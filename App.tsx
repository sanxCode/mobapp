import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createInitialBoard, getLegalMoves, isKingInCheck, simulateMove, hasAnyLegalMoves } from './utils/engine';
import { getBestMove } from './utils/ai';
import { BOARD_SIZE, PIECE_SYMBOLS } from './utils/constants';
import { BoardState, Color, GameState, Move, PieceType, Position } from './types';

// Constants
const AI_COLOR: Color = 'black';
const AI_DELAY_MS = 500;

export default function App() {
  // Game Configuration
  const [gameMode, setGameMode] = useState<'pvc' | 'pvp'>('pvc'); // Player vs Computer, Player vs Player
  const [aiDifficulty, setAiDifficulty] = useState<number>(3); // Search depth
  const [showRules, setShowRules] = useState(false);

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

  // Refs for AI handling to avoid stale closures in timeouts
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const resetGame = () => {
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
  };

  // --- Move Handling ---

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.gameOver || gameState.promotionPending) return;
    if (gameMode === 'pvc' && gameState.turn === AI_COLOR) return; // Prevent clicking during AI turn

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

  const executeMove = (fromRow: number, fromCol: number, move: Move) => {
    const { board, turn, capturedWhite, capturedBlack } = gameState;
    
    // Capture logic
    const capturedPiece = board[move.row][move.col];
    const newCapturedWhite = [...capturedWhite];
    const newCapturedBlack = [...capturedBlack];
    if (capturedPiece) {
      if (capturedPiece.color === 'white') newCapturedWhite.push(capturedPiece.type);
      else newCapturedBlack.push(capturedPiece.type);
    }

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
             finalizeTurn(newBoard, turn, newCapturedWhite, newCapturedBlack);
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
             return;
        }
      }
    }

    finalizeTurn(newBoard, turn, newCapturedWhite, newCapturedBlack);
  };

  const promotePiece = (type: PieceType) => {
    if (!gameState.promotionPending) return;
    const { row, col, color } = gameState.promotionPending;
    
    const newBoard = gameState.board.map(r => [...r]);
    const piece = newBoard[row][col];
    if (piece) {
      newBoard[row][col] = { ...piece, type };
    }

    finalizeTurn(newBoard, color, gameState.capturedWhite, gameState.capturedBlack);
  };

  const finalizeTurn = (newBoard: BoardState, currentTurn: Color, capWhite: PieceType[], capBlack: PieceType[]) => {
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
      } else {
        winner = 'draw'; // Stalemate
      }
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
    <div className="flex flex-wrap gap-1 min-h-[1.5rem] opacity-80">
      {pieces.map((p, i) => (
        <span key={i} className="text-xl" style={{color: color === 'white' ? '#fff' : '#000', textShadow: color === 'white' ? '0 0 2px #000' : 'none'}}>
          {PIECE_SYMBOLS[color][p]}
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-8 gap-6">
      
      {/* Header */}
      <header className="text-center space-y-2 animate-fade-in-down">
        <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 drop-shadow-glow">
          Chatur Chess AI
        </h1>
        <p className="text-gray-400 font-light">
          {gameMode === 'pvc' ? `Human vs AI (Level ${aiDifficulty})` : 'Player vs Player'}
        </p>
      </header>

      {/* Game Info Bar */}
      <div className="w-full max-w-2xl bg-[#161b22] border border-[#21262d] rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        {/* Black Player (AI) */}
        <div className={`flex items-center gap-3 w-full md:w-auto ${gameState.turn === 'black' ? 'opacity-100' : 'opacity-50'}`}>
          <div className={`w-8 h-8 rounded-full border-2 ${gameState.turn === 'black' ? 'border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'border-[#21262d]'} bg-gradient-to-br from-gray-800 to-black transition-all`} />
          <div className="flex flex-col">
            <span className="font-medium text-gray-300">Black {gameMode === 'pvc' ? '(AI)' : ''}</span>
            {renderCaptured(gameState.capturedWhite, 'white')}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg transform transition-transform">
          {gameState.gameOver 
            ? (gameState.winner === 'draw' ? 'Draw' : `${gameState.winner === 'white' ? 'White' : 'Black'} Wins!`)
            : `${gameState.turn}'s Turn`}
        </div>

        {/* White Player (Human) */}
        <div className={`flex flex-row-reverse md:flex-row items-center gap-3 w-full md:w-auto text-right ${gameState.turn === 'white' ? 'opacity-100' : 'opacity-50'}`}>
           <div className="flex flex-col items-end md:items-start">
            <span className="font-medium text-gray-300">White</span>
            {renderCaptured(gameState.capturedBlack, 'black')}
          </div>
          <div className={`w-8 h-8 rounded-full border-2 ${gameState.turn === 'white' ? 'border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'border-[#21262d]'} bg-gradient-to-br from-white to-gray-300 transition-all`} />
        </div>
      </div>

      {/* Check Alert */}
      {gameState.check && !gameState.gameOver && (
        <div className="bg-red-600/20 border border-red-500/50 text-red-200 px-4 py-1 rounded-lg animate-pulse">
          ⚠️ Check!
        </div>
      )}

      {/* Board */}
      <div className="relative p-1 bg-[#21262d] rounded-lg shadow-2xl">
         {/* Coordinates */}
         <div className="absolute left-[-20px] top-0 bottom-0 flex flex-col justify-around text-xs text-gray-500 py-2">
            {[8,7,6,5,4,3,2,1].map(n => <span key={n}>{n}</span>)}
         </div>
         <div className="absolute bottom-[-20px] left-0 right-0 flex justify-around text-xs text-gray-500 px-2">
            {['a','b','c','d','e','f','g','h'].map(c => <span key={c}>{c}</span>)}
         </div>

        <div className="grid grid-cols-8 grid-rows-8 w-[min(85vw,500px)] h-[min(85vw,500px)] border-4 border-[#21262d] rounded overflow-hidden">
          {gameState.board.map((rowArr, r) => 
            rowArr.map((piece, c) => {
              const isSelected = gameState.selectedSquare?.row === r && gameState.selectedSquare?.col === c;
              const isValidMove = gameState.validMoves.some(m => m.row === r && m.col === c);
              const isCapture = isValidMove && piece !== null;
              const isKingChecked = gameState.check && piece?.type === PieceType.KING && piece?.color === gameState.turn;
              
              return (
                <div 
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`
                    relative flex items-center justify-center text-[clamp(1.5rem,5vw,2.5rem)] cursor-pointer select-none
                    ${getSquareColor(r, c)}
                    ${isSelected ? 'ring-inset ring-4 ring-yellow-400' : ''}
                    ${isKingChecked ? 'bg-red-500/80 animate-pulse' : ''}
                    transition-colors duration-150
                  `}
                >
                  {/* Valid Move Marker */}
                  {isValidMove && !isCapture && (
                    <div className="absolute w-3 h-3 bg-green-500/50 rounded-full" />
                  )}
                  {/* Capture Marker */}
                  {isCapture && (
                    <div className="absolute inset-0 bg-red-500/30 ring-inset ring-4 ring-red-500/50" />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span 
                        className={`
                            z-10 transition-transform duration-200 
                            ${piece.type === PieceType.CHATUR ? 'font-bold' : ''} 
                            ${isSelected ? 'scale-110' : 'hover:scale-105'}
                            drop-shadow-md
                        `}
                        style={{ color: piece.color === 'white' ? '#fff' : '#1a1a1a', textShadow: piece.color === 'white' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none' }}
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <button 
          onClick={resetGame}
          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold rounded-lg hover:translate-y-[-2px] hover:shadow-lg transition-all active:scale-95"
        >
          ↻ New Game
        </button>
        <button 
          onClick={() => setShowRules(true)}
          className="px-6 py-2 bg-[#21262d] border border-gray-600 rounded-lg hover:bg-[#30363d] transition-all"
        >
          📖 Rules
        </button>
        
        <div className="flex items-center gap-2 bg-[#21262d] p-1 rounded-lg border border-gray-600">
           <button 
             onClick={() => { setGameMode('pvc'); resetGame(); }}
             className={`px-3 py-1 rounded text-sm ${gameMode === 'pvc' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}
           >
             Vs AI
           </button>
           <button 
             onClick={() => { setGameMode('pvp'); resetGame(); }}
             className={`px-3 py-1 rounded text-sm ${gameMode === 'pvp' ? 'bg-yellow-500 text-black font-bold' : 'text-gray-400'}`}
           >
             2 Player
           </button>
        </div>

        {gameMode === 'pvc' && (
           <select 
             value={aiDifficulty}
             onChange={(e) => setAiDifficulty(Number(e.target.value))}
             className="bg-[#21262d] border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
           >
             <option value={2}>Easy</option>
             <option value={3}>Medium</option>
             <option value={4}>Hard</option>
           </select>
        )}
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRules(false)}>
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-4 border-b border-[#30363d] pb-2">
                <h2 className="text-2xl font-cinzel text-yellow-400">Rules</h2>
                <button onClick={() => setShowRules(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
             </div>
             
             <div className="space-y-4 text-gray-300">
                <section>
                    <h3 className="text-lg font-bold text-orange-400 mb-2">The Chatur Piece (⛃ / ⛂)</h3>
                    <div className="flex justify-center gap-8 text-4xl mb-2 bg-[#0d1117] p-4 rounded-lg">
                        <span className="text-white drop-shadow-md">⛃</span>
                        <span className="text-black bg-white rounded-full px-1">⛂</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>Movement:</strong> Moves <span className="text-yellow-400">diagonally forward</span> (1 step, or 2 on first move).</li>
                        <li><strong>Capture:</strong> Captures <span className="text-red-400">straight forward</span> (Inverse of a Pawn).</li>
                        <li><strong>Position:</strong> Alternates with Pawns on the starting rank (b, d, f, h).</li>
                    </ul>
                </section>
                <section>
                    <h3 className="text-lg font-bold text-orange-400 mb-2">Standard Rules</h3>
                    <p className="text-sm">Standard Chess rules apply for all other pieces (King, Queen, Rook, Bishop, Knight, Pawn). Win by Checkmate.</p>
                </section>
             </div>
          </div>
        </div>
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
    </div>
  );
}
