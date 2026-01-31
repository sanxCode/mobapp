import { BoardState, Color, Move, Piece, PieceType, Position } from '../types';

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRow = [
    PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
    PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
  ];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
    board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
  }

  // Setup Pawns (a,c,e,g) and Chaturs (b,d,f,h)
  for (let col = 0; col < 8; col++) {
    const pieceType = col % 2 === 0 ? PieceType.PAWN : PieceType.CHATUR;
    board[1][col] = { type: pieceType, color: 'black', hasMoved: false };
    board[6][col] = { type: pieceType, color: 'white', hasMoved: false };
  }

  return board;
};

const isValidSquare = (row: number, col: number): boolean => {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
};

// --- Move Generation ---

const getPawnMoves = (board: BoardState, row: number, col: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Move forward
  const fwdRow = row + direction;
  if (isValidSquare(fwdRow, col) && !board[fwdRow][col]) {
    moves.push({ row: fwdRow, col });

    // Double move
    if (row === startRow) {
      const doubleRow = row + 2 * direction;
      if (isValidSquare(doubleRow, col) && !board[doubleRow][col]) {
        moves.push({ row: doubleRow, col });
      }
    }
  }

  // Capture
  for (const dc of [-1, 1]) {
    const captureCol = col + dc;
    if (isValidSquare(fwdRow, captureCol)) {
      const target = board[fwdRow][captureCol];
      if (target && target.color !== piece.color) {
        moves.push({ row: fwdRow, col: captureCol, isCapture: true });
      }
    }
  }
  return moves;
};

const getChaturMoves = (board: BoardState, row: number, col: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const direction = piece.color === 'white' ? -1 : 1;
  const startRow = piece.color === 'white' ? 6 : 1;

  // Move Diagonally Forward
  for (const dc of [-1, 1]) {
    const diagRow = row + direction;
    const diagCol = col + dc;

    if (isValidSquare(diagRow, diagCol) && !board[diagRow][diagCol]) {
      moves.push({ row: diagRow, col: diagCol });

      // Double diagonal move on first turn
      // Logic: Must pass through the empty diagonal square to reach the double
      if (row === startRow && !piece.hasMoved) {
        const doubleRow = row + 2 * direction;
        const doubleCol = col + 2 * dc;
        if (isValidSquare(doubleRow, doubleCol) && !board[doubleRow][doubleCol]) {
          moves.push({ row: doubleRow, col: doubleCol });
        }
      }
    }
  }

  // Capture Straight Forward
  const captureRow = row + direction;
  if (isValidSquare(captureRow, col)) {
    const target = board[captureRow][col];
    if (target && target.color !== piece.color) {
      moves.push({ row: captureRow, col, isCapture: true });
    }
  }

  return moves;
};

const getSlidingMoves = (board: BoardState, row: number, col: number, piece: Piece, dirs: number[][]): Move[] => {
  const moves: Move[] = [];
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;
    while (isValidSquare(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ row: r, col: c });
      } else {
        if (target.color !== piece.color) {
          moves.push({ row: r, col: c, isCapture: true });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
};

const getKnightMoves = (board: BoardState, row: number, col: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (isValidSquare(r, c)) {
      const target = board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push({ row: r, col: c, isCapture: !!(target && target.color !== piece.color) });
      }
    }
  }
  return moves;
};

// Check if a square is attacked by opponent
export const isSquareAttacked = (board: BoardState, row: number, col: number, attackerColor: Color): boolean => {
  // We scan the board for pieces of attackerColor and see if they can hit (row, col)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === attackerColor) {
        // Simplified attack logic (ignoring king check recursion)
        // Check attacks based on piece type
        if (piece.type === PieceType.PAWN) {
           const dir = piece.color === 'white' ? -1 : 1;
           // Pawns attack diagonally
           if (r + dir === row && (c - 1 === col || c + 1 === col)) return true;
        } else if (piece.type === PieceType.CHATUR) {
           // Chaturs attack straight forward
           const dir = piece.color === 'white' ? -1 : 1;
           if (r + dir === row && c === col) return true;
        } else if (piece.type === PieceType.KNIGHT) {
           const knightMoves = getKnightMoves(board, r, c, piece);
           if (knightMoves.some(m => m.row === row && m.col === col)) return true;
        } else if (piece.type === PieceType.KING) {
            // King attacks adjacent
            if (Math.abs(r - row) <= 1 && Math.abs(c - col) <= 1) return true;
        } else {
           // Sliding pieces (Queen, Rook, Bishop)
           // Use existing logic but filter out non-attacks? getSlidingMoves covers attacks
           let moves: Move[] = [];
           if (piece.type === PieceType.ROOK) moves = getSlidingMoves(board, r, c, piece, [[0,1],[0,-1],[1,0],[-1,0]]);
           else if (piece.type === PieceType.BISHOP) moves = getSlidingMoves(board, r, c, piece, [[1,1],[1,-1],[-1,1],[-1,-1]]);
           else if (piece.type === PieceType.QUEEN) moves = getSlidingMoves(board, r, c, piece, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]);
           
           if (moves.some(m => m.row === row && m.col === col)) return true;
        }
      }
    }
  }
  return false;
};

