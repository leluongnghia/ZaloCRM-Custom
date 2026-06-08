<template>
  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    <div
      v-for="card in cards"
      :key="card.title"
      class="border rounded-[20px] p-5 shadow-sm transition-all duration-300 hover:shadow-md group cursor-pointer text-left flex flex-col justify-between"
      :class="isDark ? 'bg-[#112240] border-[#1D2D50] hover:border-emerald-500/30' : 'bg-white border-slate-100 hover:border-emerald-500/30'"
    >
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">{{ card.title }}</span>
          <v-icon :color="getIconColorClass(card.colorId)" size="16">{{ card.icon }}</v-icon>
        </div>
        <div class="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{{ card.value }}</div>
      </div>
      
      <!-- Trend indicators (Linear/Stripe style) -->
      <div class="mt-3 flex items-center gap-1.5">
        <span 
          class="text-[10px] font-bold px-1.5 py-0.5 rounded"
          :class="card.trendUp 
            ? (card.colorId === 'orange' || card.colorId === 'red' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400') 
            : (card.colorId === 'orange' || card.colorId === 'red' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400')"
        >
          {{ card.trend }}
        </span>
        <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500">{{ card.trendLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';

interface KpiData {
  messagesToday: number;
  messagesUnreplied: number;
  messagesUnread: number;
  appointmentsToday: number;
  newContactsThisWeek: number;
  totalContacts: number;
}

const props = defineProps<{
  kpi: KpiData | null;
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

const cards = computed(() => [
  { title: 'Tin hôm nay', value: props.kpi?.messagesToday ?? '0', icon: 'mdi-message-processing-outline', colorId: 'cyan', trend: '+8.4%', trendUp: true, trendLabel: 'hôm qua' },
  { title: 'Chưa trả lời', value: props.kpi?.messagesUnreplied ?? '0', icon: 'mdi-alert-circle-outline', colorId: 'orange', trend: '-12%', trendUp: false, trendLabel: 'tuần trước' },
  { title: 'Chưa đọc', value: props.kpi?.messagesUnread ?? '0', icon: 'mdi-email-outline', colorId: 'red', trend: '-5%', trendUp: false, trendLabel: 'hôm qua' },
  { title: 'Lịch hôm nay', value: props.kpi?.appointmentsToday ?? '0', icon: 'mdi-calendar-check-outline', colorId: 'emerald', trend: '+20%', trendUp: true, trendLabel: 'trung bình' },
  { title: 'KH mới (tuần)', value: props.kpi?.newContactsThisWeek ?? '0', icon: 'mdi-account-plus-outline', colorId: 'purple', trend: '+15%', trendUp: true, trendLabel: 'tuần trước' },
  { title: 'Tổng số KH', value: props.kpi?.totalContacts ?? '0', icon: 'mdi-account-group-outline', colorId: 'slate', trend: '+4.2%', trendUp: true, trendLabel: 'tháng trước' },
]);



function getIconColorClass(id: string) {
  const map: Record<string, string> = {
    cyan: '#06b6d4',
    orange: '#f97316',
    red: '#ef4444',
    emerald: '#10b981',
    purple: '#a855f7',
    slate: '#64748b',
  };
  return map[id] || map.slate;
}
</script>
