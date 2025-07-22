import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import HUD from "./components/HUD";
import GameCanvas from "./components/GameCanvas";
import OverlayMenu from "./components/OverlayMenu";
import FullscreenButton from "./components/FullscreenButton";
import { levels } from "./game/levels";
import { createInitialGameState, updateGameState } from "./game/gameLogic";
import { createKeys, attachKeyboardHandlers } from "./game/input";
import { loadAudio } from "./game/sounds";

const ASSETS = null; // Placeholder for future sprite assets

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
  const [levelIndex, setLevelIndex] = useState(0);
  const [gameState, setGameState] = useState(createInitialGameState(levels[0]));
  const [keys, setKeys] = useState(createKeys());
  const [menuVisible, setMenuVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const gameCanvasRef = useRef(null);
  const sounds = useRef();

  // Theme switching
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // Sound loading and global play
  useEffect(() => {
    sounds.current = loadAudio();
  }, []);

  // Keyboard events
  useEffect(() => {
    return attachKeyboardHandlers(setKeys, () => gameState.status);
  }, [gameState.status]);

  // Pause with Escape and window blur
  useEffect(() => {
    function handlePause() {
      if (gameState.status === "playing") {
        handlePauseGame();
      }
    }
    function handleWindowBlur() {
      if (gameState.status === "playing") {
        handlePauseGame();
      }
    }
    window.addEventListener("requestPause", handlePause);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("requestPause", handlePause);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [gameState.status]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    let running = true;
    let frame;
    function loop() {
      if (!running) return;
      if (gameState.status === "playing" && !menuVisible && !paused) {
        updateGameState(gameState, keys, sounds.current);
        setGameState({ ...gameState });
      }
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [gameState, keys, menuVisible, paused]);

  // Start game: reset to first level, full state reset
  const handleStartGame = useCallback(() => {
    setLevelIndex(0);
    setGameState(createInitialGameState(levels[0]));
    setPaused(false);
    setMenuVisible(false);
    setTimeout(() => {
      sounds.current && sounds.current.theme();
    }, 250);
  }, []);

  // Pause/resume logic
  const handlePauseGame = useCallback(() => {
    setPaused(true);
    setMenuVisible(true);
    sounds.current && sounds.current.stopTheme();
  }, []);
  const handleResumeGame = useCallback(() => {
    setPaused(false);
    setMenuVisible(false);
    sounds.current && sounds.current.theme();
  }, []);

  // Quit game returns to start menu
  const handleQuitGame = useCallback(() => {
    setMenuVisible(true);
    setPaused(false);
    setLevelIndex(0);
    setGameState(createInitialGameState(levels[0]));
    sounds.current && sounds.current.stopTheme();
  }, []);

  // Focus canvas when unmenued/unpaused
  useEffect(() => {
    if (gameCanvasRef.current && !menuVisible && !paused) {
      gameCanvasRef.current.focus();
    }
  }, [menuVisible, paused]);

  // Fullscreen logic
  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen) {
      gameCanvasRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      gameCanvasRef.current.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // End of level/game: open menu on win/lose/game complete
  useEffect(() => {
    if (
      gameState.status === "win" ||
      gameState.status === "lose" ||
      (gameState.status === "win" && levelIndex === levels.length - 1)
    ) {
      setMenuVisible(true);
      sounds.current && sounds.current.stopTheme();
    }
  }, [gameState.status, levelIndex]);

  // Sound for jump
  useEffect(() => {
    if (keys.jump && gameState.player.onGround === false) {
      sounds.current && sounds.current.jump && sounds.current.jump();
    }
    // eslint-disable-next-line
  }, [keys.jump]);

  // Handler to go to next level
  const handleNextLevel = useCallback(() => {
    const nextIndex = levelIndex + 1;
    if (nextIndex < levels.length) {
      setLevelIndex(nextIndex);
      setGameState(
        createInitialGameState(
          levels[nextIndex],
          gameState.lives,
          gameState.score,
          gameState.coinCount
        )
      );
      setPaused(false);
      setMenuVisible(false);
      setTimeout(() => {
        sounds.current && sounds.current.theme();
      }, 250);
    }
    // No else: final win = handled by overlay content
  }, [levelIndex, gameState.lives, gameState.score, gameState.coinCount]);

  // Overlay menu content
  const renderMenuContent = () => {
    if (gameState.status === "win") {
      if (levelIndex === levels.length - 1) {
        return (
          <div className="overlay-menu-msg success">
            <span>🏰 You Won the Game!</span>
            <div>Score: {gameState.score}</div>
            <div>Thanks for playing!</div>
          </div>
        );
      } else {
        return (
          <div className="overlay-menu-msg success">
            <span>🎉 Level Complete!</span>
            <div>Score: {gameState.score}</div>
            <div>Next Level: {levels[levelIndex + 1].name}</div>
          </div>
        );
      }
    }
    if (gameState.status === "lose") {
      return (
        <div className="overlay-menu-msg fail">
          <span>💀 Game Over!</span>
          <div>Try Again?</div>
        </div>
      );
    }
    if (paused) {
      return <div className="overlay-menu-msg">⏸️ Paused</div>;
    }
    return <div className="overlay-menu-msg">Press Start to Play!</div>;
  };

  return (
    <div className="App">
      <header className="App-header platformer-header">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <div className="game-main-layout">
          <HUD
            score={gameState.score}
            coins={gameState.coinCount}
            lives={gameState.lives}
            levelName={levels[levelIndex]?.name || "???"}
          />
          <div className="game-canvas-wrap">
            <GameCanvas
              ref={gameCanvasRef}
              gameState={gameState}
              assets={ASSETS}
              tabIndex={0}
            />
            <FullscreenButton
              onClick={handleFullscreenToggle}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>
        <OverlayMenu
          visible={menuVisible}
          isPaused={paused}
          onStart={gameState.status !== "playing" ? handleStartGame : null}
          onResume={paused ? handleResumeGame : null}
          onQuit={gameState.status === "playing" || paused ? handleQuitGame : null}
          onNextLevel={
            gameState.status === "win" && levelIndex < levels.length - 1
              ? handleNextLevel
              : null
          }
        >
          {renderMenuContent()}
        </OverlayMenu>
        <footer className="game-footer">
          <span>Bubble Trouble &copy; 2024</span>
          <span style={{ marginLeft: 12, color: "#aaa", fontSize: "0.82em" }}>
            Controls: ← → or A/D to move, Space/↑/W to jump, Shift to run/dash, Esc to pause, 🗖 for fullscreen.
          </span>
        </footer>
      </header>
    </div>
  );
}

export default App;
