# Sporely Azure OpenAI Integration Architecture

## Executive Summary

This document outlines the architecture for integrating Azure OpenAI into Sporely to provide:
- **Grounded AI responses** using Sporely-specific data (user's grows, cultures, inventory)
- **Knowledge library integration** for mycology-specific guidance
- **Image analysis** for contamination detection, species identification, and growth monitoring
- **IoT data analysis** for environmental optimization
- **Conversational interface** for natural language queries
- **Data sovereignty** - all data stays within your Azure tenant

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Sporely Frontend                                    │
│                           (React + TypeScript)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐│
│  │  AI Chat     │  │  Image       │  │  IoT Data    │  │  Smart               ││
│  │  Component   │  │  Analysis    │  │  Analyzer    │  │  Recommendations     ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘│
│         │                 │                 │                     │            │
│         └────────────────┬┴─────────────────┴─────────────────────┘            │
│                          │                                                      │
│                   ┌──────▼───────┐                                             │
│                   │  useAI()     │  React hook for all AI operations           │
│                   │  Hook        │                                              │
│                   └──────┬───────┘                                             │
│                          │                                                      │
└──────────────────────────┼──────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Supabase Edge Functions                                  │
│                        (Deno Runtime - Secure)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                      AI Gateway Function                                     ││
│  │  • Rate limiting (per user tier)                                            ││
│  │  • Request validation                                                        ││
│  │  • Token counting & cost tracking                                           ││
│  │  • Audit logging                                                             ││
│  └──────────────────────────────────┬──────────────────────────────────────────┘│
│                                     │                                            │
│  ┌──────────────────────────────────▼──────────────────────────────────────────┐│
│  │                     Context Builder (RAG)                                    ││
│  │  • Retrieves user's relevant data                                           ││
│  │  • Builds grounded context                                                  ││
│  │  • Sanitizes PII if needed                                                  ││
│  └──────────────────────────────────┬──────────────────────────────────────────┘│
│                                     │                                            │
└─────────────────────────────────────┼────────────────────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────────┐   ┌───────────────────────┐   ┌─────────────────────────────┐
│   Azure OpenAI    │   │  Azure AI Search      │   │  Azure Blob Storage         │
│   (GPT-4o)        │   │  (Vector Store)       │   │  (Images/Documents)         │
├───────────────────┤   ├───────────────────────┤   ├─────────────────────────────┤
│  • Chat           │   │  • Knowledge library  │   │  • Observation photos       │
│  • Vision         │   │  • User data index    │   │  • Harvest photos           │
│  • Embeddings     │   │  • Species database   │   │  • Reference images         │
│  • Assistants API │   │  • Growing guides     │   │  • Uploaded documents       │
└───────────────────┘   └───────────────────────┘   └─────────────────────────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────┐
                        │   Supabase PostgreSQL       │
                        │   (Primary Data Store)      │
                        ├─────────────────────────────┤
                        │  • User data (cultures,     │
                        │    grows, inventory)        │
                        │  • AI interaction logs      │
                        │  • Cached responses         │
                        │  • Usage metrics            │
                        └─────────────────────────────┘
```

---

## Data Grounding Strategy (RAG Architecture)

### Why Azure OpenAI + Azure AI Search?

1. **Data Sovereignty**: All data stays in your Azure tenant
2. **Hybrid Search**: Combine vector (semantic) + keyword search
3. **Multi-index Architecture**: Separate indexes for different data types
4. **Real-time Updates**: Near-instant indexing of user data changes
5. **Cost Control**: Only pay for what you index and search

### Index Architecture

```
Azure AI Search
├── knowledge-library-index
│   ├── Species reference data
│   ├── Growing guides & techniques
│   ├── Contamination identification
│   ├── Substrate recipes
│   └── Equipment guides
│
├── user-data-index (per-tenant/user)
│   ├── Culture records
│   ├── Grow history & yields
│   ├── Observations & notes
│   ├── Recipes (user-created)
│   └── Environmental data
│
└── community-insights-index (future)
    ├── Aggregated success patterns
    ├── Common contamination causes
    └── Strain performance data
```

### RAG Flow

```
User Query: "Why is my Lion's Mane pinning slow?"
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  1. CONTEXT RETRIEVAL                                          │
│                                                                 │
│  Query Azure AI Search for:                                     │
│  • User's Lion's Mane grows (history, conditions)              │
│  • Knowledge library entries for Lion's Mane pinning           │
│  • Environmental data from user's fruiting room                │
│  • Similar user observations                                    │
│                                                                 │
│  Returns: Ranked, relevant context documents                    │
└───────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  2. PROMPT CONSTRUCTION                                        │
│                                                                 │
│  System Prompt:                                                 │
│  "You are Sporely AI, a mycology cultivation assistant..."     │
│                                                                 │
│  Grounded Context:                                              │
│  - User's current grow: started 14 days ago, 72°F, 85% RH      │
│  - Species optimal: 75-80°F, 90-95% RH for pinning             │
│  - User's previous grows: avg pinning at day 10-12             │
│  - Knowledge: Lion's Mane requires high humidity (>90%)        │
│                                                                 │
│  User Query: "Why is my Lion's Mane pinning slow?"             │
└───────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────────────────┐
│  3. GROUNDED RESPONSE                                          │
│                                                                 │
│  Azure OpenAI generates response using ONLY provided context:  │
│                                                                 │
│  "Based on your grow data, I see a few potential factors:      │
│                                                                 │
│  1. **Humidity**: Your current 85% RH is below the 90-95%      │
│     optimal range for Lion's Mane pinning.                     │
│                                                                 │
│  2. **Temperature**: 72°F is at the lower end. Consider        │
│     raising to 75-78°F to encourage pinning.                   │
│                                                                 │
│  3. **Comparison**: Your previous grows pinned at day 10-12,   │
│     so at day 14 you're running about 4 days behind.           │
│                                                                 │
│  **Recommendation**: Increase humidity to 92-95% and raise     │
│  temperature to 76°F. Lion's Mane is particularly sensitive    │
│  to humidity drops during pinning initiation."                 │
└───────────────────────────────────────────────────────────────┘
```

---

## Knowledge Library Architecture

### Content Categories

| Category | Content Type | Update Frequency |
|----------|-------------|------------------|
| Species Library | Detailed species/strain info | System updates |
| Growing Techniques | Agar, LC, grain, substrate guides | Curated additions |
| Contamination Guide | ID photos, causes, prevention | Expert review |
| Equipment Guides | Setup, maintenance, troubleshooting | As needed |
| Calculators & Formulas | Hydration, BE, spawn rates | Version controlled |
| Safety & Compliance | Food safety, lab practices | Regulatory driven |
| Research Papers | Peer-reviewed mycology research | Curated imports |
| Community Insights | Aggregated successful patterns | ML-generated |

### Knowledge Library Schema

```typescript
interface KnowledgeDocument {
  id: string;
  category: 'species' | 'technique' | 'contamination' | 'equipment' |
            'safety' | 'research' | 'community';

  // Content
  title: string;
  content: string;              // Main text content
  summary?: string;             // Short summary for context

  // Metadata
  tags: string[];               // For filtering
  speciesIds?: string[];        // Related species
  strainIds?: string[];         // Related strains
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';

  // Versioning
  version: number;
  createdAt: Date;
  updatedAt: Date;
  author?: string;

  // Search optimization
  embedding?: number[];         // Vector embedding for semantic search
  keywords?: string[];          // Extracted keywords

  // Media
  images?: KnowledgeImage[];
  videos?: KnowledgeVideo[];

  // Quality
  reviewStatus: 'draft' | 'reviewed' | 'approved' | 'deprecated';
  confidenceScore?: number;     // For ML-generated content
  citations?: string[];
}

interface KnowledgeImage {
  id: string;
  url: string;                  // Azure Blob Storage URL
  caption: string;
  type: 'diagram' | 'photo' | 'microscopy' | 'chart';
  analysisData?: ImageAnalysisResult;  // Azure Vision API output
}
```

### Library Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    Knowledge Library Pipeline                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Content    │────▶│   Review &   │────▶│   Embed &    │    │
│  │   Ingestion  │     │   Approve    │     │   Index      │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│        ▲                                          │             │
│        │                                          ▼             │
│  ┌──────────────┐                        ┌──────────────┐      │
│  │   Sources    │                        │  Azure AI    │      │
│  │  • Manual    │                        │  Search      │      │
│  │  • Import    │                        │  Index       │      │
│  │  • Research  │                        └──────────────┘      │
│  │  • Community │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Image Analysis Capabilities

### Use Cases

| Feature | Azure Service | Description |
|---------|---------------|-------------|
| Contamination Detection | GPT-4o Vision | Analyze photos for mold types, bacterial growth |
| Species Identification | Custom Vision | Identify mushroom species from photos |
| Growth Stage Assessment | GPT-4o Vision | Determine colonization %, pin development |
| Health Scoring | GPT-4o Vision | Rate culture/grow health from visual indicators |
| Microscopy Analysis | GPT-4o Vision | Analyze mycelium structure, spore morphology |
| Label/QR Reading | Azure Vision OCR | Extract data from lab labels |

### Image Analysis Flow

```typescript
interface ImageAnalysisRequest {
  imageUrl: string;             // Azure Blob Storage URL
  analysisType: 'contamination' | 'identification' | 'health' |
                'stage' | 'microscopy' | 'label';
  context?: {
    entityType: 'culture' | 'grow' | 'grain_spawn';
    entityId: string;
    currentStage?: string;
    speciesId?: string;
  };
}

interface ImageAnalysisResult {
  analysisType: string;
  confidence: number;           // 0-1 confidence score

  // Contamination specific
  contamination?: {
    detected: boolean;
    type?: 'trichoderma' | 'cobweb' | 'bacterial' | 'lipstick' |
           'black_mold' | 'unknown';
    severity?: 'minor' | 'moderate' | 'severe';
    location?: string;          // Where in image
    recommendations?: string[];
  };

  // Identification specific
  identification?: {
    species?: string;
    strain?: string;
    alternativeMatches?: Array<{species: string; confidence: number}>;
  };

  // Health assessment
  healthAssessment?: {
    score: number;              // 1-10
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

  // Raw response
  rawAnalysis: string;          // Full AI response for display
  processingTime: number;       // ms
}
```

### Image Storage Architecture

```
Azure Blob Storage
├── sporely-images/
│   ├── users/{user_id}/
│   │   ├── cultures/{culture_id}/
│   │   │   ├── observations/
│   │   │   │   └── {observation_id}_{timestamp}.jpg
│   │   │   └── primary/
│   │   │       └── current.jpg
│   │   ├── grows/{grow_id}/
│   │   │   ├── stages/
│   │   │   │   ├── spawning_{timestamp}.jpg
│   │   │   │   ├── colonization_{timestamp}.jpg
│   │   │   │   └── fruiting_{timestamp}.jpg
│   │   │   ├── harvests/
│   │   │   │   └── flush_{n}_{timestamp}.jpg
│   │   │   └── observations/
│   │   │       └── {observation_id}_{timestamp}.jpg
│   │   └── inventory/{item_id}/
│   │       └── {timestamp}.jpg
│   │
│   └── knowledge/
│       ├── species/{species_id}/
│       ├── contamination/
│       └── techniques/
```

---

## IoT Data Integration

### Supported Data Sources

| Data Type | Sensors | Use in AI |
|-----------|---------|-----------|
| Temperature | DHT22, BME280, SHT31 | Environmental analysis, recommendations |
| Humidity | DHT22, BME280, SHT31 | Fruiting optimization |
| CO2 | MH-Z19, SCD30 | FAE recommendations |
| Light | BH1750, TSL2561 | Photoperiod tracking |
| Weight | HX711 load cells | Yield predictions, hydration monitoring |
| Air Pressure | BME280 | Environmental correlation |

### IoT Data Schema

```typescript
interface IoTReading {
  id: string;
  deviceId: string;
  locationId: string;           // Maps to Sporely location
  timestamp: Date;

  readings: {
    temperature?: number;       // Fahrenheit
    humidity?: number;          // Percentage
    co2?: number;               // PPM
    lightLevel?: number;        // Lux
    weight?: number;            // Grams
    pressure?: number;          // hPa
  };

  metadata?: {
    batteryLevel?: number;
    signalStrength?: number;
    firmware?: string;
  };
}

interface IoTAnalysisRequest {
  locationId: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  analysisType: 'optimization' | 'anomaly' | 'correlation' | 'prediction';
  context?: {
    activeGrows?: string[];     // Grow IDs in this location
    speciesIds?: string[];      // Species being grown
    targetStage?: string;       // Current growth stage
  };
}

interface IoTAnalysisResult {
  summary: string;

  // Environmental assessment
  environmentalScore?: {
    overall: number;            // 1-10
    temperature: number;
    humidity: number;
    co2: number;
    light: number;
  };

  // Deviations from optimal
  deviations?: Array<{
    parameter: string;
    actual: number;
    optimal: {min: number; max: number};
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;

  // Anomalies detected
  anomalies?: Array<{
    timestamp: Date;
    parameter: string;
    value: number;
    expectedRange: {min: number; max: number};
    possibleCause?: string;
  }>;

  // Predictions
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

  // Actionable recommendations
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
    reason: string;
    impact: string;
  }>;
}
```

### IoT Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        IoT Devices                               │
│    ESP32, Arduino, Raspberry Pi with sensors                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT / HTTP
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure IoT Hub (Optional)                      │
│              or direct POST to Supabase Edge Function           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase Edge Function                           │
│                  (iot-data-ingestion)                           │
│  • Validate device authentication                                │
│  • Transform and normalize readings                              │
│  • Store in PostgreSQL                                          │
│  • Trigger alerts if thresholds exceeded                        │
│  • Queue for AI analysis (batch)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase PostgreSQL                            │
│                                                                  │
│  iot_readings table:                                            │
│  • id, device_id, location_id, timestamp                        │
│  • temperature, humidity, co2, light, weight, pressure          │
│  • Partitioned by time for efficient queries                    │
│  • Retention policy: detailed (30 days), hourly avg (1 year)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (batch analysis)
┌─────────────────────────────────────────────────────────────────┐
│              Azure OpenAI Analysis Pipeline                      │
│                                                                  │
│  Triggered by:                                                  │
│  • User request ("Analyze my fruiting room")                    │
│  • Scheduled analysis (daily summary)                           │
│  • Threshold alerts (immediate)                                 │
│                                                                  │
│  Combines:                                                       │
│  • IoT readings (time series)                                   │
│  • Active grows in location                                     │
│  • Species optimal parameters                                   │
│  • Historical performance data                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Chat Interface Architecture

### Chat Component Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Sporely AI Assistant                                    [−][×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🧬 AI Assistant                                            ││
│  │  ─────────────────                                          ││
│  │  Welcome! I can help you with:                              ││
│  │  • Analyzing your cultures and grows                        ││
│  │  • Identifying contamination from photos                    ││
│  │  • Optimizing your growing conditions                       ││
│  │  • Answering mycology questions                             ││
│  │                                                              ││
│  │  What would you like help with?                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  👤 You                                                      ││
│  │  ────                                                        ││
│  │  Why is my LC-241220-001 not showing growth after 7 days?   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  🧬 AI Assistant                                    ⏱️ 2.3s  ││
│  │  ─────────────────                                          ││
│  │  I've reviewed LC-241220-001 and found some potential       ││
│  │  issues:                                                     ││
│  │                                                              ││
│  │  📊 **Culture Details:**                                    ││
│  │  • Strain: Blue Oyster                                      ││
│  │  • Inoculated: Dec 20, 2024 (7 days ago)                    ││
│  │  • Location: Incubator A (78°F recorded)                    ││
│  │                                                              ││
│  │  ⚠️ **Possible Issues:**                                    ││
│  │  1. **Temperature**: 78°F is slightly high for LC. Blue     ││
│  │     Oyster prefers 72-75°F for optimal LC growth.           ││
│  │                                                              ││
│  │  2. **No observations logged**: Consider adding daily       ││
│  │     observations to track progress.                         ││
│  │                                                              ││
│  │  **Recommendations:**                                        ││
│  │  • Lower incubator temp to 73°F                             ││
│  │  • Check for any cloudiness or swirls (early growth)        ││
│  │  • Add observation with photo for analysis                  ││
│  │                                                              ││
│  │  [📷 Upload Photo for Analysis]  [📝 Add Observation]       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [📷] Type your question...                         [Send ▶] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Quick actions: [🔍 Analyze Culture] [📊 Check Grows]          │
│                 [🌡️ Environment] [📚 Knowledge Base]           │
└─────────────────────────────────────────────────────────────────┘
```

### Chat State Management

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // For assistant messages
  sources?: Array<{
    type: 'culture' | 'grow' | 'knowledge' | 'iot';
    id: string;
    title: string;
  }>;

  // For user messages with images
  images?: Array<{
    url: string;
    analysisResult?: ImageAnalysisResult;
  }>;

  // Actions the AI can suggest
  suggestedActions?: Array<{
    type: 'add_observation' | 'update_stage' | 'view_entity' |
          'upload_image' | 'adjust_environment';
    label: string;
    payload: Record<string, unknown>;
  }>;

  // Metadata
  processingTime?: number;
  tokensUsed?: number;
  cost?: number;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];

  // Context for the session
  context?: {
    focusedEntityType?: 'culture' | 'grow' | 'inventory' | 'location';
    focusedEntityId?: string;
  };

  createdAt: Date;
  updatedAt: Date;

  // Usage tracking
  totalTokens: number;
  totalCost: number;
}
```

### Conversation Modes

| Mode | Context | Example Queries |
|------|---------|-----------------|
| General | Full access to user data + knowledge | "How do I make LC?" |
| Culture Focus | Single culture + related data | "Why is this culture yellowing?" |
| Grow Focus | Single grow + environmental data | "When should I start fruiting?" |
| Location Focus | Location + all entities there | "Analyze my fruiting room" |
| Image Analysis | Image + entity context | "Is this contamination?" |
| IoT Analysis | Sensor data + grows | "Why did humidity spike at 3am?" |

---

## Service Layer Implementation

### Directory Structure

```
src/lib/ai/
├── index.ts                    # Main exports
├── types.ts                    # AI-specific type definitions
│
├── services/
│   ├── AzureOpenAIService.ts   # Azure OpenAI client wrapper
│   ├── AzureSearchService.ts   # Azure AI Search client
│   ├── ImageAnalysisService.ts # Vision/image analysis
│   ├── IoTAnalysisService.ts   # IoT data analysis
│   └── KnowledgeService.ts     # Knowledge library operations
│
├── hooks/
│   ├── useAI.ts                # Main AI hook
│   ├── useChat.ts              # Chat session management
│   ├── useImageAnalysis.ts     # Image analysis hook
│   └── useIoTAnalysis.ts       # IoT analysis hook
│
├── context/
│   ├── AIContext.tsx           # AI provider context
│   └── ChatContext.tsx         # Chat session context
│
├── prompts/
│   ├── system.ts               # System prompts
│   ├── cultivation.ts          # Cultivation-specific prompts
│   ├── contamination.ts        # Contamination analysis prompts
│   ├── identification.ts       # Species identification prompts
│   └── optimization.ts         # Environmental optimization prompts
│
└── utils/
    ├── contextBuilder.ts       # Build grounded context
    ├── tokenCounter.ts         # Estimate token usage
    ├── responseParser.ts       # Parse AI responses
    └── costCalculator.ts       # Calculate API costs
