// ============================================================================
// AI SERVICE
// Main service for interacting with Azure OpenAI via Supabase Edge Functions
// ============================================================================

import { supabase } from '../../supabase';
import type {
  ChatMessage,
  ChatSession,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  IoTAnalysisRequest,
  IoTAnalysisResult,
  KnowledgeDocument,
  AIGatewayRequest,
  AIGatewayResponse,
  AIServiceError,
  AIUsageRecord,
  UsageSummary,
} from '../types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// =============================================================================
// AI SERVICE CLASS
// =============================================================================

export class AIService {
  private static instance: AIService;

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Ensure supabase is configured before database operations
   */
  private ensureSupabase() {
    if (!supabase) {
      throw new Error('Database connection not available');
    }
    return supabase;
  }

  // ===========================================================================
  // CHAT OPERATIONS
  // ===========================================================================

  /**
   * Send a chat message and get a response
   */
  async sendMessage(
    message: string,
    options: {
      sessionId?: string;
      contextEntityType?: string;
      contextEntityId?: string;
      images?: string[];
    } = {}
  ): Promise<{ message: ChatMessage; session: ChatSession }> {
    const request: AIGatewayRequest = {
      action: 'chat',
      messages: [{ role: 'user', content: message }],
      sessionId: options.sessionId,
      contextEntityType: options.contextEntityType,
      contextEntityId: options.contextEntityId,
    };

    // If images provided, add them to the request
    if (options.images && options.images.length > 0) {
      request.imageUrl = options.images[0]; // For now, support single image
    }

    const response = await this.callGateway(request);

    if (!response.success || !response.message) {
      throw new Error(response.error || 'Failed to get AI response');
    }

    // Get or create session
    const session = await this.getOrCreateSession(
      options.sessionId || generateId(),
      options.contextEntityType,
      options.contextEntityId
    );

    return {
      message: response.message,
      session,
    };
  }

  /**
   * Stream a chat response (for real-time display)
   */
  async *streamMessage(
    message: string,
    options: {
      sessionId?: string;
      contextEntityType?: string;
      contextEntityId?: string;
    } = {}
  ): AsyncGenerator<string> {
    const request: AIGatewayRequest = {
      action: 'chat',
      messages: [{ role: 'user', content: message }],
      sessionId: options.sessionId,
      contextEntityType: options.contextEntityType,
      contextEntityId: options.contextEntityId,
      stream: true,
    };

    // For streaming, we'd use Server-Sent Events or WebSocket
    // For now, fall back to regular request
    const response = await this.callGateway(request);

    if (response.success && response.message) {
      // Simulate streaming by yielding chunks
      const content = response.message.content;
      const words = content.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
  }

  /**
   * Get chat session with messages
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await this.ensureSupabase()
      .from('ai_chat_sessions')
      .select(`
        *,
        messages:ai_chat_messages(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformSession(data);
  }

  /**
   * Get all chat sessions for current user
   */
  async getSessions(limit = 20): Promise<ChatSession[]> {
    const { data, error } = await this.ensureSupabase()
      .from('ai_chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return (data || []).map(s => this.transformSession(s));
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await this.ensureSupabase()
      .from('ai_chat_sessions')
      .delete()
      .eq('id', sessionId);

    return !error;
  }

  // ===========================================================================
  // IMAGE ANALYSIS
  // ===========================================================================

  /**
   * Analyze an image for contamination, health, etc.
   */
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    const gatewayRequest: AIGatewayRequest = {
      action: 'analyze_image',
      imageUrl: request.imageUrl,
      analysisType: request.analysisType,
      contextEntityType: request.context?.entityType,
      contextEntityId: request.context?.entityId,
    };

    const response = await this.callGateway(gatewayRequest);

    if (!response.success || !response.imageAnalysis) {
      throw new Error(response.error || 'Failed to analyze image');
    }

    return response.imageAnalysis;
  }

  // ===========================================================================
  // IOT ANALYSIS
  // ===========================================================================

  /**
   * Analyze IoT sensor data for a location
   */
  async analyzeIoTData(request: IoTAnalysisRequest): Promise<IoTAnalysisResult> {
    const gatewayRequest: AIGatewayRequest = {
      action: 'analyze_iot',
      locationId: request.locationId,
      timeRange: {
        start: request.timeRange.start.toISOString(),
        end: request.timeRange.end.toISOString(),
      },
    };

    const response = await this.callGateway(gatewayRequest);

    if (!response.success || !response.iotAnalysis) {
      throw new Error(response.error || 'Failed to analyze IoT data');
    }

    return response.iotAnalysis;
  }

  // ===========================================================================
  // KNOWLEDGE LIBRARY
  // ===========================================================================

  /**
   * Search the knowledge library
   */
  async searchKnowledge(
    query: string,
    options: {
      category?: string;
      limit?: number;
    } = {}
  ): Promise<KnowledgeDocument[]> {
    const gatewayRequest: AIGatewayRequest = {
      action: 'search_knowledge',
      query,
      category: options.category as any,
      limit: options.limit || 10,
    };

    const response = await this.callGateway(gatewayRequest);

    if (!response.success) {
      throw new Error(response.error || 'Failed to search knowledge');
    }

    return response.documents || [];
  }

  /**
   * Get a knowledge document by ID
   */
  async getKnowledgeDocument(id: string): Promise<KnowledgeDocument | null> {
    const { data, error } = await this.ensureSupabase()
      .from('knowledge_documents')
      .select('*')
      .eq('id', id)
      .eq('review_status', 'approved')
      .single();

    if (error || !data) {
      return null;
    }

    return this.transformKnowledgeDocument(data);
  }

  /**
   * Browse knowledge documents by category
   */
  async browseKnowledge(
    category?: string,
    options: {
      page?: number;
      pageSize?: number;
      sortBy?: 'title' | 'created_at' | 'updated_at';
    } = {}
  ): Promise<{ documents: KnowledgeDocument[]; total: number }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.ensureSupabase()
      .from('knowledge_documents')
      .select('*', { count: 'exact' })
      .eq('review_status', 'approved')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    query = query.order(options.sortBy || 'title', { ascending: true });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error browsing knowledge:', error);
      return { documents: [], total: 0 };
    }

