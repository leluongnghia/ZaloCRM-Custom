import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export interface VersionInfo {
  version: string;
  commit: string;
  date: string;
}

export function useSystem() {
  const version = ref<VersionInfo | null>(null);
  const loading = ref(false);
  const updating = ref(false);
  const error = ref('');
  const updateResult = ref<{ message: string; output: string } | null>(null);

  const authStore = useAuthStore();

  async function fetchVersion() {
    loading.value = true;
    error.value = '';
    try {
      const { data } = await axios.get('/api/v1/system/version', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      version.value = data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Không thể lấy thông tin phiên bản';
    } finally {
      loading.value = false;
    }
  }

  async function updateSystem() {
    updating.value = true;
    error.value = '';
    updateResult.value = null;
    try {
      const { data } = await axios.post('/api/v1/system/update', {}, {
        headers: { Authorization: `Bearer ${authStore.token}` }
      });
      updateResult.value = {
        message: data.message,
        output: data.output
      };
      // Refresh version after update
      await fetchVersion();
      return { ok: true };
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Cập nhật hệ thống thất bại';
      return { ok: false, error: error.value };
    } finally {
      updating.value = false;
    }
  }

  return {
    version,
    loading,
    updating,
    error,
    updateResult,
    fetchVersion,
    updateSystem
  };
}
