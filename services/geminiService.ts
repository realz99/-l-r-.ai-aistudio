
import { GoogleGenAI, Type } from "@google/genai";
import { Transcript, SmartEntity, Subtask, NeuroTask } from "../types";
import { SettingsStore } from "./settingsStore";
import { KeyManager } from "./keyManager";

// Helper to get client with rotating key
const getClient = () => {
  const activeKey = KeyManager.getActiveKey();
  
  if (!activeKey) {
      // Fallback if no user keys, try env (dev mode) or throw
      if (process.env.API_KEY) {
          return { client: new GoogleGenAI({ apiKey: process.env.API_KEY }), keyId: null };
      }
      throw new Error("No valid API keys available. Please add a Gemini API key in settings.");
  }
  
  return { client: new GoogleGenAI({ apiKey: activeKey.key }), keyId: activeKey.id };
};

export interface TranscriptionSegment {
  speaker: string;
  text: string;
}

/**
 * Refines raw transcription text (from Web Speech API) using Gemini.
 * Fixes grammar, punctuation, and formats it into segments.
 */
export const cleanupTranscript = async (rawText: string): Promise<TranscriptionSegment[]> => {
    const { client, keyId } = getClient();
    const vocab = SettingsStore.getVocabulary();
    
    try {
        const prompt = `
            You are an expert transcription editor.
            Refine the following raw transcript text (which may have errors from speech-to-text).
            
            Tasks:
            1. Fix punctuation, capitalization, and grammar.
            2. Infer speaker changes if obvious from context (label as Speaker 1, Speaker 2), otherwise use "Speaker 1".
            3. Apply context from this vocabulary list: ${vocab.join(', ')}.
            
            Raw Text:
            "${rawText}"
            
            Return a JSON array of objects with 'speaker' and 'text'.
        `;

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speaker: { type: Type.STRING },
                            text: { type: Type.STRING }
                        },
                        required: ['speaker', 'text']
                    }
                }
            }
        });

        if (keyId && response.usageMetadata) {
            const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
            KeyManager.logUsage(keyId, totalTokens);
        }

        const jsonStr = response.text || "[]";
        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error("Cleanup Error:", error);
        // Fallback: return raw text as single segment
        return [{ speaker: "Speaker 1", text: rawText }];
    }
};

/**
 * Transcribes audio data using Gemini 2.5 Flash.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<TranscriptionSegment[]> => {
  const { client, keyId } = getClient();
  
  try {
    const vocab = SettingsStore.getVocabulary();
    const vocabPrompt = vocab.length > 0 
        ? `Use this custom vocabulary list to improve accuracy for specific terms: ${vocab.join(', ')}.` 
        : '';

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Transcribe this audio accurately. ${vocabPrompt}
            Identify different speakers (e.g., Speaker 1, Speaker 2) based on voice characteristics. 
            Return a JSON array of objects, where each object has a 'speaker' field and a 'text' field.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              speaker: { type: Type.STRING },
              text: { type: Type.STRING }
            },
            required: ['speaker', 'text']
          }
        }
      }
    });

    // Track usage (Input audio tokens + output text)
    if (keyId && response.usageMetadata) {
        const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
        KeyManager.logUsage(keyId, totalTokens);
    }

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Transcription Error:", error);
    if (keyId) KeyManager.reportError(keyId, error.message || "Unknown error");
    throw error;
  }
};

/**
 * "Second Brain" Analysis: Extracts dates, locations, and tasks.
 */
export const extractSmartEntities = async (fullText: string): Promise<SmartEntity[]> => {
  const { client, keyId } = getClient();
  
  try {
    const prompt = `
      Analyze the following text and extract "Smart Entities" to act as a second brain for the user.
      Look for:
      1. Dates and Times (for calendar events or alarms).
      2. Physical Addresses or Locations.
      3. Specific actionable tasks.

      Return a JSON array.
      
      Text to analyze:
      ${fullText}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['date', 'location', 'task', 'alarm'] },
              text: { type: Type.STRING, description: "The extracted text snippet" },
              value: { type: Type.STRING, description: "Normalized value (ISO date or full address)" },
              context: { type: Type.STRING, description: "Brief context surrounding the entity" }
            },
            required: ['id', 'type', 'text', 'context']
          }
        }
      }
    });

     if (keyId && response.usageMetadata) {
        const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
        KeyManager.logUsage(keyId, totalTokens);
    }

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("Smart Entity Extraction Error:", error);
    if (keyId) KeyManager.reportError(keyId, error.message || "Unknown error");
    return [];
  }
};

export const chatWithTranscript = async (transcript: Transcript, message: string, history: any[]): Promise<string> => {
    const textContent = transcript.segments.map(s => `${s.speakerId}: ${s.text}`).join('\n');
    const { client, keyId } = getClient();

    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Context: The following is a meeting transcript:\n${textContent}\n\nUser Question: ${message}`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }, 
            }
        });

        if (keyId && response.usageMetadata) {
            const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
            KeyManager.logUsage(keyId, totalTokens);
        }

        return response.text || "I couldn't understand that.";
    } catch (e: any) {
        console.error("Chat Error:", e);
        if (keyId) KeyManager.reportError(keyId, e.message || "Unknown error");
        return "I'm having trouble analyzing that right now. Please check your API key quotas.";
    }
};

