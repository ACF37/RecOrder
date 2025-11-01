<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

type HotdogEntry = {
  id: string
  createdAt: string
  toppings: string[]
}

const STORAGE_KEY = 'recorder.hotdogs.v1'

const defaultToppings = [
  'チーズ',
  'オニオンチップス',
  'サルサソース',
  'カレーパウダー',
  'ハチミツ',
]

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const toppingOptions = ref<string[]>([...defaultToppings])
const entries = ref<HotdogEntry[]>([])
const selectedToppings = ref<string[]>([])
const newToppingName = ref('')

const filters = reactive({
  range: '7',
  search: '',
})

const rangeChoices = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const validationError = ref('')

function formatDisplayTimestamp(isoTimestamp: string) {
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) return isoTimestamp
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const sortedEntries = computed(() =>
  [...entries.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
)

const filteredEntries = computed(() => {
  const lowerSearch = filters.search.trim().toLowerCase()
  const now = new Date()
  return sortedEntries.value.filter((entry) => {
    const byRange = (() => {
      if (filters.range === 'all') return true
      const days = Number(filters.range)
      if (!Number.isFinite(days)) return true
      const cutoff = new Date(now)
      cutoff.setHours(0, 0, 0, 0)
      cutoff.setDate(cutoff.getDate() - (days - 1))
      const entryDate = new Date(entry.createdAt)
      if (Number.isNaN(entryDate.getTime())) return true
      entryDate.setHours(0, 0, 0, 0)
      return entryDate >= cutoff
    })()
    if (!byRange) return false
    if (!lowerSearch) return true
    const displayTime = formatDisplayTimestamp(entry.createdAt).toLowerCase()
    const haystack = `${displayTime} ${entry.toppings.join(' ').toLowerCase()}`
    return haystack.includes(lowerSearch)
  })
})

const totalHotdogs = computed(() => entries.value.length)
const visibleHotdogs = computed(() => filteredEntries.value.length)
const uniqueToppingsUsed = computed(() => {
  const bag = new Set<string>()
  entries.value.forEach((entry) => entry.toppings.forEach((t) => bag.add(t)))
  return bag.size
})

const toppingFrequency = computed(() => {
  const counts = new Map<string, number>()
  entries.value.forEach((entry) => {
    entry.toppings.forEach((topping) => {
      counts.set(topping, (counts.get(topping) ?? 0) + 1)
    })
  })
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const topToppings = computed(() => toppingFrequency.value.slice(0, 3))

const rangeLabel = computed(() => rangeChoices.find((item) => item.value === filters.range)?.label ?? 'All time')

const formIsValid = computed(() => selectedToppings.value.length > 0)

const resetForm = () => {
  selectedToppings.value = []
  newToppingName.value = ''
  validationError.value = ''
}

const persist = () => {
  if (typeof window === 'undefined') return
  const payload = {
    entries: entries.value,
    toppingOptions: toppingOptions.value,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const load = () => {
  if (typeof window === 'undefined') return
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      entries?: Array<Partial<HotdogEntry> & { date?: string }>
      toppingOptions?: string[]
    }
    if (Array.isArray(parsed.toppingOptions)) {
      const cleaned = parsed.toppingOptions.filter((item) => typeof item === 'string' && item.trim())
      toppingOptions.value = cleaned.length ? Array.from(new Set(cleaned)) : [...defaultToppings]
    }
    if (Array.isArray(parsed.entries)) {
      const normalised = parsed.entries
        .map((entry) => {
          const toppings = Array.isArray(entry.toppings)
            ? entry.toppings.filter(
                (item): item is string => typeof item === 'string' && item.trim().length > 0
              )
            : []
          if (toppings.length === 0) return null
          const createdAt = (() => {
            if (typeof entry.createdAt === 'string') {
              const parsedDate = new Date(entry.createdAt)
              if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toISOString()
            }
            if (typeof entry.date === 'string') {
              const parsedDate = new Date(`${entry.date}T12:00:00`)
              if (!Number.isNaN(parsedDate.getTime())) return parsedDate.toISOString()
            }
            return null
          })()
          if (!createdAt) return null
          return {
            id: typeof entry.id === 'string' && entry.id ? entry.id : createId(),
            createdAt,
            toppings,
          }
        })
        .filter((entry): entry is HotdogEntry => Boolean(entry))
      entries.value = normalised
    }
  } catch (error) {
    console.error('Failed to load saved data', error)
  }
}

const addNewTopping = () => {
  const candidate = newToppingName.value.trim()
  if (!candidate) return
  if (!toppingOptions.value.includes(candidate)) {
    toppingOptions.value = [...toppingOptions.value, candidate].sort((a, b) => a.localeCompare(b))
  }
  if (!selectedToppings.value.includes(candidate)) {
    selectedToppings.value = [...selectedToppings.value, candidate]
  }
  newToppingName.value = ''
}

const toggleTopping = (name: string) => {
  if (selectedToppings.value.includes(name)) {
    selectedToppings.value = selectedToppings.value.filter((item) => item !== name)
  } else {
    selectedToppings.value = [...selectedToppings.value, name]
  }
}

const addEntry = () => {
  if (!formIsValid.value) {
    validationError.value = 'Pick at least one topping before saving.'
    return
  }
  const entry: HotdogEntry = {
    id: createId(),
    createdAt: new Date().toISOString(),
    toppings: [...selectedToppings.value],
  }
  entries.value = [entry, ...entries.value]
  resetForm()
}

const deleteEntry = (id: string) => {
  entries.value = entries.value.filter((entry) => entry.id !== id)
}

onMounted(() => {
  load()
})

watch([entries, toppingOptions], persist, { deep: true })
</script>

<template>
  <section class="tracker">
    <header class="header">
      <h1>RecOrder</h1>
      <p class="tagline">Track every hot dog build, surface your favourite topping combos.</p>
    </header>

    <div class="content">
      <div class="primary">
        <section class="panel">
          <h2>Add a hot dog</h2>
          <form @submit.prevent="addEntry" class="form">
            <fieldset class="field">
              <legend>Toppings</legend>
              <div class="topping-list">
                <button
                  v-for="topping in toppingOptions"
                  :key="topping"
                  type="button"
                  class="topping-pill"
                  :class="{ selected: selectedToppings.includes(topping) }"
                  @click="toggleTopping(topping)"
                >
                  {{ topping }}
                </button>
              </div>
              <div class="add-topping">
                <input
                  v-model="newToppingName"
                  type="text"
                  placeholder="Add custom topping"
                  @keyup.enter.prevent="addNewTopping"
                />
                <button type="button" class="secondary" @click="addNewTopping">Add topping</button>
              </div>
            </fieldset>

            <p v-if="validationError" class="error">{{ validationError }}</p>

            <div class="form-actions">
              <button type="submit" class="primary" :disabled="!formIsValid">Save hot dog</button>
              <button type="button" class="ghost" @click="resetForm">Reset</button>
            </div>
          </form>
        </section>

        <section class="panel">
          <div class="panel-header">
            <h2>History</h2>
            <div class="filters">
              <label>
                <span class="sr-only">Search</span>
                <input v-model="filters.search" type="search" placeholder="Search toppings, time..." />
              </label>
              <label>
                <span class="sr-only">Range</span>
                <select v-model="filters.range">
                  <option v-for="choice in rangeChoices" :key="choice.value" :value="choice.value">
                    {{ choice.label }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <p v-if="filteredEntries.length === 0" class="empty">No hot dogs logged yet.</p>

          <ul v-else class="history">
            <li v-for="entry in filteredEntries" :key="entry.id" class="history-row">
              <div class="history-meta">
                <span class="history-date">{{ formatDisplayTimestamp(entry.createdAt) }}</span>
              </div>
              <div class="history-toppings">
                <span v-for="topping in entry.toppings" :key="topping" class="badge">{{ topping }}</span>
              </div>
              <button type="button" class="ghost small" @click="deleteEntry(entry.id)">Delete</button>
            </li>
          </ul>
        </section>
      </div>

      <aside class="sidebar">
        <section class="panel stats">
          <h2>Stats</h2>
          <dl class="stat-grid">
            <div>
              <dt>Total logged</dt>
              <dd>{{ totalHotdogs }}</dd>
            </div>
            <div>
              <dt>{{ rangeLabel }}</dt>
              <dd>{{ visibleHotdogs }}</dd>
            </div>
            <div>
              <dt>Unique toppings used</dt>
              <dd>{{ uniqueToppingsUsed }}</dd>
            </div>
          </dl>

          <div class="top-toppings" v-if="topToppings.length">
            <h3>Top toppings</h3>
            <ol>
              <li v-for="[topping, count] in topToppings" :key="topping">
                <span>{{ topping }}</span>
                <span class="count">{{ count }}</span>
              </li>
            </ol>
          </div>

          <p v-else class="empty">Add a hot dog to see stats.</p>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.tracker {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
}

.tagline {
  margin: 0;
  color: #51606d;
}

.content {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(250px, 1fr);
  gap: 1.5rem;
}

.primary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar {
  position: sticky;
  top: 1.5rem;
  align-self: start;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel h2 {
  margin: 0;
  font-size: 1.4rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input[type='text'],
input[type='search'],
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

legend {
  padding: 0;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.topping-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.topping-pill {
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #1f2937;
  padding: 0.35rem 0.9rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.topping-pill:hover {
  border-color: #64748b;
}

.topping-pill.selected {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.add-topping {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.add-topping input {
  flex: 1 1 200px;
}

button {
  cursor: pointer;
  font: inherit;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.55rem 1.2rem;
  transition: background 0.2s ease, color 0.2s ease, border 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.primary {
  background: #2563eb;
  color: #ffffff;
}

.primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.secondary {
  background: #0f172a;
  color: #ffffff;
}

.secondary:hover {
  background: #1e293b;
}

.ghost {
  background: transparent;
  border-color: #cbd5e1;
  color: #1f2937;
}

.ghost:hover {
  border-color: #94a3b8;
}

.small {
  padding: 0.35rem 0.8rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.error {
  color: #dc2626;
  margin: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.filters {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filters input {
  min-width: 200px;
}

.history {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
  padding: 0;
}

.history-row {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-weight: 600;
}

.history-date {
  color: #0f172a;
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
}

.stats {
  gap: 1.5rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 0;
}

.stat-grid div {
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.stat-grid dt {
  margin: 0;
  font-size: 0.85rem;
  color: #64748b;
}

.stat-grid dd {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: #0f172a;
}

.top-toppings {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-toppings h3 {
  margin: 0;
}

.top-toppings ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.top-toppings li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  font-weight: 600;
  color: #0f172a;
}

.count {
  color: #2563eb;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 640px) {
  .panel {
    padding: 1.25rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters input,
  .filters select {
    width: 100%;
  }
}
</style>
