import {
    getSession,
    onSupabaseAuthChange,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    sendPasswordReset,
    updatePassword,
    deleteCurrentUser,
    reauthenticateUser,
    upsertProfileRow
} from './api.js';

let currentUser = null;
let initPromise = null;
let authSubscription = null;
let checkoutCallback = null;
const userListeners = new Set();

function notifyUserListeners() {
    userListeners.forEach((listener) => listener(currentUser));
}

function flushCheckoutCallback(user) {
    if (typeof checkoutCallback === 'function') {
        const callback = checkoutCallback;
        checkoutCallback = null;
        callback(user);
    }
}

export async function initAuth() {
    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const session = await getSession();
        currentUser = session?.user || null;
        notifyUserListeners();

        if (!authSubscription) {
            authSubscription = onSupabaseAuthChange(({ user }) => {
                currentUser = user;
                notifyUserListeners();

                if (currentUser) {
                    flushCheckoutCallback(currentUser);
                }
            });
        }

        return currentUser;
    })();

    return initPromise;
}

export function getCurrentUser() {
    return currentUser;
}

export function onCurrentUserChange(listener) {
    userListeners.add(listener);

    if (initPromise) {
        listener(currentUser);
    }

    return () => {
        userListeners.delete(listener);
    };
}

export function getUserFirstName(user) {
    return user?.user_metadata?.first_name ||
        user?.user_metadata?.full_name?.split(' ')[0] ||
        user?.email?.split('@')[0] ||
        'there';
}

export async function login({ email, password }) {
    const data = await signInWithEmail({ email, password });
    currentUser = data.user || null;
    notifyUserListeners();

    if (currentUser) {
        flushCheckoutCallback(currentUser);
        window.dispatchEvent(new CustomEvent('omegatek:auth-success'));
    }

    return currentUser;
}

export async function register({ firstName, lastName, email, phone, password }) {
    const data = await signUpWithEmail({ firstName, lastName, email, phone, password });

    if (data.session && data.user) {
        currentUser = data.user;
        notifyUserListeners();
        flushCheckoutCallback(currentUser);
        window.dispatchEvent(new CustomEvent('omegatek:auth-success'));
    }

    return data;
}

export async function logout() {
    await signOutUser();
    currentUser = null;
    checkoutCallback = null;
    notifyUserListeners();
}

export async function forgotPassword(email) {
    await sendPasswordReset(email);
}

export async function saveProfile({ firstName, lastName, phone }) {
    if (!currentUser) {
        throw new Error('You must be signed in to save your profile.');
    }

    await upsertProfileRow({
        id: currentUser.id,
        email: currentUser.email,
        first_name: firstName,
        last_name: lastName,
        phone
    });
}

export async function changePassword(newPassword) {
    await updatePassword(newPassword);
}

export async function deleteAccount(password) {
    if (!currentUser) {
        throw new Error('You must be signed in to delete your account.');
    }

    await reauthenticateUser({ email: currentUser.email, password });
    await deleteCurrentUser();
    await signOutUser();

    currentUser = null;
    checkoutCallback = null;
    notifyUserListeners();
}

export function requireAuthForCheckout(onProceed) {
    if (currentUser) {
        onProceed(currentUser);
        return false;
    }

    checkoutCallback = onProceed;
    return true;
}

export function continueAsGuest() {
    flushCheckoutCallback(null);
}
