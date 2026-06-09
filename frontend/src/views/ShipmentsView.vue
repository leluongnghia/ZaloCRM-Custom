<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-truck-delivery-outline</v-icon>
          </div>
          Theo dõi vận chuyển (Logistics)
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Theo dõi hành trình vận đơn Viettel Post, đồng bộ trạng thái webhook thời gian thực và quản lý COD
        </p>
      </div>

      <div class="flex gap-2">
        <v-btn
          color="blue-grey-darken-1"
          prepend-icon="mdi-robot-confused"
          variant="outlined"
          @click="openSimulationDialog"
          class="font-bold rounded-xl text-xs"
        >
          Mô phỏng Webhook VTP
        </v-btn>
      </div>
    </div>

    <!-- Bento Grid KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div 
        v-for="card in kpiCards" 
        :key="card.title"
        class="p-5 rounded-[20px] border transition-all duration-200"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ card.title }}</span>
          <v-icon :color="card.color" size="22">{{ card.icon }}</v-icon>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-3xl font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ card.value }}</span>
          <span class="text-[11px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">vận đơn</span>
        </div>
        <div class="mt-1 text-[11px] text-slate-400">
          {{ card.subText }}
        </div>
      </div>
    </div>

    <!-- Split Layout Panels -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Left Panel: Shipments List Table (70% or 65% width) -->
      <div class="lg:col-span-8 space-y-4">
        <v-card class="rounded-[20px] border-0" :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'">
          <v-card-text class="pa-4">
            <!-- Filters Toolbar -->
            <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
              <div class="w-full md:w-80">
                <v-text-field
                  v-model="search"
                  placeholder="Tìm theo mã vận đơn, mã đơn..."
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  density="compact"
                  variant="outlined"
                  color="emerald-600"
                  class="rounded-xl"
                />
              </div>
              <div class="flex gap-2 w-full md:w-auto">
                <v-select
                  v-model="statusFilter"
                  :items="statusOptions"
                  label="Trạng thái giao"
                  hide-details
                  density="compact"
                  variant="outlined"
                  color="emerald-600"
                  style="width: 200px;"
                />
              </div>
            </div>

            <!-- Shipments Data Table -->
            <v-data-table
              :headers="headers"
              :items="filteredShipments"
              :loading="loading"
              v-model:selected="selectedShipments"
              select-strategy="single"
              hover
              class="rounded-xl text-xs"
              @click:row="handleRowClicked"
            >
              <!-- Waybill tracking code -->
              <template #item.trackingNumber="{ item }">
                <span class="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {{ item.trackingNumber || 'CHƯA CÓ (PENDING)' }}
                </span>
              </template>

              <!-- Order Reference -->
              <template #item.orderCode="{ item }">
                <span class="font-mono text-xs text-slate-500">
                  {{ item.order?.orderCode || '—' }}
                </span>
              </template>

              <!-- Customer details -->
              <template #item.receiver="{ item }">
                <div class="flex flex-col" v-if="item.order">
                  <span class="font-bold text-slate-800 dark:text-slate-200">
                    {{ getAddressDetails(item.order.shippingAddressJson).receiverName }}
                  </span>
                  <span class="text-[11px] text-slate-400">
                    {{ getAddressDetails(item.order.shippingAddressJson).receiverPhone }}
                  </span>
                </div>
                <span v-else>—</span>
              </template>

              <!-- COD Amount -->
              <template #item.codAmount="{ item }">
                <span class="font-bold">
                  {{ formatCurrency(item.codAmount) }}
                </span>
              </template>

              <!-- Delivery status -->
              <template #item.status="{ item }">
                <v-chip
                  :color="shipmentStatusColor(item.status)"
                  size="small"
                  variant="tonal"
                  class="font-bold"
                >
                  {{ shipmentStatusLabel(item.status) }}
                </v-chip>
              </template>

              <!-- PDF label link -->
              <template #item.labelPdfUrl="{ item }">
                <a 
                  v-if="item.labelPdfUrl" 
                  :href="item.labelPdfUrl" 
                  target="_blank" 
                  class="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-semibold"
                  @click.stop
                >
                  <v-icon size="14">mdi-file-pdf-box</v-icon> PDF
                </a>
                <span v-else class="text-xs text-slate-400">—</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </div>

      <!-- Right Panel: Live Shipment Tracking Details (35% width) -->
      <div class="lg:col-span-4 space-y-4">
        <!-- Loading state -->
        <div v-if="detailsLoading" class="p-8 rounded-[20px] border flex flex-col items-center justify-center min-h-[400px]" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
          <v-progress-circular indeterminate color="emerald-600" class="mb-4" />
          <span class="text-xs text-slate-400">Đang tải lịch trình vận đơn...</span>
        </div>

        <!-- Selected Shipment details -->
        <div v-else-if="selectedShipment" class="rounded-[20px] border p-5 space-y-5" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
          <div class="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase">Chi tiết vận đơn</span>
              <h2 class="text-base font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {{ selectedShipment.trackingNumber || 'CHỜ TẠO' }}
              </h2>
            </div>
            <v-chip :color="shipmentStatusColor(selectedShipment.status)" size="small" variant="flat" class="font-bold text-white text-[10px]">
              {{ shipmentStatusLabel(selectedShipment.status) }}
            </v-chip>
          </div>

          <!-- Recipient & Logistics info -->
          <div class="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl text-xs">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Người nhận</div>
              <div class="font-bold text-slate-800 dark:text-slate-100 mt-1">
                {{ getAddressDetails(selectedShipment.order?.shippingAddressJson).receiverName }}
              </div>
              <div class="text-slate-500 mt-0.5">
                SĐT: {{ getAddressDetails(selectedShipment.order?.shippingAddressJson).receiverPhone }}
              </div>
              <div class="text-slate-400 mt-1 italic">
                ĐC: {{ getAddressText(selectedShipment.order?.shippingAddressJson) }}
              </div>
            </div>

            <v-divider class="my-2 dark:border-slate-800" />

            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-slate-400">COD thu hộ:</span>
                <div class="font-bold text-emerald-600 mt-0.5">{{ formatCurrency(selectedShipment.codAmount) }}</div>
              </div>
              <div>
                <span class="text-slate-400">Trọng lượng:</span>
                <div class="font-bold mt-0.5">{{ selectedShipment.weightGrams }}g</div>
              </div>
            </div>

            <div class="flex justify-between items-center pt-2" v-if="selectedShipment.estimatedDelivery">
              <span class="text-slate-400">Dự kiến giao:</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ new Date(selectedShipment.estimatedDelivery).toLocaleDateString('vi-VN') }}
              </span>
            </div>

            <div v-if="selectedShipment.labelPdfUrl" class="pt-2">
              <a :href="selectedShipment.labelPdfUrl" target="_blank" class="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-bold transition-all text-xs">
                <v-icon size="14">mdi-printer</v-icon> Xem nhãn in (PDF)
              </a>
            </div>
          </div>

          <!-- Real-time timeline tracker -->
          <div class="space-y-4">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-800">Hành trình chi tiết (Realtime)</h4>

            <div v-if="selectedShipment.trackingLogs && selectedShipment.trackingLogs.length > 0" class="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800 ml-2 py-1">
              <div 
                v-for="(log, idx) in selectedShipment.trackingLogs" 
                :key="log.id"
                class="relative text-xs"
              >
                <!-- Dot -->
                <div 
                  class="absolute -left-[21px] top-0.5 h-3 w-3 rounded-full border-2 bg-white"
                  :class="idx === 0 ? 'border-emerald-600 bg-emerald-100 animate-pulse' : 'border-slate-300 bg-white dark:bg-[#112240]'"
                ></div>
                
                <div>
                  <div class="font-bold" :class="idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                    {{ log.activity }}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">
                    {{ formatDateTime(log.occurredAt) }}
                  </div>
                  <div v-if="log.location" class="text-[10px] text-slate-500 italic mt-0.5">
                    Vị trí: {{ log.location }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-slate-400 text-xs italic">
              Chưa có hành trình vận chuyển được ghi nhận.
            </div>
          </div>

          <!-- Status history table -->
          <div class="space-y-2">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b pb-2 dark:border-slate-800">Lịch sử hệ thống</h4>
            
            <div class="border dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table class="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr class="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 text-slate-400">
                    <th class="p-2 font-bold">Từ -> Sang</th>
                    <th class="p-2 font-bold text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in selectedShipment.statusHistory" :key="h.id" class="border-b last:border-b-0 dark:border-slate-800 hover:bg-slate-50/50">
                    <td class="p-2">
                      <span class="font-mono text-slate-400">{{ h.fromStatus }}</span>
                      <v-icon size="10" color="slate-400" class="mx-1">mdi-arrow-right</v-icon>
                      <span class="font-bold text-slate-700 dark:text-slate-200">{{ h.toStatus }}</span>
                      <div class="text-[10px] text-slate-400 mt-0.5">{{ h.notes }}</div>
                    </td>
                    <td class="p-2 text-right text-slate-400 align-top">
                      {{ formatDateTime(h.createdAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Placeholder state -->
        <div v-else class="p-8 rounded-[20px] border flex flex-col items-center justify-center min-h-[400px] text-center" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
          <v-icon size="40" color="slate-400" class="mb-3">mdi-truck-cargo-container</v-icon>
          <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300">Chọn vận đơn</h3>
          <p class="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Chọn một dòng vận đơn bên trái để theo dõi lịch trình chi tiết</p>
        </div>
      </div>
    </div>

    <!-- Dialog: Mô phỏng Webhook Viettel Post (Dev/Demo tool) -->
    <v-dialog v-model="simulationDialog" max-width="500px">
      <v-card class="rounded-[20px] border border-slate-200 dark:border-slate-800" :class="isDark ? 'bg-[#112240]' : 'bg-white'">
        <v-card-title class="bg-slate-800 dark:bg-slate-900 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">MÔ PHỎNG WEBHOOK VIETTEL POST</span>
          <v-icon color="white" class="cursor-pointer" @click="simulationDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="space-y-4 text-xs">
            <p class="text-slate-400">
              Công cụ mô phỏng cách Viettel Post gửi webhook cập nhật trạng thái về ZaloCRM. Giúp kiểm tra tính chính xác của P1 Webhook Security và DB sync.
            </p>

            <v-select
              v-model="simData.shipmentId"
              :items="simShipmentsList"
              item-title="trackingText"
              item-value="id"
              label="Chọn vận đơn cần cập nhật"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              class="rounded-xl"
            />

            <v-select
              v-model="simData.statusCode"
              :items="vtpStatusCodes"
              item-title="label"
              item-value="code"
              label="Chọn mã trạng thái mới của Viettel Post"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              class="rounded-xl"
            />

            <v-text-field
              v-model="simData.location"
              label="Vị trí/Bưu cục hiện tại (Mô phỏng)"
              placeholder="Ví dụ: Bưu cục Cầu Giấy Hub"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              class="rounded-xl"
            />

            <v-text-field
              v-model="simData.secret"
              label="Webhook Secret Key"
              placeholder="Nhập secret key để xác thực"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              class="rounded-xl"
              hint="Phải khớp với Secret Key cấu hình để xác thực webhook thành công"
              persistent-hint
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end border-t dark:border-slate-800">
          <v-btn variant="outlined" color="slate-400" @click="simulationDialog = false" class="font-bold text-xs">Đóng</v-btn>
          <v-btn
            color="emerald-600"
            variant="flat"
            class="text-white font-bold text-xs"
            :loading="simulating"
            :disabled="!simData.shipmentId"
            @click="triggerWebhookSimulation"
          >
            Gửi Webhook (Trigger)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar alert -->
    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="4000">
      {{ snack.text }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snack.show = false">Đóng</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { api } from '@/api';

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// State
const shipments = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('ALL');

// Selection state for double panel layout
const selectedShipments = ref<any[]>([]);
const selectedShipment = ref<any | null>(null);
const detailsLoading = ref(false);

// Webhook simulation state
const simulationDialog = ref(false);
const simulating = ref(false);
const simData = reactive({
  shipmentId: '',
  statusCode: 501, 
  location: 'Bưu cục Khai Thác Cầu Giấy',
  secret: 'VTP_WEBHOOK_SECRET_2026', 
});

const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
}

// Table Headers
const headers = [
  { title: 'Mã Vận Đơn', key: 'trackingNumber', sortable: true },
  { title: 'Mã Đơn', key: 'orderCode', sortable: true },
  { title: 'Người Nhận', key: 'receiver', sortable: true },
  { title: 'Tiền COD', key: 'codAmount', sortable: true, align: 'end' as const },
  { title: 'Trạng Thái Vận Chuyển', key: 'status', sortable: true },
  { title: 'Nhãn In PDF', key: 'labelPdfUrl', sortable: false },
];

const statusOptions = [
  { title: 'Tất cả vận đơn', value: 'ALL' },
  { title: 'Chờ tạo vận đơn ngầm', value: 'PENDING_WAYBILL' },
  { title: 'Chờ lấy hàng (Pickup Pending)', value: 'PICKUP_PENDING' },
  { title: 'Đang giao hàng (Shipping)', value: 'SHIPPING' },
  { title: 'Giao thành công (Delivered)', value: 'DELIVERED' },
  { title: 'Đã hủy (Cancelled)', value: 'CANCELLED' },
];

// Bento Grid KPI computations
const kpiCards = computed(() => {
  const total = shipments.value.length;
  const shipping = shipments.value.filter(s => s.status === 'SHIPPING').length;
  const delivered = shipments.value.filter(s => s.status === 'DELIVERED').length;
  const pending = shipments.value.filter(s => s.status === 'PENDING_WAYBILL').length;

  return [
    { title: 'Tổng số vận đơn', value: total, icon: 'mdi-truck-cargo-container', color: 'blue', subText: 'Tổng lượng vận đơn đã xử lý' },
    { title: 'Đang vận chuyển', value: shipping, icon: 'mdi-dolly', color: 'indigo', subText: 'Hàng hóa đang trên đường đi' },
    { title: 'Giao thành công', value: delivered, icon: 'mdi-check-all', color: 'emerald-600', subText: 'Đã phát thành công tới người nhận' },
    { title: 'Chờ tạo vận đơn', value: pending, icon: 'mdi-alert-circle-outline', color: 'orange', subText: 'Các vận đơn lỗi API chờ chạy lại' },
  ];
});

// Filters logic
const filteredShipments = computed(() => {
  return shipments.value.filter(item => {
    // Search filter
    const trackingMatch = item.trackingNumber?.toLowerCase().includes(search.value.toLowerCase()) || false;
    const orderMatch = item.order?.orderCode?.toLowerCase().includes(search.value.toLowerCase()) || false;
    const matchesSearch = trackingMatch || orderMatch;

    // Status filter
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

// Webhook simulation items
const simShipmentsList = computed(() => {
  return shipments.value
    .filter(s => s.status !== 'PENDING_WAYBILL' && s.trackingNumber)
    .map(s => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      trackingText: `${s.trackingNumber} (${s.order?.orderCode || 'Không có mã đơn'})`
    }));
});

const vtpStatusCodes = [
  { label: '501 - Đang giao hàng (SHIPPING)', code: 501 },
  { label: '505 - Giao thành công (DELIVERED)', code: 505 },
  { label: '107 - Người nhận từ chối / Hủy đơn (CANCELLED)', code: 107 },
  { label: '202 - Chờ lấy hàng lại (PICKUP_PENDING)', code: 202 },
];

// Formatting
function formatCurrency(val: number) {
  if (val === undefined || val === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

// Shipment Status Helpers
function shipmentStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING_WAYBILL: 'Chờ tạo vận đơn',
    PICKUP_PENDING: 'Chờ lấy hàng',
    SHIPPING: 'Đang giao hàng',
    DELIVERED: 'Giao thành công',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
}

function shipmentStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING_WAYBILL: 'orange',
    PICKUP_PENDING: 'blue',
    SHIPPING: 'indigo',
    DELIVERED: 'emerald-600',
    CANCELLED: 'red',
  };
  return map[status] ?? 'grey';
}

// APIs
async function fetchShipments() {
  loading.value = true;
  try {
    const res = await api.get('/logistics/shipments');
    shipments.value = res.data.shipments ?? [];
    
    // Auto-select first shipment on mount if list is not empty
    if (shipments.value.length > 0 && !selectedShipment.value) {
      loadShipmentDetails(shipments.value[0].id);
    }
  } catch (err: any) {
    console.error('Failed to fetch shipments:', err);
    showSnack('Không thể tải danh sách vận đơn', 'error');
  } finally {
    loading.value = false;
  }
}

// Row click handler for table
function handleRowClicked(_event: Event, { item }: { item: any }) {
  if (item && item.id) {
    loadShipmentDetails(item.id);
  }
}

async function loadShipmentDetails(id: string) {
  detailsLoading.value = true;
  try {
    const res = await api.get(`/logistics/shipments/${id}`);
    selectedShipment.value = res.data;
  } catch (err: any) {
    console.error('Failed to load shipment details:', err);
    showSnack('Không thể tải chi tiết vận đơn', 'error');
  } finally {
    detailsLoading.value = false;
  }
}

// Webhook simulation handler
function openSimulationDialog() {
  if (simShipmentsList.value.length === 0) {
    showSnack('Vui lòng tạo ít nhất 1 vận đơn (Waybill) thành công trước khi chạy mô phỏng webhook!', 'warning');
    return;
  }
  simData.shipmentId = simShipmentsList.value[0].id;
  simulationDialog.value = true;
}

async function triggerWebhookSimulation() {
  simulating.value = true;
  try {
    const targetShipment = shipments.value.find(s => s.id === simData.shipmentId);
    if (!targetShipment || !targetShipment.trackingNumber) return;

    const orgId = targetShipment.order?.orgId;
    if (!orgId) {
      showSnack('Không tìm thấy Org ID của vận đơn này', 'error');
      return;
    }

    const payload = {
      ORDER_NUMBER: targetShipment.trackingNumber,
      ORDER_STATUS: simData.statusCode,
      STATUS_NAME: getVtpStatusName(simData.statusCode),
      LOC_NAME: simData.location || 'Bưu cục phân loại chính',
      NOTE: 'Mô phỏng cập nhật trạng thái vận đơn tự động.',
    };

    await api.post(`/logistics/webhook/viettelpost/${orgId}`, payload, {
      headers: {
        'X-Viettel-Secret': simData.secret,
      },
    });

    showSnack('Đã gửi Webhook thành công! Trạng thái vận đơn đang được đồng bộ ngầm.');
    simulationDialog.value = false;
    
    // Reload database states and refresh details
    setTimeout(async () => {
      await fetchShipments();
      if (selectedShipment.value && selectedShipment.value.id === simData.shipmentId) {
        await loadShipmentDetails(simData.shipmentId);
      }
    }, 1000);
  } catch (err: any) {
    console.error('Failed to trigger webhook simulation:', err);
    showSnack(err.response?.data?.error || 'Gửi webhook thất bại (Xác thực không hợp lệ?)', 'error');
  } finally {
    simulating.value = false;
  }
}

function getVtpStatusName(code: number) {
  const map: Record<number, string> = {
    501: 'Đang giao hàng',
    505: 'Giao thành công',
    107: 'Khách hàng không nhận hàng / Hủy đơn',
    202: 'Bưu tá báo chờ phát lại',
  };
  return map[code] ?? 'Cập nhật hành trình';
}

// Helpers
function getAddressDetails(addressJson: string) {
  try {
    return JSON.parse(addressJson);
  } catch {
    return {
      receiverName: 'Chưa cập nhật',
      receiverPhone: '',
      receiverProvince: '',
      receiverDistrict: '',
      receiverWard: '',
      receiverAddress: '',
    };
  }
}

function getAddressText(addressJson: string) {
  const addr = getAddressDetails(addressJson);
  return `${addr.receiverAddress}, ${addr.receiverWard}, ${addr.receiverDistrict}, ${addr.receiverProvince}`;
}

onMounted(() => {
  fetchShipments();
});
</script>

<style scoped>
.v-btn {
  letter-spacing: 0.5px;
}
</style>
