import { intro, outro, select, spinner, isCancel } from "@clack/prompts";
import pc from "picocolors";
import { games, type GameKey } from "../games";

export async function showMenu(): Promise<void> {
  intro(pc.inverse(" Welcome to Atari Arcade! "));

  const gameOptions = Object.entries(games).map(([key, game]) => ({
    value: key as GameKey,
    label: game.name,
    hint: game.description,
  }));

  const selectedGame = await select({
    message: "Choose your game:",
    options: gameOptions,
  });

  if (isCancel(selectedGame)) {
    outro(pc.dim("Thanks for visiting!"));
    process.exit(0);
  }

  const s = spinner();
  s.start("Loading game...");
  await new Promise((r) => setTimeout(r, 300));
  s.stop("Game loaded!");

  await games[selectedGame].start();

  outro(pc.green("Thanks for playing!"));
}
