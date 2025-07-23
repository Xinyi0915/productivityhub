import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getAIResponse, generateSuggestions } from '../services/aiAssistant';
import { sendNotification } from '../utils/notifications';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiZap, FiMessageCircle, FiCpu, FiTrash2 } from 'react-icons/fi';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistantPage = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const habits = useSelector((state: RootState) => state.habits.habits);
  const { totalFocusMinutes } = useSelector((state: RootState) => state.timer);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `👋 Hello ${user?.username || 'there'}! I'm your AI productivity assistant. I can help you with:

### 🎯 Task Management
 -Prioritizing your tasks
 -Creating effective schedules
 -Breaking down big projects

### 📈 Habit Building
 -Starting new habits
 -Tracking progress
 -Overcoming obstacles

### ⏱️ Focus & Time Management
 -Pomodoro techniques
 -Deep work strategies
 -Time blocking

How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getAIResponse(
        messages
          .slice(-4)
          .map(msg => ({
            role: msg.type,
            content: msg.content,
          }))
          .concat([{ role: 'user', content: input }]),
        {
          tasks,
          habits,
          totalFocusMinutes,
        }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      sendNotification(
        (dispatch) => dispatch,
        'AI Assistant Error',
        'Sorry, I encountered an error while processing your request.',
        'error'
      );
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleGenerateSuggestions = async () => {
    setIsTyping(true);
    try {
      const suggestions = await generateSuggestions({
        tasks,
        habits,
        totalFocusMinutes,
      });

      const suggestionMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Here are some personalized suggestions based on your current tasks, habits, and focus time:\n\n${suggestions.join('\n')}`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, suggestionMessage]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      sendNotification(
        (dispatch) => dispatch,
        'AI Assistant Error',
        'Sorry, I encountered an error while generating suggestions.',
        'error'
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gray-50">
      <div className="w-full max-w-3xl md:max-w-4xl lg:max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-600 rounded-lg">
              <FiCpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600">Your personal productivity coach</p>
            </div>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
            disabled={isTyping}
          >
            <FiZap className="w-5 h-5" />
            <span>Generate Suggestions</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Messages */}
          <div className="h-[calc(70vh)] min-h-[400px] max-h-[800px] overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`group relative flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <FiMessageCircle className="w-4 h-4 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-2xl p-4 ${
                    message.type === 'user'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                    message.type === 'user' ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === 'user'
                        ? 'text-primary-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center ml-3">
                    <span className="text-xs font-medium text-white">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                >
                  <FiTrash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <FiMessageCircle className="w-4 h-4 text-primary-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about productivity..."
                className="w-full px-4 py-3 pr-16 sm:pr-24 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                disabled={isTyping}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center space-x-1 px-2 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
                disabled={isTyping || !input.trim()}
              >
                <FiSend className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage; 