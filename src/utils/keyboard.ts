import { stdin } from "process";

export type Direction = "up" | "down" | "left" | "right";
export type Key =
  | Direction
  | "space"
  | "enter"
  | "escape"
  | "q"
  | "r"
  | "p"
  | "w"
  | "a"
  | "s"
  | "d"
  | "unknown";

export type KeyHandler = (key: Key, raw: Buffer) => void;

const KEY_CODES: Record<string, Key> = {
  // Arrow keys
  "\x1b[A": "up",
  "\x1b[B": "down",
  "\x1b[C": "right",
  "\x1b[D": "left",

  // WASD
  w: "up",
  W: "up",
  a: "left",
  A: "left",
  s: "down",
  S: "down",
  d: "right",
  D: "right",

  // Special keys
  " ": "space",
  "\r": "enter",
  "\x1b": "escape",
  q: "q",
  Q: "q",
  r: "r",
  R: "r",
  p: "p",
  P: "p",
};

let isListening = false;
let currentHandler: KeyHandler | null = null;

/**
 * Parse a raw key buffer into a Key type
 */
export function parseKey(data: Buffer): Key {
  const str = data.toString();
  return KEY_CODES[str] || "unknown";
}

/**
 * Start listening for keyboard input
 */
export function startKeyboardListener(handler: KeyHandler): void {
  if (isListening) {
    stopKeyboardListener();
  }

  currentHandler = handler;
  isListening = true;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  stdin.on("data", onKeyPress);
}

/**
 * Stop listening for keyboard input
 */
export function stopKeyboardListener(): void {
  if (!isListening) return;

  stdin.off("data", onKeyPress);
  stdin.setRawMode(false);
  stdin.pause();

  currentHandler = null;
  isListening = false;
}

function onKeyPress(data: Buffer): void {
  if (!currentHandler) return;

  const key = parseKey(data);

  // Handle Ctrl+C to exit
  if (data.toString() === "\x03") {
    stopKeyboardListener();
    process.exit(0);
  }

  currentHandler(key, data);
}

/**
 * Wait for a specific key press
 */
export function waitForKey(keys: Key[]): Promise<Key> {
  return new Promise((resolve) => {
    const handler: KeyHandler = (key) => {
      if (keys.includes(key)) {
        stopKeyboardListener();
        resolve(key);
      }
    };
    startKeyboardListener(handler);
  });
}
