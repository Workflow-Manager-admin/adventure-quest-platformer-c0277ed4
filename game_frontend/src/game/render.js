import { TILE_SIZE, COLORS, PLAYER_STATES, POWERUP_TYPES } from "./constants";

/**
 * Simple pixel-style block and sprite rendering for game state, but adds new elements per requirements
 */
function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPlayer(ctx, x, y, facing, tick, size) {
  // Small or big
  let h = size === PLAYER_STATES.BIG ? 40 : 28;
  let c = size === PLAYER_STATES.BIG ? COLORS.playerBig : COLORS.player;
  drawRect(ctx, x, y, 28, h, c);
  ctx.fillStyle = "#fff";
  if (facing === "right")
    ctx.fillRect(x + 20, y + 10, 4, 4);
  else ctx.fillRect(x + 4, y + 10, 4, 4);
  // Legs (rudimentary running animation)
  if (tick % 24 > 12) {
    drawRect(ctx, x + 6, y + h - 4, 4, 4, "#222");
    drawRect(ctx, x + 18, y + h - 4, 4, 4, "#222");
  }
}

function drawEnemy(ctx, x, y, tick) {
  // Red round head, feet, angry eyebrows, defeated = flattened (optional)
  ctx.beginPath();
  ctx.arc(x + 14, y + 14, 12, 0, 2 * Math.PI, false);
  ctx.fillStyle = COLORS.enemy;
  ctx.fill();
  drawRect(ctx, x + 4, y + 24, 7, 4, "#333");
  drawRect(ctx, x + 15, y + 24, 7, 4, "#333");
  // Eyebrows
  ctx.strokeStyle = "#111";
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 10); ctx.lineTo(x + 13, y + 8);
  ctx.moveTo(x + 20, y + 10); ctx.lineTo(x + 15, y + 8);
  ctx.stroke();
}

function drawCoin(ctx, x, y, tick) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 7 + (tick % 10) / 5, 0, 2 * Math.PI);
  ctx.fillStyle = COLORS.coin;
  ctx.globalAlpha = 0.88;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffed9f";
  ctx.stroke();
  ctx.restore();
}

function drawPowerUp(ctx, x, y, type, tick) {
  // Basic mushroom shape
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 14, y + 9, 10, 0, Math.PI, true); // Cap
  ctx.fillStyle = COLORS.powerup;
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 7, y + 9, 14, 12); // Stalk
  ctx.restore();
}

/**
 * Draw the world tiles, player, enemies, coins, powerups
 */
export function drawGame(canvas, gameState, assets) {
  const ctx = canvas.getContext("2d");
  // Clear background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Camera offset
  const camX = Math.floor(gameState.camera.x);

  // Draw level tiles
  const map = gameState.level.tiles;
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const tile = map[y][x];
      const drawX = x * TILE_SIZE - camX;
      const drawY = y * TILE_SIZE;

      if (tile === 1) { // ground
        drawRect(ctx, drawX, drawY, TILE_SIZE, TILE_SIZE, COLORS.ground);
      } else if (tile === 2) { // block/brick
        drawRect(ctx, drawX, drawY, TILE_SIZE, TILE_SIZE, COLORS.block);
        ctx.strokeStyle = "#c97a21";
        ctx.strokeRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (tile === 7) { // question
        drawRect(ctx, drawX, drawY, TILE_SIZE, TILE_SIZE, COLORS.question);
        ctx.strokeStyle = "#e9c82e";
        ctx.strokeRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 20px Consolas, monospace";
        ctx.fillText("?", drawX + 8, drawY + 24);
      } else if (tile === 6) { // pit
        // Draw pit as gap or dark
        drawRect(ctx, drawX, drawY, TILE_SIZE, TILE_SIZE, "#222");
      } else if (tile === 5) { // goal
        // Draw flag/castle
        ctx.save();
        ctx.fillStyle = COLORS.goal;
        ctx.fillRect(drawX + 11, drawY, 8, TILE_SIZE);
        ctx.fillStyle = "#eee";
        ctx.beginPath();
        ctx.arc(drawX + 15, drawY + 6, 6, 0, 2 * Math.PI);
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // Draw coins
  if (gameState.coins) {
    for (const coin of gameState.coins) {
      drawCoin(ctx, coin.x - camX, coin.y, gameState.tick);
    }
  }
  // Draw powerups
  if (gameState.powerups) {
    for (const pu of gameState.powerups) {
      if (!pu.collected) drawPowerUp(ctx, pu.x - camX, pu.y, pu.type, gameState.tick);
    }
  }
  // Draw enemies
  if (gameState.enemies) {
    for (const enemy of gameState.enemies) {
      drawEnemy(ctx, enemy.x - camX, enemy.y, gameState.tick);
    }
  }
  // Draw player (with big/small)
  drawPlayer(ctx, gameState.player.x - camX, gameState.player.y, gameState.player.facing, gameState.tick, gameState.player.size);
}
