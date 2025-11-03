<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm', name: string, emoji: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const customToppingName = ref('')
const customToppingEmoji = ref('')
const modalInputRef = ref<HTMLInputElement | null>(null)

const handleConfirm = () => {
  const name = customToppingName.value.trim()
  const emoji = customToppingEmoji.value.trim()
  if (!name || !emoji) return
  emit('confirm', name, emoji)
  customToppingName.value = ''
  customToppingEmoji.value = ''
}

const handleClose = () => {
  emit('close')
  customToppingName.value = ''
  customToppingEmoji.value = ''
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        modalInputRef.value?.focus()
      })
    }
  }
)
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="handleClose">
    <div class="modal" tabindex="-1" @keydown.esc.prevent="handleClose">
      <h3>トッピングを追加</h3>
      <input
        ref="modalInputRef"
        v-model="customToppingEmoji"
        type="text"
        placeholder="絵文字 (例: 🍅)"
        maxlength="2"
      />
      <input
        v-model="customToppingName"
        type="text"
        placeholder="トッピング名 (例: ケチャップ)"
        @keyup.enter.prevent="handleConfirm"
      />
      <div class="modal-actions">
        <button type="button" class="primary" @click="handleConfirm">追加</button>
        <button type="button" class="ghost" @click="handleClose">キャンセル</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.modal h3 {
  margin: 0;
  color: #0f172a;
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

button {
  cursor: pointer;
  font: inherit;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.55rem 1.2rem;
  transition: background 0.2s ease, color 0.2s ease, border 0.2s ease;
}

.primary {
  background: #2563eb;
  color: #ffffff;
}

.primary:hover {
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
</style>
