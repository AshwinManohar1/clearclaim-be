import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

let geminiClient: GoogleGenerativeAI | null = null;

export const getGeminiClient = (): GoogleGenerativeAI | null => {
  if (!env.geminiApiKey) {
    console.warn('Gemini API key not configured');
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return geminiClient;
};

export const isGeminiConfigured = (): boolean => {
  return !!env.geminiApiKey;
};
