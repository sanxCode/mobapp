export type Color = 'white' | 'black';

export enum PieceType {
  KING = 'king',
  QUEEN = 'queen',
  ROOK = 'rook',
  BISHOP = 'bishop',
  KNIGHT = 'knight',
  PAWN = 'pawn',
  CHATUR = 'chatur'
}

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move extends Position {
  fromRow?: number; // Optional helpers for engine move tracking
  fromCol?: number;
  castling?: 'kingside' | 'queenside';
  isCapture?: boolean;
}

export type BoardState = (Piece | null)[][];

export interface GameState {
  board: BoardState;
  turn: Color;
  selectedSquare: Position | null;
  validMoves: Move[];
  gameOver: boolean;
  winner: Color | 'draw' | null;
  check: boolean;
  capturedWhite: PieceType[];
  capturedBlack: PieceType[];
  promotionPending: { row: number; col: number; color: Color } | null;
}
