<template>
  <v-app :class="{ 'liquid-bg': isLiquidBg }">
    <component :is="layout">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.name" />
        </transition>
      </router-view>
    </component>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const isReady = ref(false);

const isDark = computed(() => theme.global.name.value === 'dark');
const isLiquidBg = computed(() => {
  // Always liquid on auth pages, otherwise only if dark mode
  if (route.meta.layout === 'auth') return true;
  return isDark.value;
});

onMounted(async () => {
  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.global.name.value = savedTheme;
  }
  
  await router.isReady();
  isReady.value = true;
});

const layout = computed(() => {
  return route.meta.layout === 'auth' ? AuthLayout : DefaultLayout;
});
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
