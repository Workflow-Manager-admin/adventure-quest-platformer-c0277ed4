import { BLOCK, GROUND, ENEMY, COIN, GOAL } from "./constants";

// These levels are easy to increase in complexity.
export const levels = [
  {
    name: "World 1-1",
    tiles: [
      // 0 empty, 1 ground, 2 block, 3 enemy, 4 coin, 5 goal
      // y = 0 is top row, y increases downward
      // Each row: [x0, x1, ...]
      // Level size: 15x8 (width x height)
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,4,0,0],
      [0,0,0,0,0,0,2,0,2,0,0,0,0,4,0],
      [0,4,0,3,0,0,0,0,0,0,2,0,0,0,0],
      [0,0,2,0,0,2,0,3,0,0,0,2,0,0,0],
      [0,0,0,0,2,0,4,0,2,0,0,0,2,0,5],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ],
    enemies: [
      { x: 3 * 32, y: 4 * 32, dir: "left" },
      { x: 7 * 32, y: 4 * 32, dir: "right" }
    ],
    coins: [
      { x: 12 * 32 + 16, y: 1 * 32 + 8 },
      { x: 13 * 32 + 16, y: 2 * 32 + 8 },
      { x: 1 * 32 + 16, y: 3 * 32 + 8 },
      { x: 6 * 32 + 16, y: 5 * 32 + 8 }
    ],
    width: 15,
    height: 8,
    goal: { x: 14 * 32, y: 5 * 32 }
  }
];