export const breakdownTask = async (taskText: string): Promise<Subtask[]> => {
    const { client, keyId } = getClient();
    const context = SettingsStore.getSettings().userContext;

    try {
        // IMPROVED PROMPT: Specifically targeted at Neurodivergent/ADHD needs (Momentum, Low Friction)
        const prompt = `
            You are an expert ADHD productivity coach. Your goal is to help the user overcome task paralysis.
            Break down the following task into tiny, manageable "micro-steps".
            
            Rules:
            1. Steps should be atomic (e.g., "Open laptop" instead of "Write report").
            2. Estimate short durations (1-15 mins) to encourage momentum.
            3. Keep the tone encouraging but direct.
            4. Use the provided User Context to personalize if relevant.

            User Context: ${context}
            Task: "${taskText}"
            
            Return a JSON array of subtasks.
        `;
        
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING },
                            durationMinutes: { type: Type.INTEGER }
                        },
                        required: ['text', 'durationMinutes']
                    }
                }
            }
        });

        if (keyId && response.usageMetadata) {
             const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
             KeyManager.logUsage(keyId, totalTokens);
        }

        const raw = JSON.parse(response.text || "[]");
        return raw.map((r: any, i: number) => ({
            id: `sub-${Date.now()}-${i}`,
            text: r.text,
            durationMinutes: r.durationMinutes,
            completed: false
        }));

    } catch (e: any) {
        console.error("Task Breakdown Error:", e);
        return [];
    }
};

export const processBrainDump = async (dumpText: string): Promise<NeuroTask[]> => {
    const { client, keyId } = getClient();
    const context = SettingsStore.getSettings().userContext;

    try {
        // IMPROVED PROMPT: Focus on decluttering mental load
        const prompt = `
            You are a "Second Brain" assistant for a neurodivergent user.
            Analyze this "Brain Dump" of unstructured thoughts and organize them into clear, distinct tasks.
            
            For each task:
            1. Give it a clear, actionable title.
            2. Assign a category (Home, Work, Errands, Health, Other).
            3. Estimate the total time.
            4. Generate 3-5 subtasks to help get started.
            
            User Context: ${context}
            Brain Dump: "${dumpText}"
            
            Return a JSON array of NeuroTasks.
        `;
        
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            durationMinutes: { type: Type.INTEGER },
                            category: { type: Type.STRING },
                            subtasks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        text: { type: Type.STRING },
                                        durationMinutes: { type: Type.INTEGER }
                                    }
                                }
                            }
                        },
                        required: ['title', 'durationMinutes', 'category']
                    }
                }
            }
        });

        if (keyId && response.usageMetadata) {
             const totalTokens = (response.usageMetadata.promptTokenCount || 0) + (response.usageMetadata.candidatesTokenCount || 0);
             KeyManager.logUsage(keyId, totalTokens);
        }

        const raw = JSON.parse(response.text || "[]");
        return raw.map((r: any, i: number) => ({
            id: `task-${Date.now()}-${i}`,
            title: r.title,
            date: new Date().toISOString(),
            startTime: 'Today', // Default
            endTime: 'Anytime', // Default
            durationMinutes: r.durationMinutes,
            category: r.category,
            subtasks: (r.subtasks || []).map((s: any, j: number) => ({
                id: `sub-${Date.now()}-${i}-${j}`,
                text: s.text,
                durationMinutes: s.durationMinutes,
                completed: false
            })),
            completed: false
        }));

    } catch (e: any) {
        console.error("Brain Dump Error:", e);
        return [];
    }
};