```

### Core Service Interface

```typescript
// src/lib/ai/services/AzureOpenAIService.ts

interface AIServiceConfig {
  endpoint: string;             // Azure OpenAI endpoint
  apiKey: string;               // API key (from env or user settings)
  deploymentName: string;       // GPT-4o deployment name
  apiVersion: string;           // e.g., "2024-02-15-preview"
}

interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{type: 'text' | 'image_url'; ...}>;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class AzureOpenAIService {
  constructor(config: AIServiceConfig);

  // Core chat completion
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncGenerator<string>;

  // Image analysis
  analyzeImage(imageUrl: string, prompt: string): Promise<ChatResponse>;

  // Embeddings for search
  getEmbedding(text: string): Promise<number[]>;
}
```

### React Hook Interface

```typescript
// src/lib/ai/hooks/useAI.ts

interface UseAIOptions {
  onError?: (error: Error) => void;
  onTokenUsage?: (usage: TokenUsage) => void;
}

interface UseAIReturn {
  // Chat operations
  sendMessage: (message: string, images?: string[]) => Promise<ChatMessage>;
  streamMessage: (message: string) => AsyncGenerator<string>;

  // Specialized analysis
  analyzeImage: (imageUrl: string, context: ImageAnalysisContext) =>
    Promise<ImageAnalysisResult>;
  analyzeIoTData: (locationId: string, timeRange: TimeRange) =>
    Promise<IoTAnalysisResult>;

