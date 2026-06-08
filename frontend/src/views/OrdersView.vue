<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight flex items-center gap-3" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
          <div class="p-2 rounded-xl" :class="isDark ? 'bg-[#1D2D50]' : 'bg-emerald-50'">
            <v-icon size="28" :color="isDark ? '#00F2FF' : 'emerald-600'">mdi-package-variant-closed</v-icon>
          </div>
          Quản lý đơn hàng (OMS)
        </h1>
        <p class="text-[15px] mt-2 font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
          Quản lý đơn hàng bán lẻ, tạo vận đơn Viettel Post và theo dõi trạng thái đồng bộ thời gian thực
        </p>
      </div>

      <div>
        <v-btn color="emerald-600" prepend-icon="mdi-plus" @click="openCreateOrder" class="font-bold text-white">
          Tạo đơn hàng mới
        </v-btn>
      </div>
    </div>

    <!-- Filters & Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

    <!-- Main List Card -->
    <v-card class="rounded-[20px] border-0" :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100 shadow-sm'">
      <v-card-text class="pa-4">
        <!-- List Toolbar -->
        <div class="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          <div class="w-full md:w-80">
            <v-text-field
              v-model="search"
              placeholder="Tìm kiếm mã đơn, tên khách hàng..."
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
              label="Trạng thái đơn"
              hide-details
              density="compact"
              variant="outlined"
              color="emerald-600"
              style="width: 160px;"
            />
          </div>
        </div>

        <!-- Orders Table -->
        <v-data-table
          :headers="headers"
          :items="filteredOrders"
          :loading="loading"
          hover
          class="rounded-xl"
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
              <!-- Pending waybill retry mode -->
              <v-chip
                v-if="item.shipment.status === 'PENDING_WAYBILL'"
                color="orange-darken-1"
                size="small"
                variant="flat"
                class="font-bold cursor-pointer text-white"
                prepend-icon="mdi-sync animate-spin"
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
                class="font-bold text-white"
                prepend-icon="mdi-truck-fast-outline"
                @click.stop="openCreateShipment(item)"
              >
                Tạo vận đơn
              </v-btn>
            </div>
          </template>

          <!-- Action menu -->
          <template #item.actions="{ item }">
            <v-btn
              icon="mdi-eye-outline"
              variant="text"
              size="small"
              color="slate-500"
              @click.stop="viewOrderDetails(item)"
            />
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Dialog: Tạo đơn hàng mới -->
    <v-dialog v-model="createOrderDialog" max-width="850px" persistent>
      <v-card class="rounded-[20px] overflow-hidden">
        <v-card-title class="bg-emerald-600 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-lg font-bold">TẠO ĐƠN HÀNG MỚI & THÔNG TIN SHIP</span>
          <v-icon color="white" class="cursor-pointer" @click="createOrderDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6 bg-slate-50 dark:bg-slate-900">
          <v-form ref="orderForm" v-model="isOrderFormValid">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- CỘT TRÁI: THÔNG TIN ĐƠN HÀNG -->
              <div class="col-span-12 md:col-span-7 space-y-4">
                <h3 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <v-icon size="18">mdi-cart-outline</v-icon>
                  1. Chi tiết sản phẩm & Thanh toán
                </h3>
                
                <v-card variant="flat" class="border border-slate-100 rounded-xl pa-4">
                  <!-- Chọn khách hàng -->
                  <v-autocomplete
                    v-model="newOrder.customerId"
                    :items="contactsList"
                    item-title="fullName"
                    item-value="id"
                    label="Khách hàng Zalo (CRM Contact)"
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Vui lòng chọn khách hàng']"
                    @update:model-value="onContactSelected"
                    class="mb-4"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.raw.fullName" :subtitle="item.raw.phone || 'Không có SĐT'" />
                    </template>
                  </v-autocomplete>

                  <!-- Danh sách sản phẩm -->
                  <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-bold text-slate-500 uppercase">Sản phẩm (Items)</span>
                      <v-btn
                        size="x-small"
                        color="emerald-600"
                        variant="outlined"
                        prepend-icon="mdi-plus"
                        @click="addOrderItem"
                        class="font-bold"
                      >
                        Thêm SP
                      </v-btn>
                    </div>

                    <div v-for="(item, index) in newOrder.items" :key="index" class="flex items-start gap-2 mb-2">
                      <v-text-field
                        v-model="item.productName"
                        placeholder="Tên sản phẩm"
                        variant="outlined"
                        color="emerald-600"
                        density="compact"
                        hide-details
                        :rules="[v => !!v || 'Bắt buộc']"
                        style="flex: 2;"
                      />
                      <v-text-field
                        v-model.number="item.quantity"
                        type="number"
                        placeholder="SL"
                        variant="outlined"
                        color="emerald-600"
                        density="compact"
                        hide-details
                        :rules="[v => v > 0 || '>0']"
                        style="width: 70px;"
                      />
                      <v-text-field
                        v-model.number="item.unitPrice"
                        type="number"
                        placeholder="Đơn giá"
                        variant="outlined"
                        color="emerald-600"
                        density="compact"
                        hide-details
                        style="width: 110px;"
                      />
                      <v-btn
                        icon="mdi-delete-outline"
                        color="red"
                        variant="text"
                        size="small"
                        class="mt-1"
                        :disabled="newOrder.items.length === 1"
                        @click="removeOrderItem(index)"
                      />
                    </div>
                  </div>

                  <!-- Các chi phí -->
                  <div class="grid grid-cols-2 gap-4 mb-2">
                    <v-text-field
                      v-model.number="newOrder.shippingFee"
                      type="number"
                      label="Phí ship (VNĐ)"
                      variant="outlined"
                      color="emerald-600"
                      density="compact"
                    />
                    <v-text-field
                      v-model.number="newOrder.discountAmount"
                      type="number"
                      label="Giảm giá (VNĐ)"
                      variant="outlined"
                      color="emerald-600"
                      density="compact"
                    />
                  </div>

                  <!-- Tạm tính, Tổng cộng, COD -->
                  <div class="bg-slate-50 dark:bg-[#1D2D50]/30 rounded-xl p-3 space-y-1.5 text-sm">
                    <div class="flex justify-between text-slate-500">
                      <span>Tạm tính (hàng hóa):</span>
                      <span class="font-semibold">{{ formatCurrency(orderSubtotal) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-500">
                      <span>Phí ship:</span>
                      <span class="font-semibold text-emerald-600">+{{ formatCurrency(newOrder.shippingFee || 0) }}</span>
                    </div>
                    <div class="flex justify-between text-slate-500">
                      <span>Giảm giá:</span>
                      <span class="font-semibold text-red-500">-{{ formatCurrency(newOrder.discountAmount || 0) }}</span>
                    </div>
                    <v-divider class="my-2" />
                    <div class="flex justify-between text-base font-bold text-slate-800 dark:text-slate-100">
                      <span>Tổng cộng cần thanh toán:</span>
                      <span class="text-emerald-600">{{ formatCurrency(orderTotal) }}</span>
                    </div>
                  </div>

                  <div class="mt-4">
                    <v-text-field
                      v-model.number="newOrder.codAmount"
                      type="number"
                      label="Tiền thu hộ COD (VNĐ)"
                      variant="outlined"
                      color="emerald-600"
                      density="comfortable"
                      placeholder="Mặc định thu bằng tổng tiền"
                      hint="Nếu thu COD, nhập số tiền cần shipper thu hộ"
                      persistent-hint
                    />
                  </div>
                </v-card>
              </div>

              <!-- CỘT PHẢI: THÔNG TIN VẬN CHUYỂN -->
              <div class="col-span-12 md:col-span-5 space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <v-icon size="18">mdi-truck-delivery-outline</v-icon>
                    2. Địa chỉ nhận hàng
                  </h3>
                  <v-btn
                    v-if="selectedContactDetails"
                    size="x-small"
                    color="emerald-600"
                    variant="tonal"
                    prepend-icon="mdi-content-copy"
                    @click="copyContactInfo"
                    class="font-bold text-xs"
                  >
                    Lấy thông tin KH
                  </v-btn>
                </div>

                <v-card variant="flat" class="border border-slate-100 rounded-xl pa-4 space-y-3">
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverName"
                    label="Tên người nhận"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc']"
                  />
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverPhone"
                    label="Số điện thoại nhận"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc', v => /^[0-9]{9,11}$/.test(v) || 'SĐT không hợp lệ']"
                  />
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverProvince"
                    label="Tỉnh / Thành phố"
                    placeholder="Ví dụ: Hà Nội"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc']"
                  />
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverDistrict"
                    label="Quận / Huyện"
                    placeholder="Ví dụ: Cầu Giấy"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc']"
                  />
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverWard"
                    label="Phường / Xã"
                    placeholder="Ví dụ: Dịch Vọng"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc']"
                  />
                  <v-text-field
                    v-model="newOrder.shippingAddress.receiverAddress"
                    label="Địa chỉ chi tiết (Số nhà, đường...)"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    :rules="[v => !!v || 'Bắt buộc']"
                  />

                  <v-textarea
                    v-model="newOrder.notes"
                    label="Ghi chú đơn hàng"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    rows="2"
                    hide-details
                  />
                </v-card>
              </div>
            </div>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4 bg-white dark:bg-[#112240] border-t justify-end">
          <v-btn variant="outlined" color="slate-500" @click="createOrderDialog = false">Hủy</v-btn>
          <v-btn
            color="emerald-600"
            variant="flat"
            class="text-white font-bold px-6"
            :loading="submittingOrder"
            :disabled="!isOrderFormValid"
            @click="submitCreateOrder"
          >
            Tạo đơn hàng
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog: Tạo vận đơn Viettel Post -->
    <v-dialog v-model="createShipmentDialog" max-width="450px">
      <v-card class="rounded-[20px]">
        <v-card-title class="bg-emerald-600 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">TẠO VẬN ĐƠN VIETTEL POST</span>
          <v-icon color="white" class="cursor-pointer" @click="createShipmentDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div v-if="selectedOrderForShipment" class="space-y-4">
            <div class="text-sm space-y-1">
              <div class="flex justify-between text-slate-500">
                <span>Đơn hàng:</span>
                <span class="font-bold text-slate-800 dark:text-slate-100">{{ selectedOrderForShipment.orderCode }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Người nhận:</span>
                <span class="font-bold">{{ getAddressDetails(selectedOrderForShipment.shippingAddressJson).receiverName }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Điện thoại:</span>
                <span class="font-bold">{{ getAddressDetails(selectedOrderForShipment.shippingAddressJson).receiverPhone }}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>COD thu hộ:</span>
                <span class="font-bold text-emerald-600">{{ formatCurrency(selectedOrderForShipment.codAmount) }}</span>
              </div>
            </div>

            <v-divider />

            <v-text-field
              v-model.number="shipmentWeight"
              type="number"
              label="Trọng lượng gói hàng (grams)"
              variant="outlined"
              color="emerald-600"
              density="comfortable"
              hint="Ví dụ: 500 = 0.5kg"
              persistent-hint
              :rules="[v => v > 0 || 'Trọng lượng phải lớn hơn 0']"
            />
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 justify-end">
          <v-btn variant="outlined" color="slate-500" @click="createShipmentDialog = false">Đóng</v-btn>
          <v-btn
            color="emerald-600"
            variant="flat"
            class="text-white font-bold"
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
      <v-card class="rounded-[20px]" v-if="selectedOrderDetail">
        <v-card-title class="bg-slate-800 text-white py-4 px-6 flex items-center justify-between">
          <span class="text-base font-bold">CHI TIẾT ĐƠN HÀNG {{ selectedOrderDetail.orderCode }}</span>
          <v-icon color="white" class="cursor-pointer" @click="orderDetailDialog = false">mdi-close</v-icon>
        </v-card-title>

        <v-card-text class="pa-6">
          <div class="space-y-4">
            <!-- Order status summary -->
            <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
              <span class="text-xs font-bold text-slate-500 uppercase">Trạng thái đơn:</span>
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
                <v-divider class="my-2" />
                <div v-if="selectedOrderDetail.shippingAddressJson">
                  <strong>Địa chỉ nhận:</strong> 
                  {{ getAddressText(selectedOrderDetail.shippingAddressJson) }}
                </div>
              </div>
            </div>

            <!-- Products List -->
            <div>
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh sách sản phẩm</h4>
              <div class="border rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-[#1D2D50]/50 border-b">
                      <th class="p-2.5 font-bold">Sản phẩm</th>
                      <th class="p-2.5 font-bold text-right" style="width: 60px;">SL</th>
                      <th class="p-2.5 font-bold text-right" style="width: 100px;">Đơn giá</th>
                      <th class="p-2.5 font-bold text-right" style="width: 100px;">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedOrderDetail.items" :key="item.id" class="border-b last:border-b-0">
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
              <div class="bg-slate-50 dark:bg-slate-900 border rounded-xl p-3.5 space-y-2 text-sm">
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

        <v-card-actions class="pa-4 justify-end border-t">
          <v-btn color="slate-600" variant="flat" class="font-bold text-white" @click="orderDetailDialog = false">Đóng</v-btn>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { api } from '@/api';

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// State
const orders = ref<any[]>([]);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('ALL');

// Dialogs state
const createOrderDialog = ref(false);
const isOrderFormValid = ref(false);
const submittingOrder = ref(false);

const createShipmentDialog = ref(false);
const submittingShipment = ref(false);
const selectedOrderForShipment = ref<any | null>(null);
const shipmentWeight = ref(500);

const orderDetailDialog = ref(false);
const selectedOrderDetail = ref<any | null>(null);

// Contacts lists for dropdown selection
const contactsList = ref<any[]>([]);
const selectedContactDetails = ref<any | null>(null);

const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
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
  { title: 'Mới tạo (Pending)', value: 'PENDING' },
  { title: 'Đang giao (Processing)', value: 'PROCESSING' },
  { title: 'Hoàn thành (Completed)', value: 'COMPLETED' },
  { title: 'Đã hủy (Cancelled)', value: 'CANCELLED' },
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

// New Order model
const newOrder = reactive({
  customerId: '',
  items: [
    { productName: '', quantity: 1, unitPrice: 0 }
  ],
  shippingFee: 30000,
  discountAmount: 0,
  codAmount: null as number | null,
  notes: '',
  shippingAddress: {
    receiverName: '',
    receiverPhone: '',
    receiverProvince: '',
    receiverDistrict: '',
    receiverWard: '',
    receiverAddress: '',
  }
});

// Calculations for New Order
const orderSubtotal = computed(() => {
  return newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
});

const orderTotal = computed(() => {
  return orderSubtotal.value + (newOrder.shippingFee || 0) - (newOrder.discountAmount || 0);
});

// Format currency
function formatCurrency(val: number) {
  if (val === undefined || val === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
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

// Fetch contacts for order dialog
async function fetchContactsForDropdown() {
  try {
    const res = await api.get('/contacts', { params: { limit: 100 } });
    contactsList.value = res.data.contacts ?? res.data ?? [];
  } catch (err: any) {
    console.error('Failed to load contacts for dropdown:', err);
  }
}

// On select contact in create form
function onContactSelected(val: string) {
  const contact = contactsList.value.find(c => c.id === val);
  selectedContactDetails.value = contact || null;
}

// Copy CRM contact info into shipment receiver fields
function copyContactInfo() {
  if (!selectedContactDetails.value) return;
  newOrder.shippingAddress.receiverName = selectedContactDetails.value.fullName || '';
  newOrder.shippingAddress.receiverPhone = selectedContactDetails.value.phone || '';
  newOrder.shippingAddress.receiverProvince = '';
  newOrder.shippingAddress.receiverDistrict = '';
  newOrder.shippingAddress.receiverWard = '';
  newOrder.shippingAddress.receiverAddress = '';
  showSnack('Đã sao chép tên và SĐT từ thông tin khách hàng ZaloCRM.');
}

// Add/Remove Order Items in form
function addOrderItem() {
  newOrder.items.push({ productName: '', quantity: 1, unitPrice: 0 });
}

function removeOrderItem(index: number) {
  newOrder.items.splice(index, 1);
}

// Open Dialog: Create Order
function openCreateOrder() {
  newOrder.customerId = '';
  newOrder.items = [{ productName: '', quantity: 1, unitPrice: 0 }];
  newOrder.shippingFee = 30000;
  newOrder.discountAmount = 0;
  newOrder.codAmount = null;
  newOrder.notes = '';
  newOrder.shippingAddress = {
    receiverName: '',
    receiverPhone: '',
    receiverProvince: '',
    receiverDistrict: '',
    receiverWard: '',
    receiverAddress: '',
  };
  selectedContactDetails.value = null;
  createOrderDialog.value = true;
}

// Submit Create Order
async function submitCreateOrder() {
  submittingOrder.value = true;
  try {
    const payload = {
      customerId: newOrder.customerId,
      items: newOrder.items,
      shippingFee: newOrder.shippingFee,
      discountAmount: newOrder.discountAmount,
      codAmount: newOrder.codAmount !== null ? newOrder.codAmount : orderTotal.value,
      notes: newOrder.notes,
      shippingAddressJson: JSON.stringify(newOrder.shippingAddress),
    };

    await api.post('/logistics/orders', payload);
    showSnack('Tạo đơn hàng thành công!');
    createOrderDialog.value = false;
    fetchOrders();
  } catch (err: any) {
    console.error('Failed to create order:', err);
    showSnack(err.response?.data?.error || 'Tạo đơn hàng thất bại', 'error');
  } finally {
    submittingOrder.value = false;
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
  
  // Show notification starting
  showSnack('Đang gửi lại yêu cầu tạo vận đơn đến Viettel Post...', 'info');
  
  try {
    // API creation logic for existing orders is triggered via /logistics/shipments
    // If we call it again, it expects weight. We use shipment weight or fallback
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
  fetchContactsForDropdown();
});
</script>

<style scoped>
.v-btn {
  letter-spacing: 0.5px;
}
</style>
