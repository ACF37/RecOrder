<script setup lang="ts">
import { computed, ref } from 'vue'
import { useHotdogStore } from '../composables/useHotdogStore'

const { totalHotdogs, uniqueToppingsUsed, toppingFrequency, topToppings, clearAllData } = useHotdogStore()

const hasEntries = computed(() => totalHotdogs.value > 0)
const maxFrequencyCount = computed(() => (toppingFrequency.value[0]?.[1] ?? 0))

const isConfirmingDelete = ref(false)

const handleClearAll = () => {
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    setTimeout(() => {
      isConfirmingDelete.value = false
    }, 3000)
    return
  }
  clearAllData()
  isConfirmingDelete.value = false
}
</script>

<template>
  <section class="stats-view">
    <section class="panel">
      <h2>Overview</h2>
      <dl class="stat-grid">
        <div>
          <dt>Total logged</dt>
          <dd>{{ totalHotdogs }}</dd>
        </div>
        <div>
          <dt>Unique toppings</dt>
          <dd>{{ uniqueToppingsUsed }}</dd>
        </div>
      </dl>
    </section>

    <section class="panel">
      <h2>Top toppings</h2>
      <p v-if="!hasEntries" class="empty">Log a hot dog to see your stats.</p>
      <ol v-else class="top-list">
        <li v-for="[topping, count] in topToppings" :key="topping">
          <span>{{ topping }}</span>
          <span class="count">{{ count }}</span>
        </li>
      </ol>
    </section>

    <section class="panel">
      <h2>All toppings</h2>
      <p v-if="!hasEntries" class="empty">No toppings recorded yet.</p>
      <ul v-else class="frequency-list">
        <li v-for="[topping, count] in toppingFrequency" :key="topping">
          <span class="label">{{ topping }}</span>
          <span
            class="bar"
            :style="{ width: maxFrequencyCount ? `${Math.max((count / maxFrequencyCount) * 100, 8)}%` : '8%' }"
          ></span>
          <span class="count">{{ count }}</span>
        </li>
      </ul>
    </section>

    <section class="panel danger-zone">
      <h2>Danger Zone</h2>
      <p class="warning-text">すべての記録とカスタムトッピングが削除されます。この操作は取り消せません。</p>
      <button
        class="delete-all-btn"
        :class="{ confirming: isConfirmingDelete }"
        @click="handleClearAll"
      >
        {{ isConfirmingDelete ? '本当に削除しますか？もう一度クリックして確認' : 'すべてのデータを削除' }}
      </button>
    </section>
  </section>
</template>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  height: 100%;
  overflow-y: auto;
  background: #f8fafc;
}

.panel {
  background: #ffffff;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.panel h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin: 0;
}

.stat-grid div {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.stat-grid dt {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.stat-grid dd {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
}

.top-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 0.65rem 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.count {
  color: #2563eb;
}

.frequency-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.frequency-list li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.75rem;
}

.label {
  font-weight: 600;
  color: #0f172a;
}

.bar {
  height: 0.55rem;
  background: #93c5fd;
  border-radius: 999px;
  min-width: 0.75rem;
}

.empty {
  margin: 0;
  color: #94a3b8;
}

.danger-zone {
  border: 2px solid #fee2e2;
  background: #fef2f2;
}

.danger-zone h2 {
  color: #991b1b;
}

.warning-text {
  margin: 0;
  font-size: 0.9rem;
  color: #7f1d1d;
  line-height: 1.5;
}

.delete-all-btn {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.delete-all-btn:hover {
  background: #b91c1c;
}

.delete-all-btn:active {
  transform: scale(0.98);
}

.delete-all-btn.confirming {
  background: #7f1d1d;
  animation: pulse 0.5s ease-in-out infinite alternate;
}

@keyframes pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.02);
  }
}

@media (max-width: 640px) {
  .panel {
    padding: 1rem;
  }

  .panel h2 {
    font-size: 1rem;
  }

  .frequency-list li {
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
  }

  .bar {
    grid-column: 1 / -1;
  }
}
</style>
