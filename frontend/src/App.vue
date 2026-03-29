<template>
  <v-app class="bg-[#F9FAFB]">
    <template v-if="route.name">
      <div v-if="isFullLayout" class="flex h-screen w-full overflow-hidden">
        
        <!-- Modern Sidebar -->
        <aside class="w-[260px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300">
          <!-- Logo Area -->
          <div class="h-16 flex items-center px-6 border-b border-transparent">
            <div class="flex items-center gap-2 text-emerald-600">
              <v-icon size="28">mdi-view-grid-plus</v-icon>
              <span class="text-xl font-bold tracking-tight text-slate-800">Zalo<span class="text-emerald-600">CRM</span></span>
            </div>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-1 overflow-y-auto py-6 px-4 hidescrollbar">
            <div class="text-[11px] font-bold text-slate-400 tracking-widest mb-3 px-2">CHUNG</div>
            <div class="space-y-1">
              <router-link
                v-for="item in menuItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                :class="route.path === item.path ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'"
              >
                <v-icon size="20" :class="route.path === item.path ? 'text-emerald-600' : 'text-slate-500'">{{ item.icon }}</v-icon>
                <span class="text-sm tracking-wide">{{ item.title }}</span>
              </router-link>
            </div>
          </nav>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-slate-100 space-y-2">
            <button @click="toggleTheme" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <v-icon size="20" class="text-slate-500">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
              <span class="text-sm font-medium">{{ isDark ? 'Chế độ sáng' : 'Chế độ tối' }}</span>
            </button>
            <button @click="logout" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
              <v-icon size="20" class="text-red-500">mdi-logout</v-icon>
              <span class="text-sm font-medium">Đăng xuất</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Wrapper -->
        <div class="flex-1 flex flex-col h-screen overflow-hidden bg-[#F9FAFB] relative z-10">
          <!-- Top Header -->
          <header class="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-20 shrink-0">
            <h2 class="text-lg font-bold text-slate-800 tracking-wide uppercase">
              {{ currentPageTitle }}
            </h2>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                <span class="relative flex h-2 w-2 mr-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-bold text-emerald-700 tracking-wider">ONLINE</span>
              </div>
            </div>
          </header>

          <!-- Page Content -->
          <v-main class="flex-1 overflow-y-auto bg-transparent">
            <div class="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
              <router-view v-slot="{ Component }">
                <component :is="Component" :key="$route.path" />
              </router-view>
            </div>
          </v-main>
        </div>
      </div>

      <!-- Auth Layout -->
      <v-main v-else class="flex flex-col items-center justify-center min-h-screen bg-[#F9FAFB]">
        <div class="w-full max-w-[450px] px-4">
           <router-view v-slot="{ Component }">
            <component :is="Component" :key="$route.path" />
          </router-view>
        </div>
      </v-main>
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const authStore = useAuthStore();

const isDark = computed(() => theme.global.name.value === 'dark');
const isFullLayout = computed(() => route.meta.layout !== 'auth');

interface MenuItem {
  title: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: 'mdi-poll', path: '/' },
  { title: 'Tin nhắn', icon: 'mdi-message-text-outline', path: '/chat' },
  { title: 'Khách hàng', icon: 'mdi-account-group-outline', path: '/contacts' },
  { title: 'Tài khoản Zalo', icon: 'mdi-cellphone-link', path: '/zalo-accounts' },
  { title: 'Lịch hẹn', icon: 'mdi-calendar-clock-outline', path: '/appointments' },
  { title: 'Báo cáo', icon: 'mdi-chart-box-outline', path: '/reports' },
  { title: 'Admin Dashboard', icon: 'mdi-cog-outline', path: '/settings' },
  { title: 'API & Webhook', icon: 'mdi-webhook', path: '/api-settings' },
];

const currentPageTitle = computed(() => {
  const currentItems = menuItems.filter(item => item.path === route.path);
  const currentItem = currentItems.length > 0 ? currentItems[0] : null;
  return currentItem ? currentItem.title : String(route.name || '');
});

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark';
  localStorage.setItem('theme', theme.global.name.value);
}

function logout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  // Default to light theme for this new UI if no previous choice was made or enforce it
  theme.global.name.value = savedTheme || 'light';
});
</script>

<style>
/* Hide scrollbar for sidebar */
.hidescrollbar::-webkit-scrollbar {
  display: none;
}
.hidescrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
