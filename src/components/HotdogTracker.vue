<script setup lang="ts">
import { ref } from 'vue'
import {
  toppingOptions,
  sortedEntries,
  addEntry,
  deleteEntry,
  completeEntry,
  uncompleteEntry,
  addCustomTopping,
} from '../composables/useHotdogStore'
import HotdogForm from './HotdogForm.vue'
import HotdogHistory from './HotdogHistory.vue'
import AddToppingModal from './AddToppingModal.vue'

const selectedToppings = ref<string[]>([])
const isModalOpen = ref(false)

const handleSubmit = async () => {
  await addEntry(selectedToppings.value)
  selectedToppings.value = []
}

const handleReset = () => {
  selectedToppings.value = []
}

const handleComplete = async (id: string) => {
  await completeEntry(id)
}

const handleUncomplete = async (id: string) => {
  await uncompleteEntry(id)
}

const handleDelete = async (id: string) => {
  await deleteEntry(id)
}

const handleOpenModal = () => {
  isModalOpen.value = true
}

const handleCloseModal = () => {
  isModalOpen.value = false
}

const handleConfirmTopping = async (name: string, emoji: string) => {
  await addCustomTopping(name, emoji)
  // 新しく追加されたトッピングのIDを取得して選択
  const newTopping = toppingOptions.value.find((opt) => opt.name === name && opt.emoji === emoji)
  if (newTopping && !selectedToppings.value.includes(newTopping.id)) {
    selectedToppings.value = [...selectedToppings.value, newTopping.id]
  }
  isModalOpen.value = false
}
</script>

<template>
  <section class="tracker">
    <HotdogHistory :entries="sortedEntries" @delete="handleDelete" @complete="handleComplete" @uncomplete="handleUncomplete" />

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
