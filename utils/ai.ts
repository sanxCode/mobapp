import { BoardState, Color, Move, PieceType, Position } from '../types';
import { PIECE_VALUES } from './constants';
import { getAllLegalMoves, isKingInCheck, simulateMove } from './engine';

// --- Evaluation Logic ---

// Piece Square Tables (Simplified)
// Bonus for controlling center, advancing pawns, etc.
const PST: Record<string, number[][]> = {
  pawn: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10, 5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  knight: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ]
  // Can add more for other pieces
};

// Mirror PST for black
const getPSTValue = (pieceType: PieceType, row: number, col: number, color: Color): number => {
  let table = PST[pieceType];
  // Treat Chatur like a pawn for positioning logic (advance to promote)
  if (pieceType === PieceType.CHATUR) table = PST.pawn;

  if (!table) return 0;

  if (color === 'white') {
    return table[row][col];
  } else {
    // Flip row for black
    return table[7 - row][col];
  }
};

const evaluateBoard = (board: BoardState, aiColor: Color): number => {
  let score = 0;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const value = PIECE_VALUES[piece.type] + getPSTValue(piece.type, r, c, piece.color);
        if (piece.color === aiColor) {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  return score;
};

// --- Minimax ---

interface AIResult {
  score: number;
  move: { from: Position; to: Move } | null;
}

export const getBestMove = (
  board: BoardState,
  depth: number,
  isMaximizing: boolean,
  aiColor: Color,
  alpha: number = -Infinity,
  beta: number = Infinity
): AIResult => {
  
  // Base case: depth reached
  if (depth === 0) {
    return { score: evaluateBoard(board, aiColor), move: null };
  }

  const currentColor = isMaximizing ? aiColor : (aiColor === 'white' ? 'black' : 'white');
  const allMoves = getAllLegalMoves(board, currentColor);

  // Checkmate / Stalemate check
  if (allMoves.length === 0) {
    if (isKingInCheck(board, currentColor)) {
        // Checkmate: return huge negative score for loser
        return { score: isMaximizing ? -100000 : 100000, move: null }; 
    }
    // Stalemate
    return { score: 0, move: null };
  }

  // Sort moves for Alpha-Beta efficiency (Captures first)
  allMoves.sort((a, b) => {
    const valA = a.to.isCapture ? 10 : 0;
    const valB = b.to.isCapture ? 10 : 0;
    return valB - valA;
  });

  let bestMove: { from: Position; to: Move } | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const { from, to } of allMoves) {
      const newBoard = simulateMove(board, from.row, from.col, to.row, to.col, to.castling);
      
      // Auto-promote pawns/chaturs for AI to Queens for simplicity during search
      // (Real engine would branch for underpromotion, but unnecessary for this level)
      const movedPiece = newBoard[to.row][to.col];
      if (movedPiece && (movedPiece.type === PieceType.PAWN || movedPiece.type === PieceType.CHATUR)) {
         if ((movedPiece.color === 'white' && to.row === 0) || (movedPiece.color === 'black' && to.row === 7)) {
             newBoard[to.row][to.col] = { ...movedPiece, type: PieceType.QUEEN };
         }
      }

      const evalResult = getBestMove(newBoard, depth - 1, false, aiColor, alpha, beta);
      
      if (evalResult.score > maxEval) {
        maxEval = evalResult.score;
        bestMove = { from, to };
      }
      alpha = Math.max(alpha, evalResult.score);
      if (beta <= alpha) break; // Prune
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const { from, to } of allMoves) {
      const newBoard = simulateMove(board, from.row, from.col, to.row, to.col, to.castling);
      
      // Handle promotion for opponent in simulation too
      const movedPiece = newBoard[to.row][to.col];
      if (movedPiece && (movedPiece.type === PieceType.PAWN || movedPiece.type === PieceType.CHATUR)) {
         if ((movedPiece.color === 'white' && to.row === 0) || (movedPiece.color === 'black' && to.row === 7)) {
             newBoard[to.row][to.col] = { ...movedPiece, type: PieceType.QUEEN };
         }
      }

      const evalResult = getBestMove(newBoard, depth - 1, true, aiColor, alpha, beta);
      
      if (evalResult.score < minEval) {
        minEval = evalResult.score;
        bestMove = { from, to };
      }
      beta = Math.min(beta, evalResult.score);
      if (beta <= alpha) break; // Prune
    }
    return { score: minEval, move: bestMove };
  }
};
