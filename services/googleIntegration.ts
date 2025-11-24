import { CalendarEvent } from "../types";

export interface GoogleProfile {
  email: string;
  name: string;
  avatar: string;
}

// Simulates the OAuth flow delay and returns a profile
export const simulateGoogleLogin = (): Promise<GoogleProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        email: "seunabari@gmail.com",
        name: "Seun Abari",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Seun"
      });
    }, 1500);
  });
};

export const addToGoogleCalendar = (title: string, dateStr: string): Promise<boolean> => {
    return new Promise((resolve) => {
        // Simulate API call
        console.log(`Adding to calendar: ${title} at ${dateStr}`);
        setTimeout(() => resolve(true), 1000);
    });
};

// Returns mock events that would come from the Google Calendar API
export const getMockCalendarEvents = (): CalendarEvent[] => {
    const today = new Date();
    // Normalize to start of today for consistent event placement
    const baseDate = new Date(today);
    baseDate.setHours(0, 0, 0, 0);

    return [
        {
            id: 'evt1',
            title: 'Product Strategy Sync',
            startTime: new Date(baseDate.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
            endTime: new Date(baseDate.getTime() + 10.5 * 60 * 60 * 1000), // 10:30 AM
            location: 'Google Meet',
            attendees: ['Sarah', 'Mike']
        },
        {
            id: 'evt2',
            title: 'ọlọ́rọ̀.ai Design Review',
            startTime: new Date(baseDate.getTime() + 13 * 60 * 60 * 1000), // 1:00 PM
            endTime: new Date(baseDate.getTime() + 14.5 * 60 * 60 * 1000), // 2:30 PM
            location: 'Zoom',
            attendees: ['Design Team']
        },
        {
            id: 'evt3',
            title: 'Yoruba Language Session',
            startTime: new Date(baseDate.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
            endTime: new Date(baseDate.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM
            location: 'Coffee Shop',
            attendees: []
        }
    ];
};