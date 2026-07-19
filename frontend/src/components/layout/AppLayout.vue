<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/invoices',  icon: '🧾', label: 'Invoices'  },
  { path: '/expenses',  icon: '💸', label: 'Expenses'  },
  { path: '/income',    icon: '💰', label: 'Income'    },
  { path: '/clients',   icon: '👥', label: 'Clients & Vendors' },
  { path: '/estimates', icon: '🏗️', label: 'Estimates' },
  { path: '/gst',       icon: '📋', label: 'GST Reports' },
  { path: '/profile',   icon: '⚙️', label: 'Profile'  },
]

const pageTitle = computed(() => {
  const item = navItems.find(n => route.path.startsWith(n.path))
  return item?.label || 'Finance'
})

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U'
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">💹</div>
      <div>
        <div class="logo-text">FinanceFlow</div>
        <div class="logo-sub">GST · Invoices · Reports</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">Main Menu</div>
      <router-link
        v-for="item in navItems.slice(0,7)"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path.startsWith(item.path) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        {{ item.label }}
      </router-link>

      <div class="nav-section" style="margin-top:12px;">Settings</div>
      <router-link to="/profile" class="nav-item" :class="{ active: route.path === '/profile' }">
        <span class="nav-icon">⚙️</span> Profile
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="user-card" @click="logout" title="Click to logout">
        <div class="user-avatar">{{ initials }}</div>
        <div>
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="user-role">{{ auth.user?.businessName || 'Logout →' }}</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Topbar -->
  <header class="topbar">
    <h1 class="page-title">{{ pageTitle }}</h1>
    <div class="topbar-right">
      <router-link to="/invoices/new" class="btn btn-primary btn-sm">
        + New Invoice
      </router-link>
    </div>
  </header>

  <!-- Page content -->
  <main class="main-content">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
</template>

<style scoped>
.fade-enter-active,.fade-leave-active{transition:opacity .25s ease,transform .25s ease;}
.fade-enter-from{opacity:0;transform:translateY(8px);}
.fade-leave-to{opacity:0;transform:translateY(-4px);}
</style>
