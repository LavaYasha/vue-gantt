import { computed, ref, useSlots, type Ref } from 'vue'
import { useGanttContext } from './useGanttContext'

/**
 * Hover state + visibility for an opt-in bar/milestone tooltip. Shared by
 * `GanttTask` and `GanttMilestone` so the enable rule lives in one place: the
 * tooltip is on when the `tooltip` config flag is set or a `tooltip` slot is
 * provided, and is hidden while the item is being dragged.
 *
 * `useSlots()` reads the calling component's slots, so each component sees its
 * own `tooltip` slot.
 */
export function useHoverTooltip(dragging: Ref<boolean>) {
  const ctx = useGanttContext()
  const slots = useSlots()
  const hovered = ref(false)
  const show = computed(
    () => (ctx.config.value.tooltip || !!slots.tooltip) && hovered.value && !dragging.value,
  )
  return { hovered, show }
}
