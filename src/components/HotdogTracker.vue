<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { formatDisplayTimestamp, useHotdogStore } from '../composables/useHotdogStore'

const { toppingOptions, sortedEntries, addEntry, deleteEntry, ensureTopping } = useHotdogStore()

const selectedToppings = ref<string[]>([])
const validationError = ref('')
const isModalOpen = ref(false)
const customToppingName = ref('')
const modalInputRef = ref<HTMLInputElement | null>(null)

const formIsValid = computed(() => selectedToppings.value.length > 0)
const hasEntries = computed(() => sortedEntries.value.length > 0)

const toggleTopping = (name: string) => {
  if (selectedToppings.value.includes(name)) {
    selectedToppings.value = selectedToppings.value.filter((item) => item !== name)
  } else {
    selectedToppings.value = [...selectedToppings.value, name]
  }
}

const resetForm = () => {
  selectedToppings.value = []
  validationError.value = ''
}

const submitEntry = () => {
  if (!formIsValid.value) {
    validationError.value = 'Pick at least one topping before saving.'
    return
  }
  addEntry(selectedToppings.value)
  resetForm()
}

const openModal = () => {
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  customToppingName.value = ''
}

const confirmAddCustom = () => {
  const candidate = customToppingName.value.trim()
  if (!candidate) return
  ensureTopping(candidate)
  if (!selectedToppings.value.includes(candidate)) {
    selectedToppings.value = [...selectedToppings.value, candidate]
  }
  closeModal()
}

watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => {
      modalInputRef.value?.focus()
    })
  }
})

watch(selectedToppings, (current) => {
  if (current.length > 0) {
    validationError.value = ''
  }
})
</script>

<template>
  <section class="tracker">
    <section class="panel">
      <div class="panel-header">
        <h2>Log a hot dog</h2>
        <button type="button" class="icon-button" @click="openModal" aria-label="Add custom topping">
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <form @submit.prevent="submitEntry" class="form">
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
        </fieldset>

        <p v-if="validationError" class="error">{{ validationError }}</p>

        <div class="form-actions">
          <button type="submit" class="primary" :disabled="!formIsValid">Save hot dog</button>
          <button type="button" class="ghost" @click="resetForm">Reset</button>
        </div>
      </form>
    </section>

    <section class="panel">
      <h2>History</h2>
      <p v-if="!hasEntries" class="empty">No hot dogs logged yet.</p>
      <ul v-else class="history">
        <li v-for="entry in sortedEntries" :key="entry.id" class="history-row">
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

    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal" tabindex="-1" @keydown.esc.prevent="closeModal">
        <h3>Add topping</h3>
        <input
          ref="modalInputRef"
          v-model="customToppingName"
          type="text"
          placeholder="New topping name"
          @keyup.enter.prevent="confirmAddCustom"
        />
        <div class="modal-actions">
          <button type="button" class="primary" @click="confirmAddCustom">Add</button>
          <button type="button" class="ghost" @click="closeModal">Cancel</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tracker {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.panel {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel h2,
.panel h3,
.legend {
  margin: 0;
  color: #0f172a;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.icon-button {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  font-size: 1.4rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.icon-button:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

legend {
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
  border-color: #2563eb;
  color: #ffffff;
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
  gap: 0.75rem;
  flex-wrap: wrap;
}

.error {
  margin: 0;
  color: #dc2626;
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

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 20;
}

.modal {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem;
  width: min(360px, 100%);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  outline: none;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.18);
}

.modal input {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  font: inherit;
}

.modal input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  outline: none;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .panel {
    padding: 1.25rem;
  }

  .topping-list {
    gap: 0.4rem;
  }
}
</style>
