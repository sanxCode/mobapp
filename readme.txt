================================================================================
                            CHATURANGA v2.2.0
                      Ancient Chess Reimagined
================================================================================

A unique chess variant featuring the CHATUR - a new piece that moves 
diagonally and captures straight! Now with AI opponent, Online Multiplayer, 
sound effects, and a stunning Indian sacred geometry theme.

================================================================================
                          WHAT'S NEW IN v2.2
================================================================================

* ONLINE MULTIPLAYER - Real-time play with friends using Supabase
    + Create/Join game rooms via 6-digit codes
    + Instant move synchronization
    + Smart disconnect detection
    + Optimized for cross-device play
* SOUND EFFECTS - Authentic wooden chess piece sounds
* UNDO/REDO - Take back moves (smart 2-step for AI mode)
* LAST MOVE HIGHLIGHT - See which squares were involved in previous move
* START SCREEN - Beautiful popup to select game mode and difficulty
* PWA SUPPORT - Install as a standalone app on mobile/desktop
* AI OPPONENT - 3 difficulty levels (Easy, Medium, Hard)
* INDIAN SACRED GEOMETRY THEME - Custom artwork with gold accents
* 2-PLAYER MODE - Play locally against a friend

================================================================================
                           THE CHATUR PIECE
================================================================================

The Chatur is the star of this chess variant - it's the INVERSE of a pawn:

                    PAWN                    CHATUR
  Movement:         Straight forward        Diagonal forward
  First Move:       2 squares straight      2 squares diagonal
  Capture:          Diagonal                Straight forward
  Promotion:        Yes, at 8th rank        Yes, at 8th rank

The name "Chatur" (चतुर) means "clever" in Hindi/Sanskrit.

================================================================================
                            BOARD SETUP
================================================================================

    a   b   c   d   e   f   g   h
  +---+---+---+---+---+---+---+---+
8 | R | N | B | Q | K | B | N | R |  Black Back Rank
  +---+---+---+---+---+---+---+---+
7 | P | C | P | C | P | C | P | C |  Black Pawns & Chaturs
  +---+---+---+---+---+---+---+---+
6 |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+
5 |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+
4 |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+
3 |   |   |   |   |   |   |   |   |
  +---+---+---+---+---+---+---+---+
2 | P | C | P | C | P | C | P | C |  White Pawns & Chaturs
  +---+---+---+---+---+---+---+---+
1 | R | N | B | Q | K | B | N | R |  White Back Rank
  +---+---+---+---+---+---+---+---+

P = Pawn, C = Chatur

================================================================================
                              FEATURES
================================================================================

GAMEPLAY:
  * Full chess logic with all standard pieces
  * New Chatur piece with unique movement
  * Online Multiplayer (Supabase)
  * AI opponent with 3 difficulty levels
  * 2-Player local mode
  * Legal move validation
  * Check and checkmate detection
  * Stalemate detection
  * Castling (kingside and queenside)
  * Pawn and Chatur promotion

VISUAL:
  * Indian sacred geometry theme
  * Custom board with decorative border
  * Gold and cream color palette
  * Victory celebration effects
  * Smooth piece hover animations
  * Responsive design for all screen sizes

SOUND & UX:
  * Authentic wooden chess sounds (move, capture, check, victory)
  * Undo/Redo with smart 2-step for AI mode
  * Last move highlight (gold tint on from/to squares)
  * Start screen with game mode selection
  * PWA installable on mobile/desktop

================================================================================
                           INSTALLATION
================================================================================

Prerequisites: Node.js 18+ and npm

1. Clone the repository
   git clone <your-repo-url>
   cd chatur-chess/mobapp

2. Install dependencies
   npm install

3. Start development server
   npm run dev

4. Open http://localhost:3000/mobapp/ in your browser

Production Build:
   npm run build
   npm run preview

================================================================================
                           HOW TO PLAY
================================================================================

CONTROLS:
1. Select a Piece - Click on any piece of your color
2. View Valid Moves - Gold dots appear on valid move squares
3. View Captures - Gold rings show capturable enemy pieces
4. Make a Move - Click on any highlighted square
5. Cancel Selection - Click elsewhere to deselect
6. Undo - Click the undo button (undoes your move + AI response)
7. Redo - Click the redo button to restore undone moves

GAME MODES:
  * Vs AI - Play against the computer (Easy/Medium/Hard)
  * Local PvP - Play locally against a friend on same device
  * Online - Create/Join room to play with friend remotely

ONLINE PLAY:
1. Host: Select "Online" -> "Create Game". Share the 6-letter code.
2. Guest: Select "Online" -> "Join Game". Enter the code.
3. Play! Board flips automatically for the black player.

AI DIFFICULTY:
  * Easy - Depth 2 search, makes some mistakes
  * Medium - Depth 3 search, solid play
  * Hard - Depth 4 search, challenging opponent

================================================================================
                         TECHNOLOGY STACK
================================================================================

  * React 19 - UI components and state management
  * TypeScript - Type-safe code
  * Vite - Fast development and bundling
  * TailwindCSS - Utility-first styling
  * Web Audio API - Sound effects via Lichess audio
  * Supabase - Database & Realtime sync for multiplayer

================================================================================
                            BROWSER SUPPORT
================================================================================

  * Chrome - Supported
  * Firefox - Supported
  * Safari - Supported
  * Edge - Supported
  * Mobile Browsers - Supported

================================================================================
                              LICENSE
================================================================================

This project is licensed under the MIT License.

Copyright (c) 2026 Chaturanga

================================================================================
                              CREDITS
================================================================================

Game Created By: Jiv Dost Mahan
Design and Developed By: Sunny Vaghela

================================================================================

                Made with love by Chaturanga Team
           Enjoy the game and may the best strategist win!

================================================================================
