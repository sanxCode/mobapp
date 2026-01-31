import { PieceType } from '../types';

export const BOARD_SIZE = 8;

export const PIECE_SYMBOLS = {
  white: {
    [PieceType.KING]: '♔',
    [PieceType.QUEEN]: '♕',
    [PieceType.ROOK]: '♖',
    [PieceType.BISHOP]: '♗',
    [PieceType.KNIGHT]: '♘',
    [PieceType.PAWN]: '♙',
    [PieceType.CHATUR]: '⛃'
  },
  black: {
    [PieceType.KING]: '♚',
    [PieceType.QUEEN]: '♛',
    [PieceType.ROOK]: '♜',
    [PieceType.BISHOP]: '♝',
    [PieceType.KNIGHT]: '♞',
    [PieceType.PAWN]: '♟',
    [PieceType.CHATUR]: '⛂'
  }
};

export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.KING]: 20000,
  [PieceType.QUEEN]: 900,
  [PieceType.ROOK]: 500,
  [PieceType.BISHOP]: 330,
  [PieceType.KNIGHT]: 320,
  [PieceType.CHATUR]: 150, // Slightly more valuable than pawn due to dynamic movement
  [PieceType.PAWN]: 100
};
