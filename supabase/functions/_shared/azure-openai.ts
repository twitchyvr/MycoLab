// ============================================================================
// AZURE OPENAI CLIENT
// Shared client for Azure OpenAI API calls
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class AzureOpenAIClient {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor() {
    this.endpoint = Deno.env.get('AZURE_OPENAI_ENDPOINT') ?? '';
    this.apiKey = Deno.env.get('AZURE_OPENAI_API_KEY') ?? '';
    this.deploymentName = Deno.env.get('AZURE_OPENAI_DEPLOYMENT') ?? 'gpt-4o';
    this.apiVersion = Deno.env.get('AZURE_OPENAI_API_VERSION') ?? '2024-02-15-preview';

    if (!this.endpoint || !this.apiKey) {
      console.warn('Azure OpenAI credentials not configured');
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages: request.messages,
        max_tokens: request.max_tokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        stream: request.stream ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async getEmbedding(text: string): Promise<number[]> {
    const embeddingDeployment = Deno.env.get('AZURE_OPENAI_EMBEDDING_DEPLOYMENT') ?? 'text-embedding-3-small';
    const url = `${this.endpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI Embedding error: ${response.status} - ${error}`);
    }

    const result: EmbeddingResponse = await response.json();
    return result.data[0].embedding;
  }

  async analyzeImage(imageUrl: string, prompt: string): Promise<ChatCompletionResponse> {
    return this.chat({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
    });
  }

  isConfigured(): boolean {
    return !!(this.endpoint && this.apiKey);
  }
}

// Pricing per 1K tokens (approximate, update as needed)
export const PRICING = {
  'gpt-4o': {
    prompt: 0.005,      // $5 per 1M tokens
    completion: 0.015,  // $15 per 1M tokens
  },
  'gpt-4o-mini': {
    prompt: 0.00015,    // $0.15 per 1M tokens
    completion: 0.0006, // $0.60 per 1M tokens
  },
  'text-embedding-3-small': {
    prompt: 0.00002,    // $0.02 per 1M tokens
    completion: 0,
  },
};

export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4o'
): number {
  const pricing = PRICING[model as keyof typeof PRICING] ?? PRICING['gpt-4o'];
  return (promptTokens / 1000 * pricing.prompt) + (completionTokens / 1000 * pricing.completion);
}
