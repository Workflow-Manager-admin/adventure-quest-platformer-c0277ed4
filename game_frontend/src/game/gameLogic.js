import {
  PLAYER, ENEMY, COIN, BLOCK, BRICK, GROUND, GOAL, PIT, QUESTION, POWERUP,
  GRAVITY, JUMP_VELOCITY, PLAYER_SPEED, PLAYER_SPEED_RUN, ENEMY_SPEED, TILE_SIZE,
  INITIAL_LIVES, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_STATES, POWERUP_TYPES
} from "./constants";

/**
 * Initialize a new game state given a level specification
 */
export function createInitialGameState(level, startingLives = INITIAL_LIVES, startingScore = 0, startingCoins = 0) {
  return {
    currentLevelIndex: 0,
    level,
    status: "menu", // menu | playing | paused | win | lose | levelwin | complete
    player: {
      x: TILE_SIZE,
      y: CANVAS_HEIGHT - 3 * TILE_SIZE,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: "right",
      size: PLAYER_STATES.SMALL,
      power: POWERUP_TYPES.NONE,
      dying: false,
      dead: false,
      animState: "idle"
    },
    enemies: JSON.parse(JSON.stringify(level.enemies)),
    coins: JSON.parse(JSON.stringify(level.coins)),
    score: startingScore,
    coinCount: startingCoins,
    lives: startingLives,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    camera: { x: 0 },
    tick: 0,
    blocks: [],
    powerups: [],
    nextPowerUp: null,
    animation: { },
    questionBlocks: [],
    movingPlatforms: []
  };
}

function collidesWithTile(map, x, y, width, height, ignoreTypes=[]) {
  const tileX1 = Math.floor(x / TILE_SIZE);
  const tileY1 = Math.floor(y / TILE_SIZE);
  const tileX2 = Math.floor((x + width - 1) / TILE_SIZE);
  const tileY2 = Math.floor((y + height - 1) / TILE_SIZE);
  for (let ty = tileY1; ty <= tileY2; ty++) {
    for (let tx = tileX1; tx <= tileX2; tx++) {
      if (map[ty]) {
        const t = map[ty][tx];
        if (ignoreTypes.includes(t)) continue;
        if (t === 1 || t === 2 || t === 7) return true; // 1 ground, 2 block, 7 question
        // 6 = pit, handled differently
      }
    }
  }
  return false;
}

function isGround(map, x, y) {
  const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 1;
}

function isBlock(map, x, y) {
  const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 2;
}

function isQuestion(map, x, y) {
  const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 7;
}

function isBrick(map, x, y) {
  const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 2;
}

function isPit(map, x, y) {
  const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 6;
}

function isGoal(level, x, y) {
  return Math.abs(x - level.goal.x) < 20 && Math.abs(y - level.goal.y) < 32;
}