    return {
      documents: (data || []).map(d => this.transformKnowledgeDocument(d)),
      total: count || 0,
    };
  }

  // ===========================================================================
  // USAGE TRACKING
  // ===========================================================================

  /**
   * Get usage summary for current user
   */
  async getUsageSummary(period: 'day' | 'week' | 'month' = 'month'): Promise<UsageSummary> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const { data, error } = await this.ensureSupabase()
      .from('ai_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching usage:', error);
    }

    const records = data || [];

    // Aggregate by type
    const byType: Record<string, { tokens: number; cost: number; count: number }> = {};
    let totalTokens = 0;
    let totalCost = 0;

    for (const record of records) {
      totalTokens += record.total_tokens || 0;
      totalCost += parseFloat(record.estimated_cost) || 0;

      const type = record.request_type;
      if (!byType[type]) {
        byType[type] = { tokens: 0, cost: 0, count: 0 };
      }
      byType[type].tokens += record.total_tokens || 0;
      byType[type].cost += parseFloat(record.estimated_cost) || 0;
      byType[type].count += 1;
    }

    // TODO: Get actual tier limits from user settings/subscription
    const tierLimit = 500; // Default for basic tier

    return {
      period,
      startDate,
      endDate: now,
      totalTokens,
      totalCost,
      requestCount: records.length,
      byType,
      tierLimit,
      tierUsed: records.length,
      tierRemaining: Math.max(0, tierLimit - records.length),
      overage: Math.max(0, records.length - tierLimit),
    };
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Call the AI gateway edge function
   */
  private async callGateway(request: AIGatewayRequest): Promise<AIGatewayResponse> {
    try {
      const { data, error } = await this.ensureSupabase().functions.invoke('ai-gateway', {
        body: request,
      });

      if (error) {
        console.error('AI Gateway error:', error);
        return {
          success: false,
          error: error.message || 'AI service unavailable',
        };
      }

      return data as AIGatewayResponse;
    } catch (err) {
      console.error('AI Gateway network error:', err);
      return {
        success: false,
        error: 'Network error connecting to AI service',
      };
    }
  }

  /**
   * Get or create a chat session
   */
  private async getOrCreateSession(
    sessionId: string,
    contextEntityType?: string,
    contextEntityId?: string
  ): Promise<ChatSession> {
    // Try to get existing session
    const { data: existing } = await this.ensureSupabase()
      .from('ai_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (existing) {
      return this.transformSession(existing);
    }

    // Create new session
    const { data: created, error } = await this.ensureSupabase()
      .from('ai_chat_sessions')
      .insert({
        id: sessionId,
        context_entity_type: contextEntityType || 'general',
        context_entity_id: contextEntityId,
        title: 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create chat session');
    }

    return this.transformSession(created);
  }

  /**
   * Transform database session to ChatSession type
   */
  private transformSession(data: any): ChatSession {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      messages: (data.messages || []).map((m: any) => this.transformMessage(m)),
      contextEntityType: data.context_entity_type,
      contextEntityId: data.context_entity_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      totalTokens: data.total_tokens || 0,
      totalCost: parseFloat(data.total_cost) || 0,
      messageCount: data.message_count || 0,
      retainUntil: data.retain_until ? new Date(data.retain_until) : undefined,
      isActive: data.is_active,
    };
  }

  /**
   * Transform database message to ChatMessage type
   */
  private transformMessage(data: any): ChatMessage {
    return {
      id: data.id,
      role: data.role,
      content: data.content,
      timestamp: new Date(data.created_at),
      images: data.images,
      sources: data.sources,
      suggestedActions: data.suggested_actions,
      processingTimeMs: data.processing_time_ms,
      tokensUsed: data.total_tokens,
      estimatedCost: parseFloat(data.estimated_cost) || undefined,
      modelUsed: data.model_used,
    };
  }

  /**
   * Transform database knowledge document
   */
  private transformKnowledgeDocument(data: any): KnowledgeDocument {
    return {
      id: data.id,
      category: data.category,
      subcategory: data.subcategory,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      tags: data.tags,
      difficultyLevel: data.difficulty_level,
      speciesIds: data.species_ids,
      strainIds: data.strain_ids,
      version: data.version,
      previousVersionId: data.previous_version_id,
      authorType: data.author_type,
      authorId: data.author_id,
      authorName: data.author_name,
      reviewStatus: data.review_status,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      confidenceScore: parseFloat(data.confidence_score) || undefined,
      citations: data.citations,
      images: data.images,
      videos: data.videos,
      keywords: data.keywords,
      embeddingUpdatedAt: data.embedding_updated_at ? new Date(data.embedding_updated_at) : undefined,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();
