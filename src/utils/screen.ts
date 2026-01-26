import { stdout } from "process";

/**
 * ANSI escape codes for terminal control
 */
export const ANSI = {
  // Cursor
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  moveTo: (x: number, y: number) => `\x1b[${y};${x}H`,
  moveToStart: "\x1b[H",

  // Screen
  clearScreen: "\x1b[2J",
  clearLine: "\x1b[2K",

  // Colors (foreground)
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
} as const;

export interface ScreenSize {
  width: number;
  height: number;
}

/**
 * Get the terminal size
 */
export function getScreenSize(): ScreenSize {
  return {
    width: stdout.columns || 80,
    height: stdout.rows || 24,
  };
}

/**
 * Clear the screen and move cursor to top-left
 */
export function clearScreen(): void {
  stdout.write(ANSI.clearScreen + ANSI.moveToStart);
}

/**
 * Hide the cursor
 */
export function hideCursor(): void {
  stdout.write(ANSI.hideCursor);
}

/**
 * Show the cursor
 */
export function showCursor(): void {
  stdout.write(ANSI.showCursor);
}

/**
 * Move cursor to specific position (1-indexed)
 */
export function moveTo(x: number, y: number): void {
  stdout.write(ANSI.moveTo(x, y));
}

/**
 * Write text at a specific position
 */
export function writeAt(x: number, y: number, text: string): void {
  stdout.write(ANSI.moveTo(x, y) + text);
}

/**
 * Draw a box border
 */
export function drawBox(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = ANSI.white
): void {
  const horizontal = "─".repeat(width - 2);
  const top = `┌${horizontal}┐`;
  const bottom = `└${horizontal}┘`;

  writeAt(x, y, color + top + ANSI.reset);

  for (let i = 1; i < height - 1; i++) {
    writeAt(x, y + i, color + "│" + ANSI.reset);
    writeAt(x + width - 1, y + i, color + "│" + ANSI.reset);
  }

  writeAt(x, y + height - 1, color + bottom + ANSI.reset);
}

/**
 * Draw centered text
 */
export function drawCenteredText(
  y: number,
  text: string,
  screenWidth?: number
): void {
  const width = screenWidth || getScreenSize().width;
  const x = Math.floor((width - text.length) / 2) + 1;
  writeAt(x, y, text);
}
