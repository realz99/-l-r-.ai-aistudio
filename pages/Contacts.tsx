
import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Search, Phone, Mail } from 'lucide-react';
import { Contact } from '../types';

const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'Sheriff Okoye', email: 'sheriff@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sheriff' },
    { id: '2', name: 'Sarah Chen', email: 'sarah@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
    { id: '3', name: 'Mike Ross', phone: '+1 (555) 0123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike' },
];

const Contacts: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
    const [search, setSearch] = useState('');

    const handleImport = async () => {
        // Feature detection for Contact Picker API
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'email', 'tel'];
                const opts = { multiple: true };
                // @ts-ignore
                const newContacts = await navigator.contacts.select(props, opts);
                
                const formatted = newContacts.map((c: any, i: number) => ({
                    id: `imported_${Date.now()}_${i}`,
                    name: c.name?.[0] || 'Unknown',
                    email: c.email?.[0],
                    phone: c.tel?.[0]
                }));
                
                setContacts(prev => [...prev, ...formatted]);
            } catch (ex) {
                // Handle cancellation or error
                console.log(ex);
            }
        } else {
            alert("Contact import is not supported on this device/browser. Added a mock contact.");
            setContacts(prev => [...prev, { id: `mock_${Date.now()}`, name: "New Contact", email: "new@example.com" }]);
        }
    };

    const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-ios-bg dark:bg-black min-h-screen flex flex-col">
            <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
                <button onClick={onBack} className="text-otter-500">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white flex-1 text-center md:text-left">Contacts</h1>
                <button onClick={handleImport} className="text-otter-500">
                    <UserPlus size={24} />
                </button>
            </div>

            <div className="p-4 max-w-2xl mx-auto w-full">
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search contacts" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-ios-surface-dark border-none rounded-xl py-2.5 pl-10 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-otter-500 placeholder-gray-500"
                    />
                </div>

                <div className="bg-white dark:bg-ios-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-transparent">
                    {filtered.map((contact, index) => (
                        <div key={contact.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-ios-separator-dark/50 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                {contact.avatar ? (
                                    <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                        {contact.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    {contact.email && <span className="flex items-center gap-1"><Mail size={10} /> {contact.email}</span>}
                                    {contact.phone && <span className="flex items-center gap-1"><Phone size={10} /> {contact.phone}</span>}
                                </div>
                            </div>
                            <button className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-xs font-bold rounded-full text-otter-500 hover:bg-otter-50">
                                Invite
                            </button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            No contacts found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Contacts;
