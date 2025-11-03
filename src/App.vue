<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import {
  initializeStore,
  fetchEntries,
  subscribeToEntries,
  migrateFromLocalStorage,
} from './composables/useHotdogStore'

onMounted(async () => {
  // 1. トッピングオプションを取得
  await initializeStore()
  
  // 2. LocalStorageからのマイグレーション（初回のみ）
  await migrateFromLocalStorage()
  
  // 3. エントリーを取得
  await fetchEntries()
  
  // 4. リアルタイム更新の購読
  subscribeToEntries()
})
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <!-- <div class="brand">
        <span class="logo">🌭</span>
        <h1>RecOrder</h1>
      </div> -->
      <nav class="nav">
        <RouterLink to="/" class="nav-link" active-class="active" exact-active-class="active">
          Log
        </RouterLink>
        <RouterLink to="/stats" class="nav-link" active-class="active">
          Stats
        </RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  flex-direction: row-reverse;
  justify-content: space-between;
  gap: 1rem;
  background: #ffffff;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #0f172a;
}

.brand h1 {
  margin: 0;
  font-size: 1.75rem;
}

.logo {
  font-size: 1.8rem;
  line-height: 1;
}

.nav {
  display: flex;
  gap: 0.75rem;
}

.nav-link {
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  font-weight: 600;
  color: #475569;
  transition: background 0.2s ease, color 0.2s ease;
}

.nav-link:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.nav-link.active {
  background: #2563eb;
  color: #ffffff;
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) {
  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav {
    width: 100%;
  }

  .nav-link {
    flex: 1;
    text-align: center;
  }
}
</style>
