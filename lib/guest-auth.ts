import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const GUEST_ID_KEY = "bowling_analyzer_guest_id";
const GUEST_MODE_KEY = "bowling_analyzer_guest_mode";

/**
 * Generate a unique guest ID
 */
function generateGuestId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `guest_${timestamp}_${randomPart}`;
}

/**
 * Get or create a guest ID for this device
 */
export async function getOrCreateGuestId(): Promise<string> {
    try {
        let guestId: string | null = null;

        if (Platform.OS === "web") {
            guestId = window.localStorage.getItem(GUEST_ID_KEY);
            if (!guestId) {
                guestId = generateGuestId();
                window.localStorage.setItem(GUEST_ID_KEY, guestId);
            }
        } else {
            guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
            if (!guestId) {
                guestId = generateGuestId();
                await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
            }
        }

        return guestId;
    } catch (error) {
        console.error("[GuestAuth] Failed to get/create guest ID:", error);
        return generateGuestId();
    }
}

/**
 * Check if guest mode is enabled
 */
export async function isGuestModeEnabled(): Promise<boolean> {
    try {
        if (Platform.OS === "web") {
            return window.localStorage.getItem(GUEST_MODE_KEY) === "true";
        }
        const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
        return value === "true";
    } catch {
        return false;
    }
}

/**
 * Enable guest mode
 */
export async function enableGuestMode(): Promise<void> {
    try {
        if (Platform.OS === "web") {
            window.localStorage.setItem(GUEST_MODE_KEY, "true");
        } else {
            await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
        }
    } catch (error) {
        console.error("[GuestAuth] Failed to enable guest mode:", error);
    }
}

/**
 * Disable guest mode (for when user logs in with real account)
 */
export async function disableGuestMode(): Promise<void> {
    try {
        if (Platform.OS === "web") {
            window.localStorage.removeItem(GUEST_MODE_KEY);
        } else {
            await AsyncStorage.removeItem(GUEST_MODE_KEY);
        }
    } catch (error) {
        console.error("[GuestAuth] Failed to disable guest mode:", error);
    }
}

export interface GuestUser {
    id: number;
    openId: string;
    name: string;
    email: null;
    loginMethod: string;
    lastSignedIn: Date;
    isGuest: true;
}

/**
 * Get a guest user object
 */
export async function getGuestUser(): Promise<GuestUser> {
    const guestId = await getOrCreateGuestId();
    return {
        id: -1, // Special ID for guest
        openId: guestId,
        name: "ゲストユーザー",
        email: null,
        loginMethod: "guest",
        lastSignedIn: new Date(),
        isGuest: true,
    };
}
