<script setup lang="ts">
import { ref } from 'vue'
import { useHotdogStore } from '../composables/useHotdogStore'
import HotdogForm from './HotdogForm.vue'
import HotdogHistory from './HotdogHistory.vue'
import AddToppingModal from './AddToppingModal.vue'

const { toppingOptions, sortedEntries, addEntry, deleteEntry, completeEntry, uncompleteEntry, ensureTopping } = useHotdogStore()

const selectedToppings = ref<string[]>([])
const isModalOpen = ref(false)

const handleSubmit = () => {
  addEntry(selectedToppings.value)
  selectedToppings.value = []
}

const handleReset = () => {
  selectedToppings.value = []
}

const handleComplete = (id: string) => {
  completeEntry(id)
}

const handleUncomplete = (id: string) => {
  uncompleteEntry(id)
}

const handleOpenModal = () => {
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
}

const handleConfirmTopping = (name: string) => {
  ensureTopping(name)
  if (!selectedToppings.value.includes(name)) {
    selectedToppings.value = [...selectedToppings.value, name]
  }
  isModalOpen.value = false
}
</script>

<template>
  <section class="tracker">
    <HotdogHistory :entries="sortedEntries" @delete="deleteEntry" @complete="handleComplete" @uncomplete="handleUncomplete" />

    <HotdogForm
      :topping-options="toppingOptions"
      :selected-toppings="selectedToppings"
      @update:selected-toppings="selectedToppings = $event"
      @open-modal="handleOpenModal"
      @submit="handleSubmit"
      @reset="handleReset"
    />

    <AddToppingModal :is-open="isModalOpen" @close="handleCloseModal" @confirm="handleConfirmTopping" />
  </section>
</template>

<style scoped>
.tracker {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  gap: 0;
}
</style>
