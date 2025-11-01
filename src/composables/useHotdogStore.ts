import { computed, effectScope, ref, watch } from 'vue'

export type HotdogEntry = {
  id: string
  createdAt: string
  toppings: string[]
}

const STORAGE_KEY = 'recorder.hotdogs.v1'

const defaultToppings = [
  '🧀チーズ',
  '🧅オニオン',
  '🍅サルサ',
  '🍛カレー',
  '🍯ハチミツ',
]

const entries = ref<HotdogEntry[]>([])
const toppingOptions = ref<string[]>([...defaultToppings])

let isInitialised = false
const persistenceScope = effectScope()

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const persist = () => {
  if (typeof window === 'undefined') return
  const payload = {
    entries: entries.value,
    toppingOptions: toppingOptions.value,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const load = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as {
      entries?: Array<Partial<HotdogEntry> & { date?: string; toppings?: unknown }>
      toppingOptions?: unknown
    }

    if (Array.isArray(parsed.toppingOptions)) {
      const cleaned = parsed.toppingOptions
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
      if (cleaned.length > 0) {
        toppingOptions.value = Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b))
      }
    }

    if (Array.isArray(parsed.entries)) {
      const normalised = parsed.entries
        .map((entry) => {
          const toppings = Array.isArray(entry.toppings)
            ? entry.toppings
                .map((item) => (typeof item === 'string' ? item.trim() : ''))
                .filter((item): item is string => item.length > 0)
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
            id: typeof entry.id === 'string' && entry.id.length > 0 ? entry.id : createId(),
            createdAt,
            toppings,
          }
        })
        .filter((entry): entry is HotdogEntry => entry !== null)
      entries.value = normalised
    }
  } catch (error) {
    console.error('Failed to load saved data', error)
  }
}

export function formatDisplayTimestamp(isoTimestamp: string) {
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

export function useHotdogStore() {
  if (!isInitialised) {
    load()
    persistenceScope.run(() => {
      watch([entries, toppingOptions], persist, { deep: true })
    })
    isInitialised = true
  }

const sortedEntries = computed(() =>
    [...entries.value].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
)

  const totalHotdogs = computed(() => entries.value.length)

  const uniqueToppingsUsed = computed(() => {
    const bag = new Set<string>()
    entries.value.forEach((entry) => entry.toppings.forEach((topping) => bag.add(topping)))
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

  const ensureTopping = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!toppingOptions.value.includes(trimmed)) {
      toppingOptions.value = [...toppingOptions.value, trimmed].sort((a, b) => a.localeCompare(b))
    }
  }

  const addEntry = (toppings: string[]) => {
    if (toppings.length === 0) return
    const entry: HotdogEntry = {
      id: createId(),
      createdAt: new Date().toISOString(),
      toppings: [...toppings],
    }
    entries.value.push(entry)
  }

  const deleteEntry = (id: string) => {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }

  const clearAllData = () => {
    entries.value = []
    toppingOptions.value = [...defaultToppings]
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return {
    entries,
    toppingOptions,
    sortedEntries,
    totalHotdogs,
    uniqueToppingsUsed,
    toppingFrequency,
    topToppings,
    ensureTopping,
    addEntry,
    deleteEntry,
    clearAllData,
  }
}