  // Entity-specific helpers
  analyzeCulture: (cultureId: string, question?: string) =>
    Promise<CultureAnalysisResult>;
  analyzeGrow: (growId: string, question?: string) =>
    Promise<GrowAnalysisResult>;

  // Status
  isLoading: boolean;
  error: Error | null;

  // Usage tracking
  sessionUsage: {tokens: number; cost: number};
}

function useAI(options?: UseAIOptions): UseAIReturn;
```

---

## Security & Privacy

### Data Flow Security

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AUTHENTICATION                                               │
│     ├─ Supabase Auth (JWT tokens)                               │
│     ├─ Azure AD for service accounts                            │
│     └─ API key rotation (90 days)                               │
│                                                                  │
│  2. DATA ACCESS                                                  │
│     ├─ RLS policies (user can only access own data)             │
│     ├─ Edge function validates user context                     │
│     └─ AI only receives authorized data                         │
│                                                                  │
│  3. DATA IN TRANSIT                                             │
│     ├─ TLS 1.3 everywhere                                       │
│     ├─ Azure Private Endpoints (optional)                       │
│     └─ No data logging in transit                               │
│                                                                  │
│  4. DATA AT REST                                                 │
│     ├─ Supabase encryption (AES-256)                            │
│     ├─ Azure Storage encryption                                 │
│     └─ Azure AI Search encryption                               │
│                                                                  │
│  5. AI SAFETY                                                    │
│     ├─ Content filtering enabled                                │
│     ├─ No training on user data                                 │
│     ├─ Audit logging of all AI interactions                     │
│     └─ PII filtering before AI processing                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Privacy Controls

```typescript
interface UserAISettings {
  // Feature toggles
  aiEnabled: boolean;
  imageAnalysisEnabled: boolean;
  iotAnalysisEnabled: boolean;

