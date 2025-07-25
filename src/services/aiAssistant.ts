import axios, { AxiosError } from 'axios';
import { Task } from '../store/slices/tasksSlice';
import { Habit } from '../store/slices/habitsSlice';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const token = import.meta.env.VITE_GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "deepseek/DeepSeek-V3-0324";
const API_VERSION = "2024-05-01-preview";

// Rate limiting configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds

if (!token) {
  throw new Error('GitHub token not found in environment variables');
}

const client = axios.create({
  baseURL: endpoint,
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Version': API_VERSION
  }
});

const filterThinkTags = (content: string): string => {
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const handleRateLimit = async (error: AxiosError, retryCount: number): Promise<number> => {
  if (error.response?.status === 429) {
    const resetTime = error.response.headers['x-ratelimit-reset'];
    const waitTime = resetTime 
      ? (new Date(Number(resetTime) * 1000).getTime() - Date.now())
      : INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    
    console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry ${retryCount + 1}/${MAX_RETRIES}`);
    return waitTime;
  }
  throw error;
};

export const getAIResponse = async (
  messages: Message[],
  context: {
    tasks: Task[];
    habits: Habit[];
    totalFocusMinutes: number;
  }
): Promise<string> => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const systemPrompt = `You are a helpful productivity assistant. You have access to the following information:
      - User's tasks: ${JSON.stringify(context.tasks)}
      - User's habits: ${JSON.stringify(context.habits)}
      - Total focus minutes: ${context.totalFocusMinutes}
      
      Use this information to provide personalized advice and suggestions.`;

      const allMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ];

      const response = await client.post('/chat/completions?api-version=' + API_VERSION, {
        messages: allMessages,
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 1000,
        model: model
      });

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from the API');
      }

      return filterThinkTags(content);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429 && retryCount < MAX_RETRIES - 1) {
          const waitTime = await handleRateLimit(error, retryCount);
          await sleep(waitTime);
          retryCount++;
          continue;
        }
        
        return `Error: ${error.response?.status === 429 
          ? 'Rate limit exceeded. Please try again in a few minutes.' 
          : error.response?.data?.message || error.message}. Please check your API key and try again.`;
      }
      return 'An unexpected error occurred. Please try again later.';
    }
  }

  return 'Maximum retry attempts reached. Please try again later.';
};

export const generateSuggestions = async (
  context: {
    tasks: Task[];
    habits: Habit[];
    totalFocusMinutes: number;
  }
): Promise<string[]> => {
  const prompt = `Based on the user's current tasks, habits, and focus time, generate 3-5 personalized suggestions to improve their productivity. 
  Tasks: ${JSON.stringify(context.tasks)}
  Habits: ${JSON.stringify(context.habits)}
  Total focus minutes: ${context.totalFocusMinutes}`;

  try {
    const response = await getAIResponse([{ role: 'user', content: prompt }], context);
    return response.split('\n').filter(suggestion => suggestion.trim());
  } catch (error) {
    console.error('Error generating suggestions:', error);
    if (error instanceof Error) {
      return [`Error: ${error.message}`];
    }
    return ['An unexpected error occurred while generating suggestions.'];
  }
}; 