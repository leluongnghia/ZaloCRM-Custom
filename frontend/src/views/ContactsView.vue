<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-account-group-outline</v-icon>
          </div>
          Khách hàng
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Quản lý danh bạ khách hàng Zalo, phân loại và trạng thái chăm sóc
        </p>
      </div>
      
      <div>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate" class="font-bold">
          Thêm KH
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <ContactFilters :filters="filters" @search="onFilterChange" />

    <!-- Data table -->
    <v-data-table
      :headers="headers"
      :items="contacts"
      :loading="loading"
      :items-per-page="pagination.limit"
      :items-length="total"
      item-value="id"
      hover
      @click:row="onRowClick"
      @update:page="onPageChange"
    >
      <!-- Avatar -->
      <template #item.avatarUrl="{ item }">
        <v-avatar size="32" color="grey-lighten-2">
          <v-img v-if="item.avatarUrl" :src="item.avatarUrl" />
          <v-icon v-else size="18">mdi-account</v-icon>
        </v-avatar>
      </template>

      <!-- Source chip -->
      <template #item.source="{ item }">
        <v-chip v-if="item.source" size="small" variant="tonal">
          {{ sourceLabel(item.source) }}
        </v-chip>
        <span v-else class="text-grey">—</span>
      </template>

      <!-- Email -->
      <template #item.email="{ item }">
        <span v-if="item.email" class="text-body-2">{{ item.email }}</span>
        <span v-else class="text-grey">—</span>
      </template>

      <!-- Status chip -->
      <template #item.status="{ item }">
        <v-chip
          v-if="item.status"
          :color="statusColor(item.status)"
          size="small"
          variant="tonal"
        >
          {{ statusLabel(item.status) }}
        </v-chip>
        <span v-else class="text-grey">—</span>
      </template>

      <!-- Next appointment date -->
      <template #item.nextAppointment="{ item }">
        <span v-if="item.nextAppointment" class="text-body-2">
          {{ formatDate(item.nextAppointment) }}
        </span>
        <span v-else class="text-grey">—</span>
      </template>

      <!-- First contact date -->
      <template #item.firstContactDate="{ item }">
        {{ item.firstContactDate ? new Date(item.firstContactDate).toLocaleDateString('vi-VN') : '—' }}
      </template>

      <!-- Assigned user -->
      <template #item.assignedUser="{ item }">
        <span class="text-body-2">{{ item.assignedUser?.fullName ?? '—' }}</span>
      </template>
    </v-data-table>

    <!-- Contact detail/edit dialog -->
    <ContactDetailDialog
      v-model="showDialog"
      :contact="selectedContact"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import ContactFilters from '@/components/contacts/ContactFilters.vue';
import ContactDetailDialog from '@/components/contacts/ContactDetailDialog.vue';
import { useContacts, SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';
import { useTheme } from 'vuetify';

const { contacts, total, loading, filters, pagination, fetchContacts } = useContacts();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

const showDialog = ref(false);
const selectedContact = ref<Contact | null>(null);

const headers = [
  { title: '', key: 'avatarUrl', sortable: false, width: '48px' },
  { title: 'Tên', key: 'fullName', sortable: true },
  { title: 'SĐT', key: 'phone', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Nguồn', key: 'source', sortable: false },
  { title: 'Trạng thái', key: 'status', sortable: false },
  { title: 'Tái khám', key: 'nextAppointment', sortable: true },
  { title: 'Ngày tiếp nhận', key: 'firstContactDate', sortable: true },
  { title: 'Sale', key: 'assignedUser', sortable: false },
];

function sourceLabel(value: string) {
  return SOURCE_OPTIONS.find(o => o.value === value)?.text ?? value;
}

function statusLabel(value: string) {
  return STATUS_OPTIONS.find(o => o.value === value)?.text ?? value;
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    new: 'grey',
    contacted: 'blue',
    interested: 'orange',
    converted: 'success',
    lost: 'error',
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

function openCreate() {
  selectedContact.value = null;
  showDialog.value = true;
}

function onRowClick(_event: Event, row: { item: Contact }) {
  selectedContact.value = row.item;
  showDialog.value = true;
}

function onSaved() {
  fetchContacts();
}

function onDeleted() {
  fetchContacts();
}

onMounted(() => fetchContacts());
</script>
