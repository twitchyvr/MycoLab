// ============================================================================
// IOT INGEST EDGE FUNCTION
// Receives sensor data from IoT devices and stores it in the database
// Supports: temperature, humidity, CO2, VPD, light level, and custom sensors
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseAdmin } from '../_shared/supabase.ts';

// =============================================================================
// TYPES
// =============================================================================

interface IoTReading {
  device_id: string;
  location_id?: string;
  reading_at?: string;
  temperature?: number;
  humidity?: number;
  co2_ppm?: number;
  vpd?: number;
  light_level?: number;
  light_par?: number;
  air_flow?: number;
  substrate_moisture?: number;
  substrate_temperature?: number;
  pressure?: number;
  custom_data?: Record<string, unknown>;
}

interface IoTIngestRequest {
  // Single reading
  reading?: IoTReading;

  // Batch readings
  readings?: IoTReading[];

  // Device registration
  register_device?: {
    device_id: string;
    device_type: string;
    name: string;
    location_id?: string;
    capabilities?: string[];
    firmware_version?: string;
  };

  // API key for device authentication (alternative to user auth)
  api_key?: string;
}

interface AlertThreshold {
  id: string;
  location_id: string;
  metric: string;
  min_value?: number;
  max_value?: number;
  alert_type: string;
  notification_channels: string[];
}

// =============================================================================
// ALERT PROCESSING
// =============================================================================

async function checkAlertThresholds(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  reading: IoTReading,
  locationId: string
): Promise<void> {
  // Get alert thresholds for this location
  const { data: thresholds, error } = await supabase
    .from('iot_alert_thresholds')
    .select('*')
    .eq('location_id', locationId)
    .eq('is_active', true);

  if (error || !thresholds || thresholds.length === 0) {
    return;
  }

  const alerts: Array<{
    threshold_id: string;
    location_id: string;
    metric: string;
    value: number;
    alert_type: string;
    message: string;
  }> = [];

  for (const threshold of thresholds) {
    const value = getMetricValue(reading, threshold.metric);
    if (value === null) continue;

    let alertType: string | null = null;
    let message = '';

    if (threshold.min_value !== null && value < threshold.min_value) {
      alertType = 'low';
      message = `${threshold.metric} is below minimum: ${value} < ${threshold.min_value}`;
    } else if (threshold.max_value !== null && value > threshold.max_value) {
      alertType = 'high';
      message = `${threshold.metric} is above maximum: ${value} > ${threshold.max_value}`;
    }

    if (alertType) {
      alerts.push({
        threshold_id: threshold.id,
        location_id: locationId,
        metric: threshold.metric,
        value,
        alert_type: alertType,
        message,
      });
    }
  }

  // Insert alerts
  if (alerts.length > 0) {
    await supabase.from('iot_alerts').insert(alerts);

    // TODO: Send notifications based on threshold.notification_channels
    // This would integrate with email, push, SMS services
    console.log(`Created ${alerts.length} alerts for location ${locationId}`);
  }
}

function getMetricValue(reading: IoTReading, metric: string): number | null {
  switch (metric) {
    case 'temperature':
      return reading.temperature ?? null;
    case 'humidity':
      return reading.humidity ?? null;
    case 'co2_ppm':
      return reading.co2_ppm ?? null;
    case 'vpd':
      return reading.vpd ?? null;
    case 'light_level':
      return reading.light_level ?? null;
    case 'light_par':
      return reading.light_par ?? null;
    case 'air_flow':
      return reading.air_flow ?? null;
    case 'substrate_moisture':
      return reading.substrate_moisture ?? null;
    case 'substrate_temperature':
      return reading.substrate_temperature ?? null;
    case 'pressure':
      return reading.pressure ?? null;
    default:
      return null;
  }
}

// =============================================================================
// VPD CALCULATION
// =============================================================================

/**
 * Calculate Vapor Pressure Deficit from temperature and humidity
 * @param tempF Temperature in Fahrenheit
 * @param humidity Relative humidity percentage (0-100)
 * @returns VPD in kPa
 */
function calculateVPD(tempF: number, humidity: number): number {
  // Convert to Celsius
  const tempC = (tempF - 32) * 5 / 9;

  // Saturation vapor pressure (Tetens equation)
  const svp = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));

  // Actual vapor pressure
  const avp = svp * (humidity / 100);

  // VPD = SVP - AVP
  return Math.round((svp - avp) * 100) / 100;
}

// =============================================================================
// DEVICE AUTHENTICATION
// =============================================================================

