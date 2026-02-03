import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialBoard, getLegalMoves, isKingInCheck, simulateMove, hasAnyLegalMoves } from './utils/engine';
import { getBestMove } from './utils/ai';
import { BOARD_SIZE, PIECE_SYMBOLS } from './utils/constants';
import { playMoveSound, playCaptureSound, playCheckSound, playVictorySound, playDrawSound, playUndoSound, playRedoSound, playStartSound } from './utils/sounds';
import { createGameRoom, joinGameRoom, getGameState, updateGameState, subscribeToGame, isPlayerTurn, getPlayerColor, abandonGame, GameRoom } from './utils/multiplayer';

// Helper to get base path for assets
const getBasePath = () => import.meta.env.BASE_URL || '/';

// Get piece image path
const getPieceImage = (color: string, type: string) => {
  const pieceName = `${color}_${type.toLowerCase()}`;
  return `${getBasePath()}pieces/${pieceName}.png`;
};
import { BoardState, Color, GameState, Move, PieceType, Position } from './types';

// Constants
const AI_COLOR: Color = 'black';
const AI_DELAY_MS = 500;

// ============== Interactive Chatur Tutorial Component ==============
interface TutorialStep {
  title: string;
  description: string;
  board: (string | null)[][]; // 5x5 mini board
  highlights: { row: number; col: number; type: 'move' | 'capture' | 'piece' | 'arrow' }[];
  pieceMove?: { from: { row: number; col: number }; to: { row: number; col: number } };
  showArrow?: boolean; // Whether to show the directional arrow
}

