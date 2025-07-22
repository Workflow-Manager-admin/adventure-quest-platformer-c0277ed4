import React from "react";

// PUBLIC_INTERFACE
function OverlayMenu({ visible, onStart, onQuit, onResume, isPaused, children }) {
  if (!visible) return null;
  return (
    <div className="overlay-menu-bg">
      <div className="overlay-menu">
        <div className="overlay-menu-title">Adventure Quest</div>
        {children}
        <div className="overlay-menu-actions">
          {onStart && <button className="overlay-btn" onClick={onStart}>Start Game</button>}
          {onResume && isPaused && <button className="overlay-btn" onClick={onResume}>Resume</button>}
          {onQuit && <button className="overlay-btn" onClick={onQuit}>Quit</button>}
        </div>
      </div>
    </div>
  );
}
export default OverlayMenu;
