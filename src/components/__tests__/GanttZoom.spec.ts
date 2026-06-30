import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { useGanttContext } from '../../composables/useGanttContext'
import { DEFAULT_ZOOM_LEVELS } from '../../zoom'
import Gantt from '../Gantt.vue'
import GanttRoot from '../GanttRoot.vue'
import GanttZoom from '../GanttZoom.vue'
import type { GanttContext, GanttRow as GanttRowData, GanttZoomEvent } from '../../types'

const rows: GanttRowData[] = [
  { id: 'r1', tasks: [{ id: 'a', start: '2026-01-01', end: '2026-01-05' }] },
]

// Typed view over the imperative API both Gantt and GanttRoot expose via ref.
interface ZoomApi {
  setZoom: (id: string) => void
  zoomIn: () => void
  zoomOut: () => void
}
const api = (wrapper: { vm: unknown }) => wrapper.vm as unknown as ZoomApi

describe('zoom — axis driven by the active level', () => {
  it('overrides tiers and base unit from the zoom level (month preset)', () => {
    // Arrange + Act: month preset is tiers ['quarter','month','week'] @ 48px.
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })

    // Assert: three stacked tier rows, ordered coarse→fine.
    const tierRows = wrapper.findAll('.gantt-timeline__row')
    expect(tierRows.map(r => r.attributes('data-tier'))).toEqual(['quarter', 'month', 'week'])

    // Base (finest) unit is the last tier → week.
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('week')

    // Density comes from the preset's columnWidth (48px), not the prop default.
    const style = wrapper.find('.gantt-root').attributes('style') ?? ''
    expect(style).toContain('--gantt-column-width: 48px')
  })

  it('lets a static :zoom override the explicit tiers/columnWidth props', () => {
    const wrapper = mount(Gantt, {
      props: { rows, tiers: ['day'], columnWidth: 99, zoom: 'year' },
    })
    // Year preset wins: tiers ['year','quarter'], base unit quarter.
    expect(wrapper.findAll('.gantt-timeline__row').map(r => r.attributes('data-tier'))).toEqual([
      'year',
      'quarter',
    ])
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('quarter')
    const style = wrapper.find('.gantt-root').attributes('style') ?? ''
    expect(style).toContain('--gantt-column-width: 64px')
  })

  it('falls back to the tiers/columnWidth props when no zoom is active', () => {
    const wrapper = mount(Gantt, { props: { rows, tiers: ['day', 'week'], columnWidth: 33 } })
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('day')
    const style = wrapper.find('.gantt-root').attributes('style') ?? ''
    expect(style).toContain('--gantt-column-width: 33px')
  })
})

describe('zoom — imperative API on Gantt', () => {
  it('zoomIn steps to the next finer level and emits update:zoom + zoom-change', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })

    api(wrapper).zoomIn()
    await nextTick()

    // coarse→fine: month → week.
    expect(wrapper.emitted('update:zoom')).toEqual([['week']])
    const change = wrapper.emitted('zoom-change') as [GanttZoomEvent][]
    expect(change).toHaveLength(1)
    expect(change[0]![0].id).toBe('week')
    expect(change[0]![0].level.id).toBe('week')
  })

  it('zoomOut steps to the next coarser level', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })
    api(wrapper).zoomOut()
    await nextTick()
    // month → quarter.
    expect(wrapper.emitted('update:zoom')).toEqual([['quarter']])
  })

  it('clamps zoomIn at the finest level (active level stays at hour)', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'hour' } })
    api(wrapper).zoomIn()
    await nextTick()
    // The active level does not advance past the finest preset: base unit stays 'hour'.
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('hour')
    // A clamped step re-selects the active level, which is a no-op (no event).
    expect(wrapper.emitted('update:zoom')).toBeUndefined()
  })

  it('clamps zoomOut at the coarsest level (active level stays at year)', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'year' } })
    api(wrapper).zoomOut()
    await nextTick()
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('quarter')
    // A clamped step re-selects the active level, which is a no-op (no event).
    expect(wrapper.emitted('update:zoom')).toBeUndefined()
  })

  it('setZoom activates an arbitrary level by id', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })
    api(wrapper).setZoom('day')
    await nextTick()
    expect(wrapper.emitted('update:zoom')).toEqual([['day']])
  })

  it('ignores setZoom for an unknown level id', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })
    api(wrapper).setZoom('nope')
    await nextTick()
    expect(wrapper.emitted('update:zoom')).toBeUndefined()
  })
})

