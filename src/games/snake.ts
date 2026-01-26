import type { Game } from "./index";
import {
  ANSI,
  clearScreen,
  drawBox,
  getScreenSize,
  writeAt,
  showCursor,
  hideCursor,
} from "../utils/screen";
import {
  startKeyboardListener,
  stopKeyboardListener,
  type Direction,
  type Key,
} from "../utils/keyboard";
import { beep } from "../utils/sound";

interface Point {
  x: number;
  y: number;
}

interface SnakeState {
  snake: Point[];
  food: Point;
  direction: Direction;
  nextDirection: Direction;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
  speed: number;
  gameWidth: number;
  gameHeight: number;
}

const MAX_WIDTH = 40;
const MAX_HEIGHT = 18;
const INITIAL_SPEED = 120;
const VERTICAL_MULTIPLIER = 1.8;
const SPEED_INCREMENT = 5;

export const snake: Game = {
  name: "Snake",
  description: "Classic snake game - eat food and grow longer",
  async start() {
    const screen = getScreenSize();

    // Adapt to terminal size
    const gameWidth = Math.min(MAX_WIDTH, screen.width - 4);
    const gameHeight = Math.min(MAX_HEIGHT, screen.height - 8);
    const offsetX = Math.max(1, Math.floor((screen.width - gameWidth - 2) / 2));
    const offsetY = Math.max(2, Math.floor((screen.height - gameHeight - 4) / 2));

    const state: SnakeState = {
      snake: [{ x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight / 2) }],
      food: { x: 0, y: 0 },
      direction: "right",
      nextDirection: "right",
      score: 0,
      gameOver: false,
      isPaused: false,
      speed: INITIAL_SPEED,
      gameWidth,
      gameHeight,
    };

    // Place initial food
    placeFood();

    function placeFood() {
      let newFood: Point;
      do {
        newFood = {
          x: Math.floor(Math.random() * state.gameWidth),
          y: Math.floor(Math.random() * state.gameHeight),
        };
      } while (state.snake.some((s) => s.x === newFood.x && s.y === newFood.y));
      state.food = newFood;
    }

    hideCursor();
    clearScreen();

    // Draw static elements
    drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
    writeAt(offsetX + Math.floor(gameWidth / 2) - 2, offsetY - 1, ANSI.bold + ANSI.yellow + "SNAKE" + ANSI.reset);

    let intervalId: ReturnType<typeof setInterval>;

    function getSpeed(): number {
      const isVertical = state.direction === "up" || state.direction === "down";
      return isVertical ? state.speed * VERTICAL_MULTIPLIER : state.speed;
    }

    function gameLoop() {
      if (state.gameOver) {
        renderGameOver();
        return;
      }

      if (!state.isPaused) {
        update();
        render();
      } else {
        renderPaused();
      }

      clearInterval(intervalId);
      intervalId = setInterval(gameLoop, getSpeed());
    }

    function update() {
      state.direction = state.nextDirection;

      const head = { ...state.snake[0] };

      switch (state.direction) {
        case "up": head.y--; break;
        case "down": head.y++; break;
        case "left": head.x--; break;
        case "right": head.x++; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= gameWidth || head.y < 0 || head.y >= gameHeight) {
        state.gameOver = true;
        return;
      }

      // Self collision
      if (state.snake.some((s) => s.x === head.x && s.y === head.y)) {
        state.gameOver = true;
        return;
      }

      state.snake.unshift(head);

      // Food collision
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 10;
        state.speed = Math.max(40, state.speed - SPEED_INCREMENT);
        beep();
        placeFood();
      } else {
        state.snake.pop();
      }
    }

    function render() {
      // Clear game area
      for (let y = 1; y <= gameHeight; y++) {
        writeAt(offsetX + 1, offsetY + y, " ".repeat(gameWidth));
      }

      // Draw food
      writeAt(offsetX + state.food.x + 1, offsetY + state.food.y + 1, ANSI.red + "o" + ANSI.reset);

      // Draw snake
      state.snake.forEach((segment, i) => {
        const color = i === 0 ? ANSI.green : ANSI.cyan;
        writeAt(offsetX + segment.x + 1, offsetY + segment.y + 1, color + "#" + ANSI.reset);
      });

      // Draw score
      writeAt(offsetX, offsetY + gameHeight + 3, `${ANSI.yellow}Score: ${state.score}${ANSI.reset}  ${ANSI.dim}Q:Quit P:Pause${ANSI.reset}`);
    }

    function renderPaused() {
      writeAt(offsetX + Math.floor(gameWidth / 2) - 3, offsetY + Math.floor(gameHeight / 2), ANSI.yellow + "PAUSED" + ANSI.reset);
    }

    function renderGameOver() {
      const cx = offsetX + Math.floor(gameWidth / 2);
      const cy = offsetY + Math.floor(gameHeight / 2);

      writeAt(cx - 5, cy - 1, ANSI.red + ANSI.bold + "GAME OVER!" + ANSI.reset);
      writeAt(cx - 5, cy + 1, `Score: ${ANSI.yellow}${state.score}${ANSI.reset}`);
      writeAt(cx - 8, cy + 3, ANSI.dim + "R:Restart Q:Quit" + ANSI.reset);
    }

    function cleanup() {
      clearInterval(intervalId);
      stopKeyboardListener();
      showCursor();
      clearScreen();
    }

    function resetGame() {
      state.snake = [{ x: Math.floor(gameWidth / 2), y: Math.floor(gameHeight / 2) }];
      state.direction = "right";
      state.nextDirection = "right";
      state.score = 0;
      state.gameOver = false;
      state.isPaused = false;
      state.speed = INITIAL_SPEED;
      placeFood();

      clearScreen();
      drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
      writeAt(offsetX + Math.floor(gameWidth / 2) - 2, offsetY - 1, ANSI.bold + ANSI.yellow + "SNAKE" + ANSI.reset);
    }

    // Start game loop
    intervalId = setInterval(gameLoop, state.speed);

    return new Promise<void>((resolve) => {
      startKeyboardListener((key: Key) => {
        if (key === "q") {
          cleanup();
          resolve();
          return;
        }

        if (key === "r" && state.gameOver) {
          resetGame();
          return;
        }

        if (key === "p" || key === "space") {
          state.isPaused = !state.isPaused;
          return;
        }

        // Prevent 180-degree turns
        if (key === "up" && state.direction !== "down") state.nextDirection = "up";
        else if (key === "down" && state.direction !== "up") state.nextDirection = "down";
        else if (key === "left" && state.direction !== "right") state.nextDirection = "left";
        else if (key === "right" && state.direction !== "left") state.nextDirection = "right";
      });
    });
  },
};