  // Data sharing
  shareYieldData: boolean;        // For community insights
  shareEnvironmentalData: boolean;
  shareSuccessPatterns: boolean;

  // Privacy
  anonymizeBeforeAnalysis: boolean;
  retainConversations: boolean;
  conversationRetentionDays: number;

  // Usage limits
  dailyTokenLimit?: number;
  monthlyCostLimit?: number;
}
```

---

## Cost Management

### Pricing Estimates (Azure OpenAI GPT-4o)

| Operation | Tokens | Estimated Cost |
|-----------|--------|----------------|
| Simple query (no images) | ~1,500 | ~$0.02 |
| Query with context | ~4,000 | ~$0.05 |
| Image analysis | ~2,000 + image | ~$0.03 |
| Full grow analysis | ~8,000 | ~$0.10 |
| IoT data analysis | ~5,000 | ~$0.06 |

### Cost Control Strategies

```typescript
interface CostManagement {
  // Caching
  cacheResponses: boolean;
  cacheTTL: number;              // Hours to cache similar queries

  // Rate limiting by tier
  tierLimits: {
    free: {dailyTokens: 5000; features: ['chat', 'basic_analysis']};
    basic: {dailyTokens: 50000; features: ['chat', 'images', 'iot']};
    pro: {dailyTokens: 200000; features: ['all']};
    enterprise: {dailyTokens: 'unlimited'; features: ['all']};
  };