function boundingBoxesIntersect(a, b) {
  // Simple bounding box collision for player/enemy/coin/powerup
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function stepEnemies(gameState, map) {
  gameState.enemies.forEach((e, idx) => {
    // Simple 2D patrol left/right, no jumping
    if (!e.dir) e.dir = "left";
    // Try moving horizontally
    const dx = e.dir === "left" ? -ENEMY_SPEED : ENEMY_SPEED;
    const nextX = e.x + dx;
    // Enemy turns around at edge/platform end or block/wall
    if (
      !collidesWithTile(map, nextX, e.y, 28, 28)
      && isGround(map, nextX + 7, e.y + 28)
    ) {
      e.x = nextX;
    } else {
      e.dir = e.dir === "left" ? "right" : "left";
    }
  });
}

function stepPlayer(player, map, keys, powers = {}, allowRun = true) {
  let vx = 0;
  let speed = keys.run && allowRun ? PLAYER_SPEED_RUN : PLAYER_SPEED;
  if (keys.left) {
    vx -= speed;
    player.facing = "left";
  }
  if (keys.right) {
    vx += speed;
    player.facing = "right";
  }
  player.vx = vx;

  // Jump logic
  if (keys.jump && player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  // Horizontal movement
  const nextX = player.x + player.vx;
  if (!collidesWithTile(map, nextX, player.y, 28, 28)) {
    player.x = nextX;
    player.animState = player.vx !== 0 ? "run" : "idle";
  } else {
    player.vx = 0;
    player.animState = "idle";
  }

  // Gravity
  player.vy += GRAVITY;
  let nextY = player.y + player.vy;
  // Collision bottom
  if (player.vy >= 0 && collidesWithTile(map, player.x, nextY, 28, 28)) {
    // Land on ground/platform/block/question
    player.y = Math.floor((player.y + player.vy) / TILE_SIZE) * TILE_SIZE;
    player.vy = 0;
    player.onGround = true;
    player.animState = player.vx !== 0 ? "run" : "idle";
  } else if (
    player.vy < 0 &&
    collidesWithTile(map, player.x, nextY, 28, 28)
  ) {
    // Hit block/question from below: break or activate
    const upY = Math.floor((player.y + player.vy) / TILE_SIZE) * TILE_SIZE;
    const blockType = (() => {
      const ty = Math.floor((player.y + player.vy) / TILE_SIZE);
      const tx1 = Math.floor(player.x / TILE_SIZE);
      const tx2 = Math.floor((player.x + 27) / TILE_SIZE);
      if (map[ty] && (map[ty][tx1] === 2 || map[ty][tx1] === 7)) return map[ty][tx1];
      if (map[ty] && (map[ty][tx2] === 2 || map[ty][tx2] === 7)) return map[ty][tx2];
      return 0;
    })();
    // Break brick if possible
    if (blockType === 2 && player.size === PLAYER_STATES.BIG) {
      // Destroy block instantly
      const ty = Math.floor((player.y + player.vy) / TILE_SIZE);
      const tx = Math.floor(player.x / TILE_SIZE);
      map[ty][tx] = 0;
      // SFX: block break
    }
    // Activate question block
    if (blockType === 7) {
      const ty = Math.floor((player.y + player.vy) / TILE_SIZE);
      const tx = Math.floor(player.x / TILE_SIZE);
      map[ty][tx] = 0;
      // SFX: powerup/coin
    }
    player.vy = 0;
    player.animState = "jump";
  } else {
    player.y = nextY;
    player.onGround = false;
    player.animState = "jump";
  }
}

function fallIntoPit(map, player) {
  // If Y below map (pitfall)
  if (player.y > (map.length - 1) * TILE_SIZE + 10) {
    return true;
  }
  // If player positioned on a PIT tile
  const tx = Math.floor(player.x / TILE_SIZE), ty = Math.floor(player.y / TILE_SIZE);
  return map[ty] && map[ty][tx] === 6;
}

function spawnPowerUp(type, x, y, powerups) {
  powerups.push({ type, x, y, vy: -5, collected: false });
}

/**
 * The main per-frame update step for the game
 * (modifies state in-place)
 */
export function updateGameState(gameState, keys, soundEffects) {
  if (gameState.status !== "playing") return;
  // 
  let map = gameState.level.tiles;

  // Step player
  stepPlayer(gameState.player, map, keys);

  // Step enemies
  stepEnemies(gameState, map);

  // Camera follow
  const maxCamera = gameState.level.width * TILE_SIZE - gameState.canvas.width;
  gameState.camera.x = Math.max(
    0,
    Math.min(
      gameState.player.x - 80,
      maxCamera
    )
  );

  // Coins: classic collision check
  for (let i = gameState.coins.length - 1; i >= 0; i--) {
    const coin = { x: gameState.coins[i].x, y: gameState.coins[i].y, width: 16, height: 16 };
    const playerBox = { x: gameState.player.x, y: gameState.player.y, width: 28, height: 28 };
    if (boundingBoxesIntersect(coin, playerBox)) {
      gameState.coins.splice(i, 1);
      gameState.score += 100;
      gameState.coinCount += 1;
      soundEffects && soundEffects.coin && soundEffects.coin();
    }
  }

  // Powerups: check if player picks up
  for (let i = gameState.powerups.length - 1; i >= 0; i--) {
    let p = gameState.powerups[i];
    if (p.collected) continue;
    const puBox = { x: p.x, y: p.y, width: 28, height: 28 };
    const playerBox = { x: gameState.player.x, y: gameState.player.y, width: 28, height: 28 };
    if (boundingBoxesIntersect(puBox, playerBox)) {
      p.collected = true;
      if (p.type === POWERUP_TYPES.MUSHROOM) {
        gameState.player.size = PLAYER_STATES.BIG;
        gameState.player.power = POWERUP_TYPES.MUSHROOM;
        // SFX: pickup
      }
      soundEffects && soundEffects.powerup && soundEffects.powerup();
      gameState.score += 500;
      gameState.powerups.splice(i, 1);
    }
  }

  // Enemy collisions: only lose if touch from side/bottom, else if jump from top (vy>0), defeat enemy and bounce
  let stomped = false;
  for (let eidx = gameState.enemies.length - 1; eidx >= 0; eidx--) {
    const enemy = gameState.enemies[eidx];
    const enemyBox = { x: enemy.x, y: enemy.y, width: 28, height: 28 };
    const playerBox = { x: gameState.player.x, y: gameState.player.y, width: 28, height: 28 };
    if (boundingBoxesIntersect(enemyBox, playerBox)) {
      if (gameState.player.vy > 0 && gameState.player.y < enemy.y) {
        // Stomp from above, defeat enemy
        gameState.enemies.splice(eidx, 1);
        gameState.score += 250;
        gameState.player.vy = -7.0;
        stomped = true;
        soundEffects && soundEffects.stomp && soundEffects.stomp();
        continue;
      }
      // Otherwise, hit from side: lose life or shrink if big
      soundEffects && soundEffects.hit && soundEffects.hit();
      if (gameState.player.size === PLAYER_STATES.BIG) {
        gameState.player.size = PLAYER_STATES.SMALL;
        gameState.player.power = POWERUP_TYPES.NONE;
        // SFX: shrink
      } else {
        gameState.lives -= 1;
        if (gameState.lives <= 0) {
          gameState.status = "lose";
        } else {
          // Respawn player
          gameState.player.x = TILE_SIZE;
          gameState.player.y = CANVAS_HEIGHT - 3 * TILE_SIZE;
          gameState.player.vx = 0;
          gameState.player.vy = 0;
          return;
        }
      }
    }
  }

  // Pitfall lose
  if (fallIntoPit(map, gameState.player)) {
    soundEffects && soundEffects.hit && soundEffects.hit();
    gameState.lives -= 1;
    if (gameState.lives <= 0) {
      gameState.status = "lose";
    } else {
      // Respawn
      gameState.player.x = TILE_SIZE;
      gameState.player.y = CANVAS_HEIGHT - 3 * TILE_SIZE;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
      return;
    }
  }

  // Level goal: win if touch
  if (isGoal(gameState.level, gameState.player.x, gameState.player.y)) {
    soundEffects && soundEffects.goal && soundEffects.goal();
    gameState.status = "win";
    gameState.score += 1000;
    return;
  }

  gameState.tick += 1;
}
