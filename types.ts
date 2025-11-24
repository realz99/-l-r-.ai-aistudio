
import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isAuthenticated: boolean;
}

export interface Speaker {
  id: string;
  name: string;
  color: string;
}

export interface Segment {
  id: string;
  speakerId: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  confidence?: number; // 0.0 to 1.0
  isHighlighted?: boolean;
  comment?: string;
  reminder?: {
    date: string; // ISO string
    title: string;
  };
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  completed: boolean;
}

export interface SmartEntity {
  id: string;
  type: 'date' | 'location' | 'task' | 'alarm';
  text: string;
  value?: string; // ISO date string or normalized address
  context: string; // The sentence it came from
}

export interface Subtask {
  id: string;
  text: string;
  durationMinutes: number;
  completed: boolean;
}

export interface NeuroTask {
  id: string;
  title: string;
  date: string; // ISO date
  startTime?: string; // "1:25 AM"
  endTime?: string;   // "2:00 AM"
  durationMinutes: number;
  category: string;
  subtasks: Subtask[];
  completed: boolean;
}

export interface Transcript {
  id: string;
  title: string;
  date: string; // ISO string
  duration: number; // seconds
  segments: Segment[];
  summary: string | null;
  summaryPoints?: string[]; // New field for dashboard bullet points
  actionItems: ActionItem[];
  smartEntities?: SmartEntity[]; // "Second Brain" data
  speakers: Speaker[];
  status: 'processing' | 'completed';
  channelId?: string; // Linked to a channel
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface APIKey {
  id: string;
  key: string; 
  label: string;
  usage: {
    totalRequests: number;
    totalTokens: number;
    cost: number; // Estimated cost in USD
    lastUsed: string | null;
  };
  isActive: boolean;
  errorCount: number;
  lastError?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private';
  members: number;
}

export interface Folder {
  id: string;
  name: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

// --- SETTINGS INTERFACES ---

export interface NotificationSettings {
  myConversations: boolean;
  sharedWithMe: boolean;
  liveNotes: boolean;
  highlights: boolean;
  meetingSummary: boolean;
  comments: boolean;
  calendarEvents: boolean;
  activityStats: boolean;
  productTips: boolean;
  offers: boolean;
  dailyDigest: boolean;
}

export interface MeetingSettings {
  autoShare: 'Don\'t share' | 'View only' | 'Edit';
  defaultPermission: 'Collaborator' | 'Viewer';
  collaboratorsCanShare: boolean;
  autoJoin: 'Meetings where I am the host' | 'All meetings' | 'No meetings';
  autoCapture: boolean;
  emailHost: boolean;
  preRecordingEmails: boolean;
  sendLinkViaChat: boolean;
}

export interface AdvancedSettings {
  darkMode: 'Default' | 'Dark' | 'Light';
  syncPhotos: boolean;
  recordBluetooth: boolean;
  removeBranding: boolean;
  showSpeakerTime: boolean;
  preventAutoLock: boolean;
}

export interface AppSettings {
  dataSaver: boolean;
  language: string;
  themeColor: 'blue' | 'teal' | 'purple' | 'orange' | 'pink';
  vocabulary: string[];
  userContext: string; // For "Context" page
  notifications: NotificationSettings;
  meeting: MeetingSettings;
  advanced: AdvancedSettings;
}

export interface SettingItemProps {
  label: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  hasChevron?: boolean;
  isLast?: boolean;
  destructive?: boolean;
  toggle?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  sublabel?: string;
  disabled?: boolean;
}