  // Optimization
  useEmbeddingsCache: boolean;   // Cache embeddings for repeated content
  compressContext: boolean;      // Summarize long context
  streamResponses: boolean;      // Stream for better UX, same cost
}
```

### Usage Tracking

```sql
-- ai_usage table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),

  -- Request details
  request_type TEXT NOT NULL,   -- 'chat', 'image', 'iot', 'embedding'
  model TEXT NOT NULL,          -- 'gpt-4o', 'text-embedding-3-small'

  -- Token counts
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,

  -- Cost tracking
  estimated_cost DECIMAL(10, 6),

  -- Metadata
  cached BOOLEAN DEFAULT false,
  session_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage queries
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
```

---

## Implementation Phases

### Phase 1: Foundation (Core Infrastructure)

**Goal**: Establish the base AI service layer and basic chat functionality

**Deliverables**:
1. Azure resource setup (OpenAI, AI Search, Blob Storage)
2. Supabase Edge Functions for AI gateway
3. Basic `AzureOpenAIService` client
4. Simple chat interface component
5. Basic context retrieval (user's cultures/grows)
6. User settings for AI features
7. Usage tracking and cost display

**Database Changes**:
- `ai_chat_sessions` table
- `ai_chat_messages` table
- `ai_usage` table
- Update `user_settings` for AI preferences

### Phase 2: Knowledge Library

**Goal**: Build the curated knowledge base and RAG system

**Deliverables**:
1. Azure AI Search index setup
2. Knowledge document schema and ingestion
3. `KnowledgeService` for CRUD operations
4. Vector embedding generation
5. RAG pipeline integration
6. Admin interface for knowledge management
7. Initial content population (species, techniques)

**Database Changes**:
- `knowledge_documents` table (if storing locally)
- Embedding storage consideration

### Phase 3: Image Analysis

**Goal**: Enable visual AI capabilities

**Deliverables**:
1. Azure Blob Storage integration
2. Image upload component
3. `ImageAnalysisService` implementation
4. Contamination detection workflow
5. Species identification feature
6. Health assessment integration
7. Image-in-chat capability

**Database Changes**:
- Update `images` column usage across entities
- `image_analysis_results` table
- Blob storage reference patterns

### Phase 4: IoT Integration

**Goal**: Connect environmental sensors to AI analysis

**Deliverables**:
1. IoT data ingestion Edge Function
2. `iot_readings` table with time partitioning
3. `IoTAnalysisService` implementation
4. Environmental dashboard with AI insights
5. Anomaly detection alerts
6. Predictive recommendations
7. Device management UI

**Database Changes**:
- `iot_devices` table
- `iot_readings` table (partitioned)
- `iot_alerts` table

### Phase 5: Advanced Features

**Goal**: Sophisticated AI capabilities and UX improvements

**Deliverables**:
1. Multi-turn conversation memory
2. Proactive recommendations (push notifications)
3. Batch analysis scheduling
4. Community insights aggregation
5. Custom model fine-tuning (if data allows)
6. Voice input/output
7. Mobile-optimized chat interface

---

## Environment Variables

```bash
# Azure OpenAI
VITE_AZURE_OPENAI_ENDPOINT=https://sporely-ai.openai.azure.com
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4o
VITE_AZURE_OPENAI_API_VERSION=2024-02-15-preview
# API key stored in Supabase secrets, not client-side

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://sporely-search.search.windows.net
AZURE_SEARCH_INDEX_KNOWLEDGE=knowledge-library
AZURE_SEARCH_INDEX_USER=user-data
# API key stored in Supabase secrets

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT=sporelystorage
AZURE_STORAGE_CONTAINER=images
# SAS tokens generated server-side

