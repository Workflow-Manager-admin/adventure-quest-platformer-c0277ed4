const SOUNDS = {
  coin: require("../assets/coin.wav"),
  jump: require("../assets/jump.wav"),
  hit: require("../assets/hit.wav"),
  goal: require("../assets/goal.wav"),
  theme: require("../assets/theme.mp3")
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
