// Chess sound effects using Lichess's public domain sounds
// High quality, authentic wooden chess piece sounds

// Lichess sound CDN - these are public domain
const SOUND_BASE = 'https://lichess1.org/assets/sound/standard';

// Preload audio elements for instant playback
const sounds: Record<string, HTMLAudioElement> = {};

const preloadSound = (name: string, url: string) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = 0.5;
    sounds[name] = audio;
};

// Initialize sounds on first interaction (required for mobile)
let initialized = false;

const initSounds = () => {
    if (initialized) return;
    initialized = true;

    preloadSound('move', `${SOUND_BASE}/Move.mp3`);
    preloadSound('capture', `${SOUND_BASE}/Capture.mp3`);
    preloadSound('check', `${SOUND_BASE}/Check.mp3`);
    preloadSound('victory', `${SOUND_BASE}/Victory.mp3`);
    preloadSound('defeat', `${SOUND_BASE}/Defeat.mp3`);
    preloadSound('draw', `${SOUND_BASE}/Draw.mp3`);
    preloadSound('start', `${SOUND_BASE}/Confirmation.mp3`);
};

const playSound = (name: string) => {
    initSounds();
    const sound = sounds[name];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {
            // Ignore autoplay policy errors
        });
    }
};

// === GAME SOUNDS ===

// Piece move - wooden tap
export const playMoveSound = () => playSound('move');

// Capture - piece taken
export const playCaptureSound = () => playSound('capture');

// Check - king in danger
export const playCheckSound = () => playSound('check');

// Checkmate/Victory
export const playVictorySound = () => playSound('victory');

// Defeat sound (for AI wins)
export const playDefeatSound = () => playSound('defeat');

// Stalemate/Draw
export const playDrawSound = () => playSound('draw');

// Undo - reuse move sound (subtle)
export const playUndoSound = () => playSound('move');

// Redo - reuse move sound
export const playRedoSound = () => playSound('move');

// Start game - notification chime
export const playStartSound = () => playSound('start');
