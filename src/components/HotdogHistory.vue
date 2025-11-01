<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { formatDisplayTimestamp, type HotdogEntry } from '../composables/useHotdogStore'

interface Props {
  entries: HotdogEntry[]
}

interface Emits {
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const historyListRef = ref<HTMLElement | null>(null)

watch(() => props.entries.length, () => {
  nextTick(() => {
    if (historyListRef.value) {
      historyListRef.value.scrollTop = historyListRef.value.scrollHeight
    }
  })
})
</script>

<template>
  <section class="panel">
    <p v-if="entries.length === 0" class="empty">No hot dogs logged yet.</p>
    <ul v-else ref="historyListRef" class="history">
      <li v-for="entry in entries" :key="entry.id" class="history-row">
        <div class="history-toppings">
          <span v-for="topping in entry.toppings" :key="topping" class="badge">{{ topping }}</span>
        </div>
        <div class="history-footer">
          <span class="history-date">{{ formatDisplayTimestamp(entry.createdAt) }}</span>
          <button type="button" class="delete-btn" @click="emit('delete', entry.id)">削除</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.panel {
  background: #ffffff;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
}

.panel h2 {
  margin: 0;
  color: #0f172a;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.history {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.history-row {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: #fafbfc;
}

.history-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.history-date {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 400;
}

.history-toppings {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.badge {
  background: #e2e8f0;
  color: #0f172a;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
}

.empty {
  margin: 0;
  color: #94a3b8;
  flex-shrink: 0;
}

.delete-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.delete-btn:hover {
  color: #64748b;
}

@media (max-width: 640px) {
  .panel {
    padding: 1rem;
  }

  .panel h2 {
    font-size: 1rem;
  }
}
</style>
