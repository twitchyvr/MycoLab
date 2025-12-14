// ============================================================================
// TODAY VIEW - Daily Dashboard Widget
// Shows actionable items, upcoming tasks, and status at a glance
// ============================================================================

import React, { useMemo, useState } from 'react';
import { useData } from '../../store';
import type { Culture, Grow, GrowStage } from '../../store/types';

// ============================================================================
// TYPES
// ============================================================================

interface TodayTask {
  id: string;
  type: 'culture' | 'grow' | 'harvest' | 'check' | 'milestone';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  entityId: string;
  entityType: 'culture' | 'grow';
  entityName: string;
  dueInfo?: string;
  action?: string;
}

type Page = 'dashboard' | 'today' | 'inventory' | 'stock' | 'cultures' | 'lineage' | 'grows' | 'recipes' | 'calculator' | 'spawnrate' | 'pressure' | 'contamination' | 'efficiency' | 'analytics' | 'settings' | 'devlog';

interface TodayViewProps {
  onNavigate?: (page: Page) => void;
}

// ============================================================================
// ICONS
// ============================================================================

const Icons = {
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Sprout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/>
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Mushroom: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 2L12 22"/><path d="M17 7C17 7 13 9 12 14"/><path d="M7 7C7 7 11 9 12 14"/>
      <path d="M19 12C19 12 15 13 12 17"/><path d="M5 12C5 12 9 13 12 17"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Target: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  Flame: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDaysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// ============================================================================
// TASK GENERATION
// ============================================================================

function generateCultureTasks(cultures: Culture[], strains: any[]): TodayTask[] {
  const tasks: TodayTask[] = [];
  const today = new Date();

  for (const culture of cultures) {
    if (culture.status === 'archived' || culture.status === 'depleted' || culture.status === 'contaminated') {
      continue;
    }

    const strain = strains.find(s => s.id === culture.strainId);
    const strainName = strain?.name || 'Unknown strain';
    const daysSinceCreation = getDaysSince(culture.createdAt);

    // Check for cultures that are colonizing and may be ready
    if (culture.status === 'colonizing') {
      const expectedDays = strain?.colonizationDays?.max || 21;
      const daysRemaining = expectedDays - daysSinceCreation;

      if (daysRemaining <= 0) {
        tasks.push({
          id: `culture-ready-${culture.id}`,
          type: 'culture',
          priority: 'high',
          title: `Check ${culture.label} for full colonization`,
          description: `${strainName} - Expected colonization complete`,
          entityId: culture.id,
          entityType: 'culture',
          entityName: culture.label,
          dueInfo: `Day ${daysSinceCreation} of ~${expectedDays}`,
          action: 'Check colonization progress',
        });
      } else if (daysRemaining <= 3) {
        tasks.push({
          id: `culture-soon-${culture.id}`,
          type: 'culture',
          priority: 'medium',
          title: `${culture.label} nearing full colonization`,
          description: `${strainName} - ~${daysRemaining} days remaining`,
          entityId: culture.id,
          entityType: 'culture',
          entityName: culture.label,
          dueInfo: `Day ${daysSinceCreation} of ~${expectedDays}`,
        });
      }
    }

    // Check for cultures with low health rating
    if (culture.healthRating && culture.healthRating <= 3) {
      tasks.push({
        id: `culture-health-${culture.id}`,
        type: 'check',
        priority: 'urgent',
        title: `Low health rating: ${culture.label}`,
        description: `${strainName} - Health rating: ${culture.healthRating}/10`,
        entityId: culture.id,
        entityType: 'culture',
        entityName: culture.label,
        action: 'Inspect for contamination',
      });
    }

    // Check for expiring cultures (spore syringes, etc.)
    if (culture.expiresAt) {
      const daysUntilExpiry = getDaysUntil(culture.expiresAt);
      if (daysUntilExpiry <= 0) {
        tasks.push({
          id: `culture-expired-${culture.id}`,
          type: 'check',
          priority: 'urgent',
          title: `${culture.label} has expired`,
          description: `${strainName} - Review and archive`,
          entityId: culture.id,
          entityType: 'culture',
          entityName: culture.label,
          action: 'Review and update status',
        });
      } else if (daysUntilExpiry <= 14) {
        tasks.push({
          id: `culture-expiring-${culture.id}`,
          type: 'culture',
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: `${culture.label} expiring soon`,
          description: `${strainName} - ${daysUntilExpiry} days until expiry`,
          entityId: culture.id,
          entityType: 'culture',
          entityName: culture.label,
          dueInfo: `Expires in ${daysUntilExpiry} days`,
          action: 'Use or transfer before expiry',
        });
      }
    }
  }

  return tasks;
}

function generateGrowTasks(grows: Grow[], strains: any[]): TodayTask[] {
  const tasks: TodayTask[] = [];

  for (const grow of grows) {
    if (grow.status !== 'active') continue;

    const strain = strains.find(s => s.id === grow.strainId);
    const strainName = strain?.name || 'Unknown strain';

    // Calculate days in current stage
    let stageStartDate: Date;
    switch (grow.currentStage) {
      case 'colonization':
        stageStartDate = grow.colonizationStartedAt || grow.spawnedAt;
        break;
      case 'fruiting':
        stageStartDate = grow.fruitingStartedAt || grow.spawnedAt;
        break;
      default:
        stageStartDate = grow.spawnedAt;
    }
    const daysInStage = getDaysSince(stageStartDate);

    // Stage-specific tasks
    if (grow.currentStage === 'spawning') {
      // Spawning stage - check after 2-3 days for signs of growth
      if (daysInStage >= 3) {
        tasks.push({
          id: `grow-spawn-check-${grow.id}`,
          type: 'check',
          priority: 'medium',
          title: `Check ${grow.name} spawn progress`,
          description: `${strainName} - Day ${daysInStage} of spawning`,
          entityId: grow.id,
          entityType: 'grow',
          entityName: grow.name,
          dueInfo: `Day ${daysInStage}`,
          action: 'Look for mycelium growth',
        });
      }
    }

    if (grow.currentStage === 'colonization') {
      const expectedDays = strain?.colonizationDays?.max || 21;
      const daysRemaining = expectedDays - daysInStage;

      if (daysRemaining <= 0) {
        tasks.push({
          id: `grow-colonized-${grow.id}`,
          type: 'milestone',
          priority: 'high',
          title: `${grow.name} may be fully colonized`,
          description: `${strainName} - Ready for fruiting conditions?`,
          entityId: grow.id,
          entityType: 'grow',
          entityName: grow.name,
          dueInfo: `Day ${daysInStage} of ~${expectedDays}`,
          action: 'Check colonization and initiate fruiting',
        });
      } else if (daysRemaining <= 3) {
        tasks.push({
          id: `grow-colonization-soon-${grow.id}`,
          type: 'grow',
          priority: 'medium',
          title: `${grow.name} nearing full colonization`,
          description: `${strainName} - ~${daysRemaining} days remaining`,
          entityId: grow.id,
          entityType: 'grow',
          entityName: grow.name,
          dueInfo: `Day ${daysInStage} of ~${expectedDays}`,
        });
      }
    }

    if (grow.currentStage === 'fruiting') {
      const expectedPinDays = 10; // Typical pin formation time
      const expectedHarvestDays = strain?.fruitingDays?.max || 14;

      // Check for pins
      if (!grow.firstPinsAt && daysInStage >= expectedPinDays) {
        tasks.push({
          id: `grow-pins-check-${grow.id}`,
          type: 'check',
          priority: 'high',
          title: `Check ${grow.name} for pins`,
          description: `${strainName} - Day ${daysInStage} of fruiting`,
          entityId: grow.id,
          entityType: 'grow',
          entityName: grow.name,
          dueInfo: `Day ${daysInStage} in fruiting`,
          action: 'Look for pin formation',
        });
      }

      // Check for harvest readiness
      if (grow.firstPinsAt) {
        const daysSincePins = getDaysSince(grow.firstPinsAt);
        if (daysSincePins >= 5) {
          tasks.push({
            id: `grow-harvest-check-${grow.id}`,
            type: 'harvest',
            priority: 'urgent',
            title: `${grow.name} may be ready to harvest`,
            description: `${strainName} - ${daysSincePins} days since first pins`,
            entityId: grow.id,
            entityType: 'grow',
            entityName: grow.name,
            dueInfo: `${daysSincePins} days since pins`,
            action: 'Check veil break and harvest',
          });
        }
      }

      // Daily misting/FAE reminder for fruiting grows
      tasks.push({
        id: `grow-fae-${grow.id}`,
        type: 'check',
        priority: 'low',
        title: `Maintain FAE for ${grow.name}`,
        description: `${strainName} - Day ${daysInStage} fruiting`,
        entityId: grow.id,
        entityType: 'grow',
        entityName: grow.name,
        action: 'Check humidity and fresh air exchange',
      });
    }

    if (grow.currentStage === 'harvesting') {
      tasks.push({
        id: `grow-harvest-${grow.id}`,
        type: 'harvest',
        priority: 'urgent',
        title: `Active harvest: ${grow.name}`,
        description: `${strainName} - Harvest mature fruits`,
        entityId: grow.id,
        entityType: 'grow',
        entityName: grow.name,
        action: 'Pick mature mushrooms before spore drop',
      });
    }
  }

  return tasks;
}

// ============================================================================
// COMPONENTS
// ============================================================================

const TaskCard: React.FC<{
  task: TodayTask;
  onComplete?: () => void;
  onNavigate?: () => void;
}> = ({ task, onComplete, onNavigate }) => {
  const priorityColors = {
    urgent: 'border-red-500/50 bg-red-950/20',
    high: 'border-orange-500/50 bg-orange-950/20',
    medium: 'border-amber-500/50 bg-amber-950/20',
    low: 'border-zinc-600 bg-zinc-900/50',
  };

  const priorityBadge = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',
  };

  const typeIcons = {
    culture: <Icons.Droplet />,
    grow: <Icons.Sprout />,
    harvest: <Icons.Mushroom />,
    check: <Icons.AlertCircle />,
    milestone: <Icons.Target />,
  };

  return (
    <div className={`border rounded-lg p-3 transition-all hover:border-zinc-500 ${priorityColors[task.priority]}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-zinc-400">
          {typeIcons[task.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityBadge[task.priority]}`}>
              {task.priority}
            </span>
            {task.dueInfo && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Icons.Clock />
                {task.dueInfo}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
          <p className="text-xs text-zinc-400 mt-0.5">{task.description}</p>
          {task.action && (
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <Icons.ChevronRight />
              {task.action}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onComplete && (
            <button
              onClick={onComplete}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
              title="Mark as done"
            >
              <Icons.Check />
            </button>
          )}
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              title="View details"
            >
              <Icons.ChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatPill: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}> = ({ icon, label, value, color }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700`}>
    <span className={color}>{icon}</span>
    <span className="text-xs text-zinc-400">{label}</span>
    <span className={`text-sm font-semibold ${color}`}>{value}</span>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TodayView: React.FC<TodayViewProps> = ({ onNavigate }) => {
  const { state, activeStrains } = useData();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'urgent' | 'cultures' | 'grows'>('all');

  // Generate all tasks
  const allTasks = useMemo(() => {
    const cultureTasks = generateCultureTasks(state.cultures, activeStrains);
    const growTasks = generateGrowTasks(state.grows, activeStrains);
    return [...cultureTasks, ...growTasks];
  }, [state.cultures, state.grows, activeStrains]);

  // Filter out completed and apply filter
  const visibleTasks = useMemo(() => {
    let tasks = allTasks.filter(t => !completedTasks.has(t.id));

    switch (filter) {
      case 'urgent':
        tasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
        break;
      case 'cultures':
        tasks = tasks.filter(t => t.entityType === 'culture');
        break;
      case 'grows':
        tasks = tasks.filter(t => t.entityType === 'grow');
        break;
    }

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [allTasks, completedTasks, filter]);

  // Stats
  const stats = useMemo(() => ({
    activeCultures: state.cultures.filter(c => c.status === 'active' || c.status === 'colonizing').length,
    activeGrows: state.grows.filter(g => g.status === 'active').length,
    fruitingGrows: state.grows.filter(g => g.status === 'active' && g.currentStage === 'fruiting').length,
    urgentTasks: allTasks.filter(t => !completedTasks.has(t.id) && (t.priority === 'urgent' || t.priority === 'high')).length,
  }), [state.cultures, state.grows, allTasks, completedTasks]);

  const handleCompleteTask = (taskId: string) => {
    setCompletedTasks(prev => new Set([...prev, taskId]));
  };

  const handleNavigateToEntity = (entityType: string) => {
    if (onNavigate) {
      const page: Page = entityType === 'culture' ? 'cultures' : 'grows';
      onNavigate(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-800/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Icons.Sun />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{getGreeting()}</h2>
            <p className="text-sm text-zinc-400">{formatDate(new Date())}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 mt-4">
          <StatPill
            icon={<Icons.Droplet />}
            label="Cultures"
            value={stats.activeCultures}
            color="text-blue-400"
          />
          <StatPill
            icon={<Icons.Sprout />}
            label="Active Grows"
            value={stats.activeGrows}
            color="text-emerald-400"
          />
          <StatPill
            icon={<Icons.Mushroom />}
            label="Fruiting"
            value={stats.fruitingGrows}
            color="text-purple-400"
          />
          {stats.urgentTasks > 0 && (
            <StatPill
              icon={<Icons.Flame />}
              label="Urgent"
              value={stats.urgentTasks}
              color="text-red-400"
            />
          )}
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-500">Filter:</span>
        {(['all', 'urgent', 'cultures', 'grows'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === f
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {f === 'all' ? 'All Tasks' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-xs text-zinc-500 ml-auto">
          {visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {visibleTasks.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Icons.Check />
            </div>
            <h3 className="text-white font-medium mb-1">All caught up!</h3>
            <p className="text-sm text-zinc-500">No tasks requiring attention right now.</p>
          </div>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleCompleteTask(task.id)}
              onNavigate={() => handleNavigateToEntity(task.entityType)}
            />
          ))
        )}
      </div>

      {/* Completed Tasks Count */}
      {completedTasks.size > 0 && (
        <div className="text-center">
          <button
            onClick={() => setCompletedTasks(new Set())}
            className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            {completedTasks.size} task{completedTasks.size !== 1 ? 's' : ''} completed today - Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayView;
