import { defineCommand, runMain } from "citty";
import { showBanner } from "./ui/banner";
import { showMenu } from "./ui/menu";
import { games, type GameKey } from "./games";

const main = defineCommand({
  meta: {
    name: "atari",
    version: "1.0.0",
    description: "Retro Atari games in your terminal",
  },
  args: {
    game: {
      type: "positional",
      description: "Game to play (snake, pong, breakout)",
      required: false,
    },
    list: {
      type: "boolean",
      alias: "l",
      description: "List available games",
    },
  },
  async run({ args }) {
    await showBanner();

    if (args.list) {
      console.log("\nAvailable games:");
      for (const [key, game] of Object.entries(games)) {
        console.log(`  - ${key}: ${game.description}`);
      }
      console.log("\nUsage: atari <game>");
      return;
    }

    if (args.game) {
      const gameKey = args.game as GameKey;
      if (games[gameKey]) {
        await games[gameKey].start();
      } else {
        console.error(`Unknown game: ${args.game}`);
        console.log("Available games: " + Object.keys(games).join(", "));
        process.exit(1);
      }
    } else {
      await showMenu();
    }
  },
});

runMain(main);