const findKing = (board: BoardState, color: Color): Position | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === PieceType.KING && p.color === color) return { row: r, col: c };
    }
  }
  return null;
};

export const isKingInCheck = (board: BoardState, color: Color): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false; // Should not happen
  const opponent = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos.row, kingPos.col, opponent);
};

const canCastle = (board: BoardState, row: number, col: number, color: Color, side: 'kingside' | 'queenside'): boolean => {
  const rookCol = side === 'kingside' ? 7 : 0;
  const rook = board[row][rookCol];
  if (!rook || rook.type !== PieceType.ROOK || rook.hasMoved) return false;
  
  const start = side === 'kingside' ? col + 1 : rookCol + 1;
  const end = side === 'kingside' ? rookCol : col;
  
  // Empty space
  for (let c = start; c < end; c++) {
    if (board[row][c]) return false;
  }

  // Not passing through check
  const dir = side === 'kingside' ? 1 : -1;
  const opponent = color === 'white' ? 'black' : 'white';
  
  // Check current, middle, and dest squares
  // Note: we check if squares are attacked.
  // King pos (col), col+dir, col+2*dir
  if (isSquareAttacked(board, row, col, opponent)) return false;
  if (isSquareAttacked(board, row, col + dir, opponent)) return false;
  if (isSquareAttacked(board, row, col + 2 * dir, opponent)) return false;

  return true;
};

const getKingMoves = (board: BoardState, row: number, col: number, piece: Piece): Move[] => {
  const moves: Move[] = [];
  const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  
  for (const [dr, dc] of offsets) {
    const r = row + dr;
    const c = col + dc;
    if (isValidSquare(r, c)) {
      const target = board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push({ row: r, col: c, isCapture: !!(target && target.color !== piece.color) });
      }
    }
  }

  // Castling
  if (!piece.hasMoved && !isKingInCheck(board, piece.color)) {
    if (canCastle(board, row, col, piece.color, 'kingside')) {
      moves.push({ row, col: col + 2, castling: 'kingside' });
    }
    if (canCastle(board, row, col, piece.color, 'queenside')) {
      moves.push({ row, col: col - 2, castling: 'queenside' });
    }
  }

  return moves;
};

// Generate pseudo-legal moves (ignoring self-check)
const getPseudoLegalMoves = (board: BoardState, row: number, col: number): Move[] => {
  const piece = board[row][col];
  if (!piece) return [];

  switch (piece.type) {
    case PieceType.PAWN: return getPawnMoves(board, row, col, piece);
    case PieceType.CHATUR: return getChaturMoves(board, row, col, piece);
    case PieceType.ROOK: return getSlidingMoves(board, row, col, piece, [[0,1],[0,-1],[1,0],[-1,0]]);
    case PieceType.BISHOP: return getSlidingMoves(board, row, col, piece, [[1,1],[1,-1],[-1,1],[-1,-1]]);
    case PieceType.QUEEN: return getSlidingMoves(board, row, col, piece, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]);
    case PieceType.KNIGHT: return getKnightMoves(board, row, col, piece);
    case PieceType.KING: return getKingMoves(board, row, col, piece);
    default: return [];
  }
};

// Execute a move on a *copy* of the board
export const simulateMove = (board: BoardState, fromRow: number, fromCol: number, toRow: number, toCol: number, castling?: string): BoardState => {
  const newBoard = board.map(r => [...r]);
  const piece = newBoard[fromRow][fromCol];
  if (!piece) return newBoard;

  const movedPiece = { ...piece, hasMoved: true };
  newBoard[toRow][toCol] = movedPiece;
  newBoard[fromRow][fromCol] = null;

  if (castling) {
    const rookRow = toRow;
    const rookFromCol = castling === 'kingside' ? 7 : 0;
    const rookToCol = castling === 'kingside' ? toCol - 1 : toCol + 1;
    const rook = newBoard[rookRow][rookFromCol];
    if (rook) {
      newBoard[rookRow][rookToCol] = { ...rook, hasMoved: true };
      newBoard[rookRow][rookFromCol] = null;
    }
  }
  return newBoard;
};

// Get fully legal moves (filtering out self-checks)
export const getLegalMoves = (board: BoardState, row: number, col: number): Move[] => {
  const piece = board[row][col];
  if (!piece) return [];
  
  const pseudoMoves = getPseudoLegalMoves(board, row, col);
  
  return pseudoMoves.filter(move => {
    const nextBoard = simulateMove(board, row, col, move.row, move.col, move.castling);
    return !isKingInCheck(nextBoard, piece.color);
  });
};

export const hasAnyLegalMoves = (board: BoardState, color: Color): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) {
        if (getLegalMoves(board, r, c).length > 0) return true;
      }
    }
  }
  return false;
};

export const getAllLegalMoves = (board: BoardState, color: Color): { from: Position, to: Move }[] => {
    const allMoves: { from: Position, to: Move }[] = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && p.color === color) {
                const moves = getLegalMoves(board, r, c);
                moves.forEach(m => {
                    allMoves.push({ from: { row: r, col: c }, to: m });
                });
            }
        }
    }
    return allMoves;
}
