import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { PLAYER, ENEMY, COIN, BLOCK, GROUND, GOAL } from "../game/constants";
import { drawGame } from "../game/render";

// PUBLIC_INTERFACE
const GameCanvas = forwardRef(({ gameState, assets, onEnterFullscreen, onExitFullscreen, ...rest }, ref) => {
  const canvasRef = useRef(null);

  // Public method for parent fullscreen toggle
  useImperativeHandle(ref, () => ({
    requestFullscreen: () => {
      const el = canvasRef.current;
      if (el.requestFullscreen) {
        el.requestFullscreen();
        onEnterFullscreen && onEnterFullscreen();
      }
    },
    exitFullscreen: () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        onExitFullscreen && onExitFullscreen();
      }
    }
  }));

  useEffect(() => {
    // Draw current game state
    if (!gameState || !canvasRef.current) return;
    drawGame(canvasRef.current, gameState, assets);
  }, [gameState, assets]);

  // Always keep canvas focusable for controls
  return (
    <canvas
      ref={canvasRef}
      width={gameState?.canvas?.width || 480}
      height={gameState?.canvas?.height || 272}
      tabIndex={0}
      style={{
        // Centered and crisp rendering
        display: "block",
        margin: "0 auto",
        imageRendering: "pixelated",
        outline: "none",
        background: "#95e3fa"
      }}
      aria-label="2D platformer game canvas"
      {...rest}
    />
  );
});
export default GameCanvas;
