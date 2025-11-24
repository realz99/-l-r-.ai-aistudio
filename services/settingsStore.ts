
import { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  dataSaver: false,
  language: 'English',
  themeColor: 'blue',
  vocabulary: [],
  userContext: '',
  geminiModel: 'gemini-2.5-flash',
  notifications: {
    myConversations: true,
    sharedWithMe: true,
    liveNotes: true,
    highlights: true,
    meetingSummary: true,
    comments: true,
    calendarEvents: true,
    activityStats: false,
    productTips: true,
    offers: true,
    dailyDigest: false,
  },
  meeting: {
    autoShare: "Don't share",
    defaultPermission: 'Collaborator',
    collaboratorsCanShare: true,
    autoJoin: 'Meetings where I am the host',
    autoCapture: true,
    emailHost: false,
    preRecordingEmails: false,
    sendLinkViaChat: false,
  },
  advanced: {
    darkMode: 'Default',
    syncPhotos: false,
    recordBluetooth: false,
    removeBranding: false,
    showSpeakerTime: false,
    preventAutoLock: true,
    showBottomNav: true,
  }
};

export class SettingsStore {
  private static STORAGE_KEY = 'oloro_app_settings';

  static getSettings(): AppSettings {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    // Deep merge to ensure new structure key updates exist even in old data
    const parsed = JSON.parse(stored);
    return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        meeting: { ...DEFAULT_SETTINGS.meeting, ...parsed.meeting },
        advanced: { ...DEFAULT_SETTINGS.advanced, ...parsed.advanced },
    };
  }

  static updateSettings(partial: Partial<AppSettings>) {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  static replaceSettings(newSettings: AppSettings) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
  }

  static getVocabulary(): string[] {
    return this.getSettings().vocabulary;
  }

  static addVocabularyTerm(term: string) {
    const current = this.getVocabulary();
    if (!current.includes(term)) {
        this.updateSettings({ vocabulary: [...current, term] });
    }
  }

  static removeVocabularyTerm(term: string) {
    const current = this.getVocabulary();
    this.updateSettings({ vocabulary: current.filter(t => t !== term) });
  }
}
