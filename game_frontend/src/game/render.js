import { TILE_SIZE, COLORS } from "./constants";

/**
 * Simple pixel-style block and sprite rendering for game state
 */
function drawRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawPlayer(ctx, x, y, facing, tick) {
  // Simple blue square, face with "eye" pixel
  drawRect(ctx, x, y, 28, 28, COLORS.player);
  ctx.fillStyle = "#fff";
  if (facing === "right")
    ctx.fillRect(x + 20, y + 10, 4, 4);
  else ctx.fillRect(x + 4, y + 10, 4, 4);
  // Rudimentary jump legs
  if (tick % 24 > 12) {
    drawRect(ctx, x + 6, y + 24, 4, 4, "#222");
    drawRect(ctx, x + 18, y + 24, 4, 4, "#222");
  }
}

function drawEnemy(ctx, x, y, tick) {
  // Red round head, feet, angry eyebrows
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

/**
 * Draw the world tiles, player, enemies, coins
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
      } else if (tile === 2) { // block
        drawRect(ctx, drawX, drawY, TILE_SIZE, TILE_SIZE, COLORS.block);
        ctx.strokeStyle = "#c97a21";
        ctx.strokeRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
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
  // Draw enemies
  if (gameState.enemies) {
    for (const enemy of gameState.enemies) {
      drawEnemy(ctx, enemy.x - camX, enemy.y, gameState.tick);
    }
  }
  // Draw player
  drawPlayer(ctx, gameState.player.x - camX, gameState.player.y, gameState.player.facing, gameState.tick);
}
