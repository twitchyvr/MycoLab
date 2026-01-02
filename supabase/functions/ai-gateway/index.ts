// ============================================================================
// AI GATEWAY EDGE FUNCTION
// Main entry point for all AI operations in Sporely
// Handles: chat, image analysis, IoT analysis, knowledge search
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/supabase.ts';
import { AzureOpenAIClient, estimateCost } from '../_shared/azure-openai.ts';

// =============================================================================
// TYPES
// =============================================================================

interface AIGatewayRequest {
  action: 'chat' | 'analyze_image' | 'analyze_iot' | 'search_knowledge' | 'get_embedding';

  // Chat
  messages?: Array<{ role: string; content: string }>;
  sessionId?: string;
  contextEntityType?: string;
  contextEntityId?: string;

  // Image analysis
  imageUrl?: string;
  analysisType?: 'contamination' | 'identification' | 'health' | 'stage' | 'microscopy' | 'label';

  // IoT analysis
  locationId?: string;
  timeRange?: { start: string; end: string };

  // Knowledge search
  query?: string;
  category?: string;
  limit?: number;

  // Options
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const TIER_LIMITS = {
  free: { daily: 50, monthly: 50 },
  basic: { daily: 100, monthly: 500 },
  pro: { daily: 200, monthly: 2000 },
  enterprise: { daily: Infinity, monthly: Infinity },
};

async function checkRateLimit(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
): Promise<{ allowed: boolean; remaining: number; tier: string }> {
  // Get user's tier from settings or default to free
  const { data: settings } = await supabase
    .from('ai_user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // For now, everyone is on 'free' tier - this will be updated when billing is added
  const tier = 'free';
  const limits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];

  // Count today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const used = count ?? 0;
  const remaining = Math.max(0, limits.daily - used);

  return {
    allowed: used < limits.daily,
    remaining,
    tier,
  };
}

// =============================================================================
// CONTEXT BUILDING (RAG)
// =============================================================================

async function buildContext(
  supabase: ReturnType<typeof createSupabaseClient>,
  entityType?: string,
  entityId?: string
): Promise<string> {
  const contextParts: string[] = [];

  // Add general user context
  const { data: cultures } = await supabase
    .from('cultures')
    .select('id, label, type, status, strain_id, health_rating, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(10);

  const { data: grows } = await supabase
    .from('grows')
    .select('id, name, current_stage, status, strain_id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (cultures && cultures.length > 0) {
    contextParts.push(`User's active cultures (${cultures.length}):`);
    cultures.slice(0, 5).forEach(c => {
      contextParts.push(`- ${c.label}: ${c.type}, status=${c.status}, health=${c.health_rating || 'N/A'}`);
    });
  }

  if (grows && grows.length > 0) {
    contextParts.push(`\nUser's active grows (${grows.length}):`);
    grows.slice(0, 5).forEach(g => {
      contextParts.push(`- ${g.name}: stage=${g.current_stage}, status=${g.status}`);
    });
  }

  // Add specific entity context if provided
  if (entityType && entityId) {
    if (entityType === 'culture') {
      const { data: culture } = await supabase
        .from('cultures')
        .select(`
          *,
          strain:strains(*),
          location:locations(name),
          observations:culture_observations(*)
        `)
        .eq('id', entityId)
        .single();

      if (culture) {
        contextParts.push(`\nFocused Culture Details:`);
        contextParts.push(`- Label: ${culture.label}`);
        contextParts.push(`- Type: ${culture.type}`);
        contextParts.push(`- Status: ${culture.status}`);
        contextParts.push(`- Strain: ${culture.strain?.name || 'Unknown'}`);
        contextParts.push(`- Health Rating: ${culture.health_rating || 'Not rated'}`);
        contextParts.push(`- Location: ${culture.location?.name || 'Not set'}`);
        if (culture.observations?.length > 0) {
          contextParts.push(`- Recent observations: ${culture.observations.length}`);
        }
      }
    } else if (entityType === 'grow') {
      const { data: grow } = await supabase
        .from('grows')
        .select(`
          *,
          strain:strains(*),
          location:locations(name),
          observations:grow_observations(*),
          flushes(*)
        `)
        .eq('id', entityId)
        .single();

      if (grow) {
        contextParts.push(`\nFocused Grow Details:`);
        contextParts.push(`- Name: ${grow.name}`);
        contextParts.push(`- Stage: ${grow.current_stage}`);
        contextParts.push(`- Status: ${grow.status}`);
        contextParts.push(`- Strain: ${grow.strain?.name || 'Unknown'}`);
        contextParts.push(`- Location: ${grow.location?.name || 'Not set'}`);
        if (grow.flushes?.length > 0) {
          const totalYield = grow.flushes.reduce((sum: number, f: any) => sum + (f.wet_weight || 0), 0);
          contextParts.push(`- Total yield: ${totalYield}g from ${grow.flushes.length} flushes`);
        }
      }
    } else if (entityType === 'location') {
      // Include IoT data for location context
      const { data: readings } = await supabase
        .from('iot_readings')
        .select('*')
        .eq('location_id', entityId)
        .order('reading_at', { ascending: false })
        .limit(10);

      if (readings && readings.length > 0) {
        const latest = readings[0];
        contextParts.push(`\nLocation Environmental Data (latest):`);
        if (latest.temperature) contextParts.push(`- Temperature: ${latest.temperature}°F`);
        if (latest.humidity) contextParts.push(`- Humidity: ${latest.humidity}%`);
        if (latest.co2_ppm) contextParts.push(`- CO2: ${latest.co2_ppm} ppm`);
        if (latest.vpd) contextParts.push(`- VPD: ${latest.vpd} kPa`);
      }
    }
  }

  return contextParts.join('\n');
}

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

const SYSTEM_PROMPT = `You are Sporely AI, an expert mycology cultivation assistant integrated into the Sporely application.

Your role is to help mushroom cultivators by:
- Analyzing their cultures and grows for issues
- Providing species-specific cultivation guidance
- Identifying contamination from descriptions or images
- Recommending environmental optimizations
- Answering mycology questions with accurate, practical advice

Guidelines:
- Be concise but thorough
- Always ground your responses in the user's actual data when available
- Cite specific data points from their grows/cultures
- If you identify issues, suggest actionable next steps
- Be encouraging but honest about problems
- Use metric or imperial units based on user preference
- Format responses with markdown for clarity

When analyzing grows or cultures:
- Consider the current stage and what's normal for it
- Compare to species-specific optimal parameters
- Note any red flags like stalled growth or off-colors
- Suggest observations the user should make`;

const IMAGE_ANALYSIS_PROMPTS = {
  contamination: `Analyze this image for signs of contamination in a mushroom cultivation context.

Look for:
- Trichoderma (green mold) - bright green patches
- Cobweb mold - wispy gray/white growth that spreads quickly
- Bacterial contamination - slimy, wet-looking areas, off smells
- Black mold - dark spots or patches
- Lipstick mold - pink/red coloration
- Penicillium - blue-green with white edges

Provide:
1. Whether contamination is detected (yes/no)
2. If yes, the likely type and severity (minor/moderate/severe)
3. Location in the image
4. Recommended action (isolate, discard, treat, monitor)
5. Confidence level (0-100%)`,

  health: `Assess the health of this mushroom culture or grow.

Evaluate:
- Mycelium vigor (rhizomorphic vs tomentose growth)
- Colonization uniformity
- Color (bright white is healthy, yellowing may indicate stress)
- Moisture level (proper field capacity)
- Any signs of stress, stalling, or contamination

Provide:
1. Overall health score (1-10)
2. Key positive indicators
3. Any concerns or areas to monitor
4. Recommendations for improvement`,

  stage: `Determine the current growth stage of this mushroom grow.

Stages to identify:
- Spawning (grain spawn added to substrate)
- Colonization (mycelium spreading through substrate)
- Pinning (small primordia forming)
- Fruiting (pins developing into mushrooms)
- Harvest-ready (fully developed fruits)

Provide:
1. Current stage
2. Estimated colonization percentage (if applicable)
3. Pin count (if applicable)
4. Whether it's ready for next stage
5. Estimated days to next stage`,

  identification: `Identify the mushroom species shown in this image.

Consider:
- Cap shape, color, and texture
- Gill structure and attachment
- Stem characteristics
- Spore print color (if visible)
- Overall size and proportions

Provide:
1. Most likely species identification
2. Confidence level
3. Alternative matches (if uncertain)
4. Key identifying features observed
5. Any safety warnings if relevant`,
};

// =============================================================================
// HANDLERS
// =============================================================================

async function handleChat(
  request: AIGatewayRequest,
  supabase: ReturnType<typeof createSupabaseClient>,
  openai: AzureOpenAIClient,
  userId: string
): Promise<Response> {
  const { messages, sessionId, contextEntityType, contextEntityId } = request;

  if (!messages || messages.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'No messages provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Build context
  const context = await buildContext(supabase, contextEntityType, contextEntityId);

  // Prepare messages for Azure OpenAI
  const systemMessage = {
    role: 'system' as const,
    content: `${SYSTEM_PROMPT}\n\n--- User's Current Data ---\n${context}`,
  };

  const chatMessages = [
    systemMessage,
    ...messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Call Azure OpenAI
  const startTime = Date.now();
  const response = await openai.chat({
    messages: chatMessages,
    max_tokens: request.maxTokens ?? 2048,
    temperature: request.temperature ?? 0.7,
  });
  const processingTime = Date.now() - startTime;

  const assistantMessage = response.choices[0]?.message?.content ?? '';
  const usage = response.usage;

  // Calculate cost
  const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens, 'gpt-4o');

  // Log usage
  await supabase.from('ai_usage').insert({
    user_id: userId,
    request_type: 'chat',
    model: 'gpt-4o',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost: cost,
    session_id: sessionId,
  });

  // Save message to database if session exists
  if (sessionId) {
    // Update session
    await supabase
      .from('ai_chat_sessions')
      .update({
        total_tokens: supabase.rpc('increment_tokens', { row_id: sessionId, amount: usage.total_tokens }),
        total_cost: supabase.rpc('increment_cost', { row_id: sessionId, amount: cost }),
        message_count: supabase.rpc('increment_count', { row_id: sessionId }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    // Save assistant message
    await supabase.from('ai_chat_messages').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: assistantMessage,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: cost,
      processing_time_ms: processingTime,
      model_used: 'gpt-4o',
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime,
        tokensUsed: usage.total_tokens,
        estimatedCost: cost,
        modelUsed: 'gpt-4o',
      },
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: cost,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleImageAnalysis(
  request: AIGatewayRequest,
  supabase: ReturnType<typeof createSupabaseClient>,
  openai: AzureOpenAIClient,
  userId: string
): Promise<Response> {
  const { imageUrl, analysisType } = request;

  if (!imageUrl) {
    return new Response(
      JSON.stringify({ success: false, error: 'No image URL provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const type = analysisType ?? 'health';
  const prompt = IMAGE_ANALYSIS_PROMPTS[type as keyof typeof IMAGE_ANALYSIS_PROMPTS] ??
    IMAGE_ANALYSIS_PROMPTS.health;

  const startTime = Date.now();
  const response = await openai.analyzeImage(imageUrl, prompt);
  const processingTime = Date.now() - startTime;

  const analysis = response.choices[0]?.message?.content ?? '';
  const usage = response.usage;
  const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens, 'gpt-4o');

  // Log usage
  await supabase.from('ai_usage').insert({
    user_id: userId,
    request_type: 'image_analysis',
    model: 'gpt-4o',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost: cost,
  });

  // Parse structured response (basic parsing - could be enhanced)
  const result = {
    analysisType: type,
    confidence: 0.85, // Would be extracted from actual response
    rawAnalysis: analysis,
    processingTimeMs: processingTime,
  };

  // Add type-specific fields based on analysis
  if (type === 'contamination') {
    result.contamination = {
      detected: analysis.toLowerCase().includes('yes') || analysis.toLowerCase().includes('contamination detected'),
      // Additional parsing would extract type, severity, etc.
    };
  }

  return new Response(
    JSON.stringify({
      success: true,
      imageAnalysis: result,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: cost,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleIoTAnalysis(
  request: AIGatewayRequest,
  supabase: ReturnType<typeof createSupabaseClient>,
  openai: AzureOpenAIClient,
  userId: string
): Promise<Response> {
  const { locationId, timeRange } = request;

  if (!locationId) {
    return new Response(
      JSON.stringify({ success: false, error: 'No location ID provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Fetch IoT readings
  let query = supabase
    .from('iot_readings')
    .select('*')
    .eq('location_id', locationId)
    .order('reading_at', { ascending: false })
    .limit(100);

  if (timeRange?.start) {
    query = query.gte('reading_at', timeRange.start);
  }
  if (timeRange?.end) {
    query = query.lte('reading_at', timeRange.end);
  }

  const { data: readings, error } = await query;

  if (error || !readings || readings.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No IoT readings found for this location',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get location info and active grows
  const { data: location } = await supabase
    .from('locations')
    .select('name, type')
    .eq('id', locationId)
    .single();

  const { data: activeGrows } = await supabase
    .from('grows')
    .select('name, current_stage, strain_id')
    .eq('location_id', locationId)
    .eq('status', 'active');

  // Calculate statistics
  const temps = readings.filter(r => r.temperature != null).map(r => r.temperature);
  const humidities = readings.filter(r => r.humidity != null).map(r => r.humidity);
  const co2s = readings.filter(r => r.co2_ppm != null).map(r => r.co2_ppm);

  const stats = {
    temperature: temps.length > 0 ? {
      avg: temps.reduce((a, b) => a + b, 0) / temps.length,
      min: Math.min(...temps),
      max: Math.max(...temps),
    } : null,
    humidity: humidities.length > 0 ? {
      avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      min: Math.min(...humidities),
      max: Math.max(...humidities),
    } : null,
    co2: co2s.length > 0 ? {
      avg: co2s.reduce((a, b) => a + b, 0) / co2s.length,
      min: Math.min(...co2s),
      max: Math.max(...co2s),
    } : null,
  };

  // Build analysis prompt
  const prompt = `Analyze the following environmental data from a mushroom cultivation location:

Location: ${location?.name || 'Unknown'} (${location?.type || 'Unknown type'})
Active grows: ${activeGrows?.map(g => `${g.name} (${g.current_stage})`).join(', ') || 'None'}

Environmental readings (last ${readings.length} readings):
${stats.temperature ? `Temperature: avg ${stats.temperature.avg.toFixed(1)}°F, range ${stats.temperature.min.toFixed(1)}-${stats.temperature.max.toFixed(1)}°F` : ''}
${stats.humidity ? `Humidity: avg ${stats.humidity.avg.toFixed(1)}%, range ${stats.humidity.min.toFixed(1)}-${stats.humidity.max.toFixed(1)}%` : ''}
${stats.co2 ? `CO2: avg ${stats.co2.avg.toFixed(0)} ppm, range ${stats.co2.min}-${stats.co2.max} ppm` : ''}

Please provide:
1. Overall environmental score (1-10) for mushroom cultivation
2. Any parameters that are outside optimal ranges
3. Specific recommendations for improvement
4. Risk assessment for contamination based on conditions`;

  const startTime = Date.now();
  const response = await openai.chat({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.5,
  });
  const processingTime = Date.now() - startTime;

  const analysis = response.choices[0]?.message?.content ?? '';
  const usage = response.usage;
  const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens, 'gpt-4o');

  // Log usage
  await supabase.from('ai_usage').insert({
    user_id: userId,
    request_type: 'iot_analysis',
    model: 'gpt-4o',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost: cost,
  });

  return new Response(
    JSON.stringify({
      success: true,
      iotAnalysis: {
        summary: analysis,
        environmentalScore: {
          overall: 7, // Would be parsed from analysis
          temperature: stats.temperature ? 8 : null,
          humidity: stats.humidity ? 7 : null,
          co2: stats.co2 ? 6 : null,
        },
        recommendations: [], // Would be parsed from analysis
        processingTimeMs: processingTime,
      },
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCost: cost,
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleKnowledgeSearch(
  request: AIGatewayRequest,
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
): Promise<Response> {
  const { query, category, limit = 10 } = request;

  if (!query) {
    return new Response(
      JSON.stringify({ success: false, error: 'No search query provided' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // For now, use PostgreSQL full-text search
  // In production, this would query Azure AI Search for vector/semantic search
  let searchQuery = supabase
    .from('knowledge_documents')
    .select('*')
    .eq('review_status', 'approved')
    .eq('is_active', true)
    .textSearch('title', query)
    .limit(limit);

  if (category) {
    searchQuery = searchQuery.eq('category', category);
  }

  const { data: documents, error } = await searchQuery;

  if (error) {
    console.error('Knowledge search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Search failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Log usage
  await supabase.from('ai_usage').insert({
    user_id: userId,
    request_type: 'knowledge_search',
    model: 'text-search',
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    estimated_cost: 0,
  });

  return new Response(
    JSON.stringify({
      success: true,
      documents: documents || [],
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client with user's auth
    const supabase = createSupabaseClient(req);

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const request: AIGatewayRequest = await req.json();

    // Check AI settings
    const { data: settings } = await supabase
      .from('ai_user_settings')
      .select('ai_enabled')
      .eq('user_id', user.id)
      .single();

    if (settings && !settings.ai_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI features are disabled in your settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Daily limit reached (${rateLimit.tier} tier). Upgrade for more queries.`,
          code: 'rate_limit',
          remaining: 0,
          tier: rateLimit.tier,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Azure OpenAI client
    const openai = new AzureOpenAIClient();

    // Route to appropriate handler
    switch (request.action) {
      case 'chat':
        return await handleChat(request, supabase, openai, user.id);

      case 'analyze_image':
        if (!openai.isConfigured()) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await handleImageAnalysis(request, supabase, openai, user.id);

      case 'analyze_iot':
        if (!openai.isConfigured()) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service not configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return await handleIoTAnalysis(request, supabase, openai, user.id);

      case 'search_knowledge':
        return await handleKnowledgeSearch(request, supabase, user.id);

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${request.action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('AI Gateway error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
