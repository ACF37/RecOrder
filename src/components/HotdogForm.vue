<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  toppingOptions: string[]
  selectedToppings: string[]
}

interface Emits {
  (e: 'update:selectedToppings', value: string[]): void
  (e: 'openModal'): void
  (e: 'submit'): void
  (e: 'reset'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const validationError = ref('')
const formIsValid = computed(() => props.selectedToppings.length > 0)

const toggleTopping = (name: string) => {
  const current = [...props.selectedToppings]
  if (current.includes(name)) {
    emit('update:selectedToppings', current.filter((item) => item !== name))
  } else {
    emit('update:selectedToppings', [...current, name])
  }
  validationError.value = ''
}

const handleSubmit = () => {
  if (!formIsValid.value) {
    validationError.value = 'Pick at least one topping before saving.'
    return
  }
  emit('submit')
  validationError.value = ''
}

const handleReset = () => {
  emit('reset')
  validationError.value = ''
}
</script>

<template>
  <section class="panel">
    <form @submit.prevent="handleSubmit" class="form">
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
          <button type="button" class="topping-pill" @click="emit('openModal')" aria-label="Add custom topping">
            <span aria-hidden="true">+ 追加</span>
          </button>
        </div>
      </fieldset>

      <p v-if="validationError" class="error">{{ validationError }}</p>

      <div class="form-actions">
        <button type="submit" class="primary" :disabled="!formIsValid">Save hot dog</button>
        <button type="button" class="ghost" @click="handleReset">Reset</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.panel {
  background: #ffffff;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-shrink: 0;
  border-top: 2px solid #e2e8f0;
}

.panel h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
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
  cursor: pointer;
  font: inherit;
  border: 1px solid transparent;
  padding: 0;
}

.icon-button:hover {
  background: #e2e8f0;
  border-color: #94a3b8;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

legend {
  font-weight: 600;
  color: #0f172a;
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
  cursor: pointer;
  font: inherit;
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

.form-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.error {
  margin: 0;
  color: #dc2626;
}

@media (max-width: 640px) {
  .panel {
    padding: 1rem;
  }

  .panel h2 {
    font-size: 1rem;
  }

  .topping-list {
    gap: 0.4rem;
  }
}
</style>
