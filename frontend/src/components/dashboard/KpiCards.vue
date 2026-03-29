<template>
  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
    <div
      v-for="card in cards"
      :key="card.title"
      class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200 group cursor-pointer"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="p-2.5 rounded-xl border" :class="getIconWrapperClass(card.colorId)">
          <v-icon :color="getIconColorClass(card.colorId)" size="22">{{ card.icon }}</v-icon>
        </div>
      </div>
      <div class="flex flex-col">
        <div class="text-[13px] font-semibold text-slate-500 mb-1">{{ card.title }}</div>
        <div class="text-2xl font-bold text-slate-800 tracking-tight">{{ card.value }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const cards = computed(() => [
  { title: 'Tin hôm nay', value: props.kpi?.messagesToday ?? '0', icon: 'mdi-message-processing-outline', colorId: 'cyan' },
  { title: 'Chưa trả lời', value: props.kpi?.messagesUnreplied ?? '0', icon: 'mdi-alert-circle-outline', colorId: 'orange' },
  { title: 'Chưa đọc', value: props.kpi?.messagesUnread ?? '0', icon: 'mdi-email-outline', colorId: 'red' },
  { title: 'Lịch hôm nay', value: props.kpi?.appointmentsToday ?? '0', icon: 'mdi-calendar-check-outline', colorId: 'emerald' },
  { title: 'KH mới (tuần)', value: props.kpi?.newContactsThisWeek ?? '0', icon: 'mdi-account-plus-outline', colorId: 'purple' },
  { title: 'Tổng số KH', value: props.kpi?.totalContacts ?? '0', icon: 'mdi-account-group-outline', colorId: 'slate' },
]);

function getIconWrapperClass(id: string) {
  const map: Record<string, string> = {
    cyan: 'bg-cyan-50 border-cyan-100',
    orange: 'bg-orange-50 border-orange-100',
    red: 'bg-red-50 border-red-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100',
    slate: 'bg-slate-50 border-slate-200',
  };
  return map[id] || map.slate;
}

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
