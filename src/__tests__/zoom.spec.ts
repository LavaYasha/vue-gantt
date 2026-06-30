import { describe, expect, it } from 'vitest'
import { DEFAULT_ZOOM_LEVELS } from '../zoom'
import type { GanttUnit } from '../types'

// Coarse → fine ranking (mirrors GanttRoot's TIER_RANK). The base (finest) tier
// of each level is its last entry; levels are ordered by that rank ascending.
const TIER_RANK: Record<GanttUnit, number> = {
  year: 0,
  quarter: 1,
  month: 2,
  week: 3,
  day: 4,
  hour: 5,
  minute: 6,
}

const ALL_UNITS = new Set<GanttUnit>(Object.keys(TIER_RANK) as GanttUnit[])

describe('DEFAULT_ZOOM_LEVELS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(DEFAULT_ZOOM_LEVELS)).toBe(true)
    expect(DEFAULT_ZOOM_LEVELS.length).toBeGreaterThan(0)
  })

  it('has unique level ids', () => {
    const ids = DEFAULT_ZOOM_LEVELS.map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('exposes a label and a positive columnWidth per level', () => {
    for (const level of DEFAULT_ZOOM_LEVELS) {
      expect(typeof level.label).toBe('string')
      expect(level.label!.length).toBeGreaterThan(0)
      expect(level.columnWidth).toBeGreaterThan(0)
    }
  })

  it('lists at least one valid GanttUnit per level in tiers', () => {
    for (const level of DEFAULT_ZOOM_LEVELS) {
      expect(level.tiers.length).toBeGreaterThan(0)
      for (const tier of level.tiers) {
        expect(ALL_UNITS.has(tier)).toBe(true)
      }
    }
  })

  it('keeps tiers within each level ordered coarse → fine', () => {
    for (const level of DEFAULT_ZOOM_LEVELS) {
      const ranks = level.tiers.map(t => TIER_RANK[t])
      const sorted = [...ranks].sort((a, b) => a - b)
      expect(ranks).toEqual(sorted)
    }
  })

  it('orders the levels coarse → fine by their base (finest) tier', () => {
    const baseRanks = DEFAULT_ZOOM_LEVELS.map(l => TIER_RANK[l.tiers[l.tiers.length - 1]!])
    const sorted = [...baseRanks].sort((a, b) => a - b)
    expect(baseRanks).toEqual(sorted)
  })

  it('places day after month (base unit ordering sanity check)', () => {
    const byId = (id: string) => DEFAULT_ZOOM_LEVELS.findIndex(l => l.id === id)
    expect(byId('month')).toBeLessThan(byId('day'))
    expect(byId('year')).toBeLessThan(byId('hour'))
  })
})
