import axios from 'axios';
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

if (!token) {
  throw new Error('GitHub token not found in environment variables');
}

const client = axios.create({
  baseURL: endpoint,
  headers: {
    'Authorization': `token ${token}`, // Changed from Bearer to token
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Api-Version': API_VERSION
  }
});

const filterThinkTags = (content: string): string => {
  return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

export const getAIResponse = async (
  messages: Message[],
  context: {
    tasks: Task[];
    habits: Habit[];
    totalFocusMinutes: number;
  }
): Promise<string> => {
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
      return `Error: ${error.response?.data?.message || error.message}. Please check your API key and try again.`;
    }
    return 'An unexpected error occurred. Please try again later.';
  }
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