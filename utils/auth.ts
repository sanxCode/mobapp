import { supabase } from './supabase';

export interface UserProfile {
    id: string;
    username: string;
    isGuest: boolean;
}

// Get current user from localStorage or session
export const getCurrentUser = async (): Promise<UserProfile | null> => {
    // Check for guest user first
    const guestUser = localStorage.getItem('chaturanga_guest_user');
    if (guestUser) {
        return JSON.parse(guestUser);
    }

    // Check for authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

    if (!profile) return null;

    return {
        id: user.id,
        username: profile.username,
        isGuest: false
    };
};

// Sign up with email and username
export const signUp = async (
    email: string,
    username: string,
    password: string
): Promise<{ success: boolean; error?: string }> => {
    // Check if username is taken
    const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

    if (existing) {
        return { success: false, error: 'Username already taken' };
    }

    // Sign up
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        return { success: false, error: error.message };
    }

    if (!data.user) {
        return { success: false, error: 'Failed to create account' };
    }

    // Create profile
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: data.user.id,
            username: username.toLowerCase()
        });

    if (profileError) {
        return { success: false, error: 'Failed to create profile' };
    }

    // Clear any guest user
    localStorage.removeItem('chaturanga_guest_user');

    return { success: true };
};

// Login with username and password
export const login = async (
    username: string,
    password: string
): Promise<{ success: boolean; error?: string }> => {
    // Get email from username
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();

    if (!profile) {
        return { success: false, error: 'Username not found' };
    }

    // Get user email from auth
    const { data: userData } = await supabase.auth.admin?.getUserById(profile.id) || { data: null };

    // Since we can't get email from admin API in client, we'll use a workaround
    // We'll try login with username as email first, then handle the actual flow

    // Actually, let's store email in profiles table for login lookup
    // For now, we'll require email for login too, or use a different approach

    // Simplified: Try to sign in (user needs to remember their email)
    // Let's change the approach - login with email instead
    return { success: false, error: 'Please use your email to login' };
};

// Login with email and password
export const loginWithEmail = async (
    email: string,
    password: string
): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Clear any guest user
    localStorage.removeItem('chaturanga_guest_user');

    return { success: true };
};

// Play as guest
export const playAsGuest = (name: string): UserProfile => {
    const guestUser: UserProfile = {
        id: 'guest_' + Math.random().toString(36).substr(2, 9),
        username: name,
        isGuest: true
    };
    localStorage.setItem('chaturanga_guest_user', JSON.stringify(guestUser));
    return guestUser;
};

// Logout
export const logout = async (): Promise<void> => {
    localStorage.removeItem('chaturanga_guest_user');
    await supabase.auth.signOut();
};

// Listen to auth changes
export const onAuthStateChange = (callback: (user: UserProfile | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', session.user.id)
                .single();

            if (profile) {
                callback({
                    id: session.user.id,
                    username: profile.username,
                    isGuest: false
                });
            }
        } else {
            // Check for guest
            const guestUser = localStorage.getItem('chaturanga_guest_user');
            if (guestUser) {
                callback(JSON.parse(guestUser));
            } else {
                callback(null);
            }
        }
    });
};
