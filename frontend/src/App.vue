<template>
  <v-app :class="isDark ? 'bg-[#0A192F] text-slate-100' : 'bg-[#F8FAFC] text-slate-700'">
    <template v-if="route.name">
      <div v-if="isFullLayout" class="flex h-screen w-full overflow-hidden">
        
        <!-- Modern Sidebar -->
        <aside 
          class="w-[260px] flex-shrink-0 flex flex-col z-20 transition-all duration-300 border-r"
          :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
        >
          <!-- Logo Area -->
          <div class="h-16 flex items-center px-6 border-b border-slate-100 dark:border-transparent">
            <div class="flex items-center gap-2.5" :class="isDark ? 'text-[#00F2FF]' : 'text-emerald-600'">
              <v-icon size="26">{{ isDark ? 'mdi-robot' : 'mdi-view-grid-plus' }}</v-icon>
              <span class="text-lg font-bold tracking-tight" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
                Zalo<span :class="isDark ? 'text-[#00F2FF]' : 'text-emerald-600'">CRM</span>
              </span>
            </div>
          </div>
          
          <!-- Navigation -->
          <nav class="flex-1 overflow-y-auto py-6 px-4 hidescrollbar">
            <div v-for="group in menuGroups" :key="group.name" class="mb-6">
              <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2.5 px-2 uppercase">
                {{ group.name }}
              </div>
              <div class="space-y-0.5">
                <router-link
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200"
                  :class="route.path === item.path 
                    ? (isDark ? 'bg-[#1D2D50] text-[#00F2FF] font-semibold shadow-sm' : 'bg-emerald-50 text-emerald-700 font-semibold') 
                    : (isDark ? 'text-slate-300 hover:bg-[#1D2D50]/50 hover:text-[#00F2FF]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium')"
                >
                  <v-icon 
                    size="18" 
                    :class="route.path === item.path ? (isDark ? 'text-[#00F2FF]' : 'text-emerald-600') : 'text-slate-400'"
                  >
                    {{ item.icon }}
                  </v-icon>
                  <span class="text-[13px] tracking-wide">{{ item.title }}</span>
                </router-link>
              </div>
            </div>
          </nav>

          <!-- Bottom Actions -->
          <div class="p-4 border-t space-y-1.5" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
            <!-- Git Update (Owner only) -->
            <button 
              v-if="authStore.isOwner"
              @click="handleSystemUpdate" 
              :disabled="sysUpdating"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
              :class="isDark ? 'text-emerald-400 hover:bg-[#1D2D50]/50 hover:text-emerald-300' : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'"
            >
              <v-icon size="18" :class="{'animate-spin text-emerald-400': sysUpdating, 'text-emerald-500': !sysUpdating}">
                {{ sysUpdating ? 'mdi-autorenew' : 'mdi-github' }}
              </v-icon>
              <span class="text-[13px] font-medium">{{ sysUpdating ? 'Đang cập nhật...' : 'Cập nhật từ Git' }}</span>
            </button>
            <button 
              @click="toggleTheme" 
              class="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
              :class="isDark ? 'text-slate-300 hover:bg-[#1D2D50]/50 hover:text-[#00F2FF]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            >
              <v-icon size="18" :class="isDark ? 'text-[#00F2FF]' : 'text-slate-500'">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
              <span class="text-[13px] font-medium">{{ isDark ? 'Chế độ sáng' : 'Chế độ tối' }}</span>
            </button>
            <button 
              @click="logout" 
              class="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors"
              :class="isDark ? 'text-red-400 hover:bg-red-950/30 hover:text-red-300' : 'text-red-600 hover:bg-red-50'"
            >
              <v-icon size="18" :class="isDark ? 'text-red-400' : 'text-red-500'">mdi-logout</v-icon>
              <span class="text-[13px] font-medium">Đăng xuất</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Wrapper -->
        <div 
          class="flex-1 flex flex-col h-screen overflow-hidden relative z-10"
          :class="isDark ? 'bg-[#0A192F]' : 'bg-[#F8FAFC]'"
        >
          <!-- Top Header -->
          <header 
            class="h-16 sticky top-0 backdrop-blur-md border-b flex items-center justify-between px-8 z-20 shrink-0 transition-all duration-300"
            :class="isDark ? 'bg-[#0A192F]/80 border-[#1D2D50]' : 'bg-white/80 border-slate-100'"
          >
            <!-- Search bar -->
            <div class="flex items-center w-72 max-w-sm">
              <div class="relative w-full">
                <v-icon size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">mdi-magnify</v-icon>
                <input 
                  type="text" 
                  placeholder="Tìm kiếm nhanh..." 
                  class="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border transition-all bg-transparent focus:outline-none focus:ring-2"
                  :class="isDark ? 'border-[#1D2D50] focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-100' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800'"
                />
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-5">
              <!-- Online status indicator -->
              <div 
                class="flex items-center px-3 py-1.5 rounded-full border transition-all"
                :class="isDark ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-slate-100 text-emerald-700'"
              >
                <span class="relative flex h-2 w-2 mr-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs font-bold tracking-wider">ONLINE</span>
              </div>

              <!-- Notifications -->
              <button 
                class="p-2 rounded-xl transition-all relative border"
                :class="isDark ? 'hover:bg-[#1D2D50] border-[#1D2D50] text-slate-300' : 'hover:bg-slate-50 border-slate-100 text-slate-600'"
              >
                <v-icon size="18">mdi-bell-outline</v-icon>
                <span class="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>

              <!-- Profile -->
              <div class="flex items-center gap-3">
                <v-avatar size="32" class="border cursor-pointer" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-200'">
                  <v-img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" />
                </v-avatar>
                <div class="hidden md:flex flex-col text-left">
                  <span class="text-xs font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-800'">Lê Lương Nghĩa</span>
                  <span class="text-[10px] font-medium text-slate-400">Owner</span>
                </div>
              </div>
            </div>
          </header>

          <!-- Page Content -->
          <v-main class="flex-1 bg-transparent" :class="route.path === '/chat' ? 'overflow-hidden' : 'overflow-y-auto'">
            <div :class="route.path === '/chat' ? 'h-full w-full' : 'p-6 md:p-8 max-w-[1600px] mx-auto w-full'">
              <router-view v-slot="{ Component }">
                <component :is="Component" :key="$route.path" />
              </router-view>
            </div>
          </v-main>
        </div>
      </div>

      <!-- Auth Layout -->
      <v-main 
        v-else 
        class="flex flex-col items-center justify-center min-h-screen transition-all duration-300"
        :class="isDark ? 'bg-[#0A192F]' : 'bg-[#F0F4F8]'"
      >
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
import { useSystem } from '@/composables/use-system';

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const authStore = useAuthStore();

