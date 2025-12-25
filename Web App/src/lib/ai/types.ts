// ============================================================================
// AI SERVICE TYPES
// TypeScript definitions for Azure OpenAI integration
// ============================================================================

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // For assistant messages with images
  images?: ChatImage[];

  // Sources used for grounded response
  sources?: ChatSource[];

  // Actions the AI can suggest
  suggestedActions?: SuggestedAction[];

  // Metadata
  processingTimeMs?: number;
  tokensUsed?: number;
  estimatedCost?: number;
  modelUsed?: string;
}

export interface ChatImage {
  url: string;
  analysisType?: ImageAnalysisType;
  analysisResult?: ImageAnalysisResult;
}

export interface ChatSource {
  type: 'culture' | 'grow' | 'knowledge' | 'iot' | 'recipe' | 'strain';
  id: string;
  title: string;
  relevanceScore?: number;
}

export interface SuggestedAction {
  type: 'add_observation' | 'update_stage' | 'view_entity' | 'upload_image' |
        'adjust_environment' | 'create_alert' | 'navigate';
  label: string;
  payload: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];

  // Context for the session
  contextEntityType?: 'culture' | 'grow' | 'inventory' | 'location' | 'recipe' | 'strain' | 'general';
  contextEntityId?: string;

  createdAt: Date;
  updatedAt: Date;

  // Usage tracking
  totalTokens: number;
  totalCost: number;
  messageCount: number;

  // Retention
  retainUntil?: Date;
  isActive: boolean;
}

export type ConversationMode =
  | 'general'      // Full access to user data + knowledge
  | 'culture'      // Single culture focus
  | 'grow'         // Single grow focus
  | 'location'     // Location + all entities there
  | 'image'        // Image analysis mode
  | 'iot'          // IoT data analysis
  | 'troubleshoot'; // Problem solving mode

// =============================================================================
// IMAGE ANALYSIS TYPES
// =============================================================================

export type ImageAnalysisType =
  | 'contamination'
  | 'identification'
  | 'health'
  | 'stage'
  | 'microscopy'
  | 'label';

export interface ImageAnalysisRequest {
  imageUrl: string;
  analysisType: ImageAnalysisType;
  context?: {
    entityType: 'culture' | 'grow' | 'grain_spawn';
    entityId: string;
    currentStage?: string;
    speciesId?: string;
    strainId?: string;
  };
}

export interface ImageAnalysisResult {
  analysisType: ImageAnalysisType;
  confidence: number; // 0-1

  // Contamination specific
  contamination?: {
    detected: boolean;
    type?: 'trichoderma' | 'cobweb' | 'bacterial' | 'lipstick' | 'black_mold' | 'penicillium' | 'unknown';
    severity?: 'minor' | 'moderate' | 'severe';
    location?: string;
    recommendations?: string[];
  };

  // Identification specific
  identification?: {
    species?: string;
    strain?: string;
    alternativeMatches?: Array<{ species: string; confidence: number }>;
  };

  // Health assessment
  healthAssessment?: {
    score: number; // 1-10
    indicators: string[];
    concerns?: string[];
    recommendations?: string[];
  };

  // Stage assessment
  stageAssessment?: {
    currentStage: string;
    colonizationPercent?: number;
    pinCount?: number;
    readyForNextStage?: boolean;
    estimatedDaysToNextStage?: number;
  };

  // Raw response for display
  rawAnalysis: string;
  processingTimeMs: number;
}

// =============================================================================
// IOT ANALYSIS TYPES
// =============================================================================

export interface IoTReading {
  id: string;
  deviceId: string;
  locationId?: string;
  readingAt: Date;

  temperature?: number;    // Fahrenheit
  humidity?: number;       // Percentage
  co2Ppm?: number;        // Parts per million
  lightLevel?: number;    // Lux
  airPressure?: number;   // hPa
  weightGrams?: number;
  vpd?: number;

  batteryLevel?: number;
  signalStrength?: number;
}

export interface IoTDevice {
  id: string;
  userId: string;
  deviceId: string;
  name: string;
  deviceType: 'environmental' | 'scale' | 'camera' | 'multi_sensor' | 'other';

  model?: string;
  firmwareVersion?: string;
  locationId?: string;

  capabilities?: {
    temperature?: boolean;
    humidity?: boolean;
    co2?: boolean;
    light?: boolean;
    weight?: boolean;
    pressure?: boolean;
  };

  lastSeenAt?: Date;
  connectionStatus: 'online' | 'offline' | 'unknown';
  readingIntervalSeconds: number;
  alertEnabled: boolean;
  isActive: boolean;
}

export interface IoTAnalysisRequest {
  locationId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  analysisType: 'optimization' | 'anomaly' | 'correlation' | 'prediction';
  context?: {
    activeGrows?: string[];
    speciesIds?: string[];
    targetStage?: string;
  };
}

export interface IoTAnalysisResult {
  summary: string;

  environmentalScore?: {
    overall: number;
    temperature: number;
    humidity: number;
    co2: number;
    light: number;
  };

