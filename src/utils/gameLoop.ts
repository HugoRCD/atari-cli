import { showCursor, hideCursor, clearScreen } from "./screen";
import { stopKeyboardListener } from "./keyboard";

export interface GameState {
  isRunning: boolean;
  isPaused: boolean;
  score: number;
  gameOver: boolean;
}

export interface GameLoopOptions {
  fps?: number;
  onUpdate: (deltaTime: number, state: GameState) => void;
  onRender: (state: GameState) => void;
  onCleanup?: () => void;
}

/**
 * Create and run a game loop
 */
export function createGameLoop(options: GameLoopOptions): {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getState: () => GameState;
  updateScore: (delta: number) => void;
  setGameOver: () => void;
} {
  const { fps = 15, onUpdate, onRender, onCleanup } = options;
  const frameTime = 1000 / fps;

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let lastTime = Date.now();

  const state: GameState = {
    isRunning: false,
    isPaused: false,
    score: 0,
    gameOver: false,
  };

  function tick() {
    if (!state.isRunning || state.isPaused || state.gameOver) return;

    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    onUpdate(deltaTime, state);
    onRender(state);
  }

  function start() {
    state.isRunning = true;
    state.isPaused = false;
    state.score = 0;
    state.gameOver = false;
    lastTime = Date.now();

    hideCursor();
    clearScreen();

    intervalId = setInterval(tick, frameTime);
    onRender(state);
  }

  function stop() {
    state.isRunning = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    stopKeyboardListener();
    showCursor();
    clearScreen();

    if (onCleanup) {
      onCleanup();
    }
  }

  function pause() {
    state.isPaused = true;
  }

  function resume() {
    if (state.isPaused) {
      state.isPaused = false;
      lastTime = Date.now();
    }
  }

  function getState() {
    return { ...state };
  }

  function updateScore(delta: number) {
    state.score += delta;
  }

  function setGameOver() {
    state.gameOver = true;
  }

  return {
    start,
    stop,
    pause,
    resume,
    getState,
    updateScore,
    setGameOver,
  };
}