# Feature Flags
VITE_AI_ENABLED=true
VITE_AI_IMAGE_ANALYSIS_ENABLED=true
VITE_AI_IOT_ANALYSIS_ENABLED=true
```

---

## ✅ Finalized Decisions (December 2025)

All architectural decisions have been confirmed by the project owner:

### 1. Hosting Architecture ✅
**Decision**: Hybrid Stack (Netlify + Supabase + Azure)
- **Netlify** - Frontend hosting (already working)
- **Supabase** - Database, Auth, Edge Functions (already working)
- **Azure** - AI services only (new)

*Rationale*: Azure handles AI workload, Supabase Edge Functions act as a secure proxy (API keys never touch frontend), no existing infrastructure migration required.

### 2. AI Pricing Model ✅
**Decision**: Freemium/Hybrid Approach

| Tier | AI Queries/Month | Overage | Features |
|------|------------------|---------|----------|
| Free | 50 | N/A | Basic chat, grounded responses |
| Basic | 500 | $0.01/query | + Image analysis, IoT analysis |
| Pro | 2,000 | $0.005/query | + Priority processing, extended retention |
| Enterprise | Unlimited | Custom | + SLA, dedicated support |

*Rationale*: Users can try AI without fear, provides predictable costs, scales with usage.

### 3. Knowledge Library Curation ✅
**Decision**: Phased Hybrid Approach

| Phase | Approach | Description |
|-------|----------|-------------|
| Phase 1 | Owner-Curated Core | Foundation content (species, basic techniques) curated by owner |
| Phase 2 | Import + AI-Assisted | Import from trusted sources with AI summarization, owner approves |
| Phase 3 | Community Suggestions | Users submit tips/notes, admin-only approval required |
| Phase 4 | Community Voting | Community votes influence library growth |

*Rationale*: Knowledge library is the competitive moat - higher quality = more value = user retention. Never fully automated.

### 4. IoT Strategy ✅
**Decision**: Custom API + Open-Source Focus

**Primary**: Custom REST API via Supabase Edge Function
- Any device can POST data
- Maximum flexibility for DIY users
- ESP32 + HTTP POST every 5 min (simple path)

**Secondary**: MQTT support (future)
- Azure IoT Hub or self-hosted option
- Real-time streaming for professional setups

**Future**: Home Assistant plugin, specific device integrations (AC Infinity, Inkbird)

*Rationale*: Open-source friendly, simple path for DIY users, professional path for serious setups.

### 5. Privacy & Data Sharing ✅
**Decision**: Privacy-First with 4 Opt-In Levels

| Level | What's Shared | With Whom | User Control |
|-------|--------------|-----------|--------------|
| None (Default) | Nothing | Nobody | Default setting |
| Anonymous Aggregate | Stats only (avg yields, success rates) | Community features | Opt-in |
| Strain Performance | Strain-specific anonymized data | Other users of same strain | Opt-in |
| Full Share | All grow data (anonymized) | Research/community | Explicit opt-in |

**Default Settings** (Privacy-First):
- AI uses ONLY user's own data
- No data shared with community
- No data used for model training
- Conversations not retained (or 30-day retention opt-in)

**Opt-in Features**:
- "Help improve strain recommendations" - share anonymized yield data
- "Contribute to community insights" - share anonymized patterns
- "Keep conversation history" - retain for continuity

*Rationale*: Respects privacy, builds trust, allows willing contributors to participate.

---

## Implementation Status

### Phase 1: Foundation - **IN PROGRESS**
- [ ] Azure resource setup (OpenAI, AI Search, Blob Storage)
- [ ] Supabase Edge Functions for AI gateway
- [ ] Basic `AzureOpenAIService` client
- [ ] Simple chat interface component
- [ ] Basic context retrieval (user's cultures/grows)
- [ ] User settings for AI features
- [ ] Usage tracking and cost display
- [ ] Database tables (ai_chat_sessions, ai_usage, etc.)

### Phase 2: Knowledge Library - **PLANNED**
- [ ] Azure AI Search index setup
- [ ] Knowledge document schema and ingestion
- [ ] Library suggestion/approval workflow
- [ ] Admin interface for content management
- [ ] Initial content population

### Phase 3: Image Analysis - **PLANNED**
- [ ] Azure Blob Storage integration
- [ ] Image upload and analysis workflow
- [ ] Contamination detection
- [ ] Species identification

### Phase 4: IoT Integration - **PLANNED**
- [ ] IoT data ingestion endpoint
- [ ] Device registration and management
- [ ] Environmental analysis
- [ ] Alert system

### Phase 5: Advanced Features - **FUTURE**
- [ ] Multi-turn conversation memory
- [ ] Proactive recommendations
- [ ] Community insights aggregation

---

## Design Principles

This architecture is designed to be:
- **Modular**: Each component can be developed independently
- **Scalable**: From single user to enterprise
- **Secure**: Data sovereignty maintained (Azure tenant control)
- **Cost-conscious**: Caching, rate limiting, tier-based access
- **Extensible**: Ready for future capabilities
- **Privacy-first**: Users control their data sharing level
- **Open-source friendly**: Custom APIs, no vendor lock-in for sensors
