// ============================================================================
// PROJECT SCOPE DEFINITIONS
// In-scope, out-of-scope, and future considerations for Sporely
// ============================================================================

/**
 * Project scope definitions - what Sporely will and won't do
 * This helps guide development priorities and user expectations
 */
export const projectScope = {
  inScope: [
    // Core Tracking
    'Unified item view: spores, cultures (LC/agar/slants), spawn, bulk - single view with drill-down',
    'Culture tracking with full lineage, genetics, and source tracking',
    'Individual grow/block tracking: inoculation → colonization → harvest → disposal',
    '3-stage grow progression with configurable factors',
    'Strain library with difficulty ratings, cultivation tips, performance data',

    // Farm/Lab Mapping
    'Farm/lab mapping: rooms, racks, shelves, slots',
    'Location occupancy tracking: what\'s where, capacity, yields per room',
    'Room environmental metrics: temp, humidity, CO2 history',

    // Daily Operations
    'Growing room daily check workflow',
    'Harvest forecasting and 7-day predictions',
    'Cool room / fridge check feature',
    'Growing cycle planning',

    // Recipes & Substrates
    'Recipe/formula library with rich text notes',
    'Substrate hydration calculator (4 modes)',
    'Recipe-to-grow linking and performance tracking',

    // Documentation
    'Photo timeline and journaling',
    'Event/observation logging with timestamps',
    'Growth stage photo logging',

    // Supplies & Costs
    'Supplies/inventory management',
    'Full cost tracking: ingredients → recipes → grows → yields',
    'Cost analysis dashboard',
    'Wishlist and purchase planning',

    // Yields & Analytics
    'Harvest and yield logging (wet/dry, flushes, BE%)',
    'Performance analytics dashboard',
    'Success/failure pattern recognition',
    'Smarter reuse / duplication of successful setups',

    // QR & Printing
    'QR code generation for all items',
    'Label design and printing (WiFi/Bluetooth thermal + PDF)',
    'QR scanner integration',

    // Notifications
    'Smart notification system with configurable alerts',
    'Strain-specific notification rules',
    'Task management and reminders',

    // Configuration
    'Lookup table management (strains, vendors, locations, etc.)',
    'Configurable ID/label generation',
    'Procedure library (SOPs)',

    // Infrastructure
    'PostgreSQL database',
    'RESTful API',
    'User authentication',
    'Cloud file storage (Azure Blob / DO Spaces)',
    'Cloud deployment (DigitalOcean or Azure)',

    // Mobile
    'Mobile-first responsive design',
    'PWA with offline capability',

    // Data
    'Global search with advanced filtering',
    'Data export/import (CSV, JSON)',
    'Dark/light theme toggle',
  ],

  outOfScope: [
    // Explicitly v1.0 out of scope
    'Native mobile apps (iOS/Android) - PWA first',
    'Real-time sensor integration (manual entry for now)',
    'AI/ML contamination detection (future)',
    'Community/social features (sharing, Q&A) - v2.0+',
    'Multi-user collaboration - v2.0+',
    'Marketplace or vendor integration',
    'Automated ordering/restocking',
    'Third-party integrations (Notion, Airtable, etc.)',
    'Video storage/streaming',
    'Chat or messaging features',
    'Payment processing',
  ],

  futureConsiderations: [
    // v2.0 and beyond
    'Multi-user support with roles/permissions',
    'Team collaboration features (consensus forecasting, shared grows)',
    'Native iOS/Android apps (React Native)',
    'IoT sensor integration (temp, humidity, CO2 auto-logging)',
    'AI contamination detection from photos',
    'Community strain database',
    'Integration with lab equipment',
    'Voice commands for hands-free logging',
    'Augmented reality for QR scanning and info overlay',
    'Machine learning for yield prediction',
    'Integration with e-commerce for supply ordering',
  ],

  developmentPrinciples: [
    'Do as much or as little as you want - app works with minimal input but rewards detailed logging',
    'Lookup tables can always be updated without breaking historical data',
    'Mobile-friendly from day one - designed for use in the lab',
    'Data is yours - full export capability always available',
    'Cloud-first for notifications and multi-device sync',
    'Progressive enhancement - core features work offline (PWA)',
  ],
};

export default projectScope;

// Type for project scope
export type ProjectScope = typeof projectScope;
