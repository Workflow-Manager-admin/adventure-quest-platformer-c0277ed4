import React from "react";

// PUBLIC_INTERFACE
function FullscreenButton({ onClick, isFullscreen }) {
  return (
    <button 
      className="fullscreen-btn" 
      onClick={onClick} 
      aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
    >
      {isFullscreen ? "🗗" : "🗖"}
    </button>
  );
}
export default FullscreenButton;
