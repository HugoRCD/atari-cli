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

interface PongState {
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  leftPaddleY: number;
  rightPaddleY: number;
  leftScore: number;
  rightScore: number;
  gameOver: boolean;
  isPaused: boolean;
  winner: "player" | "ai" | null;
  gameWidth: number;
  gameHeight: number;
}

const MAX_WIDTH = 50;
const MAX_HEIGHT = 18;
const PADDLE_HEIGHT = 4;
const WINNING_SCORE = 5;
const FRAME_TIME = 50;
const AI_SPEED = 0.8; // AI reaction speed (0-1, lower = easier)

export const pong: Game = {
  name: "Pong",
  description: "The original Atari hit - bounce the ball",
  async start() {
    const screen = getScreenSize();

    // Adapt to terminal size
    const gameWidth = Math.min(MAX_WIDTH, screen.width - 4);
    const gameHeight = Math.min(MAX_HEIGHT, screen.height - 8);
    const offsetX = Math.max(1, Math.floor((screen.width - gameWidth - 2) / 2));
    const offsetY = Math.max(2, Math.floor((screen.height - gameHeight - 4) / 2));

    const state: PongState = {
      ballX: Math.floor(gameWidth / 2),
      ballY: Math.floor(gameHeight / 2),
      ballVX: Math.random() > 0.5 ? 0.8 : -0.8,
      ballVY: (Math.random() - 0.5) * 0.8,
      leftPaddleY: Math.floor((gameHeight - PADDLE_HEIGHT) / 2),
      rightPaddleY: Math.floor((gameHeight - PADDLE_HEIGHT) / 2),
      leftScore: 0,
      rightScore: 0,
      gameOver: false,
      isPaused: false,
      winner: null,
      gameWidth,
      gameHeight,
    };

    let moveUp = false;
    let moveDown = false;

    hideCursor();
    clearScreen();

    // Draw static elements
    drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
    writeAt(offsetX + Math.floor(gameWidth / 2) - 1, offsetY + gameHeight + 3, ANSI.bold + ANSI.yellow + "PONG" + ANSI.reset);

    let intervalId: ReturnType<typeof setInterval>;

    function gameLoop() {
      if (state.gameOver) {
        renderGameOver();
        return;
      }

      if (!state.isPaused) {
        processInput();
        updateAI();
        update();
        render();
      } else {
        renderPaused();
      }
    }

    function processInput() {
      if (moveUp) {
        state.leftPaddleY = Math.max(0, state.leftPaddleY - 1);
      }
      if (moveDown) {
        state.leftPaddleY = Math.min(gameHeight - PADDLE_HEIGHT, state.leftPaddleY + 1);
      }
    }

    function updateAI() {
      // Simple AI: follow the ball with some delay
      const paddleCenter = state.rightPaddleY + PADDLE_HEIGHT / 2;
      const diff = state.ballY - paddleCenter;

      // Only move if ball is coming towards AI
      if (state.ballVX > 0) {
        if (diff > 1 && Math.random() < AI_SPEED) {
          state.rightPaddleY = Math.min(gameHeight - PADDLE_HEIGHT, state.rightPaddleY + 1);
        } else if (diff < -1 && Math.random() < AI_SPEED) {
          state.rightPaddleY = Math.max(0, state.rightPaddleY - 1);
        }
      }
    }

    function update() {
      // Move ball
      state.ballX += state.ballVX;
      state.ballY += state.ballVY;

      // Top/bottom wall collision
      if (state.ballY <= 0 || state.ballY >= gameHeight - 1) {
        state.ballVY *= -1;
        state.ballY = Math.max(0, Math.min(gameHeight - 1, state.ballY));
      }

      // Left paddle collision
      if (
        state.ballX <= 2 &&
        state.ballY >= state.leftPaddleY &&
        state.ballY < state.leftPaddleY + PADDLE_HEIGHT
      ) {
        state.ballVX = Math.abs(state.ballVX) * 1.05;
        state.ballVX = Math.min(state.ballVX, 2);
        const hitPos = (state.ballY - state.leftPaddleY) / PADDLE_HEIGHT;
        state.ballVY = (hitPos - 0.5) * 1.5;
        beep();
      }

      // Right paddle collision
      if (
        state.ballX >= gameWidth - 3 &&
        state.ballY >= state.rightPaddleY &&
        state.ballY < state.rightPaddleY + PADDLE_HEIGHT
      ) {
        state.ballVX = -Math.abs(state.ballVX) * 1.05;
        state.ballVX = Math.max(state.ballVX, -2);
        const hitPos = (state.ballY - state.rightPaddleY) / PADDLE_HEIGHT;
        state.ballVY = (hitPos - 0.5) * 1.5;
        beep();
      }

      // Score
      if (state.ballX <= 0) {
        state.rightScore++;
        if (state.rightScore >= WINNING_SCORE) {
          state.gameOver = true;
          state.winner = "ai";
        } else {
          resetBall();
        }
      } else if (state.ballX >= gameWidth - 1) {
        state.leftScore++;
        if (state.leftScore >= WINNING_SCORE) {
          state.gameOver = true;
          state.winner = "player";
        } else {
          resetBall();
        }
      }
    }

    function resetBall() {
      state.ballX = Math.floor(gameWidth / 2);
      state.ballY = Math.floor(gameHeight / 2);
      state.ballVX = (Math.random() > 0.5 ? 1 : -1) * 0.8;
      state.ballVY = (Math.random() - 0.5) * 0.8;
    }

    function render() {
      // Clear game area
      for (let y = 1; y <= gameHeight; y++) {
        writeAt(offsetX + 1, offsetY + y, " ".repeat(gameWidth));
      }

      // Draw center line
      for (let y = 1; y <= gameHeight; y++) {
        if (y % 2 === 0) {
          writeAt(offsetX + Math.floor(gameWidth / 2) + 1, offsetY + y, ANSI.dim + ":" + ANSI.reset);
        }
      }

      // Draw ball
      const bx = Math.round(state.ballX);
      const by = Math.round(state.ballY);
      if (bx >= 0 && bx < gameWidth && by >= 0 && by < gameHeight) {
        writeAt(offsetX + bx + 1, offsetY + by + 1, ANSI.white + "o" + ANSI.reset);
      }

      // Draw left paddle (player)
      for (let i = 0; i < PADDLE_HEIGHT; i++) {
        const py = state.leftPaddleY + i;
        if (py >= 0 && py < gameHeight) {
          writeAt(offsetX + 2, offsetY + py + 1, ANSI.green + "#" + ANSI.reset);
        }
      }

      // Draw right paddle (AI)
      for (let i = 0; i < PADDLE_HEIGHT; i++) {
        const py = state.rightPaddleY + i;
        if (py >= 0 && py < gameHeight) {
          writeAt(offsetX + gameWidth - 1, offsetY + py + 1, ANSI.red + "#" + ANSI.reset);
        }
      }

      // Draw scores
      writeAt(offsetX + Math.floor(gameWidth / 4), offsetY - 1, ANSI.green + state.leftScore.toString() + ANSI.reset);
      writeAt(offsetX + Math.floor((3 * gameWidth) / 4), offsetY - 1, ANSI.red + state.rightScore.toString() + ANSI.reset);

      // Draw controls
      writeAt(
        offsetX,
        offsetY + gameHeight + 3,
        `${ANSI.dim}W/S or Arrows: Move | Q: Quit | P: Pause${ANSI.reset}`
      );
    }

    function renderPaused() {
      writeAt(
        offsetX + Math.floor(gameWidth / 2) - 3,
        offsetY + Math.floor(gameHeight / 2),
        ANSI.yellow + "PAUSED" + ANSI.reset
      );
    }

    function renderGameOver() {
      const cx = offsetX + Math.floor(gameWidth / 2);
      const cy = offsetY + Math.floor(gameHeight / 2);

      if (state.winner === "player") {
        writeAt(cx - 4, cy - 1, ANSI.green + ANSI.bold + "YOU WIN!" + ANSI.reset);
      } else {
        writeAt(cx - 4, cy - 1, ANSI.red + ANSI.bold + "AI WINS!" + ANSI.reset);
      }
      writeAt(cx - 7, cy + 1, `${ANSI.green}${state.leftScore}${ANSI.reset} - ${ANSI.red}${state.rightScore}${ANSI.reset}`);
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
      state.ballY = Math.floor(gameHeight / 2);
      state.ballVX = (Math.random() > 0.5 ? 1 : -1) * 0.8;
      state.ballVY = (Math.random() - 0.5) * 0.8;
      state.leftPaddleY = Math.floor((gameHeight - PADDLE_HEIGHT) / 2);
      state.rightPaddleY = Math.floor((gameHeight - PADDLE_HEIGHT) / 2);
      state.leftScore = 0;
      state.rightScore = 0;
      state.gameOver = false;
      state.isPaused = false;
      state.winner = null;

      clearScreen();
      drawBox(offsetX, offsetY, gameWidth + 2, gameHeight + 2, ANSI.cyan);
      writeAt(offsetX + Math.floor(gameWidth / 2) - 1, offsetY + gameHeight + 3, ANSI.bold + ANSI.yellow + "PONG" + ANSI.reset);
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

        if (key === "p") {
          state.isPaused = !state.isPaused;
          return;
        }

        // Movement controls
        if (key === "up") {
          moveUp = true;
          setTimeout(() => (moveUp = false), FRAME_TIME * 2);
        }
        if (key === "down") {
          moveDown = true;
          setTimeout(() => (moveDown = false), FRAME_TIME * 2);
        }
      });
    });
  },
};
