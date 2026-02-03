import { supabase } from './supabase';
import { BoardState, Color, PieceType } from '../types';
import { createInitialBoard } from './engine';

// Game room type
export interface GameRoom {
    id: string;
    code: string;
    host_id: string;
    guest_id: string | null;
    host_username: string | null;
    guest_username: string | null;
    board_state: BoardState;
    current_turn: Color;
    captured_white: PieceType[];
    captured_black: PieceType[];
    game_over: boolean;
    winner: Color | 'draw' | null;
    in_check: boolean;
    status: 'waiting' | 'playing' | 'finished';
    last_move: { from: { row: number; col: number }; to: { row: number; col: number } } | null;
    is_public: boolean;
    created_at: string;
}

// Generate a 6-character game code
const generateGameCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Generate a unique player ID (stored in localStorage)
export const getPlayerId = (): string => {
    let id = localStorage.getItem('chaturanga_player_id');
    if (!id) {
        id = 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('chaturanga_player_id', id);
    }
    return id;
};

// Create a new game room
export const createGameRoom = async (username: string, isPublic: boolean = false): Promise<{ code: string; roomId: string } | null> => {
    const playerId = getPlayerId();
    const code = generateGameCode();
    const initialBoard = createInitialBoard();

    const { data, error } = await supabase
        .from('games')
        .insert({
            code: code,
            host_id: playerId,
            guest_id: null,
            host_username: username,
            guest_username: null,
            board_state: initialBoard,
            current_turn: 'white',
            captured_white: [],
            captured_black: [],
            game_over: false,
            winner: null,
            in_check: false,
            status: 'waiting',
            last_move: null,
            is_public: isPublic
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating game:', error);
        return null;
    }

    return { code: data.code, roomId: data.id };
};

// Join an existing game room
export const joinGameRoom = async (code: string, username: string): Promise<{ roomId: string; playerColor: Color; hostUsername: string | null } | { error: string }> => {
    const playerId = getPlayerId();

    // Find the game
    const { data: game, error: findError } = await supabase
        .from('games')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (findError || !game) {
        return { error: 'Game not found. Check the code and try again.' };
    }

    // Check if player is already in the game
    if (game.host_id === playerId) {
        return { roomId: game.id, playerColor: 'white', hostUsername: game.host_username };
    }

    if (game.guest_id === playerId) {
        return { roomId: game.id, playerColor: 'black', hostUsername: game.host_username };
    }

    // Check if game has room
    if (game.guest_id !== null) {
        return { error: 'Game is full. Both players already joined.' };
    }

    // Join as guest
    const { error: updateError } = await supabase
        .from('games')
        .update({ guest_id: playerId, guest_username: username, status: 'playing' })
        .eq('id', game.id);

    if (updateError) {
        console.error('Error joining game:', updateError);
        return { error: 'Failed to join game. Please try again.' };
    }

    return { roomId: game.id, playerColor: 'black', hostUsername: game.host_username };
};

// Find a public match or create one
export const findPublicMatch = async (username: string): Promise<{ roomId: string; playerColor: Color; hostUsername: string | null; isNew?: boolean; code?: string } | null> => {
    const playerId = getPlayerId();

    // 1. Try to find a public game waiting for players
    const { data: availableGames } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'waiting')
        .eq('is_public', true)
        .is('guest_id', null)
        .neq('host_id', playerId) // Don't join your own game
        .limit(1);

    if (availableGames && availableGames.length > 0) {
        // Found a game! Join it.
        const game = availableGames[0];
        const joinResult = await joinGameRoom(game.code, username);

        if ('error' in joinResult) {
            console.error('Error joining public game:', joinResult.error);
            return null;
        }

        return joinResult;
    }

    // 2. No game found, create a new public game
    const newGame = await createGameRoom(username, true);
    if (newGame) {
        return {
            roomId: newGame.roomId,
            code: newGame.code,
            playerColor: 'white',
            hostUsername: null,
            isNew: true
        };
    }

    return null;
};

// Get game state
export const getGameState = async (roomId: string): Promise<GameRoom | null> => {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', roomId)
        .single();

    if (error) {
        console.error('Error getting game state:', error);
        return null;
    }

    return data as GameRoom;
};

// Update game state after a move
export const updateGameState = async (
    roomId: string,
    boardState: BoardState,
    currentTurn: Color,
    capturedWhite: PieceType[],
    capturedBlack: PieceType[],
    gameOver: boolean,
    winner: Color | 'draw' | null,
    inCheck: boolean,
    lastMove: { from: { row: number; col: number }; to: { row: number; col: number } } | null
): Promise<boolean> => {
    const { error } = await supabase
        .from('games')
        .update({
            board_state: boardState,
            current_turn: currentTurn,
            captured_white: capturedWhite,
            captured_black: capturedBlack,
            game_over: gameOver,
            winner: winner,
            in_check: inCheck,
            status: gameOver ? 'finished' : 'playing',
            last_move: lastMove
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error updating game:', error);
        return false;
    }

    return true;
};

// Subscribe to game changes with presence tracking
export const subscribeToGame = (
    roomId: string,
    _opponentId: string | null, // Kept for API compatibility but not used
    onUpdate: (game: GameRoom) => void,
    onOpponentLeft?: () => void
): (() => void) => {
    const playerId = getPlayerId();
    let otherPlayersCount = 0;
    let gameStarted = false;

    const channel = supabase
        .channel(`game_${roomId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${roomId}`
            },
            (payload) => {
                const game = payload.new as GameRoom;
                // Track when game has actually started (both players joined)
                if (game.guest_id && game.host_id) {
                    gameStarted = true;
                }
                onUpdate(game);
            }
        )
        .on('presence', { event: 'sync' }, () => {
            // Count other players currently present
            const state = channel.presenceState();
            let count = 0;
            Object.values(state).forEach((presences: any) => {
                presences.forEach((p: any) => {
                    if (p.player_id !== playerId) {
                        count++;
                    }
                });
            });
            otherPlayersCount = count;
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
            // Only trigger if game has started
            if (!gameStarted) return;

            // Check if any of the leaving presences is NOT us (i.e., opponent left)
            const opponentLeft = leftPresences.some((p: any) => p.player_id !== playerId);

            // Trigger if opponent left (regardless of current count - leave happens before sync updates count)
            if (opponentLeft && onOpponentLeft) {
                onOpponentLeft();
            }
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ player_id: playerId });
            }
        });

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
};

// Mark game as abandoned
export const abandonGame = async (roomId: string, abandonedBy: Color): Promise<boolean> => {
    const winner = abandonedBy === 'white' ? 'black' : 'white';
    const { error } = await supabase
        .from('games')
        .update({
            game_over: true,
            winner: winner,
            status: 'finished'
        })
        .eq('id', roomId);

    if (error) {
        console.error('Error abandoning game:', error);
        return false;
    }
    return true;
};

// Check if it's player's turn
export const isPlayerTurn = (game: GameRoom): boolean => {
    const playerId = getPlayerId();
    if (game.current_turn === 'white' && game.host_id === playerId) return true;
    if (game.current_turn === 'black' && game.guest_id === playerId) return true;
    return false;
};

// Get player color
export const getPlayerColor = (game: GameRoom): Color | null => {
    const playerId = getPlayerId();
    if (game.host_id === playerId) return 'white';
    if (game.guest_id === playerId) return 'black';
    return null;
};
