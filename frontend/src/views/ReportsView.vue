<template>
  <div>
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-8 mt-2 flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-chart-box-outline</v-icon>
          </div>
          Báo cáo
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Phân tích tin nhắn, tăng trưởng khách hàng và thống kê lịch hẹn
        </p>
      </div>
      
      <div class="flex items-center gap-2 flex-wrap">
        <v-text-field
          v-model="dateFrom"
          label="Từ ngày"
          type="date"
          density="compact"
          variant="outlined"
          style="max-width: 160px;"
          hide-details
        />
        <v-text-field
          v-model="dateTo"
          label="Đến ngày"
          type="date"
          density="compact"
          variant="outlined"
          style="max-width: 160px;"
          hide-details
        />
        <v-btn color="primary" prepend-icon="mdi-refresh" :loading="loading" @click="fetchReport" class="font-bold">Xem</v-btn>
        <v-btn color="success" prepend-icon="mdi-file-excel" :loading="exporting" @click="exportExcel" class="font-bold">Xuất Excel</v-btn>
      </div>
    </div>

    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="messages">Tin nhắn</v-tab>
      <v-tab value="contacts">Khách hàng</v-tab>
      <v-tab value="appointments">Lịch hẹn</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="messages">
        <v-data-table
          :headers="msgHeaders"
          :items="msgData"
          :loading="loading"
          no-data-text="Không có dữ liệu"
        />
      </v-window-item>
      <v-window-item value="contacts">
        <v-data-table
          :headers="contactHeaders"
          :items="contactData"
          :loading="loading"
          no-data-text="Không có dữ liệu"
        />
      </v-window-item>
      <v-window-item value="appointments">
        <v-data-table
          :headers="aptHeaders"
          :items="aptData"
          :loading="loading"
          no-data-text="Không có dữ liệu"
        />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { api } from '@/api';
import { useTheme } from 'vuetify';

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// Date defaults: last 30 days
const today = new Date();
const prior = new Date(today);
prior.setDate(prior.getDate() - 30);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

const dateFrom = ref(fmt(prior));
const dateTo = ref(fmt(today));
const tab = ref('messages');
const loading = ref(false);
const exporting = ref(false);

const msgData = ref<{ date: string; sent: number; received: number }[]>([]);
const contactData = ref<{ label: string; count: number }[]>([]);
const aptData = ref<{ label: string; count: number }[]>([]);

const msgHeaders = [
  { title: 'Ngày', key: 'date' },
  { title: 'Đã gửi', key: 'sent' },
  { title: 'Đã nhận', key: 'received' },
];

const contactHeaders = [
  { title: 'Phân loại', key: 'label' },
  { title: 'Số lượng', key: 'count' },
];

const aptHeaders = [
  { title: 'Phân loại', key: 'label' },
  { title: 'Số lượng', key: 'count' },
];

async function fetchReport() {
  loading.value = true;
  try {
    const params = { from: dateFrom.value, to: dateTo.value };
    if (tab.value === 'messages') {
      const res = await api.get('/reports/messages', { params });
      msgData.value = res.data.data || res.data;
    } else if (tab.value === 'contacts') {
      const res = await api.get('/reports/contacts', { params });
      const raw = res.data;
      // Combine treatmentProgress + medicationStatus distributions
      const rows: { label: string; count: number }[] = [];
      const days = Array.isArray(raw.newPerDay) ? raw.newPerDay : [];
      for (const d of days) {
        rows.push({ label: `Mới ${d.date}`, count: Number(d.count ?? 0) });
      }
      for (const t of (raw.treatmentProgress ?? [])) {
        rows.push({ label: `Tiến triển: ${t.status}`, count: Number(t.count ?? 0) });
      }
      for (const m of (raw.medicationStatus ?? [])) {
        rows.push({ label: `Thuốc: ${m.status}`, count: Number(m.count ?? 0) });
      }
      contactData.value = rows;
    } else if (tab.value === 'appointments') {
      const res = await api.get('/reports/appointments', { params });
      const raw = res.data;
      const rows: { label: string; count: number }[] = [];
      for (const s of (raw.byStatus ?? [])) {
        rows.push({ label: `Trạng thái: ${s.status}`, count: Number(s.count ?? 0) });
      }
      for (const t of (raw.byType ?? [])) {
        rows.push({ label: `Loại: ${t.type ?? '—'}`, count: Number(t.count ?? 0) });
      }
      aptData.value = rows;
    }
  } catch (err) {
    console.error('Report fetch error:', err);
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  exporting.value = true;
  try {
    const res = await api.get('/reports/export', {
      params: { type: tab.value, from: dateFrom.value, to: dateTo.value },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${tab.value}-${dateFrom.value}-${dateTo.value}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
}

// Auto-fetch when tab changes
watch(tab, () => fetchReport());

// Initial load
fetchReport();
</script>
