
import { CalendarEvent, AppSettings, Transcript } from "../types";
import { SettingsStore } from "./settingsStore";

// 🔴 CRITICAL: YOU MUST PASTE YOUR REAL GOOGLE CLIENT ID HERE
// Go to console.cloud.google.com -> Credentials -> OAuth 2.0 Client IDs
let googleClientId = "PLACEHOLDER"; 

export const setGoogleClientId = (id: string) => {
    googleClientId = id;
    // Re-initialize with new ID
    initGoogleAuth();
};

export interface GoogleProfile {
  email: string;
  name: string;
  avatar: string;
  accessToken?: string;
}

let tokenClient: any;

/**
 * Initializes the Google Identity Services Token Client.
 */
export const initGoogleAuth = (callback?: (token: string) => void) => {
    if (typeof window !== 'undefined' && (window as any).google) {
        try {
            tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: googleClientId,
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar.events',
                callback: async (tokenResponse: any) => {
                    if (tokenResponse.access_token && callback) {
                        callback(tokenResponse.access_token);
                    }
                },
            });
        } catch (e) {
            console.error("Google Auth Init Error:", e);
        }
    }
};

/**
 * Triggers the REAL Google Login Popup.
 * Fails if Client ID is missing. No simulation.
 */
export const triggerGoogleLogin = (): Promise<GoogleProfile> => {
    return new Promise((resolve, reject) => {
        if (googleClientId === "PLACEHOLDER") {
             reject(new Error("MISSING_CLIENT_ID"));
             return;
        }

        if (!tokenClient) {
            // Attempt late initialization
            initGoogleAuth();
            if (!tokenClient) {
                const msg = "Google Auth not initialized. Check internet connection and GOOGLE_CLIENT_ID.";
                alert(msg);
                reject(new Error(msg));
                return;
            }
        }

        // We override the callback for this specific login request
        tokenClient.callback = async (tokenResponse: any) => {
            if (tokenResponse.error) {
                reject(tokenResponse.error);
                return;
            }

            const accessToken = tokenResponse.access_token;

            // Fetch actual user details
            try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                if (!userInfoRes.ok) throw new Error('Failed to fetch user info');
                
                const userInfo = await userInfoRes.json();
                
                resolve({
                    email: userInfo.email,
                    name: userInfo.name,
                    avatar: userInfo.picture,
                    accessToken: accessToken
                });
            } catch (error) {
                reject(error);
            }
        };

        tokenClient.requestAccessToken();
    });
};

export const fetchSettingsFromCloud = async (): Promise<AppSettings | null> => {
    // Real implementation would fetch a specific file from Drive AppData folder
    // For now, returning null to force local defaults if not implemented
    return null; 
};

export const syncSettingsToCloud = async (settings: AppSettings): Promise<boolean> => {
    // Real implementation would overwrite the AppData file
    return true;
};

/**
 * Uploads transcript to Google Drive (Real API).
 */
export const syncTranscriptToDrive = async (transcript: Transcript): Promise<boolean> => {
    const accounts = JSON.parse(localStorage.getItem('oloro_accounts') || '[]');
    const currentId = localStorage.getItem('oloro_current_account_id');
    const account = accounts.find((a: any) => a.id === currentId);

    if (!account || !account.token) return false;

    try {
        const fileContent = JSON.stringify(transcript, null, 2);
        const file = new Blob([fileContent], { type: 'application/json' });
        
        const metadata = {
            name: `${transcript.title}.json`,
            mimeType: 'application/json',
            parents: ['root'] 
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${account.token}` },
            body: form
        });

        if (!res.ok) throw new Error(await res.text());
        return true;
    } catch (e) {
        console.error("Drive Sync Failed:", e);
        return false;
    }
};

/**
 * Fetches REAL events from Google Calendar.
 */
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
    const accounts = JSON.parse(localStorage.getItem('oloro_accounts') || '[]');
    const currentId = localStorage.getItem('oloro_current_account_id');
    const account = accounts.find((a: any) => a.id === currentId);

    if (!account || !account.token) return [];

    try {
        const now = new Date().toISOString();
        // Fetch next 50 events
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&orderBy=startTime&singleEvents=true&maxResults=50`, {
            headers: { 'Authorization': `Bearer ${account.token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch calendar events");

        const data = await res.json();
        
        return data.items.map((item: any) => ({
            id: item.id,
            title: item.summary || 'No Title',
            startTime: new Date(item.start.dateTime || item.start.date),
            endTime: new Date(item.end.dateTime || item.end.date),
            location: item.location,
            attendees: item.attendees?.map((a: any) => a.email) || [],
            isAllDay: !item.start.dateTime
        }));

    } catch (e) {
        console.error("Calendar Fetch Error:", e);
        return [];
    }
};

export const addToGoogleCalendar = async (title: string, dateStr: string): Promise<boolean> => {
    const accounts = JSON.parse(localStorage.getItem('oloro_accounts') || '[]');
    const currentId = localStorage.getItem('oloro_current_account_id');
    const account = accounts.find((a: any) => a.id === currentId);

    if (!account || !account.token) return false;

    try {
        const start = new Date(dateStr);
        if (isNaN(start.getTime())) return false;
        const end = new Date(start.getTime() + 30 * 60 * 1000); 

        const event = {
            summary: title,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() }
        };

        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${account.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        return res.ok;
    } catch (e) {
        console.error("Add to Calendar Failed:", e);
        return false;
    }
};
