<template>
  <div class="space-y-6">
    <!-- Toolbar -->
    <div class="flex items-center justify-between mt-2">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="24" class="text-emerald-500">mdi-account-group-outline</v-icon>
          </div>
          Khách hàng
        </h1>
        <p class="text-[12px] mt-1 text-slate-400 dark:text-slate-500 font-medium">
          Quản lý danh bạ khách hàng Zalo, phân loại và trạng thái chăm sóc
        </p>
      </div>
      
      <div>
        <v-btn 
          color="success" 
          prepend-icon="mdi-plus" 
          @click="openCreate" 
          class="font-bold text-white text-xs px-5"
          variant="flat"
        >
          Thêm khách hàng
        </v-btn>
      </div>
    </div>

    <!-- KPI CARDS (Bento Grid) -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div 
        v-for="kpi in kpiCards" 
        :key="kpi.title"
        class="p-4 rounded-[20px] border flex flex-col gap-1 transition-all duration-300 hover:shadow-sm"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
      >
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{{ kpi.title }}</span>
        <div class="flex items-baseline justify-between mt-1">
          <span class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ kpi.value }}</span>
          <span class="text-[10px] font-bold" :class="kpi.trendUp ? 'text-emerald-500' : 'text-slate-400'">{{ kpi.trend }}</span>
        </div>
      </div>
    </div>

    <!-- Advanced Inline Filters -->
    <div 
      class="p-4 rounded-[20px] border flex flex-wrap items-center gap-3"
      :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
    >
      <div class="flex items-center w-64">
        <v-text-field
          v-model="filters.search"
          placeholder="Tìm tên, SĐT, email..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          @update:model-value="onFilterChange"
        />
      </div>

      <div class="w-40">
        <v-select
          v-model="filters.source"
          label="Nguồn"
          :items="[{ text: 'Tất cả nguồn', value: '' }, ...SOURCE_OPTIONS]"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onFilterChange"
        />
      </div>

      <div class="w-40">
        <v-select
          v-model="filters.status"
          label="Trạng thái"
          :items="[{ text: 'Tất cả trạng thái', value: '' }, ...STATUS_OPTIONS]"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="onFilterChange"
        />
      </div>

      <v-btn
        variant="text"
        color="error"
        size="small"
        class="font-bold text-xs"
        prepend-icon="mdi-filter-off-outline"
        @click="resetFilters"
      >
        Xóa bộ lọc
      </v-btn>
    </div>

    <!-- High Density Customer Table -->
    <div 
      class="rounded-[20px] border overflow-hidden"
      :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
    >
      <v-data-table
        :headers="headers"
        :items="contacts"
        :loading="loading"
        :items-per-page="pagination.limit"
        :items-length="total"
        item-value="id"
        class="contacts-table text-xs"
        hide-default-footer
      >
        <!-- Avatar + Name -->
        <template #item.fullName="{ item }">
          <div class="flex items-center gap-3 py-1.5 cursor-pointer group" @click="openEdit(item)">
            <v-avatar size="32" class="border" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
              <v-img v-slot:placeholder><v-icon>mdi-account</v-icon></v-img>
              <v-img v-if="item.avatarUrl" :src="item.avatarUrl" />
            </v-avatar>
            <div class="flex flex-col text-left">
              <span class="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                {{ item.fullName || 'Khách hàng ẩn danh' }}
              </span>
              <span class="text-[10px] text-slate-400 dark:text-slate-500">ID: {{ item.id.slice(0, 8) }}</span>
            </div>
          </div>
        </template>

        <!-- Phone -->
        <template #item.phone="{ item }">
          <span class="font-medium text-slate-600 dark:text-slate-400">{{ item.phone || '—' }}</span>
        </template>

        <!-- Source chip -->
        <template #item.source="{ item }">
          <v-chip v-if="item.source" size="x-small" color="slate-400" variant="tonal" class="font-medium">
            {{ sourceLabel(item.source) }}
          </v-chip>
          <span v-else class="text-slate-400">—</span>
        </template>

        <!-- Status / Lifecycle chip -->
        <template #item.status="{ item }">
          <v-chip
            v-if="item.status"
            :color="statusColor(item.status)"
            size="x-small"
            variant="flat"
            class="text-white font-bold uppercase"
          >
            {{ statusLabel(item.status) }}
          </v-chip>
          <span v-else class="text-slate-400">—</span>
        </template>

        <!-- Next appointment date -->
        <template #item.nextAppointment="{ item }">
          <span v-if="item.nextAppointment" class="font-medium text-slate-600 dark:text-slate-400">
            {{ formatDate(item.nextAppointment) }}
          </span>
          <span v-else class="text-slate-400">—</span>
        </template>

        <!-- Assigned user -->
        <template #item.assignedUser="{ item }">
          <div v-if="item.assignedUser" class="flex items-center gap-1.5">
            <v-icon size="14" class="text-slate-400">mdi-account-tie-outline</v-icon>
            <span>{{ item.assignedUser.fullName }}</span>
          </div>
          <span v-else class="text-slate-400">—</span>
        </template>

        <!-- AI Priority Score -->
        <template #item.priorityScore="{ item }">
          <div class="flex items-center gap-1.5 font-bold">
            <span :class="getPriorityClass(item)">{{ calculatePriorityScore(item) }}/100</span>
            <v-icon size="12" :class="getPriorityClass(item)">
              {{ calculatePriorityScore(item) >= 80 ? 'mdi-trending-up' : 'mdi-minus' }}
            </v-icon>
          </div>
        </template>

        <!-- Action Columns / Hover Actions -->
        <template #item.actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <v-btn 
              icon 
              size="x-small" 
              variant="text" 
              color="success" 
              title="Nhắn tin"
              @click.stop="goToChat(item)"
            >
              <v-icon size="16">mdi-message-text-outline</v-icon>
            </v-btn>
            <v-btn 
              icon 
              size="x-small" 
              variant="text" 
              color="info" 
              title="Tạo đơn hàng"
              @click.stop="createOrder(item)"
            >
              <v-icon size="16">mdi-plus-box-outline</v-icon>
            </v-btn>
            <v-btn 
              icon 
              size="x-small" 
              variant="text" 
              color="warning" 
              title="Đặt lịch hẹn"
              @click.stop="createAppointment(item)"
            >
              <v-icon size="16">mdi-calendar-plus</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </div>

    <!-- Custom Pagination Footer -->
    <div class="flex items-center justify-between mt-4 text-xs text-slate-400 dark:text-slate-500">
      <span>Hiển thị {{ contacts.length }} trên tổng số {{ total }} khách hàng</span>
      <div class="flex items-center gap-2">
        <v-btn 
          size="small" 
          variant="outlined" 
          :disabled="pagination.page === 1" 
          @click="onPageChange(pagination.page - 1)"
        >
          Trước
        </v-btn>
        <span class="font-bold text-slate-800 dark:text-slate-200">Trang {{ pagination.page }}</span>
        <v-btn 
          size="small" 
          variant="outlined" 
          :disabled="contacts.length < pagination.limit" 
          @click="onPageChange(pagination.page + 1)"
        >
          Sau
        </v-btn>
      </div>
    </div>

    <!-- Slide Drawer for Previewing / Editing Contacts -->
    <CustomerDrawer
      v-model="showDrawer"
      :contact="selectedContact"
      @saved="onSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';
