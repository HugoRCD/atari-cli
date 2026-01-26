import { clearScreen, drawCenteredText, ANSI, getScreenSize } from "./screen";

/**
 * Simple delay utility
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Animate text appearing character by character
 */
export async function typeText(
  y: number,
  text: string,
  color: string = ANSI.white,
  charDelay: number = 30
): Promise<void> {
  const screen = getScreenSize();
  const startX = Math.floor((screen.width - text.length) / 2) + 1;

  for (let i = 0; i < text.length; i++) {
    process.stdout.write(`\x1b[${y};${startX + i}H${color}${text[i]}${ANSI.reset}`);
    await delay(charDelay);
  }
}

/**
 * Flash the screen with a color
 */
export async function flashScreen(
  color: string = ANSI.bgWhite,
  duration: number = 100
): Promise<void> {
  const screen = getScreenSize();

  // Fill screen with color
  for (let y = 1; y <= screen.height; y++) {
    process.stdout.write(`\x1b[${y};1H${color}${" ".repeat(screen.width)}${ANSI.reset}`);
  }

  await delay(duration);
  clearScreen();
}

/**
 * Countdown animation (3, 2, 1, GO!)
 */
export async function countdown(): Promise<void> {
  const screen = getScreenSize();
  const centerY = Math.floor(screen.height / 2);

  const numbers = ["3", "2", "1", "GO!"];
  const colors = [ANSI.red, ANSI.yellow, ANSI.green, ANSI.cyan];

  for (let i = 0; i < numbers.length; i++) {
    clearScreen();
    drawCenteredText(
      centerY,
      colors[i] + ANSI.bold + numbers[i] + ANSI.reset
    );
    await delay(500);
  }

  await delay(200);
}

/**
 * Fade in effect for text (simulate with characters)
 */
export async function fadeInText(
  y: number,
  text: string,
  color: string = ANSI.white
): Promise<void> {
  const fadeChars = ["░", "▒", "▓", "█"];
  const screen = getScreenSize();
  const startX = Math.floor((screen.width - text.length) / 2) + 1;

  for (const fadeChar of fadeChars) {
    let displayText = "";
    for (const char of text) {
      displayText += char === " " ? " " : fadeChar;
    }
    process.stdout.write(`\x1b[${y};${startX}H${ANSI.dim}${displayText}${ANSI.reset}`);
    await delay(50);
  }

  process.stdout.write(`\x1b[${y};${startX}H${color}${text}${ANSI.reset}`);
}
