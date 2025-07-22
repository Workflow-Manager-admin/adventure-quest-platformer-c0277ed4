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

const ASSETS = null; // Unused, left for illustration for sprite extension

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");
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
  const toggleTheme = () => setTheme(prev => (prev === "light" ? "dark" : "light"));

  // Sound loading and global play
  useEffect(() => {
    sounds.current = loadAudio();
  }, []);

  // Keyboard events
  useEffect(() => {
    return attachKeyboardHandlers(setKeys, () => gameState.status);
  }, [gameState.status]);

  // Pause/unpause with Escape and window blur
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
    // eslint-disable-next-line
  }, [gameState.status]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    let running = true;
    let frame;

    function loop() {
      if (!running) return;
      // Only step the update if not menu or paused
      if (gameState.status === "playing" && !menuVisible && !paused) {
        // Mutate state, but then force a shallow copy for React rendering
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
    // eslint-disable-next-line
  }, [gameState, keys, menuVisible, paused]);

  // Start game: close menu, reset state
  const handleStartGame = useCallback(() => {
    setGameState(createInitialGameState(levels[0]));
    setPaused(false);
    setMenuVisible(false);
    setTimeout(() => {
      sounds.current && sounds.current.theme();
    }, 250);
  }, []);

  // Pause/resume
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

  // Quit game
  const handleQuitGame = useCallback(() => {
    setMenuVisible(true);
    setPaused(false);
    setGameState(createInitialGameState(levels[0]));
    sounds.current && sounds.current.stopTheme();
  }, []);

  // Camera follows, canvas focus on play
  useEffect(() => {
    if (gameCanvasRef.current && !menuVisible && !paused) {
      gameCanvasRef.current.focus();
    }
  }, [menuVisible, paused]);

  // Fullscreen
  const handleFullscreenToggle = useCallback(() => {
    if (!isFullscreen) {
      gameCanvasRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      gameCanvasRef.current.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // React to game end
  useEffect(() => {
    if (gameState.status === "win" || gameState.status === "lose") {
      setMenuVisible(true);
      sounds.current && sounds.current.stopTheme();
    }
  }, [gameState.status]);

  // Play jump sound on jump
  useEffect(() => {
    if (keys.jump && gameState.player.onGround === false) {
      sounds.current && sounds.current.jump && sounds.current.jump();
    }
    // eslint-disable-next-line
  }, [keys.jump]); 

  // Overlay menu content
  const renderMenuContent = () => {
    if (gameState.status === "win")
      return (
        <div className="overlay-menu-msg success">
          <span>🎉 Level Complete!</span>
          <div>Score: {gameState.score}</div>
        </div>
      );
    if (gameState.status === "lose")
      return (
        <div className="overlay-menu-msg fail">
          <span>💀 Game Over!</span>
          <div>Try Again?</div>
        </div>
      );
    if (paused)
      return <div className="overlay-menu-msg">⏸️ Paused</div>;
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
          <HUD score={gameState.score} coins={gameState.coinCount} lives={gameState.lives} />
          <div className="game-canvas-wrap">
            <GameCanvas
              ref={gameCanvasRef}
              gameState={gameState}
              assets={ASSETS}
              tabIndex={0}
            />
            <FullscreenButton onClick={handleFullscreenToggle} isFullscreen={isFullscreen} />
          </div>
        </div>
        <OverlayMenu
          visible={menuVisible}
          isPaused={paused}
          onStart={gameState.status !== "playing" ? handleStartGame : null}
          onResume={paused ? handleResumeGame : null}
          onQuit={gameState.status === "playing" || paused ? handleQuitGame : null}
        >
          {renderMenuContent()}
        </OverlayMenu>
        <footer className="game-footer">
          <span>Pixel-Art Platformer &copy; 2024</span>
          <span style={{ marginLeft: 12, color: "#aaa", fontSize: "0.82em" }}>
            Controls: ← → to move, Space/↑/W to jump, Esc to pause, 🗖 for fullscreen.
          </span>
        </footer>
      </header>
    </div>
  );
}

export default App;
