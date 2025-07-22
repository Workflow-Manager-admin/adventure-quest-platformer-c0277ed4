import { PLAYER, ENEMY, COIN, BLOCK, GROUND, GOAL, GRAVITY, JUMP_VELOCITY, PLAYER_SPEED, ENEMY_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, INITIAL_LIVES } from "./constants";

/**
 * Initialize a new game state given a level specification
 */
export function createInitialGameState(level) {
  return {
    level,
    status: "menu", // menu | playing | paused | win | lose
    player: {
      x: TILE_SIZE,
      y: CANVAS_HEIGHT - 3 * TILE_SIZE,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: "right"
    },
    enemies: JSON.parse(JSON.stringify(level.enemies)),
    coins: JSON.parse(JSON.stringify(level.coins)),
    score: 0,
    coinCount: 0,
    lives: INITIAL_LIVES,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    camera: { x: 0 },
    tick: 0
  };
}

/**
 * Physics collision for a rectangle with world
 */
function collidesWithTile(map, x, y, width, height) {
  const tileX1 = Math.floor(x / TILE_SIZE);
  const tileY1 = Math.floor(y / TILE_SIZE);
  const tileX2 = Math.floor((x + width - 1) / TILE_SIZE);
  const tileY2 = Math.floor((y + height - 1) / TILE_SIZE);
  for (let ty = tileY1; ty <= tileY2; ty++) {
    for (let tx = tileX1; tx <= tileX2; tx++) {
      if (map[ty] && (map[ty][tx] === 1 || map[ty][tx] === 2)) return true;
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

function isGoal(level, x, y) {
  return Math.abs(x - level.goal.x) < 20 && Math.abs(y - level.goal.y) < 32;
}

function boundingBoxesIntersect(a, b) {
  // Simple bounding box collision for player/enemy/coin
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

function stepEnemies(gameState, map) {
  gameState.enemies.forEach(e => {
    // Simple 2D patrol left/right, no jumping
    if (!e.dir) e.dir = "left";
    // Try moving horizontally
    const dx = e.dir === "left" ? -ENEMY_SPEED : ENEMY_SPEED;
    const nextX = e.x + dx;
    if (
      !collidesWithTile(map, nextX, e.y, 28, 28) &&
      isGround(map, nextX + 7, e.y + 28)
    ) {
      e.x = nextX;
    } else {
      e.dir = e.dir === "left" ? "right" : "left";
    }
  });
}

function stepPlayer(player, map, keys) {
  let vx = 0;
  if (keys.left) {
    vx -= PLAYER_SPEED;
    player.facing = "left";
  }
  if (keys.right) {
    vx += PLAYER_SPEED;
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
  } else {
    player.vx = 0;
  }

  // Gravity
  player.vy += GRAVITY;
  let nextY = player.y + player.vy;
  // Collision bottom
  if (player.vy >= 0 && collidesWithTile(map, player.x, nextY, 28, 28)) {
    player.y = Math.floor((player.y + player.vy) / TILE_SIZE) * TILE_SIZE;
    player.vy = 0;
    player.onGround = true;
  } else if (
    player.vy < 0 &&
    collidesWithTile(map, player.x, nextY, 28, 28)
  ) {
    player.vy = 0;
  } else {
    player.y = nextY;
    player.onGround = false;
  }
}

/**
 * The main per-frame update step for the game
 * (modifies state in-place)
 */
export function updateGameState(gameState, keys, soundEffects) {
  if (gameState.status !== "playing") return;

  // Step player
  stepPlayer(gameState.player, gameState.level.tiles, keys);

  // Step enemies
  stepEnemies(gameState, gameState.level.tiles);

  // Camera follow
  const maxCamera = gameState.level.width * TILE_SIZE - gameState.canvas.width;
  gameState.camera.x = Math.max(
    0,
    Math.min(
      gameState.player.x - 80,
      maxCamera
    )
  );

  // Coins
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

  // Enemy collisions: lose life if touch
  for (const enemy of gameState.enemies) {
    const enemyBox = { x: enemy.x, y: enemy.y, width: 28, height: 28 };
    const playerBox = { x: gameState.player.x, y: gameState.player.y, width: 28, height: 28 };
    if (boundingBoxesIntersect(enemyBox, playerBox)) {
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
