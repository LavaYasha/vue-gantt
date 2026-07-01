import type { Meta, StoryObj } from '@storybook/vue3-vite'
import GanttGrid from '../components/GanttGrid.vue'
import GanttRoot from '../components/GanttRoot.vue'
import GanttRow from '../components/GanttRow.vue'
import GanttTask from '../components/GanttTask.vue'
import GanttTaskList from '../components/GanttTaskList.vue'
import GanttTimeline from '../components/GanttTimeline.vue'
import GanttZoom from '../components/GanttZoom.vue'

/**
 * A headless zoom / view-mode control: − / level-select / +. It reads the shared
 * context, so it must live inside a `GanttRoot` (typically the `corner` slot).
 * Switching a level overrides the chart's `tiers`/`columnWidth` with that level's
 * preset (`DEFAULT_ZOOM_LEVELS` by default). Override the markup entirely via the
 * default slot, which exposes
 * `{ levels, active, setZoom, zoomIn, zoomOut, canZoomIn, canZoomOut }`.
 */
const meta: Meta<typeof GanttZoom> = {
  title: 'Components/GanttZoom',
  component: GanttZoom,
  tags: ['autodocs'],
}
export default meta

type Story = StoryObj<typeof GanttZoom>

const components = {
  GanttRoot,
  GanttTaskList,
  GanttTimeline,
  GanttGrid,
  GanttRow,
  GanttTask,
  GanttZoom,
}

/** Default control in the sidebar/header corner, driving the chart's zoom. */
export const Default: Story = {
  render: () => ({
    components,
    template: /* html */ `
      <GanttRoot zoom="week">
        <div class="sb-chart">
          <div class="sb-chart__side">
            <div class="sb-chart__corner"><GanttZoom /></div>
            <GanttTaskList />
          </div>
          <div class="sb-chart__main">
            <GanttTimeline />
            <div class="sb-chart__body">
              <GanttGrid />
              <GanttRow id="backend" name="Backend">
                <GanttTask id="t1" name="Spec" start="2026-06-02" end="2026-06-10" :progress="80" />
              </GanttRow>
              <GanttRow id="frontend" name="Frontend">
                <GanttTask id="t2" name="UI" start="2026-06-10" end="2026-06-20" :progress="40" />
              </GanttRow>
            </div>
          </div>
        </div>
      </GanttRoot>
    `,
  }),
}

/**
 * Custom UI via the default slot: build your own buttons from the exposed
 * `{ levels, active, setZoom, canZoomIn, canZoomOut, zoomIn, zoomOut }`.
 */
export const CustomControl: Story = {
  render: () => ({
    components,
    template: /* html */ `
      <GanttRoot zoom="month">
        <div class="sb-chart">
          <div class="sb-chart__side">
            <div class="sb-chart__corner">
              <GanttZoom>
                <template #default="{ levels, active, setZoom }">
                  <div style="display:flex;gap:4px;flex-wrap:wrap">
                    <button
                      v-for="level in levels"
                      :key="level.id"
                      type="button"
                      :style="{
                        font: 'inherit', padding: '2px 6px', cursor: 'pointer',
                        borderRadius: '4px',
                        border: '1px solid var(--gantt-grid-color, #e5e7eb)',
                        fontWeight: level.id === active ? 600 : 400,
                      }"
                      @click="setZoom(level.id)"
                    >
                      {{ level.label ?? level.id }}
                    </button>
                  </div>
                </template>
              </GanttZoom>
            </div>
            <GanttTaskList />
          </div>
          <div class="sb-chart__main">
            <GanttTimeline />
            <div class="sb-chart__body">
              <GanttGrid />
              <GanttRow id="backend" name="Backend">
                <GanttTask id="t1" name="Spec" start="2026-06-02" end="2026-06-10" :progress="80" />
              </GanttRow>
              <GanttRow id="frontend" name="Frontend">
                <GanttTask id="t2" name="UI" start="2026-06-10" end="2026-06-20" :progress="40" />
              </GanttRow>
            </div>
          </div>
        </div>
      </GanttRoot>
    `,
  }),
}
