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
  type Key,
} from "../utils/keyboard";
import { beep } from "../utils/sound";

interface Brick {
  x: number;
  y: number;
  color: string;
  points: number;
  destroyed: boolean;
}

interface BreakoutState {
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  paddleX: number;
  bricks: Brick[];
  score: number;
  lives: number;
  gameOver: boolean;
  isPaused: boolean;
  won: boolean;
  gameWidth: number;
  gameHeight: number;
}

const MAX_WIDTH = 44;
const MAX_HEIGHT = 20;
const PADDLE_WIDTH = 8;
const BRICK_WIDTH = 4;
const BRICK_ROWS = 4;
const FRAME_TIME = 50;

const BRICK_COLORS = [
  { color: ANSI.red, points: 40 },
  { color: ANSI.yellow, points: 30 },
  { color: ANSI.green, points: 20 },
  { color: ANSI.cyan, points: 10 },
];

export const breakout: Game = {
  name: "Breakout",
  description: "Break the bricks with your paddle",
  async start() {
    const screen = getScreenSize();

    // Adapt to terminal size
    const gameWidth = Math.min(MAX_WIDTH, screen.width - 4);
    const gameHeight = Math.min(MAX_HEIGHT, screen.height - 8);
    const offsetX = Math.max(1, Math.floor((screen.width - gameWidth - 2) / 2));
    const offsetY = Math.max(2, Math.floor((screen.height - gameHeight - 4) / 2));

    const bricksPerRow = Math.floor((gameWidth - 2) / (BRICK_WIDTH + 1));

    function createBricks(): Brick[] {
      const bricks: Brick[] = [];
      for (let row = 0; row < BRICK_ROWS; row++) {
        const { color, points } = BRICK_COLORS[row % BRICK_COLORS.length];
        for (let col = 0; col < bricksPerRow; col++) {
          bricks.push({
            x: 1 + col * (BRICK_WIDTH + 1),
            y: 2 + row,
            color,
            points,
            destroyed: false,
          });
        }
      }
      return bricks;
    }

    const state: BreakoutState = {
      ballX: Math.floor(gameWidth / 2),
      ballY: gameHeight - 4,
      ballVX: 0.5,
      ballVY: -0.5,
      paddleX: Math.floor((gameWidth - PADDLE_WIDTH) / 2),
      bricks: createBricks(),
      score: 0,
      lives: 3,
      gameOver: false,
      isPaused: false,
      won: false,
      gameWidth,
      gameHeight,
    };

    let moveLeft = false;
    let moveRight = false;

    hideCursor();
    clearScreen();

    drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
    writeAt(offsetX + Math.floor(gameWidth / 2) - 3, offsetY - 1, ANSI.bold + ANSI.yellow + "BREAKOUT" + ANSI.reset);

    let intervalId: ReturnType<typeof setInterval>;

    function gameLoop() {
      if (state.gameOver) {
        renderGameOver();
        return;
      }

      if (!state.isPaused) {
        processInput();
        update();
        render();
      } else {
        renderPaused();
      }
    }

    function processInput() {
      if (moveLeft) {
        state.paddleX = Math.max(0, state.paddleX - 2);
      }
      if (moveRight) {
        state.paddleX = Math.min(gameWidth - PADDLE_WIDTH, state.paddleX + 2);
      }
    }

    function update() {
      state.ballX += state.ballVX;
      state.ballY += state.ballVY;

      // Wall collisions
      if (state.ballX <= 0 || state.ballX >= gameWidth - 1) {
        state.ballVX *= -1;
        state.ballX = Math.max(0, Math.min(gameWidth - 1, state.ballX));
      }

      if (state.ballY <= 0) {
        state.ballVY *= -1;
        state.ballY = 0;
      }

      // Paddle collision
      if (
        state.ballY >= gameHeight - 2 &&
        state.ballY < gameHeight &&
        state.ballX >= state.paddleX - 1 &&
        state.ballX <= state.paddleX + PADDLE_WIDTH
      ) {
        state.ballVY = -Math.abs(state.ballVY);
        const hitPos = (state.ballX - state.paddleX) / PADDLE_WIDTH;
        state.ballVX = (hitPos - 0.5) * 1.5;
        state.ballY = gameHeight - 3;
        beep();
      }

      // Ball fell
      if (state.ballY >= gameHeight) {
        state.lives--;
        if (state.lives <= 0) {
          state.gameOver = true;
          state.won = false;
        } else {
          resetBall();
        }
      }

      // Brick collisions
      const bx = Math.round(state.ballX);
      const by = Math.round(state.ballY);

      for (const brick of state.bricks) {
        if (brick.destroyed) continue;

        if (bx >= brick.x && bx < brick.x + BRICK_WIDTH && by === brick.y) {
          brick.destroyed = true;
          state.score += brick.points;
          state.ballVY *= -1;
          beep();

          if (state.bricks.every((b) => b.destroyed)) {
            state.gameOver = true;
            state.won = true;
          }
          break;
        }
      }
    }

    function resetBall() {
      state.ballX = Math.floor(gameWidth / 2);
      state.ballY = gameHeight - 4;
      state.ballVX = (Math.random() > 0.5 ? 1 : -1) * 0.5;
      state.ballVY = -0.5;
    }

    function render() {
      // Clear game area
      for (let y = 1; y <= gameHeight; y++) {
        writeAt(offsetX + 1, offsetY + y, " ".repeat(gameWidth));
      }

      // Draw bricks
      for (const brick of state.bricks) {
        if (brick.destroyed) continue;
        writeAt(offsetX + brick.x + 1, offsetY + brick.y + 1, brick.color + "=".repeat(BRICK_WIDTH) + ANSI.reset);
      }

      // Draw ball
      const bx = Math.round(state.ballX);
      const by = Math.round(state.ballY);
      if (bx >= 0 && bx < gameWidth && by >= 0 && by < gameHeight) {
        writeAt(offsetX + bx + 1, offsetY + by + 1, ANSI.white + "o" + ANSI.reset);
      }

      // Draw paddle
      writeAt(offsetX + state.paddleX + 1, offsetY + gameHeight, ANSI.green + "=".repeat(PADDLE_WIDTH) + ANSI.reset);

      // Draw HUD
      const hearts = ANSI.red + "♥".repeat(state.lives) + ANSI.reset;
      writeAt(offsetX, offsetY + gameHeight + 3, `${ANSI.yellow}Score: ${state.score}${ANSI.reset} | ${hearts} | ${ANSI.dim}Q:Quit P:Pause${ANSI.reset}`);
    }

    function renderPaused() {
      writeAt(offsetX + Math.floor(gameWidth / 2) - 3, offsetY + Math.floor(gameHeight / 2), ANSI.yellow + "PAUSED" + ANSI.reset);
    }

    function renderGameOver() {
      const cx = offsetX + Math.floor(gameWidth / 2);
      const cy = offsetY + Math.floor(gameHeight / 2);

      if (state.won) {
        writeAt(cx - 4, cy - 1, ANSI.green + ANSI.bold + "YOU WIN!" + ANSI.reset);
      } else {
        writeAt(cx - 5, cy - 1, ANSI.red + ANSI.bold + "GAME OVER!" + ANSI.reset);
      }
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
      state.ballX = Math.floor(gameWidth / 2);
      state.ballY = gameHeight - 4;
      state.ballVX = (Math.random() > 0.5 ? 1 : -1) * 0.5;
      state.ballVY = -0.5;
      state.paddleX = Math.floor((gameWidth - PADDLE_WIDTH) / 2);
      state.bricks = createBricks();
      state.score = 0;
      state.lives = 3;
      state.gameOver = false;
      state.isPaused = false;
      state.won = false;

      clearScreen();
      drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
      writeAt(offsetX + Math.floor(gameWidth / 2) - 3, offsetY - 1, ANSI.bold + ANSI.yellow + "BREAKOUT" + ANSI.reset);
    }

    // Start game loop
    intervalId = setInterval(gameLoop, FRAME_TIME);

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

        if (key === "left") {
          moveLeft = true;
          setTimeout(() => (moveLeft = false), FRAME_TIME * 2);
        }
        if (key === "right") {
          moveRight = true;
          setTimeout(() => (moveRight = false), FRAME_TIME * 2);
        }
      });
    });
  },
};