  deviations?: Array<{
    parameter: string;
    actual: number;
    optimal: { min: number; max: number };
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;

  anomalies?: Array<{
    timestamp: Date;
    parameter: string;
    value: number;
    expectedRange: { min: number; max: number };
    possibleCause?: string;
  }>;

  predictions?: {
    yieldEstimate?: number;
    stageTransition?: {
      stage: string;
      estimatedDate: Date;
      confidence: number;
    };
    contaminationRisk?: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
    };
  };

  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    reason: string;
    impact: string;
  }>;

  processingTimeMs: number;
}

// =============================================================================
// KNOWLEDGE LIBRARY TYPES
// =============================================================================

export type KnowledgeCategory =
  | 'species'
  | 'technique'
  | 'contamination'
  | 'equipment'
  | 'safety'
  | 'research'
  | 'community'
  | 'troubleshooting';

export interface KnowledgeDocument {
  id: string;
  category: KnowledgeCategory;
  subcategory?: string;

  title: string;
  slug?: string;
  summary?: string;
  content: string;

  tags?: string[];
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  speciesIds?: string[];
  strainIds?: string[];

  version: number;
  previousVersionId?: string;

  authorType: 'system' | 'admin' | 'ai_generated' | 'community';
  authorId?: string;
  authorName?: string;

  reviewStatus: 'draft' | 'pending_review' | 'approved' | 'deprecated';
  reviewedBy?: string;
  reviewedAt?: Date;
  confidenceScore?: number;

  citations?: Array<{ title: string; url: string; accessedAt?: Date }>;
  images?: Array<{ id: string; url: string; caption: string; type: string }>;
  videos?: Array<{ id: string; url: string; title: string; duration?: number }>;

  keywords?: string[];
  embeddingUpdatedAt?: Date;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeSuggestion {
  id: string;
  userId: string;

  suggestionType: 'new_document' | 'edit' | 'correction' | 'addition';
  targetDocumentId?: string;

  suggestedCategory?: KnowledgeCategory;
  suggestedTitle: string;
  suggestedContent: string;

  sectionAffected?: string;
  originalText?: string;
  suggestedText?: string;

  reason?: string;
  sources?: string;

  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'merged';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  resultDocumentId?: string;

  upvotes: number;
  downvotes: number;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// USER AI SETTINGS TYPES
// =============================================================================

export type DataSharingLevel = 0 | 1 | 2 | 3;
// 0 = None (default)
// 1 = Anonymous Aggregate
// 2 = Strain Performance
// 3 = Full Share

export interface AIUserSettings {
  id: string;
  userId: string;

  // Feature toggles
  aiEnabled: boolean;
  imageAnalysisEnabled: boolean;
  iotAnalysisEnabled: boolean;

  // Privacy
  dataSharingLevel: DataSharingLevel;
  shareYieldData: boolean;
  shareEnvironmentalData: boolean;
  shareSuccessPatterns: boolean;

  // Conversation
  retainConversations: boolean;
  conversationRetentionDays: number;

  // Limits
  dailyTokenLimit?: number;
  monthlyCostLimit?: number;

  // Preferences
  preferredResponseLength: 'concise' | 'balanced' | 'detailed';
  includeCitations: boolean;
  proactiveSuggestions: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// USAGE & BILLING TYPES
// =============================================================================

export interface AIUsageRecord {
  id: string;
  userId: string;
  requestType: 'chat' | 'image_analysis' | 'iot_analysis' | 'embedding' | 'knowledge_search';
  model: string;

  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  estimatedCost: number;

  cached: boolean;
  cacheHit: boolean;

  sessionId?: string;
  createdAt: Date;
}

export interface UsageSummary {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;

  totalTokens: number;
  totalCost: number;
  requestCount: number;

  byType: Record<string, { tokens: number; cost: number; count: number }>;

  // Tier limits
  tierLimit: number;
  tierUsed: number;
  tierRemaining: number;
  overage: number;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface AIGatewayRequest {
  action: 'chat' | 'analyze_image' | 'analyze_iot' | 'search_knowledge' | 'get_embedding';

  // For chat
  messages?: Array<{ role: string; content: string }>;
  sessionId?: string;
  contextEntityType?: string;
  contextEntityId?: string;

  // For image analysis
  imageUrl?: string;
  analysisType?: ImageAnalysisType;

  // For IoT analysis
  locationId?: string;
  timeRange?: { start: string; end: string };

  // For knowledge search
  query?: string;
  category?: KnowledgeCategory;
  limit?: number;

  // Options
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGatewayResponse {
  success: boolean;
  error?: string;

  // Chat response
  message?: ChatMessage;

  // Image analysis
  imageAnalysis?: ImageAnalysisResult;

  // IoT analysis
  iotAnalysis?: IoTAnalysisResult;

  // Knowledge search
  documents?: KnowledgeDocument[];

  // Embedding
  embedding?: number[];

  // Usage
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'rate_limit' | 'quota_exceeded' | 'invalid_request' | 'server_error' | 'network_error' | 'unauthorized',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// =============================================================================
// AZURE SERVICE CONFIG
// =============================================================================

export interface AzureOpenAIConfig {
  endpoint: string;
  deploymentName: string;
  apiVersion: string;
  // API key is stored server-side in Supabase secrets, never on client
}

export interface AzureSearchConfig {
  endpoint: string;
  indexName: string;
  // API key is stored server-side
}
