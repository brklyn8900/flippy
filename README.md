# Flippy

A Flappy Bird-style game built with Next.js and integrated with blockchain wallet capabilities. This project demonstrates how web3 gaming could work on the Koinos blockchain, though the blockchain integration is currently limited to wallet connection via Kondor.

## Features

- Classic Flappy Bird gameplay mechanics
- Power-up system with multiple effects:
  - Shield: Protects from collisions
  - Slow Time: Reduces game speed
  - Double Points: Doubles score accumulation
- Local leaderboard system
- Kondor wallet integration (prepared for future blockchain features)

## Tech Stack

- Next.js 15.0.3
- React 19.0
- TypeScript
- HTML5 Canvas for game rendering
- TailwindCSS for styling
- Kondor-js for Koinos wallet integration

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## Development Status

This is a work in progress. While the core game mechanics and wallet connection are implemented, the blockchain integration features are still pending. Future updates may include:

- On-chain leaderboard
- NFT power-ups
- Token rewards for high scores

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Koinos Blockchain](https://koinos.io/)
- [Kondor Wallet](https://github.com/joticajulian/kondor)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
