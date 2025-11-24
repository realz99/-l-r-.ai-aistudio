
import { Transcript, Channel, Folder, NeuroTask } from '../types';

// Mutable arrays for "Pro" functionality (creating new items)
let _channels: Channel[] = [
  { id: 'c1', name: 'General', type: 'public', members: 12 },
  { id: 'c2', name: 'Engineering', type: 'private', members: 5 },
  { id: 'c3', name: 'Product', type: 'public', members: 8 },
  { id: 'c4', name: 'Marketing', type: 'public', members: 6 }
];

let _folders: Folder[] = [
  { id: 'f1', name: 'Q1 Interviews', count: 4 },
  { id: 'f2', name: 'Ideas', count: 12 },
  { id: 'f3', name: 'All Hands', count: 2 }
];

// Accessors and Mutators
export const getChannels = () => _channels;
export const getFolders = () => _folders;

export const addChannel = (name: string, type: 'public' | 'private' = 'public'): Channel => {
    const newChannel: Channel = {
        id: `c_${Date.now()}`,
        name,
        type,
        members: 1
    };
    _channels = [..._channels, newChannel];
    return newChannel;
};

export const addFolder = (name: string): Folder => {
    const newFolder: Folder = {
        id: `f_${Date.now()}`,
        name,
        count: 0
    };
    _folders = [..._folders, newFolder];
    return newFolder;
};

export const MOCK_TASKS: NeuroTask[] = [
    {
        id: 't1',
        title: 'look for Enfield district league and north London development league',
        date: new Date().toISOString(),
        startTime: '1:25 AM',
        endTime: '2:00 AM',
        durationMinutes: 35,
        category: 'Other',
        completed: false,
        subtasks: [
            { id: 'st1', text: 'Open a web browser', durationMinutes: 1, completed: true },
            { id: 'st2', text: "Search for 'Enfield District League'", durationMinutes: 5, completed: false },
            { id: 'st3', text: 'Review the search results for relevant links', durationMinutes: 5, completed: false },
            { id: 'st4', text: 'Click on the most relevant link for Enfield District League', durationMinutes: 2, completed: false },
            { id: 'st5', text: 'Read through the information provided about the Enfield District League', durationMinutes: 5, completed: false },
        ]
    },
    {
        id: 't2',
        title: 'Clean my room',
        date: new Date().toISOString(),
        startTime: '10:00 AM',
        endTime: '10:45 AM',
        durationMinutes: 45,
        category: 'Home',
        completed: false,
        subtasks: []
    }
];

export const MOCK_TRANSCRIPTS: Transcript[] = [
  {
    id: '1',
    title: 'Weekly Product Sync - Q3 Roadmap',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    duration: 145,
    status: 'completed',
    channelId: 'c3',
    speakers: [
      { id: 's1', name: 'Sarah Chen', color: 'text-blue-600' },
      { id: 's2', name: 'Mike Ross', color: 'text-emerald-600' },
      { id: 's3', name: 'Elena Rodriguez', color: 'text-purple-600' },
    ],
    summary: "The team discussed the Q3 roadmap, focusing on the new mobile app launch. Sarah raised concerns about the timeline for the backend migration. Mike confirmed that the API endpoints are 90% complete. Elena suggested a beta release for internal testing by next Friday.",
    summaryPoints: [
      "Project Charter and Key Milestones discussed",
      "Stakeholder Management and Deployment Process",
      "Business Case and Justification",
      "Risk Management and Phase Deployment"
    ],
    actionItems: [
      { id: 'a1', text: 'Finalize API documentation', assignee: 'Mike Ross', completed: false },
      { id: 'a2', text: 'Schedule beta testing kickoff', assignee: 'Elena Rodriguez', completed: false },
    ],
    segments: [
      { id: 'seg1', speakerId: 's1', startTime: 0, endTime: 5, text: "Alright everyone, let's get started. The main goal today is to lock down the Q3 roadmap.", confidence: 0.98 },
      { id: 'seg2', speakerId: 's1', startTime: 5.5, endTime: 12, text: "I'm particularly worried about the backend migration timeline. Are we still on track?", confidence: 0.95 },
      { id: 'seg3', speakerId: 's2', startTime: 13, endTime: 20, text: "Yes, the API endpoints are 90% complete. We just need to run final integration tests.", confidence: 0.99 },
      { id: 'seg4', speakerId: 's3', startTime: 21, endTime: 35, text: "Great. I suggest we aim for a internal beta release by next Friday. Does that work?", confidence: 0.92 }
    ]
  }
];