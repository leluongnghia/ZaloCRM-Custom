<template>
  <div class="pe-4 pb-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Area -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <div class="p-2 bg-emerald-50 rounded-xl">
            <v-icon size="28" color="emerald-600">mdi-view-dashboard</v-icon>
          </div>
          Tổng quan hệ thống
        </h1>
        <p class="text-[15px] text-slate-500 mt-2 font-medium">Theo dõi hiệu suất và tương tác ZaloCRM theo thời gian thực</p>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- New update button -->
        <button 
          @click="updateSystem" 
          :disabled="isUpdating"
          class="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all focus:outline-none disabled:opacity-50"
        >
          <v-icon size="18" :class="{'animate-spin text-emerald-600': isUpdating, 'text-slate-500': !isUpdating}">mdi-autorenew</v-icon>
          <span class="text-sm font-semibold">{{ isUpdating ? 'Đang cập nhật...' : 'Cập nhật từ Git' }}</span>
        </button>

        <div class="bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-sm font-semibold text-slate-700">Live Sync</span>
        </div>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="#059669" class="rounded-full mb-6" height="4" />

    <!-- KPI Grid -->
    <KpiCards :kpi="kpi" />

    <!-- Main Content Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <!-- Activity Chart (Spans 2 columns) -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <MessageVolumeChart :data="messageVolume" />
      </div>

      <!-- Pipeline / Funnel (1 column) -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <PipelineChart :data="pipeline" />
      </div>

      <!-- Sources Chart -->
      <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <SourceChart :data="sources" />
      </div>

      <!-- Appointments Chart -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <AppointmentChart :data="appointments" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart.vue';
import PipelineChart from '@/components/dashboard/PipelineChart.vue';
import SourceChart from '@/components/dashboard/SourceChart.vue';
import AppointmentChart from '@/components/dashboard/AppointmentChart.vue';
import { useDashboard } from '@/composables/use-dashboard';

const {
  kpi, messageVolume, pipeline, sources, appointments,
  loading, fetchAll,
} = useDashboard();

const isUpdating = ref(false);

async function updateSystem() {
  if (!confirm('Bạn có chắc chắn muốn cập nhật hệ thống từ Git? Hệ thống có thể sẽ khởi động lại sau ít phút.')) return;
  
  try {
    isUpdating.value = true;
    const token = localStorage.getItem('token');
    
    // Call the system update endpoint
    const res = await fetch('/api/v1/system/update', { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
        throw new Error('Lỗi truy cập hệ thống');
    }

    const data = await res.json();
    alert(data.message || 'Đã gửi yêu cầu cập nhật.');
  } catch (err) {
    alert('Lỗi khởi chạy cập nhật! Vui lòng kiểm tra quyền truy cập.');
  } finally {
    // Keep spinning for a while because it needs time to restart
    setTimeout(() => {
      isUpdating.value = false;
    }, 15000);
  }
}

onMounted(() => fetchAll());
</script>
