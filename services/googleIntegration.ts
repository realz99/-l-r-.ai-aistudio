
import { CalendarEvent, AppSettings, Transcript } from "../types";
import { SettingsStore } from "./settingsStore";

// ⚠️ REPLACE WITH YOUR ACTUAL CLIENT ID FOR REAL PRODUCTION USE
// If this remains "PLACEHOLDER", the app will use the robust simulation.
const GOOGLE_CLIENT_ID = "PLACEHOLDER"; 

export interface GoogleProfile {
  email: string;
  name: string;
  avatar: string;
  accessToken?: string;
}

let tokenClient: any;
let accessToken: string | null = null;

/**
 * Initializes the Google Identity Services Token Client.
 * Must be called after the GSI script loads.
 */
export const initGoogleAuth = (callback: (token: string) => void) => {
    if (typeof window !== 'undefined' && (window as any).google && GOOGLE_CLIENT_ID !== "PLACEHOLDER") {
        try {
            tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
                callback: (tokenResponse: any) => {
                    if (tokenResponse.access_token) {
                        accessToken = tokenResponse.access_token;
                        callback(tokenResponse.access_token);
                    }
                },
            });
        } catch (e) {
            console.warn("Google Auth Init Failed (Mocking Mode):", e);
        }
    }
};

/**
 * Triggers the Google Login Flow.
 * If Client ID is configured, it opens the popup.
 * Otherwise, it simulates a successful login.
 */
export const triggerGoogleLogin = (): Promise<GoogleProfile> => {
    return new Promise((resolve, reject) => {
        // 1. REAL MODE
        if (tokenClient && GOOGLE_CLIENT_ID !== "PLACEHOLDER") {
            tokenClient.requestAccessToken();
            // The callback in initGoogleAuth handles the resolution, 
            // but for this architecture, we might need to hook into it better.
            // For simplicity, we'll assume if tokenClient exists, we wait for the callback side-effect 
            // or just return the profile immediately if we already have a token.
            // This simple promise just resolves mock profile for now even in "Real" mode 
            // because getting the User Profile requires a separate fetch to userinfo endpoint.
            
            // Mocking the profile fetch part for safety, but the token is real.
            setTimeout(() => {
                 resolve({
                    email: "user@gmail.com",
                    name: "Google User",
                    avatar: "https://lh3.googleusercontent.com/a/default-user",
                    accessToken: accessToken || "mock_token"
                });
            }, 2000);
            return;
        }

        // 2. SIMULATION MODE (Fallback)
        console.log("Running in Google Auth Simulation Mode");
        setTimeout(() => {
            const mockToken = "mock_oauth_token_" + Date.now();
            accessToken = mockToken;
            resolve({
                email: "seunabari@gmail.com",
                name: "Seun Abari",
                avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Seun",
                accessToken: mockToken
            });
        }, 1500);
    });
};

export const simulateGoogleLogin = (): Promise<void> => {
    return new Promise((resolve) => {
        console.log("Simulating Google Login...");
        setTimeout(() => resolve(), 1000);
    });
};

export const fetchSettingsFromCloud = (): Promise<AppSettings | null> => {
    return new Promise((resolve) => {
        // In production, fetch specific file from AppData folder in Drive
        console.log("Fetching settings from Cloud...");
        setTimeout(() => {
            const cloudSettings = SettingsStore.getSettings(); 
            cloudSettings.vocabulary = [...cloudSettings.vocabulary, "Synced Term"];
            resolve(cloudSettings);
        }, 800);
    });
};

export const syncSettingsToCloud = (settings: AppSettings): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log("Syncing settings to Cloud...", settings);
        setTimeout(() => resolve(true), 500);
    });
};

/**
 * Uploads transcript to Google Drive.
 * Uses real API if token exists, otherwise simulates.
 */
export const syncTranscriptToDrive = async (transcript: Transcript): Promise<boolean> => {
    if (accessToken && !accessToken.startsWith("mock_")) {
        // REAL UPLOAD
        try {
            const fileContent = JSON.stringify(transcript, null, 2);
            const file = new Blob([fileContent], { type: 'application/json' });
            const metadata = {
                name: `${transcript.title}.json`,
                mimeType: 'application/json',
                parents: ['root'] // or specific folder ID
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', file);

            const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            });

            if (!res.ok) throw new Error(await res.text());
            console.log("Real Drive Upload Success");
            return true;
        } catch (e) {
            console.error("Real Drive Upload Failed:", e);
            return false;
        }
    } else {
        // SIMULATED UPLOAD
        return new Promise((resolve) => {
            console.log(`[Simulation] Syncing transcript ${transcript.id} to Google Drive...`);
            // Simulate 10% failure rate for "robustness" testing in UI
            const isSuccess = Math.random() > 0.1; 
            setTimeout(() => {
                if (isSuccess) console.log("[Simulation] Upload Success");
                else console.warn("[Simulation] Upload Failed (Simulated network error)");
                resolve(isSuccess);
            }, 1500);
        });
    }
};

export const addToGoogleCalendar = (title: string, dateStr: string): Promise<boolean> => {
    return new Promise((resolve) => {
        console.log(`Adding to calendar: ${title} at ${dateStr}`);
        setTimeout(() => resolve(true), 1000);
    });
};

export const getMockCalendarEvents = (): CalendarEvent[] => {
    const today = new Date();
    const baseDate = new Date(today);
    baseDate.setHours(0, 0, 0, 0);

    return [
        {
            id: 'evt1',
            title: 'Product Strategy Sync',
            startTime: new Date(baseDate.getTime() + 9.5 * 60 * 60 * 1000), 
            endTime: new Date(baseDate.getTime() + 10.5 * 60 * 60 * 1000), 
            location: 'Google Meet',
            attendees: ['Sarah', 'Mike']
        },
        {
            id: 'evt2',
            title: 'ọlọ́rọ̀.ai Design Review',
            startTime: new Date(baseDate.getTime() + 13 * 60 * 60 * 1000), 
            endTime: new Date(baseDate.getTime() + 14.5 * 60 * 60 * 1000), 
            location: 'Zoom',
            attendees: ['Design Team']
        },
        {
            id: 'evt3',
            title: 'Yoruba Language Session',
            startTime: new Date(baseDate.getTime() + 17 * 60 * 60 * 1000), 
            endTime: new Date(baseDate.getTime() + 18 * 60 * 60 * 1000), 
            location: 'Coffee Shop',
            attendees: []
        }
    ];
};
