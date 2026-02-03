import React, { useState } from 'react';
import { signUp, loginWithEmail, playAsGuest, UserProfile } from './utils/auth';

interface AuthModalProps {
    onAuthenticated: (user: UserProfile) => void;
    onClose?: () => void;
}

type AuthTab = 'login' | 'signup' | 'guest';

const AuthModal: React.FC<AuthModalProps> = ({ onAuthenticated, onClose }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await loginWithEmail(email, password);
        setLoading(false);

        if (!result.success) {
            setError(result.error || 'Login failed');
            return;
        }

        // Get user profile after login
        const { data: { user } } = await (await import('./utils/supabase')).supabase.auth.getUser();
        if (user) {
            const { data: profile } = await (await import('./utils/supabase')).supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (profile) {
                onAuthenticated({
                    id: user.id,
                    username: profile.username,
                    isGuest: false
                });
            }
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        const result = await signUp(email, username, password);
        setLoading(false);

        if (!result.success) {
            let errorMsg = result.error || 'Signup failed';

            // Handle common Supabase errors
            if (errorMsg.includes('rate limit') || errorMsg.includes('security purposes')) {
                errorMsg = 'Too many attempts. Please wait or play as Guest for now.';
            } else if (errorMsg.includes('User already registered')) {
                errorMsg = 'This email is already registered. Please login instead.';
            }

            setError(errorMsg);
            return;
        }

        setSignupSuccess(true);
    };

    const handleGuest = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (guestName.trim().length < 2) {
            setError('Please enter a name (at least 2 characters)');
            return;
        }

        const user = playAsGuest(guestName.trim());
        onAuthenticated(user);
    };

    const tabClass = (tab: AuthTab) =>
        `flex-1 py-3 text-sm font-semibold transition-all ${activeTab === tab
            ? 'text-[#f5e6c8] border-b-2 border-[#b8860b]'
            : 'text-[#b8860b]/50 hover:text-[#b8860b]'
        }`;

    const inputClass = "w-full p-3 bg-[#2d2a24] border border-[#b8860b]/30 rounded-lg text-[#f5e6c8] placeholder-[#b8860b]/40 focus:border-[#b8860b] focus:outline-none transition-all";

    const buttonClass = "w-full py-3 bg-gradient-to-r from-[#b8860b] to-[#d4a574] text-[#1a1814] rounded-lg font-bold hover:scale-[1.02] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed";

    if (signupSuccess) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1814] border-2 border-[#b8860b] rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h2 className="text-2xl font-cinzel font-bold text-[#f5e6c8] mb-4">Account Created!</h2>
                    <p className="text-[#b8860b]/70 mb-6">
                        Please check your email to verify your account, then you can login.
                    </p>
                    <button
                        onClick={() => { setSignupSuccess(false); setActiveTab('login'); }}
                        className={buttonClass}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1814] border-2 border-[#b8860b] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 text-center border-b border-[#b8860b]/20">
                    <h1 className="text-3xl font-cinzel font-bold title-shimmer mb-1">Chaturanga</h1>
                    <p className="text-[#b8860b]/70 text-sm">Ancient Chess Reimagined</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#b8860b]/20">
                    <button onClick={() => setActiveTab('login')} className={tabClass('login')}>
                        Login
                    </button>
                    <button onClick={() => setActiveTab('signup')} className={tabClass('signup')}>
                        Sign Up
                    </button>
                    <button onClick={() => setActiveTab('guest')} className={tabClass('guest')}>
                        Play as Guest
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {activeTab === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'signup' && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    className={inputClass}
                                    placeholder="unique_username"
                                    required
                                    maxLength={20}
                                />
                                <p className="text-[#b8860b]/40 text-xs mt-1">Letters, numbers, underscores only</p>
                            </div>
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={inputClass}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button type="submit" disabled={loading} className={buttonClass}>
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'guest' && (
                        <form onSubmit={handleGuest} className="space-y-4">
                            <p className="text-[#b8860b]/70 text-sm mb-4">
                                Play without an account. Your name will be shown to opponents.
                            </p>
                            <div>
                                <label className="block text-[#b8860b] text-sm mb-2">Your Name</label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className={inputClass}
                                    placeholder="Enter your name"
                                    required
                                    maxLength={20}
                                />
                            </div>
                            <button type="submit" className={buttonClass}>
                                Play as Guest
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                {onClose && (
                    <div className="px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-[#b8860b]/50 hover:text-[#b8860b] text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
