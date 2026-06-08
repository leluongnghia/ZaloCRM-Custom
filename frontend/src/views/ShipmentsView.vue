<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-truck-delivery-outline</v-icon>
          </div>
          Theo dõi vận chuyển (Logistics)
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Theo dõi lịch trình vận đơn Viettel Post, hành trình vận chuyển thời gian thực và quản lý thu hộ COD
        </p>
      </div>

      <div class="flex gap-2">
        <!-- Nút Test Webhook simulation -->
        <v-btn
          color="blue-grey-darken-1"
          prepend-icon="mdi-robot-confused"
          variant="outlined"
          @click="openSimulationDialog"
          class="font-bold"
        >
          Mô phỏng Webhook VTP
        </v-btn>
      </div>
    </div>

    <!-- Bento Grid KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

    <!-- Main List & Search -->
    <v-card class="rounded-[20px] border-0" :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'">
      <v-card-text class="pa-4">
        <!-- Filters Toolbar -->
        <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div class="w-full md:w-80">
            <v-text-field
              v-model="search"
              placeholder="Tìm kiếm mã vận đơn, mã đơn..."
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
              label="Trạng thái vận chuyển"
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
          hover
          class="rounded-xl"
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
              <v-icon size="14">mdi-file-pdf-box</v-icon> Nhãn in PDF
            </a>
            <span v-else class="text-xs text-slate-400">—</span>
          </template>

          <!-- Action menu -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-text-search-outline"
              variant="text"
              size="small"
              color="emerald-600"
              @click.stop="openTrackingDetails(item)"
              title="Tra cứu lịch trình"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog: Chi tiết lịch trình / tracking logs -->
    <v-dialog v-model="detailsDialog" max-width="650px">
      <v-card class="rounded-[20px]" v-if="selectedShipmentDetails">
        <v-card-title class="bg-emerald-600 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">LỊCH TRÌNH VẬN ĐƠN: {{ selectedShipmentDetails.trackingNumber || 'CHỜ TẠO' }}</span>
          <v-icon color="white" class="cursor-pointer" @click="detailsDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="space-y-6">
            
            <!-- Thông tin người nhận và nhà vận chuyển -->
            <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900 pa-4 rounded-xl">
              <div>
                <div class="text-slate-400 text-xs font-bold uppercase">Người nhận</div>
                <div class="font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {{ getAddressDetails(selectedShipmentDetails.order?.shippingAddressJson).receiverName }}
                </div>
                <div class="text-slate-500 text-xs mt-0.5">
                  {{ getAddressDetails(selectedShipmentDetails.order?.shippingAddressJson).receiverPhone }}
                </div>
                <div class="text-slate-500 text-xs mt-1">
                  {{ getAddressText(selectedShipmentDetails.order?.shippingAddressJson) }}
                </div>
              </div>

              <div>
                <div class="text-slate-400 text-xs font-bold uppercase">Thông tin Logistics</div>
                <div class="mt-1">
                  <strong>Thu hộ COD:</strong> <span class="text-emerald-600 font-bold">{{ formatCurrency(selectedShipmentDetails.codAmount) }}</span>
                </div>
                <div>
                  <strong>Trọng lượng:</strong> {{ selectedShipmentDetails.weightGrams }}g
                </div>
                <div v-if="selectedShipmentDetails.estimatedDelivery">
                  <strong>Giao dự kiến:</strong> {{ new Date(selectedShipmentDetails.estimatedDelivery).toLocaleDateString('vi-VN') }}
                </div>
                <div v-if="selectedShipmentDetails.labelPdfUrl" class="mt-2">
                  <a :href="selectedShipmentDetails.labelPdfUrl" target="_blank" class="text-blue-500 font-bold hover:underline flex items-center gap-1 text-xs">
                    <v-icon size="14">mdi-printer</v-icon> Xem nhãn in (PDF)
                  </a>
                </div>
              </div>
            </div>

            <!-- Hành trình vận chuyển (Timeline) -->
            <div>
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Hành trình chi tiết (Realtime)</h4>
              
              <div v-if="selectedShipmentDetails.trackingLogs && selectedShipmentDetails.trackingLogs.length > 0" class="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-700 ml-2">
                <div 
                  v-for="(log, idx) in selectedShipmentDetails.trackingLogs" 
                  :key="log.id"
                  class="relative"
                >
                  <!-- Timeline dot -->
                  <div 
                    class="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-white"
                    :class="idx === 0 ? 'border-emerald-600 bg-emerald-100 animate-pulse' : 'border-slate-300 bg-white dark:bg-slate-800'"
                  ></div>
                  
                  <div>
                    <div class="text-xs font-bold" :class="idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'">
                      {{ log.activity }}
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5">
                      {{ formatDateTime(log.occurredAt) }}
                    </div>
                    <div v-if="log.location" class="text-[11px] text-slate-500 italic">
                      Vị trí: {{ log.location }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-6 text-slate-400 text-sm">
                Chưa có hành trình vận chuyển được ghi nhận.
              </div>
            </div>

            <!-- Lịch sử đổi trạng thái của hệ thống -->
            <div>
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lịch sử trạng thái hệ thống</h4>
              <div class="border rounded-xl overflow-hidden text-xs">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-900 border-b">
                      <th class="p-2.5 font-bold">Từ trạng thái</th>
                      <th class="p-2.5 font-bold">Sang trạng thái</th>
                      <th class="p-2.5 font-bold">Ghi chú hệ thống</th>
                      <th class="p-2.5 font-bold text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="h in selectedShipmentDetails.statusHistory" :key="h.id" class="border-b last:border-b-0">
                      <td class="p-2.5 font-mono text-slate-500">{{ h.fromStatus }}</td>
                      <td class="p-2.5 font-mono font-bold text-slate-800 dark:text-slate-100">{{ h.toStatus }}</td>
                      <td class="p-2.5 text-slate-600">{{ h.notes }}</td>
                      <td class="p-2.5 text-right text-slate-400">{{ formatDateTime(h.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end border-t">
          <v-btn color="slate-600" variant="flat" class="font-bold text-white" @click="detailsDialog = false">Đóng</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Mô phỏng Webhook Viettel Post (Dành cho Dev/Demo) -->
    <v-dialog v-model="simulationDialog" max-width="500px">
      <v-card class="rounded-[20px]">
        <v-card-title class="bg-slate-800 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">MÔ PHỎNG WEBHOOK VIETTEL POST</span>
          <v-icon color="white" class="cursor-pointer" @click="simulationDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="space-y-4">
            <p class="text-xs text-slate-500">
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
              :rules="[v => !!v || 'Bắt buộc']"
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
            />

            <v-text-field
              v-model="simData.location"
              label="Vị trí/Bưu cục hiện tại (Mô phỏng)"
              placeholder="Ví dụ: Bưu cục Cầu Giấy Hub"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
            />

            <v-text-field
              v-model="simData.secret"
              label="Webhook Secret Key (X-Viettel-Secret Header)"
              placeholder="Nhập secret key để xác thực"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              hint="Phải khớp với Secret Key cấu hình để xác thực webhook thành công"
              persistent-hint
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="outlined" color="slate-500" @click="simulationDialog = false">Đóng</v-btn>
          <v-btn
            color="emerald-600"
            variant="flat"
            class="text-white font-bold"
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

// Dialog Detail
const detailsDialog = ref(false);
const selectedShipmentDetails = ref<any | null>(null);

// Webhook simulation state
const simulationDialog = ref(false);
const simulating = ref(false);
const simData = reactive({
  shipmentId: '',
  statusCode: 501, // VTP SHIPPING code (Ví dụ: 501 là đang giao hàng)
  location: 'Bưu cục Khai Thác Cầu Giấy',
  secret: 'VTP_WEBHOOK_SECRET_2026', // Khớp với mock adapter secret
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
  { title: 'Tra Cứu', key: 'actions', sortable: false, align: 'center' as const },
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
  } catch (err: any) {
    console.error('Failed to fetch shipments:', err);
    showSnack('Không thể tải danh sách vận đơn', 'error');
  } finally {
    loading.value = false;
  }
}

async function openTrackingDetails(shipment: any) {
  try {
    // Fetch deep details including trackingLogs and statusHistory
    const res = await api.get(`/logistics/shipments/${shipment.id}`);
    selectedShipmentDetails.value = res.data;
    detailsDialog.value = true;
  } catch (err: any) {
    console.error('Failed to load shipment details:', err);
    showSnack('Không thể tải chi tiết vận đơn', 'error');
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

    // Webhook endpoint: POST /api/v1/logistics/webhook/viettelpost/:orgId
    // Payload mapping:
    // {
    //   "ORDER_NUMBER": trackingNumber,
    //   "ORDER_STATUS": statusCode,
    //   "STATUS_NAME": "Cập nhật qua webhook mô phỏng",
    //   "LOC_NAME": location,
    //   "NOTE": "Simulated Webhook Update"
    // }
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
    // Reload database states
    setTimeout(() => {
      fetchShipments();
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