async function authenticateDevice(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  deviceId: string,
  apiKey?: string
): Promise<{ valid: boolean; device?: any; userId?: string }> {
  // First, try to find device by ID
  const { data: device, error } = await supabase
    .from('iot_devices')
    .select('*, user_id')
    .eq('device_id', deviceId)
    .single();

  if (error || !device) {
    return { valid: false };
  }

  // If device has an API key, verify it
  if (device.api_key_hash && apiKey) {
    // In production, use proper bcrypt comparison
    // For now, simple comparison (the api_key_hash should store plain key for MVP)
    if (device.api_key_hash !== apiKey) {
      return { valid: false };
    }
  }

  // Check if device is active
  if (!device.is_active) {
    return { valid: false };
  }

  return {
    valid: true,
    device,
    userId: device.user_id,
  };
}

// =============================================================================
// HANDLERS
// =============================================================================

async function handleSingleReading(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  reading: IoTReading,
  userId: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  // Validate device exists and belongs to user
  const { data: device, error: deviceError } = await supabase
    .from('iot_devices')
    .select('id, location_id')
    .eq('device_id', reading.device_id)
    .eq('user_id', userId)
    .single();

  if (deviceError || !device) {
    return { success: false, error: 'Device not found or access denied' };
  }

  // Use device's location if not specified in reading
  const locationId = reading.location_id || device.location_id;

  if (!locationId) {
    return { success: false, error: 'No location specified for reading' };
  }

  // Calculate VPD if temperature and humidity are present
  let vpd = reading.vpd;
  if (vpd === undefined && reading.temperature !== undefined && reading.humidity !== undefined) {
    vpd = calculateVPD(reading.temperature, reading.humidity);
  }

  // Insert reading
  const { data: inserted, error: insertError } = await supabase
    .from('iot_readings')
    .insert({
      device_id: device.id,
      location_id: locationId,
      user_id: userId,
      reading_at: reading.reading_at || new Date().toISOString(),
      temperature: reading.temperature,
      humidity: reading.humidity,
      co2_ppm: reading.co2_ppm,
      vpd,
      light_level: reading.light_level,
      light_par: reading.light_par,
      air_flow: reading.air_flow,
      substrate_moisture: reading.substrate_moisture,
      substrate_temperature: reading.substrate_temperature,
      pressure: reading.pressure,
      custom_data: reading.custom_data,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return { success: false, error: 'Failed to store reading' };
  }

  // Update device last_seen
  await supabase
    .from('iot_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', device.id);

  // Check alert thresholds
  await checkAlertThresholds(supabase, { ...reading, vpd }, locationId);

  return { success: true, id: inserted.id };
}

async function handleBatchReadings(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  readings: IoTReading[],
  userId: string
): Promise<{ success: boolean; inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  // Process each reading
  for (let i = 0; i < readings.length; i++) {
    const result = await handleSingleReading(supabase, readings[i], userId);
    if (result.success) {
      inserted++;
    } else {
      errors.push(`Reading ${i}: ${result.error}`);
    }
  }

  return {
    success: inserted > 0,
    inserted,
    errors,
  };
}

async function handleDeviceRegistration(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  registration: NonNullable<IoTIngestRequest['register_device']>,
  userId: string
): Promise<{ success: boolean; device?: any; api_key?: string; error?: string }> {
  // Check if device already exists
  const { data: existing } = await supabase
    .from('iot_devices')
    .select('id')
    .eq('device_id', registration.device_id)
    .single();

  if (existing) {
    return { success: false, error: 'Device ID already registered' };
  }

  // Generate API key for device
  const apiKey = crypto.randomUUID();

  // Insert device
  const { data: device, error } = await supabase
    .from('iot_devices')
    .insert({
      device_id: registration.device_id,
      user_id: userId,
      device_type: registration.device_type,
      name: registration.name,
      location_id: registration.location_id,
      capabilities: registration.capabilities,
      firmware_version: registration.firmware_version,
      api_key_hash: apiKey, // In production, this should be hashed
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Device registration error:', error);
    return { success: false, error: 'Failed to register device' };
  }

  return {
    success: true,
    device,
    api_key: apiKey, // Return once for user to save
  };
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const request: IoTIngestRequest = await req.json();

    // Authenticate
    let userId: string | undefined;

    // Try device API key authentication first (for IoT devices)
    if (request.api_key && (request.reading?.device_id || request.readings?.[0]?.device_id)) {
      const deviceId = request.reading?.device_id || request.readings?.[0]?.device_id;
      if (deviceId) {
        const auth = await authenticateDevice(supabase, deviceId, request.api_key);
        if (auth.valid) {
          userId = auth.userId;
        }
      }
    }

    // Fall back to user authentication (for web app)
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route to appropriate handler
    if (request.register_device) {
      const result = await handleDeviceRegistration(supabase, request.register_device, userId);
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 201 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (request.readings && request.readings.length > 0) {
      const result = await handleBatchReadings(supabase, request.readings, userId);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.reading) {
      const result = await handleSingleReading(supabase, request.reading, userId);
      return new Response(
        JSON.stringify(result),
        {
          status: result.success ? 201 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'No reading or device registration provided' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IoT Ingest error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