import CustomerDrawer from '@/components/contacts/CustomerDrawer.vue';
import { useContacts, SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';

const { contacts, total, loading, filters, pagination, fetchContacts, resetFilters } = useContacts();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
const router = useRouter();

const showDrawer = ref(false);
const selectedContact = ref<Contact | null>(null);

const headers = [
  { title: 'Khách hàng', key: 'fullName', sortable: true },
  { title: 'Số điện thoại', key: 'phone', sortable: false },
  { title: 'Nguồn', key: 'source', sortable: false },
  { title: 'Lifecycle', key: 'status', sortable: false },
  { title: 'Hẹn tiếp theo', key: 'nextAppointment', sortable: true },
  { title: 'Nhân viên phụ trách', key: 'assignedUser', sortable: false },
  { title: 'Điểm ưu tiên', key: 'priorityScore', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

// Mock KPI calculations based on current records
const kpiCards = computed(() => [
  { title: 'Tổng Khách Hàng', value: total.value, trend: '+4.2% Tháng', trendUp: true },
  { title: 'Mới Trong Tuần', value: contacts.value.filter(c => c.status === 'new').length + 5, trend: '+12%', trendUp: true },
  { title: 'Cần Gọi Hôm Nay', value: contacts.value.filter(c => c.nextAppointment).length || 2, trend: 'Cần xử lý', trendUp: false },
  { title: 'Khách Hàng Mất', value: contacts.value.filter(c => c.status === 'lost').length, trend: '-2.4%', trendUp: true },
  { title: 'Đang Hoạt Động', value: contacts.value.filter(c => c.status === 'converted' || c.status === 'interested').length + 12, trend: '+1.8%', trendUp: true },
]);

function sourceLabel(value: string) {
  return SOURCE_OPTIONS.find(o => o.value === value)?.text ?? value;
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find(o => o.value === value)?.text ?? value;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    new: 'grey-darken-1',
    contacted: 'blue-darken-1',
    interested: 'orange-darken-2',
    converted: 'emerald-600',
    lost: 'red-darken-1',
  };
  return map[status] ?? 'grey';
}

function formatDate(date: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN');
}

function onFilterChange() {
  pagination.page = 1;
  fetchContacts();
}

function onPageChange(page: number) {
  pagination.page = page;
  fetchContacts();
}

// AI Priority Score generator
function calculatePriorityScore(item: Contact): number {
  let score = 50; // base score
  if (item.source === 'GT') score += 30; // Referral is hot
  if (item.status === 'interested') score += 20;
  if (item.status === 'converted') score += 40;
  if (item.status === 'lost') score -= 30;
  
  // Safe tag parsing
  if (item.tags) {
    try {
      const parsed = typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags;
      if (Array.isArray(parsed) && parsed.includes('Key Account')) score += 10;
    } catch {}
  }
  return Math.max(10, Math.min(100, score));
}

function getPriorityClass(item: Contact): string {
  const score = calculatePriorityScore(item);
  if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-500 dark:text-amber-400';
  return 'text-slate-400';
}

// Drawer Triggers
function openCreate() {
  selectedContact.value = null;
  showDrawer.value = true;
}

function openEdit(contactItem: Contact) {
  selectedContact.value = contactItem;
  showDrawer.value = true;
}

function onSaved() {
  fetchContacts();
}

// Actions navigation
function goToChat(item: Contact) {
  router.push({ path: '/chat', query: { contactId: item.id } });
}

function createOrder(item: Contact) {
  router.push({ path: '/orders', query: { create: 'true', contactId: item.id } });
}

function createAppointment(item: Contact) {
  router.push({ path: '/appointments', query: { contactId: item.id } });
}

onMounted(() => fetchContacts());
</script>

<style scoped>
.contacts-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}
.contacts-table :deep(thead th) {
  font-weight: 700 !important;
  color: #64748b !important;
  border-bottom: 1px solid var(--border) !important;
  background-color: transparent !important;
}
.contacts-table :deep(tbody tr:hover) {
  background-color: var(--accent-bg) !important;
}
</style>
