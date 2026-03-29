<template>
  <v-card class="pa-8 d-flex flex-column" style="backdrop-filter: blur(20px); min-height: 480px;" elevation="0">
    <div class="text-center mb-8">
      <div
        class="ai-core-orb mx-auto mb-4 d-flex align-center justify-center"
        style="width: 64px; height: 64px; background: linear-gradient(135deg, #00F2FF, #0077B6);"
      >
        <v-icon size="32" color="white">mdi-robot</v-icon>
      </div>
      <h1 class="text-h5 font-weight-bold">Zalo<span style="color: #00F2FF;">CRM</span></h1>
      <p class="text-caption mt-1" style="color: #8892b0;">Liquid Silicon • Multi-Account Zalo Management</p>
    </div>

    <!-- Wait for setup check -->
    <div v-if="checkingSetup" class="d-flex flex-column align-center justify-center flex-grow-1">
      <v-progress-circular indeterminate color="primary" size="48" width="4"></v-progress-circular>
      <div class="mt-4 text-caption" style="color: #8892b0;">Đang tải...</div>
    </div>

    <v-form v-else @submit.prevent="handleLogin">
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        prepend-inner-icon="mdi-email-outline"
        required
        class="mb-3"
      />
      <v-text-field
        v-model="password"
        label="Mật khẩu"
        type="password"
        prepend-inner-icon="mdi-lock-outline"
        required
        class="mb-5"
      />
      <v-btn type="submit" color="primary" block size="large" :loading="loading" rounded="xl">
        <v-icon start>mdi-login</v-icon>
        Đăng nhập
      </v-btn>
    </v-form>

    <v-alert v-if="error && !checkingSetup" type="error" class="mt-4" density="compact" closable variant="tonal">
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const checkingSetup = ref(true);
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    const needs = await authStore.checkSetup();
    if (needs) {
      router.replace('/setup');
    } else {
      checkingSetup.value = false;
    }
  } catch {
    checkingSetup.value = false;
  }
});

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Đăng nhập thất bại';
  } finally {
    loading.value = false;
  }
}
</script>