describe('zoom — imperative API on GanttRoot (+ activeZoom)', () => {
  it('exposes activeZoom and updates it on setZoom', async () => {
    const wrapper = mount(GanttRoot, {
      props: { rows, zoom: 'week' },
      slots: { default: () => h('div') },
    })
    // The exposed computed ref is auto-unwrapped on the instance proxy.
    const vm = wrapper.vm as unknown as ZoomApi & { activeZoom: string | undefined }
    expect(vm.activeZoom).toBe('week')

    vm.setZoom('day')
    await nextTick()
    expect(vm.activeZoom).toBe('day')
    expect(wrapper.emitted('update:zoom')).toEqual([['day']])
  })

  it('zoomIn/zoomOut work standalone without an explicit zoom prop', async () => {
    // No `zoom`: the step anchor is the first level whose base (finest) tier
    // matches the axis. Default unit is 'day'; the first such preset is 'week'
    // (tiers ['month','week','day']), so zoomIn steps one finer → 'day'.
    const wrapper = mount(GanttRoot, {
      props: { rows },
      slots: { default: () => h('div') },
    })
    api(wrapper).zoomIn()
    await nextTick()
    expect(wrapper.emitted('update:zoom')).toEqual([['day']])
  })
})

describe('zoom — v-model:zoom reactivity', () => {
  it('re-renders the axis when the zoom prop changes externally', async () => {
    const wrapper = mount(Gantt, { props: { rows, zoom: 'month' } })
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('week')

    // Act: parent updates the v-model value.
    await wrapper.setProps({ zoom: 'day' })

    // Day preset is tiers ['week','day'] → base unit day.
    expect(wrapper.find('.gantt-root').attributes('data-unit')).toBe('day')
    expect(wrapper.findAll('.gantt-timeline__row').map(r => r.attributes('data-tier'))).toEqual([
      'week',
      'day',
    ])
  })
})

// Helper: mount GanttZoom inside a GanttRoot context, capturing the root context
// so assertions can read the active level. Uses the declarative GanttRoot slot.
function mountZoom(props: Record<string, unknown> = {}) {
  let ctx!: GanttContext
  const Capture = {
    setup() {
      ctx = useGanttContext()
      return () => h('div')
    },
  }
  const wrapper = mount(GanttRoot, {
    props: { rows, ...props },
    slots: { default: () => [h(GanttZoom), h(Capture)] },
  })
  return { wrapper, ctx: () => ctx }
}

describe('GanttZoom control', () => {
  it('renders two buttons and a select with one option per level', () => {
    const { wrapper } = mountZoom({ zoom: 'week' })
    expect(wrapper.find('.gantt-zoom__btn--out').exists()).toBe(true)
    expect(wrapper.find('.gantt-zoom__btn--in').exists()).toBe(true)
    const select = wrapper.find('select.gantt-zoom__select')
    expect(select.exists()).toBe(true)
    expect(select.findAll('option')).toHaveLength(DEFAULT_ZOOM_LEVELS.length)
    expect((select.element as HTMLSelectElement).value).toBe('week')
  })

  it('the + button zooms in (week → day) and updates the active level', async () => {
    const { wrapper, ctx } = mountZoom({ zoom: 'week' })
    await wrapper.find('.gantt-zoom__btn--in').trigger('click')
    await nextTick()
    expect(ctx().activeZoom.value).toBe('day')
    expect(wrapper.emitted('update:zoom')).toEqual([['day']])
  })

  it('the − button zooms out (week → month)', async () => {
    const { wrapper, ctx } = mountZoom({ zoom: 'week' })
    await wrapper.find('.gantt-zoom__btn--out').trigger('click')
    await nextTick()
    expect(ctx().activeZoom.value).toBe('month')
    expect(wrapper.emitted('update:zoom')).toEqual([['month']])
  })

  it('changing the select calls setZoom with the chosen level', async () => {
    const { wrapper, ctx } = mountZoom({ zoom: 'week' })
    // setValue both sets the value and dispatches the change event.
    const select = wrapper.find('select.gantt-zoom__select')
    await select.setValue('year')
    await nextTick()
    expect(ctx().activeZoom.value).toBe('year')
    expect(wrapper.emitted('update:zoom')).toEqual([['year']])
  })

  it('disables the zoom-in button at the finest level', () => {
    const { wrapper } = mountZoom({ zoom: 'hour' })
    expect(wrapper.find('.gantt-zoom__btn--in').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.gantt-zoom__btn--out').attributes('disabled')).toBeUndefined()
  })

  it('disables the zoom-out button at the coarsest level', () => {
    const { wrapper } = mountZoom({ zoom: 'year' })
    expect(wrapper.find('.gantt-zoom__btn--out').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.gantt-zoom__btn--in').attributes('disabled')).toBeUndefined()
  })
})
