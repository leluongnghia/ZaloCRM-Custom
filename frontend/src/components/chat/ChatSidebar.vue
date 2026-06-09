<template>
  <div 
    class="flex flex-col h-full border-r transition-all duration-300"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
    style="width: 240px; flex-shrink: 0;"
  >
    <!-- Header / Active Stats -->
    <div class="p-4 border-b flex items-center justify-between" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
      <div class="flex items-center gap-2">
        <v-icon size="18" class="text-emerald-500">mdi-inbox-multiple</v-icon>
        <span class="font-bold text-xs tracking-wider uppercase" :class="isDark ? 'text-slate-200' : 'text-slate-800'">Hộp thư</span>
      </div>
      <v-chip size="x-small" color="success" class="font-bold text-white px-2">{{ unreadTotal }} Mới</v-chip>
    </div>

    <!-- Inbox filters -->
    <div class="flex-1 overflow-y-auto p-3 space-y-4 hidescrollbar">
      <!-- Standard Filters -->
      <div>
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 px-2 uppercase">HỘP THƯ CHÍNH</div>
        <div class="space-y-1">
          <button
            v-for="filter in filters"
            :key="filter.id"
            @click="$emit('update:activeFilter', filter.id)"
            class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-left"
            :class="activeFilter === filter.id 
              ? (isDark ? 'bg-[#1D2D50] text-[#10B981] font-semibold' : 'bg-emerald-50 text-emerald-700 font-semibold') 
              : (isDark ? 'text-slate-300 hover:bg-[#1D2D50]/40' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')"
          >
            <div class="flex items-center gap-2.5">
              <v-icon size="16" :class="activeFilter === filter.id ? (isDark ? 'text-[#10B981]' : 'text-emerald-600') : 'text-slate-400'">
                {{ filter.icon }}
              </v-icon>
              <span class="text-xs">{{ filter.name }}</span>
            </div>
            <span 
              v-if="filter.count > 0" 
              class="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              :class="filter.id === 'ai' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                : (activeFilter === filter.id 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')"
            >
              {{ filter.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- Zalo Account Select -->
      <div>
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 px-2 uppercase">LỌC THEO ZALO</div>
        <div class="px-2">
          <v-select
            :model-value="selectedAccountId"
            @update:model-value="$emit('update:selectedAccountId', $event)"
            :items="accountOptions"
            item-title="text"
            item-value="value"
            label="Tất cả tài khoản"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            class="text-xs"
            :theme="isDark ? 'dark' : 'light'"
          />
        </div>
      </div>

      <!-- Tags Filters -->
      <div>
        <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 px-2 uppercase">PHÂN LOẠI (TAGS)</div>
        <div class="space-y-1">
          <button
            @click="$emit('update:selectedTag', null)"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 text-left text-xs"
            :class="!selectedTag 
              ? (isDark ? 'bg-[#1D2D50] text-[#10B981] font-medium' : 'bg-emerald-50 text-emerald-700 font-medium') 
              : (isDark ? 'text-slate-300 hover:bg-[#1D2D50]/40' : 'text-slate-600 hover:bg-slate-50')"
          >
            <div class="flex items-center gap-2">
              <v-icon size="14" :class="!selectedTag ? (isDark ? 'text-[#10B981]' : 'text-emerald-600') : 'text-slate-400'">mdi-tag-multiple-outline</v-icon>
              <span>Tất cả nhãn</span>
            </div>
          </button>
          
          <button
            v-for="tag in availableTags"
            :key="tag"
            @click="$emit('update:selectedTag', tag)"
            class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all duration-200 text-left text-xs"
            :class="selectedTag === tag 
              ? (isDark ? 'bg-[#1D2D50] text-[#10B981] font-medium' : 'bg-emerald-50 text-emerald-700 font-medium') 
              : (isDark ? 'text-slate-300 hover:bg-[#1D2D50]/40' : 'text-slate-600 hover:bg-slate-50')"
          >
            <div class="flex items-center gap-2">
              <v-icon size="14" class="text-slate-400">mdi-tag-outline</v-icon>
              <span>{{ tag }}</span>
            </div>
            <span class="text-[10px] text-slate-400 dark:text-slate-500">({{ getTagCount(tag) }})</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import type { Conversation } from '@/composables/use-chat';

const props = defineProps<{
  conversations: Conversation[];
  activeFilter: string;
  selectedAccountId: string | null;
  accountOptions: { text: string; value: string }[];
  selectedTag: string | null;
  unreadTotal: number;
  filterCounts: {
    unread: number;
    assigned: number;
    waiting: number;
    followup: number;
    ai: number;
  };
}>();

defineEmits<{
  'update:activeFilter': [value: string];
  'update:selectedAccountId': [value: string | null];
  'update:selectedTag': [value: string | null];
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

const filters = computed(() => [
  { id: 'all', name: 'Tất cả tin nhắn', icon: 'mdi-message-text-outline', count: props.conversations.length },
  { id: 'unread', name: 'Chưa đọc', icon: 'mdi-email-unread-outline', count: props.filterCounts.unread },
  { id: 'assigned', name: 'Giao cho tôi', icon: 'mdi-account-outline', count: props.filterCounts.assigned },
  { id: 'waiting', name: 'Chờ phản hồi', icon: 'mdi-clock-outline', count: props.filterCounts.waiting },
  { id: 'followup', name: 'Hẹn hôm nay', icon: 'mdi-calendar-today', count: props.filterCounts.followup },
  { id: 'ai', name: 'Trợ lý AI ưu tiên', icon: 'mdi-robot-outline', count: props.filterCounts.ai },
]);

const availableTags = computed(() => {
  const allTags = new Set<string>();
  props.conversations.forEach(c => {
    if (c.contact?.tags) {
      try {
        const parsed = typeof c.contact.tags === 'string' ? JSON.parse(c.contact.tags) : c.contact.tags;
        if (Array.isArray(parsed)) {
          parsed.forEach((t: string) => allTags.add(t));
        }
      } catch {
        // Tag not parseable
      }
    }
  });
  return Array.from(allTags).slice(0, 10); // Return top 10 unique tags
});

function getTagCount(tag: string): number {
  return props.conversations.filter(c => {
    if (!c.contact?.tags) return false;
    try {
      const parsed = typeof c.contact.tags === 'string' ? JSON.parse(c.contact.tags) : c.contact.tags;
      return Array.isArray(parsed) && parsed.includes(tag);
    } catch {
      return false;
    }
  }).length;
}
</script>

<style scoped>
.hidescrollbar::-webkit-scrollbar {
  display: none;
}
.hidescrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
