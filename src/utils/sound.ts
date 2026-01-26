import { stdout } from "process";

/**
 * Play a terminal beep sound
 * Note: This uses the ASCII BEL character which triggers the terminal bell
 * The actual sound depends on the user's terminal settings
 */
export function beep(): void {
  stdout.write("\x07");
}

/**
 * Play a beep with a visual flash effect
 */
export function beepWithFlash(): void {
  beep();
}
