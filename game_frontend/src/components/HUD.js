import React from "react";
import coinImg from "../assets/coin.png";
import heartImg from "../assets/heart.png";

// PUBLIC_INTERFACE
function HUD({ score, coins, lives }) {
  return (
    <div className="hud-bar">
      <div className="hud-info">
        <span className="hud-label">SCORE</span>
        <span>{score}</span>
      </div>
      <div className="hud-info">
        <img src={coinImg} alt="Coin" className="hud-icon" />
        <span>{coins}</span>
      </div>
      <div className="hud-info">
        <img src={heartImg} alt="Lives" className="hud-icon" />
        <span>x{lives}</span>
      </div>
    </div>
  );
}
export default HUD;
