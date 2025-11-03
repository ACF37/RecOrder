import { createRouter, createWebHistory } from 'vue-router'
import LogView from './views/LogView.vue'
import StatsView from './views/StatsView.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'log',
  component: LogView,
    },
    {
      path: '/stats',
      name: 'stats',
  component: StatsView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export { router }
