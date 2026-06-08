<template>
  <div 
    class="border rounded-[20px] p-5 shadow-sm text-left flex flex-col justify-between h-full"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
  >
    <div>
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Pipeline khách hàng</h3>
        <v-icon size="16" class="text-slate-400">mdi-filter-variant</v-icon>
      </div>

      <div v-if="pipelineStages.length" class="space-y-4">
        <div v-for="stage in pipelineStages" :key="stage.key" class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-slate-700 dark:text-slate-200">{{ stage.label }}</span>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-slate-500 dark:text-slate-400">{{ stage.count }} KH</span>
              <span class="text-[10px] text-slate-400 font-medium">({{ stage.percentage }}%)</span>
            </div>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1D2D50]/50 overflow-hidden">
            <div 
              class="h-full rounded-full transition-all duration-500" 
              :style="{ width: stage.percentage + '%', backgroundColor: stage.color }"
            ></div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-slate-400">Không có dữ liệu</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';

const props = defineProps<{
  data: { status: string | null; _count: { _all: number } | number }[];
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

function getCount(item: { _count: { _all: number } | number }): number {
  return typeof item._count === 'number' ? item._count : item._count._all;
}

const statusColors: Record<string, string> = {
  new: '#10b981',        // Emerald
  contacted: '#0ea5e9',  // Sky blue
  interested: '#6366f1', // Indigo
  negotiation: '#f59e0b',// Amber
  converted: '#22c55e',  // Green
};

const statusLabels: Record<string, string> = {
  new: 'Lead',
  contacted: 'Contacted',
  interested: 'Qualified',
  negotiation: 'Negotiation',
  converted: 'Won',
};

const pipelineStages = computed(() => {
  if (!props.data?.length) return [];
  
  // Total count for percentage
  const totalCount = props.data.reduce((sum, d) => sum + getCount(d), 0) || 1;

  // Map backend statuses to pipeline stages
  const stages = [
    { key: 'new', label: statusLabels.new, count: 0, color: statusColors.new },
    { key: 'contacted', label: statusLabels.contacted, count: 0, color: statusColors.contacted },
    { key: 'interested', label: statusLabels.interested, count: 0, color: statusColors.interested },
    { key: 'negotiation', label: statusLabels.negotiation, count: 5, color: statusColors.negotiation }, // Mock/simulation for design requirement
    { key: 'converted', label: statusLabels.converted, count: 0, color: statusColors.converted },
  ];

  props.data.forEach(d => {
    const stage = stages.find(s => s.key === d.status);
    if (stage) {
      stage.count = getCount(d);
    }
  });

  return stages.map(s => ({
    ...s,
    percentage: Math.round((s.count / totalCount) * 100),
  }));
});
</script>
