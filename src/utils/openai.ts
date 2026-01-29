import OpenAI from 'openai';
import { env } from '../config/env';

let openaiClient: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI | null => {
  if (!env.openaiApiKey) {
    console.warn('OpenAI API key not configured');
    return null;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey,
      maxRetries: 3,
      timeout: 60000, // 60 seconds
    });
  }

  return openaiClient;
};

export const isOpenAIConfigured = (): boolean => {
  return !!env.openaiApiKey;
};

/**
 * Create a chat completion using OpenAI Chat Completions API
 * Optimized for structured data extraction
 */
export const chatCompletion = async (
  messages: Array<{ role: string; content: string | Array<{ type: string; text: string }> }>,
  model: string = 'gpt-4o-mini',
  maxTokens: number = 4000,
  temperature: number = 0.1
): Promise<{
  success: boolean;
  content?: string;
  usage?: any;
  error?: string;
  status?: number;
}> => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return {
        success: false,
        error: 'OpenAI client not configured',
      };
    }

    const response = await client.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens: maxTokens,
      temperature,
    });

    const message = response.choices?.[0]?.message;
    const content = message?.content;

    if (content) {
      return {
        success: true,
        content,
        usage: response.usage,
      };
    } else {
      console.warn('No content returned from OpenAI');
      return {
        success: false,
        error: 'No content returned',
      };
    }
  } catch (error: any) {
    console.error('OpenAI chat completion failed:', {
      error: error.message,
      status: error.status,
      type: error.type,
    });

    return {
      success: false,
      error: error.message,
      status: error.status,
    };
  }
};
