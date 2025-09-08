// OpenAI API integration service for the GPT Chatbot
import { ChatCompletionResponse, StreamingResponse, Message, PetContext } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ChatAPI {
  private static instance: ChatAPI;
  private apiKey: string | null = null;

  private constructor() {}

  public static getInstance(): ChatAPI {
    if (!ChatAPI.instance) {
      ChatAPI.instance = new ChatAPI();
    }
    return ChatAPI.instance;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  private getSystemPrompt(petContext?: PetContext): string {
    const basePrompt = `You are a knowledgeable raw pet food expert assistant. Provide helpful advice about raw feeding for dogs and cats. Always include a disclaimer that your advice doesn't replace veterinary consultation. Focus on: nutrition balance, portion sizes, food safety, transition tips, and common concerns.

Keep responses concise (under 500 tokens), friendly, and actionable. Use bullet points for lists and always prioritize pet safety.`;

    if (petContext) {
      const contextInfo = [
        petContext.petName && `Pet name: ${petContext.petName}`,
        petContext.breed && `Breed: ${petContext.breed}`,
        petContext.age && `Age: ${petContext.age} years`,
        petContext.weight && `Weight: ${petContext.weight} lbs`,
        petContext.currentDiet && `Current diet: ${petContext.currentDiet}`,
        petContext.healthConditions?.length && `Health conditions: ${petContext.healthConditions.join(', ')}`,
        petContext.dietaryRestrictions?.length && `Dietary restrictions: ${petContext.dietaryRestrictions.join(', ')}`
      ].filter(Boolean).join('\n');

      return `${basePrompt}\n\nPet Context:\n${contextInfo}`;
    }

    return basePrompt;
  }

  public async sendMessage(
    messages: Message[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      petContext?: PetContext;
      stream?: boolean;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 500,
      petContext,
      stream = false
    } = options;

    try {
      const systemMessage = {
        role: 'system',
        content: this.getSystemPrompt(petContext)
      };

      const apiMessages = [
        systemMessage,
        ...messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature,
          maxTokens: maxTokens,
          stream,
          petContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Chat API Error:', error);
      
      // Return mock response when backend is unavailable (for testing/demo)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const userMessage = messages[messages.length - 1]?.content || '';
        return this.getMockResponse(userMessage, petContext);
      }
      
      throw error;
    }
  }

  public async sendStreamingMessage(
    messages: Message[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      petContext?: PetContext;
      onChunk?: (chunk: string) => void;
    } = {}
  ): Promise<string> {
    const {
      model = 'gpt-4',
      temperature = 0.7,
      maxTokens = 500,
      petContext,
      onChunk
    } = options;

    try {
      const systemMessage = {
        role: 'system',
        content: this.getSystemPrompt(petContext)
      };

      const apiMessages = [
        systemMessage,
        ...messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch(`${API_BASE_URL}/chat/completions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature,
          maxTokens: maxTokens,
          stream: true,
          petContext
        })
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed: StreamingResponse = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                
                if (content) {
                  fullResponse += content;
                  onChunk?.(content);
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return fullResponse;
    } catch (error) {
      console.error('Streaming Chat API Error:', error);
      throw error;
    }
  }

  public async checkUsage(): Promise<{
    used: number;
    limit: number;
    resetTime: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/usage`, {
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      return await response.json();
    } catch (error) {
      console.error('Usage API Error:', error);
      // Return default limits on error
      return {
        used: 0,
        limit: 5,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }

  public async validateApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private getMockResponse(userMessage: string, petContext?: PetContext): ChatCompletionResponse {
    const responses = [
      "I'm RAWGLE AI, your raw feeding expert! 🐕 While I'm running in demo mode, I can still help with raw feeding basics.",
      "Great question about raw feeding! For safety, always transition gradually over 7-10 days when switching to raw food.",
      "For portion sizes, a good starting point is 2-3% of your pet's body weight daily, but this varies based on age, activity level, and health.",
      "Raw feeding should include 80% muscle meat, 10% organs, and 10% bones for optimal nutrition balance.",
      "Food safety is crucial - use fresh ingredients, maintain cold chain, and clean all surfaces thoroughly."
    ];

    const contextualResponse = userMessage.toLowerCase().includes('portion') || userMessage.toLowerCase().includes('calculate')
      ? "For accurate portion calculations, I recommend using our feeding calculator. Generally, active dogs need 2-3% of body weight daily in raw food."
      : userMessage.toLowerCase().includes('safety') || userMessage.toLowerCase().includes('safe')
      ? "Raw feeding safety essentials: ✅ Fresh ingredients ✅ Proper storage ✅ Clean preparation ✅ Gradual transition"
      : responses[Math.floor(Math.random() * responses.length)];

    return {
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'rawgle-demo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: contextualResponse + "\n\n*Note: This is a demo response. Connect your chat API for full functionality!*"
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 30,
        total_tokens: 80
      }
    };
  }
}

// Utility functions for message processing
export const formatMessageForAPI = (message: Message) => ({
  role: message.role,
  content: message.content
});

export const createMessageFromResponse = (
  response: ChatCompletionResponse,
  conversationId: string
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  content: response.choices[0]?.message?.content || '',
  role: 'assistant' as const,
  timestamp: new Date(),
  status: 'sent',
  metadata: {
    tokens: response.usage?.total_tokens,
    model: response.model,
    conversationId
  }
});

export const createUserMessage = (
  content: string,
  conversationId: string
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  content,
  role: 'user' as const,
  timestamp: new Date(),
  status: 'sent',
  metadata: {
    conversationId
  }
});

// Error handling utilities
export class ChatAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ChatAPIError';
  }
}

export const handleAPIError = (error: any): ChatAPIError => {
  if (error instanceof ChatAPIError) {
    return error;
  }

  if (error.message?.includes('rate limit')) {
    return new ChatAPIError(
      'You have reached your daily message limit. Upgrade to Premium for unlimited messages.',
      'RATE_LIMIT_EXCEEDED',
      false
    );
  }

  if (error.message?.includes('unauthorized')) {
    return new ChatAPIError(
      'Authentication failed. Please check your API configuration.',
      'UNAUTHORIZED',
      false
    );
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return new ChatAPIError(
      'Network error. Please check your connection and try again.',
      'NETWORK_ERROR',
      true
    );
  }

  return new ChatAPIError(
    'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR',
    true
  );
};

export default ChatAPI.getInstance();