const ChaturTutorialModal: React.FC<{
  onClose: () => void;
  getPieceImage: (color: string, type: string) => string;
}> = ({ onClose, getPieceImage }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Tutorial steps with mini-board configurations
  const tutorialSteps: TutorialStep[] = [
    {
      title: "Meet the Chatur",
      description: "The Chatur is a new piece that moves differently from any other!",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, 'wc', null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
      ],
      highlights: [{ row: 2, col: 2, type: 'piece' }],
    },
    {
      title: "Movement: Diagonal Forward",
      description: "The Chatur moves DIAGONALLY forward — one square at a time.",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, 'wc', null, null],
        [null, null, null, null, null],
      ],
      highlights: [
        { row: 3, col: 2, type: 'piece' },
        { row: 2, col: 1, type: 'move' },
        { row: 2, col: 3, type: 'move' },
      ],
      pieceMove: { from: { row: 3, col: 2 }, to: { row: 2, col: 3 } },
      showArrow: false,
    },
    {
      title: "First Move: Double Diagonal",
      description: "On its FIRST move, the Chatur can jump 2 squares diagonally!",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, 'wc', null, null],
      ],
      highlights: [
        { row: 4, col: 2, type: 'piece' },
        { row: 3, col: 1, type: 'move' },
        { row: 3, col: 3, type: 'move' },
        { row: 2, col: 0, type: 'move' },
        { row: 2, col: 4, type: 'move' },
      ],
      pieceMove: { from: { row: 4, col: 2 }, to: { row: 2, col: 4 } },
      showArrow: false,
    },
    {
      title: "Capture: Straight Forward",
      description: "The Chatur captures STRAIGHT forward — the opposite of how it moves!",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, 'bp', null, null],
        [null, null, 'wc', null, null],
        [null, null, null, null, null],
      ],
      highlights: [
        { row: 3, col: 2, type: 'piece' },
        { row: 2, col: 2, type: 'capture' },
      ],
      pieceMove: { from: { row: 3, col: 2 }, to: { row: 2, col: 2 } },
    },
    {
      title: "Compare: Pawn vs Chatur",
      description: "Pawn moves STRAIGHT, captures DIAGONAL. Chatur is the OPPOSITE!",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, 'wp', null, 'wc', null],
        [null, null, null, null, null],
      ],
      highlights: [
        { row: 3, col: 1, type: 'piece' },
        { row: 3, col: 3, type: 'piece' },
        { row: 2, col: 1, type: 'move' }, // Pawn moves straight
        { row: 2, col: 2, type: 'move' }, // Chatur moves diagonal
        { row: 2, col: 4, type: 'move' }, // Chatur moves diagonal other side
      ],
    },
    {
      title: "Board Position",
      description: "Chaturs alternate with Pawns: columns b, d, f, h have Chaturs!",
      board: [
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        ['wp', 'wc', 'wp', 'wc', 'wp'],
      ],
      highlights: [
        { row: 4, col: 1, type: 'piece' },
        { row: 4, col: 3, type: 'piece' },
      ],
    },
    {
      title: "Standard Chess Rules",
      description: "Everything else follows normal chess! King, Queen, Rook, Bishop, Knight, and Pawn move as usual. Win by Checkmate!",
      board: [
        ['br', 'bn', 'bb', 'bq', 'bk'],
        [null, null, null, null, null],
        [null, null, null, null, null],
        [null, null, null, null, null],
        ['wr', 'wn', 'wb', 'wq', 'wk'],
      ],
      highlights: [],
    },
  ];

  // Animation phase timer (5 phases for richer animations)
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 5);
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Auto-advance steps with smooth transition
  useEffect(() => {
    if (!isPlaying) return;

    const stepTimer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(prev => (prev + 1) % tutorialSteps.length);
        setAnimationPhase(0);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 300);
    }, 5000);

    return () => clearInterval(stepTimer);
  }, [isPlaying, tutorialSteps.length]);

  // Calculate piece movement offset for slide animation
  const getPieceMoveOffset = (r: number, c: number) => {
    const pieceMove = currentTutorial.pieceMove;
    if (!pieceMove) return { x: 0, y: 0 };
    if (pieceMove.from.row !== r || pieceMove.from.col !== c) return { x: 0, y: 0 };

    const dx = (pieceMove.to.col - pieceMove.from.col) * 51.2;
    const dy = (pieceMove.to.row - pieceMove.from.row) * 51.2;

    // Check if it's a single-step move (1 square diagonal)
    const isSingleStep = Math.abs(pieceMove.to.row - pieceMove.from.row) === 1;

    if (animationPhase >= 3) {
      if (isSingleStep) {
        // Single-step: move in one smooth motion at phase 3+
        return { x: dx, y: dy };
      } else {
        // Double-step (2 squares): show mid-point progress
        const progress = animationPhase === 3 ? 0.5 : 1;
        return { x: dx * progress, y: dy * progress };
      }
    }
    return { x: 0, y: 0 };
  };

  const currentTutorial = tutorialSteps[currentStep];

  const renderMiniBoard = () => {
    const board = currentTutorial.board;
    const highlights = currentTutorial.highlights;

    return (
      <div
        className={`relative grid grid-cols-5 gap-0 w-64 h-64 mx-auto rounded-lg overflow-visible border-2 border-[#b8860b] shadow-2xl transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{ boxShadow: '0 0 30px rgba(184, 134, 11, 0.3)' }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isLight = (r + c) % 2 === 0;
            const highlight = highlights.find(h => h.row === r && h.col === c);
            const highlightType = highlight?.type;
            const moveOffset = getPieceMoveOffset(r, c);

            // Determine piece to show
            let pieceColor = '';
            let pieceType = '';
            if (cell) {
              pieceColor = cell[0] === 'w' ? 'white' : 'black';
              const typeChar = cell[1];
              const typeMap: { [key: string]: string } = {
                'c': 'chatur', 'p': 'pawn', 'r': 'rook',
                'n': 'knight', 'b': 'bishop', 'q': 'queen', 'k': 'king',
              };
              pieceType = typeMap[typeChar] || 'pawn';
            }

            // Sequential animation for move dots
            const moveIndex = highlights.filter(h => h.type === 'move').findIndex(h => h.row === r && h.col === c);
            const isActiveMove = highlightType === 'move' && (animationPhase >= (moveIndex % 3) + 1);

            return (
              <div
                key={`${r}-${c}`}
                className={`relative flex items-center justify-center overflow-visible ${isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'} transition-all duration-200`}
                style={{ width: '51.2px', height: '51.2px' }}
              >
                {/* Glow background for highlighted pieces */}
                {highlightType === 'piece' && (
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle, rgba(212, 165, 116, ${animationPhase % 2 === 0 ? 0.5 : 0.2}) 0%, transparent 70%)`,
                    }}
                  />
                )}

                {/* Move indicator with ripple effect */}
                {highlightType === 'move' && (
                  <>
                    <div
                      className="absolute rounded-full bg-[#b8860b]/30 transition-all"
                      style={{
                        width: isActiveMove ? '28px' : '0px',
                        height: isActiveMove ? '28px' : '0px',
                        opacity: isActiveMove ? 0.6 : 0,
                        transitionDuration: '400ms',
                        transitionDelay: `${moveIndex * 80}ms`,
                      }}
                    />
                    <div
                      className="absolute rounded-full bg-[#d4a574] shadow-lg transition-all"
                      style={{
                        width: isActiveMove ? '14px' : '6px',
                        height: isActiveMove ? '14px' : '6px',
                        opacity: 0.95,
                        transitionDuration: '300ms',
                        transitionDelay: `${moveIndex * 80}ms`,
                        boxShadow: isActiveMove ? '0 0 12px rgba(212, 165, 116, 0.9)' : 'none',
                      }}
                    />
                  </>
                )}

                {/* Capture indicator with pulsing crosshair */}
                {highlightType === 'capture' && (
                  <>
                    <div
                      className="absolute inset-0 transition-all"
                      style={{
                        boxShadow: animationPhase % 2 === 0
                          ? 'inset 0 0 18px rgba(239, 68, 68, 0.7)'
                          : 'inset 0 0 10px rgba(239, 68, 68, 0.4)',
                        transitionDuration: '300ms',
                      }}
                    />
                    <div
                      className="absolute rounded-full border-4 border-red-500 transition-all"
                      style={{
                        width: animationPhase % 2 === 0 ? '38px' : '32px',
                        height: animationPhase % 2 === 0 ? '38px' : '32px',
                        transitionDuration: '300ms',
                      }}
                    />
                    <div className="absolute w-7 h-0.5 bg-red-500/70" />
                    <div className="absolute w-0.5 h-7 bg-red-500/70" />
                  </>
                )}

                {/* Piece image with slide animation */}
                {cell && (
                  <img
                    src={getPieceImage(pieceColor, pieceType)}
                    alt={`${pieceColor} ${pieceType}`}
                    className="w-10 h-10 object-contain z-20 transition-all"
                    style={{
                      transform: `translate(${moveOffset.x}px, ${moveOffset.y}px) scale(${highlightType === 'piece' && animationPhase % 2 === 0 ? 1.12 : 1})`,
                      transitionDuration: moveOffset.x !== 0 || moveOffset.y !== 0 ? '400ms' : '200ms',
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      filter: highlightType === 'piece'
                        ? `drop-shadow(0 0 ${animationPhase % 2 === 0 ? '14px' : '8px'} rgba(212, 165, 116, 0.9))`
                        : 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                    }}
                  />
                )}
              </div>
            );
          })
        )}

        {/* Arrow overlay for movement direction */}
        {currentTutorial.pieceMove && currentTutorial.showArrow !== false && animationPhase < 3 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" style={{ opacity: animationPhase === 2 ? 1 : 0.7 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#d4a574" />
              </marker>
            </defs>
            <line
              x1={(currentTutorial.pieceMove.from.col + 0.5) * 51.2}
              y1={(currentTutorial.pieceMove.from.row + 0.5) * 51.2}
              x2={(currentTutorial.pieceMove.to.col + 0.5) * 51.2 - 8}
              y2={(currentTutorial.pieceMove.to.row + 0.5) * 51.2 - 8}
              stroke="#d4a574"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
              strokeDasharray="6,4"
              className="animate-pulse"
            />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1814] border-2 border-[#b8860b] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#b8860b]/30">
          <h2 className="text-2xl font-cinzel text-[#d4a574]">How to Play</h2>
          <button
            onClick={onClose}
            className="text-[#b8860b] hover:text-[#d4a574] text-2xl transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Tutorial Content */}
        <div className="p-6 space-y-6">
          {/* Step indicator */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentStep
                  ? 'bg-[#d4a574] scale-125'
                  : 'bg-[#2d2a24] hover:bg-[#b8860b]/50'
                  }`}
              />
            ))}
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#f5e6c8] mb-2">
              {currentTutorial.title}
            </h3>
            <p className="text-[#b8860b] text-sm">
              {currentTutorial.description}
            </p>
          </div>

          {/* Mini Board */}
          {renderMiniBoard()}

          {/* Legend */}
          <div className="flex justify-center gap-6 text-xs text-[#f5e6c8]/70">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#b8860b]" />
              <span>Move</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-red-500" />
              <span>Capture</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setCurrentStep(prev => (prev - 1 + tutorialSteps.length) % tutorialSteps.length)}
              className="px-4 py-2 bg-[#2d2a24] text-[#f5e6c8] rounded-lg hover:bg-[#b8860b] hover:text-[#1a1814] transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-lg transition-all ${isPlaying
                ? 'bg-[#b8860b] text-[#1a1814]'
                : 'bg-[#2d2a24] text-[#f5e6c8] hover:bg-[#b8860b] hover:text-[#1a1814]'
                }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => setCurrentStep(prev => (prev + 1) % tutorialSteps.length)}
              className="px-4 py-2 bg-[#2d2a24] text-[#f5e6c8] rounded-lg hover:bg-[#b8860b] hover:text-[#1a1814] transition-all"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Quick Reference Footer */}
        <div className="p-4 bg-[#0d0d0a] border-t border-[#b8860b]/30">
          <h4 className="text-sm font-bold text-[#d4a574] mb-2 text-center">Quick Reference</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-[#1a1814] p-3 rounded-lg border border-[#2d2a24]">
              <div className="flex items-center gap-2 mb-1">
                <img src={getPieceImage('white', 'pawn')} alt="Pawn" className="w-6 h-6" />
                <span className="text-[#f5e6c8] font-bold">Pawn</span>
              </div>
              <p className="text-[#b8860b]/80">Moves: ↑ Straight</p>
              <p className="text-red-400/80">Captures: ↗↖ Diagonal</p>
            </div>
            <div className="bg-[#1a1814] p-3 rounded-lg border border-[#b8860b]/50">
              <div className="flex items-center gap-2 mb-1">
                <img src={getPieceImage('white', 'chatur')} alt="Chatur" className="w-6 h-6" />
                <span className="text-[#f5e6c8] font-bold">Chatur</span>
              </div>
              <p className="text-[#b8860b]/80">Moves: ↗↖ Diagonal</p>
              <p className="text-red-400/80">Captures: ↑ Straight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  // Game Configuration
  const [gameMode, setGameMode] = useState<'pvc' | 'pvp' | 'online'>('pvc'); // Player vs Computer, Player vs Player, Online
  const [aiDifficulty, setAiDifficulty] = useState<number>(3); // Search depth
  const [showRules, setShowRules] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(true); // Show start popup on load

  // Multiplayer State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [multiplayerError, setMultiplayerError] = useState<string | null>(null);
  const [onlineSubscreen, setOnlineSubscreen] = useState<'menu' | 'create' | 'join'>('menu');
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);

  // Game State
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createInitialBoard(),
    turn: 'white',
    selectedSquare: null,
    validMoves: [],
    gameOver: false,
    winner: null,
    check: false,
    capturedWhite: [],
    capturedBlack: [],
    promotionPending: null
  }));

  // Move History for Undo/Redo
  const [history, setHistory] = useState<GameState[]>([]);
  const [future, setFuture] = useState<GameState[]>([]);

  // Last move for highlighting
  const [lastMove, setLastMove] = useState<{ from: Position; to: Position } | null>(null);

  // Refs for AI handling to avoid stale closures in timeouts
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Show start screen (for New Game button)
  const openStartScreen = () => {
    setShowStartScreen(true);
  };

  // Actually reset and start the game
  const startGame = () => {
    setGameState({
      board: createInitialBoard(),
      turn: 'white',
      selectedSquare: null,
      validMoves: [],
      gameOver: false,
      winner: null,
      check: false,
      capturedWhite: [],
      capturedBlack: [],
      promotionPending: null
    });
    setHistory([]);
    setFuture([]);
    setLastMove(null);
    setShowStartScreen(false);
    setRoomId(null);
    setRoomCode('');
    setPlayerColor(null);
    setWaitingForOpponent(false);
    setOpponentLeft(false);
    setOpponentId(null);
    playStartSound();
  };

  // Create online game room
  const handleCreateGame = async () => {
    setMultiplayerError(null);
    const result = await createGameRoom();
    if (result) {
      setRoomId(result.roomId);
      setRoomCode(result.code);
      setPlayerColor('white');
      setWaitingForOpponent(true);
      setGameMode('online');
    } else {
      setMultiplayerError('Failed to create game. Please try again.');
    }
  };

  // Join online game room
  const handleJoinGame = async () => {
    if (!joinCodeInput.trim()) {
      setMultiplayerError('Please enter a game code.');
      return;
    }
    setMultiplayerError(null);
    const result = await joinGameRoom(joinCodeInput.trim());
    if ('error' in result) {
      setMultiplayerError(result.error);
    } else {
      setRoomId(result.roomId);
      setPlayerColor(result.playerColor);
      setGameMode('online');
      setWaitingForOpponent(false);
      setShowStartScreen(false);
      // Fetch initial game state
      const game = await getGameState(result.roomId);
      if (game) {
        setGameState({
          board: game.board_state,
          turn: game.current_turn,
          selectedSquare: null,
          validMoves: [],
          gameOver: game.game_over,
          winner: game.winner,
          check: game.in_check,
          capturedWhite: game.captured_white,
          capturedBlack: game.captured_black,
          promotionPending: null
        });
        setLastMove(game.last_move);
        setRoomCode(game.code);
      }
      playStartSound();
    }
  };

  // Subscribe to online game updates
  const opponentIdRef = useRef<string | null>(null);
  opponentIdRef.current = opponentId;

  useEffect(() => {
    if (gameMode !== 'online' || !roomId) return;

    const unsubscribe = subscribeToGame(
      roomId,
      opponentIdRef.current,
      (game: GameRoom) => {
        // Track opponent ID when game updates
        if (playerColor === 'white' && game.guest_id && !opponentIdRef.current) {
          setOpponentId(game.guest_id);
          opponentIdRef.current = game.guest_id;
        } else if (playerColor === 'black' && game.host_id && !opponentIdRef.current) {
          setOpponentId(game.host_id);
          opponentIdRef.current = game.host_id;
        }

        // Check if opponent joined
        if (waitingForOpponent && game.guest_id) {
          setWaitingForOpponent(false);
          setShowStartScreen(false);
          playStartSound();
        }

        // Update game state from server
        setGameState({
          board: game.board_state,
          turn: game.current_turn,
          selectedSquare: null,
          validMoves: [],
          gameOver: game.game_over,
          winner: game.winner,
          check: game.in_check,
          capturedWhite: game.captured_white,
          capturedBlack: game.captured_black,
          promotionPending: null
        });
        setLastMove(game.last_move);

        // Play sounds
        if (game.game_over) {
          if (game.winner === 'draw') playDrawSound();
          else playVictorySound();
        } else if (game.in_check) {
          playCheckSound();
        }
      },
      // Opponent left callback
      () => {
        if (!gameState.gameOver) {
          setOpponentLeft(true);
          // Mark game as won by remaining player - update local state immediately
          if (playerColor) {
            setGameState(prev => ({
              ...prev,
              gameOver: true,
              winner: playerColor
            }));
            // Also update the database
            const opponentColor = playerColor === 'white' ? 'black' : 'white';
            abandonGame(roomId, opponentColor);
            playVictorySound();
          }
        }
      }
    );

    return () => unsubscribe();
  }, [gameMode, roomId, waitingForOpponent, gameState.gameOver, playerColor]);

  // Undo last move (in AI mode, undo 2 moves to skip AI's turn)
  const undoMove = () => {
    if (history.length === 0) return;

    let stepsToUndo = 1;

    if (gameMode === 'pvc') {
      // If player won, only undo 1 step (to see state before winning move)
      // Otherwise (AI won or normal play), undo 2 steps (to retry player's turn)
      if (gameState.gameOver && gameState.winner !== AI_COLOR) {
        stepsToUndo = 1;
      } else if (history.length >= 2) {
        stepsToUndo = 2;
      }
    }

    // Get the state to restore
    const previousState = history[history.length - stepsToUndo];

    // Store current state and intermediate states for redo
    if (stepsToUndo === 2) {
      // Store both states: [intermediate AI state, current state]
      setFuture(prev => [history[history.length - 1], gameState, ...prev]);
    } else {
      setFuture(prev => [gameState, ...prev]);
    }

    setHistory(prev => prev.slice(0, -stepsToUndo));
    setGameState(previousState);
    playUndoSound();
  };

  // Redo move (in AI mode, redo 2 moves)
  const redoMove = () => {
    if (future.length === 0) return;

    // In PvC mode, redo 2 moves if possible
    const stepsToRedo = (gameMode === 'pvc' && future.length >= 2) ? 2 : 1;

    // Get the target state
    const nextState = future[stepsToRedo - 1];

    // Store current state and intermediate states to history
    if (stepsToRedo === 2) {
      setHistory(prev => [...prev, gameState, future[0]]);
    } else {
      setHistory(prev => [...prev, gameState]);
    }

    setFuture(prev => prev.slice(stepsToRedo));
    setGameState(nextState);
    playRedoSound();
  };

  // Save state to history before making a move
  const saveToHistory = () => {
    setHistory(prev => [...prev, { ...gameState }]);
    setFuture([]); // Clear redo stack when new move is made
  };

  // --- Move Handling ---

  const handleSquareClick = (row: number, col: number) => {
    if ((gameState.gameOver && !history.length) || gameState.promotionPending) return;
    // Allow clicking if game over to select pieces (optional) but generally we stop moves. 
    // Actually standard is stop. But we enabled undo. 
    if (gameState.gameOver) return;

    if (gameMode === 'pvc' && gameState.turn === AI_COLOR) return; // Prevent clicking during AI turn
    if (gameMode === 'online' && gameState.turn !== playerColor) return; // Prevent clicking during opponent's turn

    const { selectedSquare, validMoves, board, turn } = gameState;
    const clickedPiece = board[row][col];

    // Case 1: Clicked a valid move for selected piece
    const move = validMoves.find(m => m.row === row && m.col === col);
    if (selectedSquare && move) {
      executeMove(selectedSquare.row, selectedSquare.col, move);
      return;
    }

    // Case 2: Clicked own piece (Select it)
    if (clickedPiece && clickedPiece.color === turn) {
      const moves = getLegalMoves(board, row, col);
      setGameState(prev => ({
        ...prev,
        selectedSquare: { row, col },
        validMoves: moves
      }));
      return;
    }

    // Case 3: Clicked empty or enemy piece (Deselect)
    setGameState(prev => ({
      ...prev,
      selectedSquare: null,
      validMoves: []
    }));
  };
  // ... (rest of file) ...
  // Update the button rendering lower down in the file


  const executeMove = (fromRow: number, fromCol: number, move: Move) => {
    // Save current state to history before making move
    saveToHistory();

    const { board, turn, capturedWhite, capturedBlack } = gameState;

    // Capture logic
    const capturedPiece = board[move.row][move.col];
    const newCapturedWhite = [...capturedWhite];
    const newCapturedBlack = [...capturedBlack];
    if (capturedPiece) {
      if (capturedPiece.color === 'white') newCapturedWhite.push(capturedPiece.type);
      else newCapturedBlack.push(capturedPiece.type);
      playCaptureSound();
    } else {
      playMoveSound();
    }

    // Track last move for highlight
    const newLastMove = { from: { row: fromRow, col: fromCol }, to: { row: move.row, col: move.col } };
    setLastMove(newLastMove);

    // Execute Move
    let newBoard = simulateMove(board, fromRow, fromCol, move.row, move.col, move.castling);

    // Promotion Check
    const movedPiece = newBoard[move.row][move.col];
    if (movedPiece && (movedPiece.type === PieceType.PAWN || movedPiece.type === PieceType.CHATUR)) {
      const promotionRow = movedPiece.color === 'white' ? 0 : 7;
      if (move.row === promotionRow) {
        // If AI, auto-promote to Queen
        if (gameMode === 'pvc' && turn === AI_COLOR) {
          newBoard[move.row][move.col] = { ...movedPiece, type: PieceType.QUEEN };
          finalizeTurn(newBoard, turn, newCapturedWhite, newCapturedBlack, newLastMove);
          return;
        } else {
          // Show promotion dialog for Human
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            capturedWhite: newCapturedWhite,
            capturedBlack: newCapturedBlack,
            promotionPending: { row: move.row, col: move.col, color: turn },
            validMoves: [],
            selectedSquare: null
          }));
          // We don't finalize turn yet, so lastMove is set but turn update waits for promotion
          // Note: When promotion finishes, we need to use this lastMove
          return;
        }
      }
    }

    finalizeTurn(newBoard, turn, newCapturedWhite, newCapturedBlack, newLastMove);
  };

  const promotePiece = (type: PieceType) => {
    if (!gameState.promotionPending) return;
    const { row, col, color } = gameState.promotionPending;

    const newBoard = gameState.board.map(r => [...r]);
    const piece = newBoard[row][col];
    if (piece) {
      newBoard[row][col] = { ...piece, type };
    }

    // Use current lastMove from state (it was set before promotion started)
    finalizeTurn(newBoard, color, gameState.capturedWhite, gameState.capturedBlack, lastMove);
  };

  const finalizeTurn = (
    newBoard: BoardState,
    currentTurn: Color,
    capWhite: PieceType[],
    capBlack: PieceType[],
    currentLastMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null = null
  ) => {
    const nextTurn = currentTurn === 'white' ? 'black' : 'white';

    // Check Game Status
    const inCheck = isKingInCheck(newBoard, nextTurn);
    const hasMoves = hasAnyLegalMoves(newBoard, nextTurn);

    let isOver = false;
    let winner: Color | 'draw' | null = null;

    if (!hasMoves) {
      isOver = true;
      if (inCheck) {
        winner = currentTurn; // The player who just moved won
        playVictorySound();
      } else {
        winner = 'draw'; // Stalemate
        playDrawSound();
      }
    } else if (inCheck) {
      playCheckSound();
    }

    setGameState({
      board: newBoard,
      turn: nextTurn,
      selectedSquare: null,
      validMoves: [],
      gameOver: isOver,
      winner: winner,
      check: inCheck,
      capturedWhite: capWhite,
      capturedBlack: capBlack,
      promotionPending: null
    });

    // Sync with Supabase if online game
    if (gameMode === 'online' && roomId) {
      updateGameState(
        roomId,
        newBoard,
        nextTurn,
        capWhite,
        capBlack,
        isOver,
        winner,
        inCheck,
        currentLastMove || lastMove // Use passed move or fall back to state (though state might be stale)
      );
    }
  };

  // --- AI Effect ---

  useEffect(() => {
    if (gameMode === 'pvc' && gameState.turn === AI_COLOR && !gameState.gameOver && !gameState.promotionPending) {
      const timer = setTimeout(() => {
        const aiResult = getBestMove(gameState.board, aiDifficulty, true, AI_COLOR);
        if (aiResult.move) {
          executeMove(aiResult.move.from.row, aiResult.move.from.col, aiResult.move.to);
        } else {
          // Should be checkmate/stalemate handled by previous turn check, but safety fallback
          console.log("AI has no moves");
        }
      }, AI_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.gameOver, gameState.promotionPending, gameMode, aiDifficulty]);

  // --- Render Helpers ---

  const getSquareColor = (r: number, c: number) => (r + c) % 2 === 0 ? 'bg-[#f0d9b5]' : 'bg-[#b58863]';

  const renderCaptured = (pieces: PieceType[], color: Color) => (
    <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
      {pieces.map((p, i) => (
        <img
          key={i}
          src={getPieceImage(color, p)}
          alt={`${color} ${p}`}
          className="w-5 h-5 object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 gap-6">

      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-cinzel font-bold title-shimmer">
          Chaturanga
        </h1>
        <div className="flex items-center justify-center gap-4">
          <p className="text-[#b8860b] font-light">
            {gameMode === 'pvc' ? `Human vs AI (Level ${aiDifficulty})` :
              gameMode === 'online' ? `Online Game • ${roomCode} • You: ${playerColor === 'white' ? '⚪' : '⚫'}` :
                'Player vs Player'}
          </p>
          <button
            onClick={openStartScreen}
            className="text-xs px-3 py-1 bg-[#2d2a24] text-[#b8860b] border border-[#b8860b]/50 rounded-full hover:bg-[#b8860b] hover:text-[#1a1814] transition-all"
          >
            ↻ New
          </button>
        </div>
      </header>

      {/* Game Info Bar - Compact */}
      <div className="w-full max-w-2xl bg-[#1a1814] border border-[#b8860b] rounded-lg px-4 py-3 flex flex-row justify-between items-center gap-2 shadow-xl">
        {/* Black Player */}
        <div className={`flex items-center gap-2 ${gameState.turn === 'black' ? 'opacity-100' : 'opacity-40'}`}>
          <div className={`w-6 h-6 rounded-full border-2 ${gameState.turn === 'black' ? 'border-[#d4a574] shadow-[0_0_10px_rgba(212,165,116,0.5)]' : 'border-[#2d2a24]'} bg-[#1a1814] transition-all`} />
          <span className="text-sm font-medium text-[#f5e6c8]">Black{gameMode === 'pvc' ? ' (AI)' : ''}</span>
        </div>

        {/* Undo/Redo Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={undoMove}
            disabled={history.length === 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${history.length > 0 ? 'bg-[#b8860b] text-[#1a1814] hover:bg-[#d4a574]' : 'bg-[#2d2a24] text-[#b8860b]/30 cursor-not-allowed'}`}
            title="Undo"
          >
            ↩
          </button>
          <button
            onClick={redoMove}
            disabled={future.length === 0}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${future.length > 0 ? 'bg-[#b8860b] text-[#1a1814] hover:bg-[#d4a574]' : 'bg-[#2d2a24] text-[#b8860b]/30 cursor-not-allowed'}`}
            title="Redo"
          >
            ↪
          </button>
        </div>

        {/* White Player */}
        <div className={`flex items-center gap-2 ${gameState.turn === 'white' ? 'opacity-100' : 'opacity-40'}`}>
          <span className="text-sm font-medium text-[#f5e6c8]">White</span>
          <div className={`w-6 h-6 rounded-full border-2 ${gameState.turn === 'white' ? 'border-[#d4a574] shadow-[0_0_10px_rgba(212,165,116,0.5)]' : 'border-[#2d2a24]'} bg-[#f5e6c8] transition-all`} />
        </div>
      </div>

      {/* Board */}
      <div className={`relative ${gameState.gameOver && gameState.winner && gameState.winner !== 'draw' ? 'victory-board' : ''}`}>



        {/* Opponent Left Alert - Absolute Overlay */}
        {opponentLeft && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-green-800/95 border border-green-500 text-green-100 px-6 py-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.6)] text-center backdrop-blur-md">
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold">Opponent disconnected</div>
            <div className="text-sm opacity-90">You win!</div>
          </div>
        )}

        {/* Game Over Alert - Absolute Overlay (hide if opponent left - show disconnect message instead) */}
        {gameState.gameOver && !opponentLeft && (
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30
            px-8 py-4 rounded-xl border-2 shadow-[0_0_30px_rgba(0,0,0,0.7)] flex flex-col items-center animate-bounce-short backdrop-blur-md min-w-[240px]
            ${gameState.winner === 'draw'
              ? 'bg-gray-800/95 border-gray-500 text-gray-200'
              : 'bg-[#1a1814]/95 border-[#b8860b] text-[#f5e6c8]'}
          `}>
            <div className="text-2xl font-cinzel font-bold mb-2 text-center">
              {gameState.winner === 'draw' ? '½ - ½' : '👑 CHECKMATE!'}
            </div>
            <div className={`text-sm font-medium ${gameState.winner === 'draw' ? 'text-gray-400' : 'text-[#b8860b]'}`}>
              {gameState.winner === 'draw'
                ? 'Game Drawn (Stalemate)'
                : `${gameState.winner === 'white' ? 'White' : 'Black'} Wins!`}
            </div>
          </div>
        )}


        {/* Board with background image */}
        <div
          className="w-[min(90vw,540px)] h-[min(90vw,540px)]"
          style={{
            backgroundImage: `url(${getBasePath()}board.png)`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            padding: '7%',
          }}
        >
          {/* Grid overlay */}
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
            {/* Flip board for black player in online mode */}
            {(() => {
              const shouldFlip = gameMode === 'online' && playerColor === 'black';
              const rows = shouldFlip ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
              const cols = shouldFlip ? [...Array(8).keys()].reverse() : [...Array(8).keys()];

              return rows.map(r =>
                cols.map(c => {
                  const piece = gameState.board[r][c];
                  const isSelected = gameState.selectedSquare?.row === r && gameState.selectedSquare?.col === c;
                  const isValidMove = gameState.validMoves.some(m => m.row === r && m.col === c);
                  const isCapture = isValidMove && piece !== null;
                  const isKingChecked = gameState.check && piece?.type === PieceType.KING && piece?.color === gameState.turn;
                  const isLastMoveFrom = lastMove?.from.row === r && lastMove?.from.col === c;
                  const isLastMoveTo = lastMove?.to.row === r && lastMove?.to.col === c;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`
                      relative flex items-center justify-center cursor-pointer select-none
                      ${isLastMoveFrom || isLastMoveTo ? 'bg-[#b8860b]/30' : 'bg-transparent'}
                      ${isSelected ? 'ring-inset ring-3 ring-[#d4a574]' : ''}
                      ${isKingChecked ? 'check-square' : ''}
                      transition-all duration-150
                    `}
                    >
                      {/* Valid Move Marker */}
                      {isValidMove && !isCapture && (
                        <div className="absolute w-4 h-4 valid-move-dot rounded-full" />
                      )}
                      {/* Capture Marker */}
                      {isCapture && (
                        <div className="absolute inset-1 capture-highlight" />
                      )}

                      {/* Piece as image */}
                      {piece && (
                        <img
                          src={getPieceImage(piece.color, piece.type)}
                          alt={`${piece.color} ${piece.type}`}
                          className={`
                          z-10 transition-transform duration-200 w-[85%] h-[85%] object-contain
                          ${isSelected ? 'scale-110' : 'hover:scale-105'}
                        `}
                          style={{
                            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))'
                          }}
                          draggable={false}
                        />
                      )}
                    </div>
                  );
                })
              );
            })()}
          </div>
        </div>
      </div>

      {/* Start Screen Modal */}
      {showStartScreen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1814] border-2 border-[#b8860b] rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
            {/* Title */}
            <h1 className="text-4xl font-cinzel font-bold title-shimmer mb-2">Chaturanga</h1>
            <p className="text-[#b8860b]/70 text-sm mb-8">Ancient Chess Reimagined</p>

            {/* Waiting for opponent screen */}
            {waitingForOpponent ? (
              <div className="space-y-6">
                <div className="animate-pulse text-[#f5e6c8]">
                  <p className="text-lg mb-2">Waiting for opponent...</p>
                  <p className="text-sm text-[#b8860b]/70">Share this code with a friend:</p>
                </div>
                <div className="bg-[#2d2a24] p-4 rounded-xl border border-[#b8860b]">
                  <p className="text-3xl font-mono font-bold text-[#d4a574] tracking-widest">{roomCode}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(roomCode)}
                  className="text-[#b8860b] hover:text-[#d4a574] text-sm"
                >
                  📋 Copy Code
                </button>
                <button
                  onClick={() => { setWaitingForOpponent(false); setRoomId(null); setOnlineSubscreen('menu'); }}
                  className="block mx-auto text-red-400/70 hover:text-red-400 text-sm mt-4"
                >
                  ✕ Cancel
                </button>
              </div>
            ) : onlineSubscreen !== 'menu' && gameMode === 'online' ? (
              /* Online Create/Join screens */
              <div className="space-y-6">
                {onlineSubscreen === 'create' && (
                  <>
                    <p className="text-[#f5e6c8]">Create a new game and share the code</p>
                    <button
                      onClick={handleCreateGame}
                      className="w-full py-4 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg"
                    >
                      🎲 Create Game
                    </button>
                  </>
                )}
                {onlineSubscreen === 'join' && (
                  <>
                    <p className="text-[#f5e6c8]">Enter the game code from your friend</p>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="XXXXXX"
                      className="w-full p-4 bg-[#2d2a24] border border-[#b8860b]/50 rounded-xl text-center text-2xl font-mono text-[#f5e6c8] tracking-widest placeholder-[#b8860b]/30 focus:border-[#b8860b] focus:outline-none"
                      maxLength={6}
                    />
                    {multiplayerError && (
                      <p className="text-red-400 text-sm">{multiplayerError}</p>
                    )}
                    <button
                      onClick={handleJoinGame}
                      className="w-full py-4 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg"
                    >
                      🎮 Join Game
                    </button>
                  </>
                )}
                <button
                  onClick={() => setOnlineSubscreen('menu')}
                  className="text-[#b8860b]/70 hover:text-[#d4a574] text-sm"
                >
                  ← Back
                </button>
              </div>
            ) : (
              /* Main menu */
              <>
                {/* Game Mode Selection */}
                <div className="mb-6">
                  <p className="text-[#f5e6c8] text-sm mb-3">Select Game Mode</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setGameMode('pvc')}
                      className={`px-5 py-3 rounded-lg font-semibold transition-all ${gameMode === 'pvc' ? 'bg-[#b8860b] text-[#1a1814]' : 'bg-[#2d2a24] text-[#f5e6c8] border border-[#b8860b]/30 hover:border-[#b8860b]'}`}
                    >
                      🤖 Vs AI
                    </button>
                    <button
                      onClick={() => setGameMode('pvp')}
                      className={`px-5 py-3 rounded-lg font-semibold transition-all ${gameMode === 'pvp' ? 'bg-[#b8860b] text-[#1a1814]' : 'bg-[#2d2a24] text-[#f5e6c8] border border-[#b8860b]/30 hover:border-[#b8860b]'}`}
                    >
                      👥 Local
                    </button>
                    <button
                      onClick={() => setGameMode('online')}
                      className={`px-5 py-3 rounded-lg font-semibold transition-all ${gameMode === 'online' ? 'bg-[#b8860b] text-[#1a1814]' : 'bg-[#2d2a24] text-[#f5e6c8] border border-[#b8860b]/30 hover:border-[#b8860b]'}`}
                    >
                      🌐 Online
                    </button>
                  </div>
                </div>

                {/* AI Difficulty (only if vs AI) */}
                {gameMode === 'pvc' && (
                  <div className="mb-6">
                    <p className="text-[#f5e6c8] text-sm mb-3">AI Difficulty</p>
                    <div className="flex gap-2 justify-center">
                      {[{ val: 2, label: 'Easy' }, { val: 3, label: 'Medium' }, { val: 4, label: 'Hard' }].map(d => (
                        <button
                          key={d.val}
                          onClick={() => setAiDifficulty(d.val)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all ${aiDifficulty === d.val ? 'bg-[#b8860b] text-[#1a1814] font-bold' : 'bg-[#2d2a24] text-[#f5e6c8] border border-[#b8860b]/30 hover:border-[#b8860b]'}`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Online Options */}
                {gameMode === 'online' && (
                  <div className="mb-6 space-y-3">
                    <button
                      onClick={() => setOnlineSubscreen('create')}
                      className="w-full py-3 bg-[#2d2a24] text-[#f5e6c8] rounded-lg border border-[#b8860b]/30 hover:border-[#b8860b] transition-all"
                    >
                      🎲 Create New Game
                    </button>
                    <button
                      onClick={() => setOnlineSubscreen('join')}
                      className="w-full py-3 bg-[#2d2a24] text-[#f5e6c8] rounded-lg border border-[#b8860b]/30 hover:border-[#b8860b] transition-all"
                    >
                      🎮 Join Game
                    </button>
                  </div>
                )}

                {/* Start Button (for local modes only) */}
                {gameMode !== 'online' && (
                  <button
                    onClick={startGame}
                    className="w-full py-4 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg mb-4"
                  >
                    ▶ Start Game
                  </button>
                )}

                {/* Rules Link */}
                <button
                  onClick={() => { setShowStartScreen(false); setShowRules(true); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#b8860b]/40 text-[#b8860b] hover:bg-[#b8860b] hover:text-[#1a1814] hover:border-[#b8860b] transition-all font-cinzel font-bold text-sm mx-auto"
                >
                  <span className="text-lg">🎓</span>
                  Tutorial
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Interactive Rules/Tutorial Modal */}
      {showRules && (
        <ChaturTutorialModal
          onClose={() => setShowRules(false)}
          getPieceImage={getPieceImage}
        />
      )}

      {/* Promotion Modal */}
      {gameState.promotionPending && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-2xl text-center">
            <h2 className="text-xl font-cinzel text-yellow-400 mb-4">Promote Piece</h2>
            <div className="flex gap-4">
              {[PieceType.QUEEN, PieceType.ROOK, PieceType.BISHOP, PieceType.KNIGHT].map(type => (
                <button
                  key={type}
                  onClick={() => promotePiece(type)}
                  className="text-4xl p-4 bg-[#21262d] rounded-lg hover:bg-[#30363d] hover:scale-110 transition-all border border-transparent hover:border-yellow-500"
                  style={{ color: gameState.promotionPending!.color === 'white' ? '#fff' : '#000', backgroundColor: gameState.promotionPending!.color === 'black' ? '#e5e7eb' : '#21262d' }}
                >
                  {PIECE_SYMBOLS[gameState.promotionPending!.color][type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credits Footer */}
      <footer className="mt-6 text-center text-xs text-[#b8860b]/50">
        Created by Jiv Dost Mahan • Designed and Developed by Sunny Vaghela
      </footer>
    </div>
  );
}
