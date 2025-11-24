import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Type } from 'lucide-react';
import { SettingsStore } from '../services/settingsStore';

const Vocabulary: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');

  useEffect(() => {
    setTerms(SettingsStore.getVocabulary());
  }, []);

  const handleAdd = () => {
    if (newTerm.trim()) {
      SettingsStore.addVocabularyTerm(newTerm.trim());
      setTerms(SettingsStore.getVocabulary());
      setNewTerm('');
    }
  };

  const handleRemove = (term: string) => {
    SettingsStore.removeVocabularyTerm(term);
    setTerms(SettingsStore.getVocabulary());
  };

  return (
    <div className="bg-ios-bg dark:bg-black min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-ios-bg/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-ios-separator-dark px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-otter-500">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white flex-1 text-center md:text-left">Manage Vocabulary</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-900/30">
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300">
                    <Type size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Improve Transcription Accuracy</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        Add names, acronyms, or industry-specific terms that the AI might mishear. These will be prioritized during transcription.
                    </p>
                </div>
            </div>
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
            <input 
                type="text" 
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g. 'ọlọ́rọ̀', 'Kubernetes', 'Seun'"
                className="flex-1 bg-white dark:bg-ios-surface-dark border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-otter-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
                onClick={handleAdd}
                disabled={!newTerm.trim()}
                className="bg-otter-500 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center font-bold shadow-sm"
            >
                <Plus size={20} />
            </button>
        </div>

        {/* List */}
        <div>
            <h4 className="px-2 mb-2 text-[13px] font-normal text-gray-500 uppercase tracking-wide">My Vocabulary ({terms.length})</h4>
            <div className="bg-white dark:bg-ios-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-transparent">
                {terms.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No custom terms added yet.
                    </div>
                ) : (
                    terms.map((term, index) => (
                        <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-ios-separator-dark/50 last:border-0">
                            <span className="text-[17px] text-gray-900 dark:text-white">{term}</span>
                            <button 
                                onClick={() => handleRemove(term)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Vocabulary;