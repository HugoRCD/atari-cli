# atari

Retro Atari games in your terminal. Play classic arcade games like Snake, Pong, and Breakout directly from your command line.

## Installation

```bash
npm install -g atari
```

## Usage

```bash
# Launch interactive menu
atari

# Play a specific game directly
atari snake
atari pong
atari breakout

# List available games
atari --list

# Show help
atari --help
```

## Games

- **Snake** - Classic snake game, eat food and grow longer
- **Pong** - The original Atari hit, bounce the ball
- **Breakout** - Break the bricks with your paddle

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Space | Action (shoot, pause) |
| Q | Quit game |
| R | Restart |

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build
```

## License

MIT