const { updating: sysUpdating, updateSystem } = useSystem();

async function handleSystemUpdate() {
  if (!confirm('Hệ thống sẽ kéo bản mới nhất từ Github và khởi động lại. Cần 1-2 phút hoàn thành! Chắc chắn tiếp tục?')) return;
  const res = await updateSystem();
  if (res.ok) {
    alert('Đã gửi yêu cầu cập nhật thành công. Hệ thống đang khởi động lại.');
  } else {
    alert('Cập nhật thất bại: ' + res.error);
  }
}

const isDark = computed(() => theme.global.name.value === 'dark');
const isFullLayout = computed(() => route.meta.layout !== 'auth');

interface MenuItem {
  title: string;
  icon: string;
  path: string;
}

interface MenuGroup {
  name: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    name: 'TỔNG QUAN',
    items: [
      { title: 'Dashboard', icon: 'mdi-poll', path: '/' },
      { title: 'Báo cáo', icon: 'mdi-chart-box-outline', path: '/reports' },
    ]
  },
  {
    name: 'HỘI THOẠI & KHÁCH HÀNG',
    items: [
      { title: 'Tin nhắn', icon: 'mdi-message-text-outline', path: '/chat' },
      { title: 'Khách hàng', icon: 'mdi-account-group-outline', path: '/contacts' },
      { title: 'Tài khoản Zalo', icon: 'mdi-cellphone-link', path: '/zalo-accounts' },
      { title: 'Lịch hẹn', icon: 'mdi-calendar-clock-outline', path: '/appointments' },
    ]
  },
  {
    name: 'LOGISTICS & ĐƠN HÀNG',
    items: [
      { title: 'Đơn hàng', icon: 'mdi-package-variant-closed', path: '/orders' },
      { title: 'Vận chuyển', icon: 'mdi-truck-delivery-outline', path: '/shipments' },
    ]
  },
  {
    name: 'CẤU HÌNH & HỆ THỐNG',
    items: [
      { title: 'API & Webhook', icon: 'mdi-webhook', path: '/api-settings' },
      { title: 'Admin Dashboard', icon: 'mdi-cog-outline', path: '/settings' },
    ]
  }
];



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
