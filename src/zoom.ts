import type { GanttZoomLevel } from './types'

/**
 * Built-in zoom levels (view-mode presets), ordered **coarse → fine** — the
 * order `zoomIn` (toward finer) / `zoomOut` (toward coarser) step through. Each
 * bundles the timeline `tiers` with a `columnWidth` density tuned for that scale.
 * Pass your own array to the `zoomLevels` prop to override.
 */
export const DEFAULT_ZOOM_LEVELS: GanttZoomLevel[] = [
  { id: 'year', label: 'Year', tiers: ['year', 'quarter'], columnWidth: 64 },
  { id: 'quarter', label: 'Quarter', tiers: ['year', 'quarter', 'month'], columnWidth: 56 },
  { id: 'month', label: 'Month', tiers: ['quarter', 'month', 'week'], columnWidth: 48 },
  { id: 'week', label: 'Week', tiers: ['month', 'week', 'day'], columnWidth: 40 },
  { id: 'day', label: 'Day', tiers: ['week', 'day'], columnWidth: 40 },
  { id: 'hour', label: 'Hour', tiers: ['day', 'hour'], columnWidth: 44 },
]
