import { snake } from "./snake";
import { pong } from "./pong";
import { breakout } from "./breakout";

export interface Game {
  name: string;
  description: string;
  start: () => Promise<void>;
}

export const games = {
  snake,
  pong,
  breakout,
} as const;

export type GameKey = keyof typeof games;
