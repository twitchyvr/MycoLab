// ============================================================================
// useAI HOOK
// React hook for AI operations in Sporely
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { aiService } from '../services/AIService';
import type {
  ChatMessage,
  ChatSession,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  IoTAnalysisRequest,
  IoTAnalysisResult,
  KnowledgeDocument,
  UsageSummary,
} from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface UseAIOptions {
  sessionId?: string;
  contextEntityType?: 'culture' | 'grow' | 'inventory' | 'location' | 'recipe' | 'strain' | 'general';
  contextEntityId?: string;
  onError?: (error: Error) => void;
  onMessage?: (message: ChatMessage) => void;
}

interface UseAIReturn {
  // Chat operations
  sendMessage: (message: string, images?: string[]) => Promise<ChatMessage | null>;
  messages: ChatMessage[];
  session: ChatSession | null;
  loadSession: (sessionId: string) => Promise<void>;
  clearMessages: () => void;

  // Image analysis
  analyzeImage: (request: ImageAnalysisRequest) => Promise<ImageAnalysisResult | null>;
  imageAnalysis: ImageAnalysisResult | null;

  // IoT analysis
  analyzeIoTData: (request: IoTAnalysisRequest) => Promise<IoTAnalysisResult | null>;
  iotAnalysis: IoTAnalysisResult | null;

  // Knowledge search
  searchKnowledge: (query: string, category?: string) => Promise<KnowledgeDocument[]>;
  knowledgeResults: KnowledgeDocument[];

  // Usage
  getUsage: (period?: 'day' | 'week' | 'month') => Promise<UsageSummary | null>;
  usage: UsageSummary | null;

  // Status
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [iotAnalysis, setIotAnalysis] = useState<IoTAnalysisResult | null>(null);
  const [knowledgeResults, setKnowledgeResults] = useState<KnowledgeDocument[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ===========================================================================
  // CHAT OPERATIONS
  // ===========================================================================

  const sendMessage = useCallback(async (
    message: string,
    images?: string[]
  ): Promise<ChatMessage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        images: images?.map(url => ({ url })),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to AI service
      const result = await aiService.sendMessage(message, {
        sessionId: options.sessionId || session?.id,
        contextEntityType: options.contextEntityType,
        contextEntityId: options.contextEntityId,
        images,
      });

      // Add assistant message to local state
      setMessages(prev => [...prev, result.message]);
      setSession(result.session);

      // Callback
      options.onMessage?.(result.message);

      return result.message;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options, session?.id]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedSession = await aiService.getSession(sessionId);
      if (loadedSession) {
        setSession(loadedSession);
        setMessages(loadedSession.messages);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load session');
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSession(null);
    setError(null);
  }, []);

  // ===========================================================================
  // IMAGE ANALYSIS
  // ===========================================================================

  const analyzeImage = useCallback(async (
    request: ImageAnalysisRequest
  ): Promise<ImageAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setImageAnalysis(null);

    try {
      const result = await aiService.analyzeImage(request);
      setImageAnalysis(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to analyze image');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // ===========================================================================
  // IOT ANALYSIS
  // ===========================================================================

  const analyzeIoTData = useCallback(async (
    request: IoTAnalysisRequest
  ): Promise<IoTAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);
    setIotAnalysis(null);

    try {
      const result = await aiService.analyzeIoTData(request);
      setIotAnalysis(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to analyze IoT data');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // ===========================================================================
  // KNOWLEDGE SEARCH
  // ===========================================================================

  const searchKnowledge = useCallback(async (
    query: string,
    category?: string
  ): Promise<KnowledgeDocument[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await aiService.searchKnowledge(query, { category });
      setKnowledgeResults(results);
      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to search knowledge');
      setError(error);
      options.onError?.(error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // ===========================================================================
  // USAGE
  // ===========================================================================

  const getUsage = useCallback(async (
    period: 'day' | 'week' | 'month' = 'month'
  ): Promise<UsageSummary | null> => {
    setIsLoading(true);

    try {
      const result = await aiService.getUsageSummary(period);
      setUsage(result);
      return result;
    } catch (err) {
      console.error('Failed to get usage:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===========================================================================
  // RETURN
  // ===========================================================================

  return useMemo(() => ({
    // Chat
    sendMessage,
    messages,
    session,
    loadSession,
    clearMessages,

    // Image
    analyzeImage,
    imageAnalysis,

    // IoT
    analyzeIoTData,
    iotAnalysis,

    // Knowledge
    searchKnowledge,
    knowledgeResults,

    // Usage
    getUsage,
    usage,

    // Status
    isLoading,
    isStreaming,
    error,
  }), [
    sendMessage,
    messages,
    session,
    loadSession,
    clearMessages,
    analyzeImage,
    imageAnalysis,
    analyzeIoTData,
    iotAnalysis,
    searchKnowledge,
    knowledgeResults,
    getUsage,
    usage,
    isLoading,
    isStreaming,
    error,
  ]);
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for culture-specific AI analysis
 */
export function useCultureAI(cultureId: string) {
  return useAI({
    contextEntityType: 'culture',
    contextEntityId: cultureId,
  });
}

/**
 * Hook for grow-specific AI analysis
 */
export function useGrowAI(growId: string) {
  return useAI({
    contextEntityType: 'grow',
    contextEntityId: growId,
  });
}

/**
 * Hook for location-specific AI analysis (includes IoT)
 */
export function useLocationAI(locationId: string) {
  return useAI({
    contextEntityType: 'location',
    contextEntityId: locationId,
  });
}
