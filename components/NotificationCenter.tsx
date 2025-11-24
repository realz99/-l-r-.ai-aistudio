
import React from 'react';
import { Bell, Check, X, Calendar, Sparkles } from 'lucide-react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'alert';
    timestamp: number;
    read: boolean;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', title: 'Meeting Summary Ready', message: 'Your "Weekly Sync" has been processed.', type: 'success', timestamp: Date.now() - 1000 * 60 * 5, read: false },
    { id: '2', title: 'Task Reminder', message: 'Review Q3 roadmap in 10 mins.', type: 'alert', timestamp: Date.now() - 1000 * 60 * 60, read: false },
    { id: '3', title: 'New Feature', message: 'Try the new AI Planner to organize tasks.', type: 'info', timestamp: Date.now() - 1000 * 60 * 60 * 24, read: true },
];

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkRead }) => {
    return (
        <div className="absolute top-14 right-4 w-80 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 z-[100] overflow-hidden animate-in slide-in-from-top-2 duration-200 origin-top-right">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <X size={18} />
                </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No notifications yet.</p>
                    </div>
                ) : (
                    notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className={`p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => onMarkRead(notif.id)}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-otter-500' : 'bg-transparent'}`}></div>
                                <div>
                                    <h4 className={`text-sm font-semibold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {notif.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                        {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-white/5 text-center">
                <button className="text-xs font-bold text-otter-500 hover:underline">Mark all as read</button>
            </div>
        </div>
    );
};

export default NotificationCenter;