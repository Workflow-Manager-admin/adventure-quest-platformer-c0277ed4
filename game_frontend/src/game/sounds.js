import coinSound from "../assets/coin.wav";
import jumpSound from "../assets/jump.wav";
import hitSound from "../assets/hit.wav";
import goalSound from "../assets/goal.wav";
import themeMusic from "../assets/theme.mp3";

const SOUNDS = {
  coin: coinSound,
  jump: jumpSound,
  hit: hitSound,
  goal: goalSound,
  theme: themeMusic
};

export function loadAudio() {
  // Returns { coin() => play, ... } plus stubs for additional sounds
  const cache = {};
  for (let key in SOUNDS) {
    cache[key] = new Audio(SOUNDS[key]);
  }
  // Placeholder for new sfx
  return {
    coin: () => { cache.coin.currentTime = 0; cache.coin.play(); },
    jump: () => { cache.jump.currentTime = 0; cache.jump.play(); },
    hit: () => { cache.hit.currentTime = 0; cache.hit.play(); },
    goal: () => { cache.goal.currentTime = 0; cache.goal.play(); },
    theme: () => { cache.theme.loop = true; cache.theme.volume = 0.38; cache.theme.play(); },
    stopTheme: () => { cache.theme.pause(); cache.theme.currentTime = 0; },
    powerup: () => {},
    stomp: () => {},
    breakblock: () => {},
    question: () => {}
  };
}
