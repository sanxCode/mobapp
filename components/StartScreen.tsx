import React from 'react';
import { UserProfile } from '../utils/auth';

export type GameMode = 'pvc' | 'pvp' | 'online';
export type OnlineSubscreen = 'menu' | 'invite' | 'join' | 'searching';

interface StartScreenProps {
    currentUser: UserProfile | null;
    showStartScreen: boolean;
    onClose: () => void;
    onLogout: () => void;
    // Game Mode
    gameMode: GameMode;
    setGameMode: (mode: GameMode) => void;
    // Online State
    onlineSubscreen: OnlineSubscreen;
    setOnlineSubscreen: (sub: OnlineSubscreen) => void;
    waitingForOpponent: boolean;
    setWaitingForOpponent: (wait: boolean) => void;
    setRoomId: (id: string | null) => void;
    roomCode: string;
    joinCodeInput: string;
    setJoinCodeInput: (code: string) => void;
    multiplayerError: string | null;
    setMultiplayerError: (err: string | null) => void;
    // Actions
    onQuickMatch: () => void;
    onInviteFriend: () => void;
    onJoinGame: () => void;
    onStartGame: () => void;
    onShowTutorial: () => void;
    // AI
    aiDifficulty: number;
    setAiDifficulty: (diff: number) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({
    currentUser,
    showStartScreen,
    onClose,
    onLogout,
    gameMode,
    setGameMode,
    onlineSubscreen,
    setOnlineSubscreen,
    waitingForOpponent,
    setWaitingForOpponent,
    setRoomId,
    roomCode,
    joinCodeInput,
    setJoinCodeInput,
    multiplayerError,
    setMultiplayerError,
    onQuickMatch,
    onInviteFriend,
    onJoinGame,
    onStartGame,
    onShowTutorial,
    aiDifficulty,
    setAiDifficulty,
}) => {
    if (!showStartScreen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1814] border-2 border-[#b8860b] rounded-2xl max-w-md w-full p-8 shadow-2xl text-center relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#b8860b]/50 hover:text-[#b8860b] hover:bg-[#b8860b]/10 p-2 rounded-full transition-all"
                    title="Close Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Title */}
                <h1 className="text-4xl font-cinzel font-bold title-shimmer mb-2">Chaturanga</h1>
                <p className="text-[#b8860b]/70 text-sm mb-6">Ancient Chess Reimagined</p>

                {/* User Profile in Menu */}
                {currentUser && (
                    <div className="mb-8 bg-[#2d2a24]/50 rounded-xl p-3 border border-[#b8860b]/30 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">👤</span>
                            <span className="text-[#f5e6c8] font-bold">{currentUser.username}</span>
                            {currentUser.isGuest && <span className="text-[10px] bg-[#b8860b]/30 px-1 rounded text-[#b8860b]">GUEST</span>}
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-xs text-[#b8860b]/60 hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                            {currentUser.isGuest ? 'Switch Account / Login' : 'Sign Out'}
                        </button>
                    </div>
                )}

                {/* Waiting for opponent screen */}
                {waitingForOpponent ? (
                    <div className="space-y-6">
                        {onlineSubscreen === 'searching' ? (
                            // Searching Spinner
                            <div className="py-8">
                                <div className="w-12 h-12 border-4 border-[#b8860b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-[#f5e6c8] animate-pulse">Finding checkmate-worthy opponent...</p>
                            </div>
                        ) : (
                            // Invite Friend (Code)
                            <>
                                <div className="animate-pulse text-[#f5e6c8]">
                                    <p className="text-lg mb-2">Waiting for friend...</p>
                                    <p className="text-sm text-[#b8860b]/70">Share this code:</p>
                                </div>
                                <div className="bg-[#2d2a24] p-4 rounded-xl border border-[#b8860b]">
                                    <p className="text-3xl font-mono font-bold text-[#d4a574] tracking-widest select-all">{roomCode}</p>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(roomCode)}
                                    className="text-[#b8860b] hover:text-[#d4a574] text-sm flex items-center justify-center gap-2 mx-auto"
                                >
                                    <span>📋</span> Copy Code
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => { setWaitingForOpponent(false); setRoomId(null); setOnlineSubscreen('menu'); }}
                            className="block mx-auto text-red-400/70 hover:text-red-400 text-sm mt-4"
                        >
                            ✕ Cancel
                        </button>
                    </div>
                ) : gameMode === 'online' ? (
                    // ONLINE MENU & SUBSCREENS
                    onlineSubscreen === 'join' ? (
                        // JOIN SCREEN
                        <div className="space-y-6">
                            <p className="text-[#f5e6c8]">Enter the code shared by your friend</p>
                            <input
                                type="text"
                                maxLength={6}
                                value={joinCodeInput}
                                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                className="w-full bg-[#2d2a24] border border-[#b8860b]/50 rounded-lg py-3 px-4 text-center text-xl tracking-widest font-mono text-[#f5e6c8] focus:border-[#b8860b] focus:outline-none placeholder-[#b8860b]/20"
                            />
                            <button
                                onClick={onJoinGame}
                                className="w-full py-3 bg-[#b8860b] text-[#1a1814] rounded-lg font-bold hover:bg-[#d4a574] transition-all"
                            >
                                Join Game
                            </button>
                            {multiplayerError && <p className="text-red-400 text-sm">{multiplayerError}</p>}
                            <button
                                onClick={() => { setOnlineSubscreen('menu'); setMultiplayerError(null); }}
                                className="text-[#b8860b]/70 hover:text-[#d4a574] text-sm"
                            >
                                ← Back
                            </button>
                        </div>
                    ) : (
                        // ONLINE MAIN MENU
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={onQuickMatch}
                                    className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg"
                                >
                                    <span className="text-2xl">⚔️</span>
                                    <div className="text-left">
                                        <div className="leading-none">Quick Match</div>
                                        <div className="text-xs opacity-70 font-normal mt-1">Play random opponent</div>
                                    </div>
                                </button>

                                <div className="flex gap-4">
                                    <button
                                        onClick={onInviteFriend}
                                        className="flex-1 p-3 bg-[#2d2a24] border border-[#b8860b]/30 rounded-xl text-[#f5e6c8] hover:border-[#b8860b] hover:bg-[#b8860b]/10 transition-all group"
                                    >
                                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📩</div>
                                        <div className="text-sm font-semibold">Invite Friend</div>
                                    </button>

                                    <button
                                        onClick={() => setOnlineSubscreen('join')}
                                        className="flex-1 p-3 bg-[#2d2a24] border border-[#b8860b]/30 rounded-xl text-[#f5e6c8] hover:border-[#b8860b] hover:bg-[#b8860b]/10 transition-all group"
                                    >
                                        <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔢</div>
                                        <div className="text-sm font-semibold">Join Code</div>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setGameMode('pvc')} // Go back to main mode select
                                className="w-full py-3 mt-4 border border-[#b8860b]/30 rounded-lg text-[#b8860b] hover:bg-[#b8860b]/10 hover:border-[#b8860b] transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                            >
                                <span>←</span> Back to Main Menu
                            </button>
                        </div>
                    )
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

                        {/* Start Button */}
                        <button
                            onClick={onStartGame}
                            className="w-full py-4 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-lg mb-4"
                        >
                            ▶ Start Game
                        </button>

                        {/* Tutorial Button */}
                        <button
                            onClick={onShowTutorial}
                            className="text-[#b8860b] hover:text-[#d4a574] text-sm flex items-center justify-center gap-1 mx-auto"
                        >
                            <span>📜</span> Tutorial
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StartScreen;
