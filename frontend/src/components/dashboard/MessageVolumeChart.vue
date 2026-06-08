<template>
  <div 
    class="border rounded-[20px] p-5 shadow-sm text-left flex flex-col justify-between"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
  >
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Tin nhắn theo ngày</h3>
      <v-icon size="16" class="text-slate-400">mdi-chart-bar</v-icon>
    </div>
    
    <div class="h-[250px] relative">
      <Bar v-if="chartData" :data="chartData" :options="chartOptions" style="height: 250px;" />
      <div v-else class="text-center py-12 text-slate-400">Không có dữ liệu</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { useTheme } from 'vuetify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  data: { date: string; sent: number; received: number }[];
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

const chartData = computed(() => {
  if (!props.data?.length) return null;
  return {
    labels: props.data.map(d => d.date.slice(5)), // MM-DD
    datasets: [
      { 
        label: 'Đã nhận', 
        data: props.data.map(d => d.received), 
        backgroundColor: '#10b981', // Emerald matching ZaloCRM
        borderRadius: 6,
      },
      { 
        label: 'Đã gửi', 
        data: props.data.map(d => d.sent), 
        backgroundColor: isDark.value ? '#1D2D50' : '#E2E8F0', // Muted slate gray
        borderRadius: 6,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      position: 'top' as const,
      labels: {
        color: isDark.value ? '#94A3B8' : '#64748B',
        font: { family: 'Inter', size: 10, weight: 'bold' as const }
      }
    } 
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: isDark.value ? '#64748B' : '#94A3B8', font: { family: 'Inter', size: 9 } }
    },
    y: {
      grid: { color: isDark.value ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
      ticks: { color: isDark.value ? '#64748B' : '#94A3B8', font: { family: 'Inter', size: 9 } }
    }
  }
}));
</script>
