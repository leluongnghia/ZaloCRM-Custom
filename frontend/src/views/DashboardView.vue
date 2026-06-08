<template>
  <div class="pe-4 pb-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Area -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-view-dashboard</v-icon>
          </div>
          Tổng quan hệ thống
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Theo dõi hiệu suất và tương tác ZaloCRM theo thời gian thực
        </p>
      </div>
      
      <div class="flex items-center gap-4">

        <div 
          class="border px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm"
          :class="isDark ? 'bg-[#112240] border-[#1D2D50] text-slate-100' : 'bg-white border-slate-200 text-slate-700'"
        >
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span class="text-sm font-semibold">Live Sync</span>
        </div>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="#059669" class="rounded-full mb-6" height="4" />

    <!-- KPI Grid -->
    <KpiCards :kpi="kpi" />

    <!-- Main Content Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <!-- Activity Chart (Spans 2 columns) -->
      <div class="lg:col-span-2">
        <MessageVolumeChart :data="messageVolume" />
      </div>

      <!-- Pipeline / Funnel (1 column) -->
      <div>
        <PipelineChart :data="pipeline" />
      </div>

      <!-- Sources Chart -->
      <div>
        <SourceChart :data="sources" />
      </div>

      <!-- Appointments Chart -->
      <div class="lg:col-span-2">
        <AppointmentChart :data="appointments" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart.vue';
import PipelineChart from '@/components/dashboard/PipelineChart.vue';
import SourceChart from '@/components/dashboard/SourceChart.vue';
import AppointmentChart from '@/components/dashboard/AppointmentChart.vue';
import { useDashboard } from '@/composables/use-dashboard';
import { useTheme } from 'vuetify';

const {
  kpi, messageVolume, pipeline, sources, appointments,
  loading, fetchAll,
} = useDashboard();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

onMounted(() => fetchAll());
</script>

