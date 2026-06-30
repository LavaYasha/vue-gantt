<script setup lang="ts">
import { useGanttContext } from '../composables/useGanttContext'

// A headless zoom/view-mode control. Reads the shared context, so it must be
// placed inside a `GanttRoot` (e.g. in the `corner` slot). The default render is
// a − / level-select / + control; override it entirely via the default slot.
const { zoomLevels, activeZoom, canZoomIn, canZoomOut, setZoom, zoomIn, zoomOut } =
  useGanttContext()

function onSelect(event: Event): void {
  setZoom((event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="gantt-zoom">
    <slot
      :levels="zoomLevels"
      :active="activeZoom"
      :set-zoom="setZoom"
      :zoom-in="zoomIn"
      :zoom-out="zoomOut"
      :can-zoom-in="canZoomIn"
      :can-zoom-out="canZoomOut"
    >
      <button
        type="button"
        class="gantt-zoom__btn gantt-zoom__btn--out"
        :disabled="!canZoomOut"
        aria-label="Zoom out"
        @click="zoomOut()"
      >
        −
      </button>
      <select
        class="gantt-zoom__select"
        :value="activeZoom"
        aria-label="Zoom level"
        @change="onSelect"
      >
        <option v-for="level in zoomLevels" :key="level.id" :value="level.id">
          {{ level.label ?? level.id }}
        </option>
      </select>
      <button
        type="button"
        class="gantt-zoom__btn gantt-zoom__btn--in"
        :disabled="!canZoomIn"
        aria-label="Zoom in"
        @click="zoomIn()"
      >
        +
      </button>
    </slot>
  </div>
</template>

<style scoped>
.gantt-zoom {
  display: inline-flex;
  align-items: center;
  gap: var(--gantt-zoom-gap, 4px);
  padding: var(--gantt-zoom-padding, 4px);
}

.gantt-zoom__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--gantt-zoom-btn-size, 24px);
  height: var(--gantt-zoom-btn-size, 24px);
  padding: 0;
  font: inherit;
  line-height: 1;
  color: var(--gantt-zoom-color, inherit);
  background: var(--gantt-zoom-btn-bg, transparent);
  border: var(--gantt-zoom-border, 1px solid var(--gantt-grid-color, #e5e7eb));
  border-radius: var(--gantt-zoom-radius, 4px);
  cursor: pointer;
}

.gantt-zoom__btn:hover:not(:disabled) {
  background: var(--gantt-zoom-btn-hover-bg, rgb(0 0 0 / 6%));
}

.gantt-zoom__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.gantt-zoom__select {
  font: inherit;
  color: var(--gantt-zoom-color, inherit);
  background: var(--gantt-zoom-select-bg, transparent);
  border: var(--gantt-zoom-border, 1px solid var(--gantt-grid-color, #e5e7eb));
  border-radius: var(--gantt-zoom-radius, 4px);
  padding: var(--gantt-zoom-select-padding, 2px 6px);
  cursor: pointer;
}
</style>
