<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-2 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-package-variant-closed</v-icon>
          </div>
          Quản lý đơn hàng (OMS)
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Phân phối đơn hàng bán lẻ, kéo thả Kanban, đồng bộ vận đơn Viettel Post thời gian thực
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- View mode toggles -->
        <div class="flex bg-slate-100 dark:bg-[#112240] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button 
            @click="viewMode = 'kanban'" 
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
            :class="viewMode === 'kanban' ? 'bg-white dark:bg-emerald-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            <v-icon size="16">mdi-kanban</v-icon> Kanban
          </button>
          <button 
            @click="viewMode = 'table'" 
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
            :class="viewMode === 'table' ? 'bg-white dark:bg-emerald-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-200'"
          >
            <v-icon size="16">mdi-table-large</v-icon> Bảng dữ liệu
          </button>
        </div>

        <v-btn color="emerald-600" prepend-icon="mdi-plus" @click="createOrderDialog = true" class="font-bold text-white rounded-xl">
          Tạo đơn hàng mới
        </v-btn>
      </div>
    </div>

    <!-- Bento Grid Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div 
        v-for="stat in orderStats" 
        :key="stat.title"
        class="p-5 rounded-[20px] border transition-all duration-200"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ stat.title }}</span>
          <v-icon :color="stat.color" size="20">{{ stat.icon }}</v-icon>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ stat.value }}</span>
          <span class="text-[11px] font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">đơn hàng</span>
        </div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="p-4 rounded-[20px] border flex flex-col md:flex-row gap-4 justify-between items-center" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-100 shadow-sm'">
      <div class="w-full md:w-80">
        <v-text-field
          v-model="search"
          placeholder="Tìm theo mã đơn, tên khách..."
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
          label="Lọc trạng thái"
          hide-details
          density="compact"
          variant="outlined"
          color="emerald-600"
          style="width: 180px;"
        />
      </div>
    </div>

    <!-- KANBAN MODE -->
    <div v-if="viewMode === 'kanban'" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start pb-8">
      <div 
        v-for="col in kanbanColumns" 
        :key="col.status"
        class="rounded-[20px] p-4 flex flex-col min-h-[550px] transition-all duration-200 border"
        :class="[
          isDark ? 'bg-[#112240]/40 border-slate-800/60' : 'bg-slate-50 border-slate-200/80',
          dragOverStatus === col.status ? 'ring-2 ring-emerald-500/30 border-emerald-500 bg-emerald-500/5' : ''
        ]"
        @dragover.prevent="onDragOver(col.status)"
        @dragleave="onDragLeave"
        @drop="onDrop(col.status, $event)"
      >
        <!-- Column Header -->
        <div class="flex justify-between items-center mb-4 pb-2 border-b dark:border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full" :class="col.dotClass"></span>
            <h3 class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ col.title }}</h3>
          </div>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400">
            {{ getOrdersByStatus(col.status).length }}
          </span>
        </div>

        <!-- Column Cards Container -->
        <div class="space-y-3 flex-grow overflow-y-auto max-h-[500px] pr-1">
          <div 
            v-for="order in getOrdersByStatus(col.status)" 
            :key="order.id"
            class="p-4 rounded-xl border bg-white dark:bg-[#112240] hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 select-none"
            :class="isDark ? 'border-slate-800' : 'border-slate-200'"
            draggable="true"
            @dragstart="onDragStart(order, $event)"
          >
            <!-- Card Header -->
            <div class="flex justify-between items-center mb-2">
              <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {{ order.orderCode }}
              </span>
              <span class="text-[10px] text-slate-400 font-medium">
                {{ timeAgo(order.createdAt) }}
              </span>
            </div>

            <!-- Customer info -->
            <div class="mb-3">
              <div class="font-bold text-xs text-slate-800 dark:text-slate-200">
                {{ order.customer?.fullName || 'Khách vãng lai' }}
              </div>
              <div class="text-[10px] text-slate-400">{{ order.customer?.phone || '' }}</div>
            </div>

            <!-- Total Price -->
            <div class="flex justify-between items-center mb-3">
              <span class="text-[10px] text-slate-400 uppercase font-bold">Tổng thanh toán:</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                {{ formatCurrency(order.totalAmount) }}
              </span>
            </div>

            <v-divider class="my-2 dark:border-slate-800" />

            <!-- Logistics Waybill Area -->
            <div class="flex items-center justify-between mt-2">
              <!-- Waybill Info -->
              <div v-if="order.shipment">
                <div class="flex items-center gap-1">
                  <v-icon size="14" color="emerald-600">mdi-truck-delivery-outline</v-icon>
                  <span class="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {{ order.shipment.trackingNumber || 'Đang tạo...' }}
                  </span>
                </div>
                <div class="text-[9px] font-bold mt-0.5" :class="getShipmentStatusTextClass(order.shipment.status)">
                  {{ shipmentStatusLabel(order.shipment.status) }}
                </div>
              </div>
              <div v-else>
                <v-btn
                  color="emerald-600"
                  size="x-small"
                  variant="flat"
                  class="font-bold text-white rounded-lg px-2"
                  prepend-icon="mdi-truck-fast-outline"
                  @click.stop="openCreateShipment(order)"
                >
                  Tạo vận đơn
                </v-btn>
              </div>

              <!-- Quick action triggers -->
              <div class="flex gap-1">
                <v-btn
                  icon="mdi-eye-outline"
                  variant="text"
                  size="x-small"
                  color="slate-400"
                  @click.stop="viewOrderDetails(order)"
                />
                <v-btn
                  v-if="order.status !== 'CANCELLED' && order.status !== 'COMPLETED'"
                  icon="mdi-check"
                  variant="text"
                  size="x-small"
                  color="emerald-600"
                  @click.stop="updateOrderStatus(order.id, 'COMPLETED')"
                  title="Hoàn thành đơn"
                />
              </div>
            </div>
          </div>

          <div v-if="getOrdersByStatus(col.status).length === 0" class="text-center py-8 text-xs text-slate-400 italic">
            Không có đơn hàng
          </div>
        </div>
      </div>
    </div>

    <!-- TABLE MODE -->
    <v-card v-else class="rounded-[20px] border-0" :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'">
      <v-card-text class="pa-4">
        <v-data-table
          :headers="headers"
          :items="filteredOrders"
          :loading="loading"
          hover
          class="rounded-xl text-xs"
        >
          <!-- Order Code -->
          <template #item.orderCode="{ item }">
            <span class="font-mono font-bold" :class="isDark ? 'text-[#00F2FF]' : 'text-emerald-700'">
              {{ item.orderCode }}
            </span>
          </template>

          <!-- Customer -->
          <template #item.customer="{ item }">
            <div class="flex flex-col">
              <span class="font-bold text-slate-800 dark:text-slate-200">
                {{ item.customer?.fullName || 'Khách vãng lai' }}
              </span>
              <span class="text-[11px] text-slate-400">
                {{ item.customer?.phone || '' }}
              </span>
            </div>
          </template>

          <!-- Total Amount -->
          <template #item.totalAmount="{ item }">
            <span class="font-bold">
              {{ formatCurrency(item.totalAmount) }}
            </span>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <v-chip
              :color="orderStatusColor(item.status)"
              size="small"
              variant="tonal"
              class="font-bold"
            >
              {{ orderStatusLabel(item.status) }}
            </v-chip>
          </template>

          <!-- Logistics Waybill -->
          <template #item.shipment="{ item }">
            <div v-if="item.shipment" class="flex flex-col gap-1">
              <v-chip
                v-if="item.shipment.status === 'PENDING_WAYBILL'"
                color="orange-darken-1"
                size="small"
                variant="flat"
                class="font-bold cursor-pointer text-white"
                prepend-icon="mdi-sync"
                @click.stop="retryShipment(item)"
              >
                Chờ tạo vận đơn
              </v-chip>
              <div v-else class="flex items-center gap-1.5">
                <v-icon size="16" color="emerald-600">mdi-truck-delivery-outline</v-icon>
                <span class="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ item.shipment.trackingNumber || 'Đang tạo...' }}
                </span>
                <v-chip
                  :color="shipmentStatusColor(item.shipment.status)"
                  size="x-small"
                  variant="flat"
                  class="text-[9px] font-bold text-white px-1.5"
                >
                  {{ shipmentStatusLabel(item.shipment.status) }}
                </v-chip>
              </div>
            </div>
            <div v-else>
              <v-btn
                color="emerald-600"
                size="x-small"
                variant="flat"
                class="font-bold text-white rounded-lg"
                prepend-icon="mdi-truck-fast-outline"
                @click.stop="openCreateShipment(item)"
              >
                Tạo vận đơn
              </v-btn>
            </div>
          </template>

          <!-- Action menu -->
          <template #item.actions="{ item }">
            <div class="flex justify-center gap-1">
              <v-btn
                icon="mdi-eye-outline"
                variant="text"
                size="small"
                color="slate-500"
                @click.stop="viewOrderDetails(item)"
              />
              <v-btn
                v-if="item.status !== 'CANCELLED' && item.status !== 'COMPLETED'"
                icon="mdi-check"
                variant="text"
                size="small"
                color="emerald-600"
                @click.stop="updateOrderStatus(item.id, 'COMPLETED')"
              />
              <v-btn
                v-if="item.status !== 'CANCELLED' && item.status !== 'COMPLETED'"
                icon="mdi-close"
                variant="text"
                size="small"
                color="red"
                @click.stop="updateOrderStatus(item.id, 'CANCELLED')"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create Order Wizard Component Integration -->
    <CreateOrderWizard
      v-model="createOrderDialog"
      @order-created="fetchOrders"
      @snack="handleWizardSnack"
    />

    <!-- Dialog: Tạo vận đơn Viettel Post -->
    <v-dialog v-model="createShipmentDialog" max-width="450px">
      <v-card class="rounded-[20px] border border-slate-200 dark:border-slate-800" :class="isDark ? 'bg-[#112240]' : 'bg-white'">
        <v-card-title class="bg-emerald-600 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">TẠO VẬN ĐƠN VIETTEL POST</span>
          <v-icon color="white" class="cursor-pointer" @click="createShipmentDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div v-if="selectedOrderForShipment" class="space-y-4 text-xs">
            <div class="space-y-1">
              <div class="flex justify-between text-slate-400">
                <span>Đơn hàng:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ selectedOrderForShipment.orderCode }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Người nhận:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ getAddressDetails(selectedOrderForShipment.shippingAddressJson).receiverName }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Điện thoại:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ getAddressDetails(selectedOrderForShipment.shippingAddressJson).receiverPhone }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>COD thu hộ:</span>
                <span class="font-bold text-emerald-600">{{ formatCurrency(selectedOrderForShipment.codAmount) }}</span>
              </div>
            </div>

            <v-divider class="dark:border-slate-800" />

            <v-text-field
              v-model.number="shipmentWeight"
              type="number"
              label="Trọng lượng gói hàng (grams)"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              class="rounded-xl"
              hint="Ví dụ: 500 = 0.5kg"
              persistent-hint
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end border-t dark:border-slate-800">
          <v-btn variant="outlined" color="slate-400" @click="createShipmentDialog = false" class="font-bold text-xs">Đóng</v-btn>
          <v-btn
            color="emerald-600"
            variant="flat"
            class="text-white font-bold text-xs"
            :loading="submittingShipment"
            @click="submitCreateShipment"
          >
            Tạo vận đơn
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Xem chi tiết đơn hàng & trạng thái vận đơn -->
    <v-dialog v-model="orderDetailDialog" max-width="600px">
      <v-card class="rounded-[20px] border border-slate-200 dark:border-slate-800" v-if="selectedOrderDetail" :class="isDark ? 'bg-[#112240]' : 'bg-white'">
        <v-card-title class="bg-slate-800 dark:bg-slate-900 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">CHI TIẾT ĐƠN HÀNG {{ selectedOrderDetail.orderCode }}</span>
          <v-icon color="white" class="cursor-pointer" @click="orderDetailDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="space-y-4 text-xs">
            <!-- Order status summary -->
            <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3">
              <span class="text-xs font-bold text-slate-400 uppercase">Trạng thái đơn:</span>
              <v-chip :color="orderStatusColor(selectedOrderDetail.status)" size="small" variant="flat" class="font-bold text-white">
                {{ orderStatusLabel(selectedOrderDetail.status) }}
              </v-chip>
            </div>

            <!-- Customer and Delivery Address -->
            <div>
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin khách hàng & Giao nhận</h4>
              <div class="text-sm space-y-1">
                <div><strong>Khách hàng:</strong> {{ selectedOrderDetail.customer?.fullName }}</div>
                <div><strong>Số điện thoại:</strong> {{ selectedOrderDetail.customer?.phone || '—' }}</div>
                <v-divider class="my-2 dark:border-slate-800" />
                <div v-if="selectedOrderDetail.shippingAddressJson">
                  <strong>Địa chỉ nhận:</strong> 
                  {{ getAddressText(selectedOrderDetail.shippingAddressJson) }}
                </div>
              </div>
            </div>

            <!-- Products List -->
            <div>
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh sách sản phẩm</h4>
              <div class="border dark:border-slate-800 rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-900/40 border-b dark:border-slate-800">
                      <th class="p-2.5 font-bold">Sản phẩm</th>
                      <th class="p-2.5 font-bold text-right" style="width: 60px;">SL</th>
                      <th class="p-2.5 font-bold text-right" style="width: 100px;">Đơn giá</th>
                      <th class="p-2.5 font-bold text-right" style="width: 100px;">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedOrderDetail.items" :key="item.id" class="border-b last:border-b-0 dark:border-slate-800">
                      <td class="p-2.5 font-medium">{{ item.productName }}</td>
                      <td class="p-2.5 text-right">{{ item.quantity }}</td>
                      <td class="p-2.5 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                      <td class="p-2.5 text-right font-bold">{{ formatCurrency(item.totalPrice) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Logistics details -->
            <div v-if="selectedOrderDetail.shipment">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thông tin vận đơn Viettel Post</h4>
              <div class="bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-800 rounded-xl p-3.5 space-y-2">
                <div class="flex justify-between">
                  <span>Mã vận đơn (Waybill):</span>
                  <span class="font-mono font-bold text-emerald-600">{{ selectedOrderDetail.shipment.trackingNumber || 'Đang xử lý...' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Trạng thái logistics:</span>
                  <v-chip :color="shipmentStatusColor(selectedOrderDetail.shipment.status)" size="x-small" variant="flat" class="text-white font-bold">
                    {{ shipmentStatusLabel(selectedOrderDetail.shipment.status) }}
                  </v-chip>
                </div>
                <div class="flex justify-between" v-if="selectedOrderDetail.shipment.estimatedDelivery">
                  <span>Dự kiến giao:</span>
                  <span class="font-semibold">{{ new Date(selectedOrderDetail.shipment.estimatedDelivery).toLocaleDateString('vi-VN') }}</span>
                </div>
                <div class="flex justify-between" v-if="selectedOrderDetail.shipment.labelPdfUrl">
                  <span>Nhãn in PDF:</span>
                  <a :href="selectedOrderDetail.shipment.labelPdfUrl" target="_blank" class="text-blue-500 font-bold hover:underline flex items-center gap-1">
                    <v-icon size="16">mdi-download</v-icon> Tải nhãn PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end border-t dark:border-slate-800">
          <v-btn color="slate-600" variant="flat" class="font-bold text-white text-xs" @click="orderDetailDialog = false">Đóng</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar alerts -->
    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="4000">
      {{ snack.text }}
      <template #actions>
        <v-btn color="white" variant="text" @click="snack.show = false">Đóng</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { api } from '@/api';
import CreateOrderWizard from '@/components/CreateOrderWizard.vue';

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// View mode: 'kanban' or 'table'
const viewMode = ref<'kanban' | 'table'>('kanban');

// State
const orders = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('ALL');

// Dialogs state
const createOrderDialog = ref(false);

const createShipmentDialog = ref(false);
const submittingShipment = ref(false);
const selectedOrderForShipment = ref<any | null>(null);
const shipmentWeight = ref(500);

const orderDetailDialog = ref(false);
const selectedOrderDetail = ref<any | null>(null);

// Drag and drop state
const dragOverStatus = ref<string | null>(null);

const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
}

function handleWizardSnack(text: string, color?: string) {
  showSnack(text, color);
}

// Table Headers
const headers = [
  { title: 'Mã Đơn Hàng', key: 'orderCode', sortable: true },
  { title: 'Khách Hàng', key: 'customer', sortable: true },
  { title: 'Tổng Tiền', key: 'totalAmount', sortable: true, align: 'end' as const },
  { title: 'Trạng Thái Đơn', key: 'status', sortable: true },
  { title: 'Vận Đơn (Viettel Post)', key: 'shipment', sortable: false },
  { title: 'Hành Động', key: 'actions', sortable: false, align: 'center' as const },
];

const statusOptions = [
  { title: 'Tất cả trạng thái', value: 'ALL' },
  { title: 'Chờ xử lý (Pending)', value: 'PENDING' },
  { title: 'Đang giao (Processing)', value: 'PROCESSING' },
  { title: 'Hoàn thành (Completed)', value: 'COMPLETED' },
  { title: 'Đã hủy (Cancelled)', value: 'CANCELLED' },
];

// Kanban columns configuration
const kanbanColumns = [
  { title: 'Chờ xử lý', status: 'PENDING', dotClass: 'bg-amber-500', dotColor: 'orange' },
  { title: 'Đang giao', status: 'PROCESSING', dotClass: 'bg-blue-500', dotColor: 'blue' },
  { title: 'Hoàn thành', status: 'COMPLETED', dotClass: 'bg-emerald-500', dotColor: 'emerald' },
  { title: 'Đã hủy', status: 'CANCELLED', dotClass: 'bg-red-500', dotColor: 'red' },
];

// Stats Computeds
const orderStats = computed(() => {
  const total = orders.value.length;
  const pending = orders.value.filter(o => o.status === 'PENDING').length;
  const processing = orders.value.filter(o => o.status === 'PROCESSING').length;
  const completed = orders.value.filter(o => o.status === 'COMPLETED').length;

  return [
    { title: 'Tổng số đơn hàng', value: total, icon: 'mdi-package-variant', color: 'blue' },
    { title: 'Chờ giao/Mới tạo', value: pending, icon: 'mdi-clock-outline', color: 'orange' },
    { title: 'Đang vận chuyển', value: processing, icon: 'mdi-truck-fast-outline', color: 'indigo' },
    { title: 'Hoàn thành', value: completed, icon: 'mdi-check-circle-outline', color: 'emerald-600' },
  ];
});

// Filter logic
const filteredOrders = computed(() => {
  return orders.value.filter(order => {
    // Search filter
    const codeMatch = order.orderCode.toLowerCase().includes(search.value.toLowerCase());
    const nameMatch = order.customer?.fullName?.toLowerCase().includes(search.value.toLowerCase()) || false;
    const matchesSearch = codeMatch || nameMatch;

    // Status filter
    const matchesStatus = statusFilter.value === 'ALL' || order.status === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

// Get orders filtered by column status and search query
function getOrdersByStatus(status: string) {
  return filteredOrders.value.filter(o => o.status === status);
}

// Drag & Drop Handlers
function onDragStart(order: any, event: DragEvent) {
  event.dataTransfer?.setData('orderId', order.id);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(status: string) {
  dragOverStatus.value = status;
}

function onDragLeave() {
  dragOverStatus.value = null;
}

async function onDrop(status: string, event: DragEvent) {
  dragOverStatus.value = null;
  const orderId = event.dataTransfer?.getData('orderId');
  if (!orderId) return;

  const order = orders.value.find(o => o.id === orderId);
  if (!order || order.status === status) return;

  await updateOrderStatus(orderId, status);
}

// Update order status via backend PATCH API
async function updateOrderStatus(orderId: string, status: string) {
  try {
    await api.patch(`/logistics/orders/${orderId}`, { status });
    showSnack(`Đã cập nhật trạng thái đơn hàng thành ${orderStatusLabel(status)}`);
    fetchOrders();
  } catch (err: any) {
    console.error('Failed to update order status:', err);
    showSnack(err.response?.data?.error || 'Không thể cập nhật trạng thái đơn hàng', 'error');
  }
}

// Format currency
function formatCurrency(val: number) {
  if (val === undefined || val === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

// Time calculations
function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return date.toLocaleDateString('vi-VN');
}

// Order Status Helpers
function orderStatusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
}

function orderStatusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: 'orange',
    PROCESSING: 'indigo',
    COMPLETED: 'emerald-600',
    CANCELLED: 'red',
  };
  return map[status] ?? 'grey';
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

function getShipmentStatusTextClass(status: string) {
  const map: Record<string, string> = {
    PENDING_WAYBILL: 'text-amber-500',
    PICKUP_PENDING: 'text-blue-500',
    SHIPPING: 'text-indigo-500',
    DELIVERED: 'text-emerald-500',
    CANCELLED: 'text-red-500',
  };
  return map[status] ?? 'text-slate-400';
}

// Fetch orders data
async function fetchOrders() {
  loading.value = true;
  try {
    const res = await api.get('/logistics/orders');
    orders.value = res.data.orders ?? [];
  } catch (err: any) {
    console.error('Failed to load orders:', err);
    showSnack('Không thể tải danh sách đơn hàng', 'error');
  } finally {
    loading.value = false;
  }
}

// Open Dialog: Create Shipment (Viettel Post Waybill)
function openCreateShipment(order: any) {
  selectedOrderForShipment.value = order;
  shipmentWeight.value = 500; // default 500g
  createShipmentDialog.value = true;
}

// Submit Create Shipment (Calls /shipments API)
async function submitCreateShipment() {
  if (!selectedOrderForShipment.value) return;
  submittingShipment.value = true;
  try {
    const res = await api.post('/logistics/shipments', {
      orderId: selectedOrderForShipment.value.id,
      weightGrams: shipmentWeight.value,
    });

    const isPending = res.data.shipment?.status === 'PENDING_WAYBILL';
    if (isPending) {
      showSnack(
        'Hệ thống Viettel Post đang nghẽn. Vận đơn đã lưu dưới dạng Chờ Tạo Vận Đơn và sẽ được thử lại tự động sau.',
        'warning'
      );
    } else {
      showSnack('Tạo vận đơn Viettel Post thành công!');
    }
    
    createShipmentDialog.value = false;
    fetchOrders();
  } catch (err: any) {
    console.error('Failed to create shipment:', err);
    showSnack(err.response?.data?.error || 'Tạo vận đơn thất bại', 'error');
  } finally {
    submittingShipment.value = false;
  }
}

// Retry shipment manually if it's in PENDING_WAYBILL status
async function retryShipment(order: any) {
  if (!order.shipment) return;
  
  showSnack('Đang gửi lại yêu cầu tạo vận đơn đến Viettel Post...', 'info');
  
  try {
    const res = await api.post('/logistics/shipments', {
      orderId: order.id,
      weightGrams: order.shipment.weightGrams || 500,
    });

    const isPending = res.data.shipment?.status === 'PENDING_WAYBILL';
    if (isPending) {
      showSnack('Vẫn không kết nối được Viettel Post. Tiếp tục hàng chờ thử lại tự động.', 'warning');
    } else {
      showSnack('Tạo vận đơn Viettel Post thành công!');
    }
    fetchOrders();
  } catch (err: any) {
    console.error('Failed to retry shipment:', err);
    showSnack(err.response?.data?.error || 'Thử lại thất bại', 'error');
  }
}

// Helper to parse address
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

// View order details in dialog
function viewOrderDetails(order: any) {
  selectedOrderDetail.value = order;
  orderDetailDialog.value = true;
}

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.v-btn {
  letter-spacing: 0.5px;
}
</style>
