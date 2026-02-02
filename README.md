# ♔ Chaturanga ♚

> A unique chess variant featuring the **Chatur** — a new piece that moves diagonally and captures straight! Now with **AI opponent**, **online multiplayer**, **sound effects**, and a stunning **Indian sacred geometry theme**.

![Version](https://img.shields.io/badge/version-2.2.0-gold)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Installable-blueviolet)

---

## 🎯 What's New in v2.2

- 🌐 **Online Multiplayer** — Real-time play with friends using Supabase
  - 🎲 Create/Join game rooms via 6-digit codes
  - 🔄 Instant move synchronization
  - 🚪 Smart disconnect detection
  - 📱 Optimized for cross-device play
- 🔊 **Sound Effects** — Authentic wooden chess piece sounds (move, capture, check, victory)
- ↩️ **Undo/Redo** — Take back moves (smart 2-step for AI mode)
- 🟡 **Last Move Highlight** — See which squares were involved in the previous move
- 🎮 **Start Screen** — Beautiful popup to select game mode and difficulty
- 📱 **PWA Support** — Install as a standalone app on mobile/desktop
- 🤖 **AI Opponent** — 3 difficulty levels (Easy, Medium, Hard)
- 🎨 **Indian Sacred Geometry Theme** — Custom artwork with gold accents
- 👥 **2-Player Mode** — Play locally against a friend

---

## 📖 Table of Contents

- [Overview](#-overview)
- [The Chatur Piece](#-the-chatur-piece)
- [Game Rules](#-game-rules)
- [Board Setup](#-board-setup)
- [Features](#-features)
- [Installation](#-installation)
- [How to Play](#-how-to-play)
- [Technical Details](#-technical-details)
- [File Structure](#-file-structure)
- [Customization](#-customization)
- [Browser Support](#-browser-support)
- [License](#-license)

---

## 🎯 Overview

**Chaturanga** is a modern, browser-based chess variant that introduces a completely new piece called the **Chatur**. The game maintains all the classic chess rules while adding strategic depth through this innovative piece that behaves as the inverse of a pawn.

The name "Chatur" (चतुर) means "clever" or "cunning" in Hindi/Sanskrit, reflecting the tricky nature of this piece's unique movement pattern.

---

## 🆕 The Chatur Piece

The **Chatur** is the star of this chess variant. It's designed as the inverse of a pawn:

### Movement Rules

| Aspect | Pawn (♙/♟) | Chatur |
|--------|------------|--------|
| **Normal Movement** | Straight forward (1 square) | Diagonal forward (1 square) |
| **First Move** | Can move 2 squares straight | Can move 2 squares diagonal |
| **Capture Direction** | Diagonal (left or right) | Straight forward |
| **Promotion** | Yes, at 8th rank | Yes, at 8th rank |

### Strategic Notes

- The Chatur can control different squares than pawns, making the opening game more dynamic
- Since it moves diagonally but captures straight, it creates unique tactical opportunities
- The double diagonal move on the first turn allows for rapid flank development
- Chaturs can support each other differently than pawns

---

## 📜 Game Rules

### Standard Chess Rules Apply

All standard chess rules remain in effect for the traditional pieces:

1. **King** — Moves one square in any direction
2. **Queen** — Moves any number of squares in any direction
3. **Rook** — Moves any number of squares horizontally or vertically
4. **Bishop** — Moves any number of squares diagonally
5. **Knight** — Moves in an "L" shape (2+1 squares)
6. **Pawn** — Moves forward, captures diagonally

### Special Rules

| Rule | Description |
|------|-------------|
| **Castling** | Fully supported (kingside and queenside) |
| **Pawn Promotion** | Pawns reaching the 8th rank can promote |
| **Chatur Promotion** | Chaturs reaching the 8th rank can also promote |
| **Check** | The king must not be left in check |
| **Checkmate** | Game ends when the king is in check with no legal moves |
| **Stalemate** | Game is drawn if player has no legal moves but is not in check |

---

## 🎮 Board Setup

### Initial Position

The game starts with an alternating pattern of pawns and chaturs in the second rank:

```
    a   b   c   d   e   f   g   h
  ┌───┬───┬───┬───┬───┬───┬───┬───┐
8 │ ♜ │ ♞ │ ♝ │ ♛ │ ♚ │ ♝ │ ♞ │ ♜ │  Black Back Rank
  ├───┼───┼───┼───┼───┼───┼───┼───┤
7 │ ♟ │ ⛂ │ ♟ │ ⛂ │ ♟ │ ⛂ │ ♟ │ ⛂ │  Black Pawns & Chaturs
  ├───┼───┼───┼───┼───┼───┼───┼───┤
6 │   │   │   │   │   │   │   │   │
  ├───┼───┼───┼───┼───┼───┼───┼───┤
5 │   │   │   │   │   │   │   │   │
  ├───┼───┼───┼───┼───┼───┼───┼───┤
4 │   │   │   │   │   │   │   │   │
  ├───┼───┼───┼───┼───┼───┼───┼───┤
3 │   │   │   │   │   │   │   │   │
  ├───┼───┼───┼───┼───┼───┼───┼───┤
2 │ ♙ │ ⛃ │ ♙ │ ⛃ │ ♙ │ ⛃ │ ♙ │ ⛃ │  White Pawns & Chaturs
  ├───┼───┼───┼───┼───┼───┼───┼───┤
1 │ ♖ │ ♘ │ ♗ │ ♕ │ ♔ │ ♗ │ ♘ │ ♖ │  White Back Rank
  └───┴───┴───┴───┴───┴───┴───┴───┘
```

---

## ✨ Features

### Core Gameplay
- ✅ Full chess logic with all standard pieces
- ✅ New Chatur piece with unique movement
- ✅ **Online Multiplayer** (Supabase)
- ✅ **AI opponent** with 3 difficulty levels
- ✅ **2-Player local mode**
- ✅ Legal move validation
- ✅ Check and checkmate detection
- ✅ Stalemate detection
- ✅ Castling (kingside and queenside)
- ✅ Pawn and Chatur promotion

### Visual Design
- 🎨 **Indian sacred geometry theme** — Minimalist pieces inspired by yantras, lotus, trishul
- 🖼️ Custom board with decorative border
- ✨ Gold and cream color palette
- 🌟 Victory celebration effects
- 💫 Smooth piece hover animations
- 📱 Responsive design for all screen sizes

### User Interface
- 🎯 Click-to-select piece interaction
- 💡 Visual move highlighting (gold dots for moves, rings for captures)
- 🟡 **Last move highlight** — Gold tint on from/to squares
- ⚠️ Check indicator (pulsing red glow on king)
- 🔄 Turn indicator showing current player
- 📊 Captured pieces display
- 📖 In-game rules modal
- 🎮 Start screen with game mode selection

### Sound & UX
- 🔊 **Authentic chess sounds** — Wooden piece move, capture, check, victory
- ↩️ **Undo/Redo** — Smart 2-step undo in AI mode (undoes your move + AI response)
- 📱 **PWA Installable** — Add to home screen on mobile, install on desktop

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd chatur-chess/mobapp

# Install dependencies
npm install

# Start development server
npm run dev
```

Then open `http://localhost:3000/mobapp/` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🎮 How to Play

### Basic Controls

1. **Select a Piece:** Click on any piece of your color
2. **View Valid Moves:** Gold dots appear on valid move squares
3. **View Captures:** Gold rings show capturable enemy pieces
4. **Make a Move:** Click on any highlighted square
5. **Cancel Selection:** Click elsewhere to deselect

### Game Modes

| Mode | Description |
|------|-------------|
| **Vs AI** | Play against the computer (3 difficulty levels) |
| **Local PvP** | Play locally against a friend on same device |
| **Online** | Create/Join room to play with friend remotely |

### Online Play
1. **Host**: Select "Online" -> "Create Game". Share the 6-letter code.
2. **Guest**: Select "Online" -> "Join Game". Enter the code.
3. Play! Board flips automatically for the black player.

### AI Difficulty

- **Easy** — Depth 2 search, makes some mistakes
- **Medium** — Depth 3 search, solid play
- **Hard** — Depth 4 search, challenging opponent

---

## 🔧 Technical Details

### Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI components and state management |
| **TypeScript** | Type-safe code |
| **Vite** | Fast development and bundling |
| **TailwindCSS** | Utility-first styling |

### Architecture

```
┌─────────────────────────────────────────────┐
│                  App.tsx                     │
│            (Main Game Component)             │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐          ┌───────────────┐
│ utils/engine  │          │  utils/ai     │
│ (Move Logic)  │          │ (AI Opponent) │
└───────────────┘          └───────────────┘
```

### Key Modules

| Module | Description |
|--------|-------------|
| `App.tsx` | Main game component with UI |
| `utils/engine.ts` | Chess logic, move validation, check detection |
| `utils/ai.ts` | Minimax AI with alpha-beta pruning |
| `utils/sounds.ts` | Sound effects using Lichess audio |
| `utils/constants.ts` | Piece symbols and board size |
| `types.ts` | TypeScript type definitions |

---

## 📁 File Structure

```
mobapp/
├── public/
│   ├── board.png           # Custom board image
│   └── pieces/             # 14 piece images (white/black × 7 types)
│       ├── white_king.png
│       ├── black_king.png
│       └── ...
├── src/
│   ├── App.tsx             # Main game component
│   ├── types.ts            # TypeScript types
│   └── utils/
│       ├── engine.ts       # Chess logic
│       ├── ai.ts           # AI opponent
│       └── constants.ts    # Game constants
├── index.html              # Entry point with CSS theme
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

---

## 🎨 Customization

### Color Palette

The theme uses CSS variables in `index.html`:

```css
:root {
    --deep-black: #1a1814;     /* Background, dark pieces */
    --dark-square: #2d2a24;    /* Dark squares */
    --gold: #b8860b;           /* Primary accent */
    --gold-bright: #d4a574;    /* Highlights */
    --cream: #f5e6c8;          /* Light squares, white pieces */
}
```

### Custom Piece Images

Replace images in `public/pieces/` with your own:
- **Size:** 512×512 pixels
- **Format:** PNG with transparent background
- **Naming:** `{color}_{piece}.png` (e.g., `white_king.png`)

### Custom Board

Replace `public/board.png` with your own board image (1024×1024 recommended).

---

## 🌐 Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome | ✅ |
| Firefox | ✅ |
| Safari | ✅ |
| Edge | ✅ |
| Mobile Browsers | ✅ |

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2026 Chaturanga

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Credits

**Game Created By:** Jiv Dost Mahan  
**Design and Developed By:** Sunny Vaghela

---

<div align="center">

**Made with ♔ by Chaturanga Team**

*Enjoy the game and may the best strategist win!*

</div>
