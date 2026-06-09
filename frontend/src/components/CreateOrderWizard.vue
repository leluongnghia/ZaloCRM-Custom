<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1100px" persistent>
    <v-card class="rounded-[20px] overflow-hidden border border-slate-200 dark:border-slate-800" :class="isDark ? 'bg-[#0A192F]' : 'bg-[#F8FAFC]'">
      <!-- Header -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800" :class="isDark ? 'bg-[#112240]' : 'bg-white'">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
            <v-icon color="emerald-600">mdi-cart-plus</v-icon>
          </div>
          <div>
            <h2 class="text-lg font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">Tạo đơn hàng mới</h2>
            <p class="text-[11px] text-slate-400">OMS checkout workflow & Viettel Post sync</p>
          </div>
        </div>
        <v-icon color="slate-400" class="cursor-pointer hover:text-slate-600" @click="closeWizard">mdi-close</v-icon>
      </div>

      <!-- Step Progress Bar -->
      <div class="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800" :class="isDark ? 'bg-[#112240]' : 'bg-white'">
        <div class="flex items-center w-full justify-between max-w-4xl mx-auto">
          <div v-for="(step, idx) in steps" :key="idx" class="flex items-center">
            <div class="flex items-center gap-2">
              <div 
                class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300"
                :class="getStepClass(idx + 1)"
              >
                <v-icon v-if="currentStep > idx + 1" size="14" color="white">mdi-check</v-icon>
                <span v-else>{{ idx + 1 }}</span>
              </div>
              <span 
                class="text-xs font-bold transition-all duration-300"
                :class="currentStep === idx + 1 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : 'text-slate-400'"
              >
                {{ step.name }}
              </span>
            </div>
            <div 
              v-if="idx < steps.length - 1" 
              class="h-[2px] w-12 mx-4 transition-all duration-300"
              :class="currentStep > idx + 1 ? 'bg-emerald-500' : (isDark ? 'bg-slate-800' : 'bg-slate-200')"
            ></div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 min-h-[500px]">
        <!-- Left: Form Steps (70% width) -->
        <div class="lg:col-span-8 flex flex-col justify-between">
          <div class="flex-grow">
            <!-- Step 1: Customer -->
            <div v-if="currentStep === 1" class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">1. Chọn khách hàng</h3>
                <v-btn 
                  size="small" 
                  color="emerald-600" 
                  variant="text" 
                  prepend-icon="mdi-plus" 
                  class="font-bold text-xs"
                  @click="showNewContactForm = !showNewContactForm"
                >
                  {{ showNewContactForm ? 'Chọn từ CRM' : 'Khách hàng mới' }}
                </v-btn>
              </div>

              <!-- Quick Create Contact Form -->
              <div v-if="showNewContactForm" class="p-5 rounded-[20px] border" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
                <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">Tạo nhanh khách hàng mới</h4>
                <div class="grid grid-cols-2 gap-4">
                  <v-text-field
                    v-model="newContact.fullName"
                    label="Họ và tên *"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    class="rounded-xl"
                  />
                  <v-text-field
                    v-model="newContact.phone"
                    label="Số điện thoại *"
                    variant="outlined"
                    color="emerald-600"
                    density="comfortable"
                    class="rounded-xl"
                  />
                </div>
                <div class="flex justify-end gap-2 mt-4">
                  <v-btn variant="outlined" size="small" color="slate-400" @click="showNewContactForm = false">Hủy</v-btn>
                  <v-btn color="emerald-600" variant="flat" size="small" class="text-white font-bold" @click="handleCreateContact">Lưu Contact</v-btn>
                </div>
              </div>

              <!-- Contact Selector -->
              <div v-else class="space-y-4">
                <v-autocomplete
                  v-model="selectedCustomerId"
                  :items="contacts"
                  item-title="fullName"
                  item-value="id"
                  placeholder="Tìm kiếm theo tên hoặc SĐT..."
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                  @update:model-value="onContactChanged"
                >
                  <template #item="{ props, item }">
                    <v-list-item 
                      v-bind="props" 
                      :title="item.raw.fullName" 
                      :subtitle="item.raw.phone || 'Không có SĐT'"
                    >
                      <template #append>
                        <v-chip size="x-small" color="emerald-600" class="font-bold text-white">{{ item.raw.source || 'Zalo' }}</v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-autocomplete>

                <!-- Customer card preview -->
                <div v-if="selectedContact" class="p-5 rounded-[20px] border flex gap-4 items-start" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
                  <v-avatar color="emerald-600" size="48" class="text-white font-bold">
                    {{ selectedContact.fullName?.charAt(0) || 'K' }}
                  </v-avatar>
                  <div class="space-y-1.5 flex-grow">
                    <div class="flex justify-between items-center">
                      <h4 class="font-bold text-base" :class="isDark ? 'text-slate-100' : 'text-slate-800'">{{ selectedContact.fullName }}</h4>
                      <v-chip size="x-small" color="emerald-600" variant="tonal" class="font-bold">{{ selectedContact.source }}</v-chip>
                    </div>
                    <p class="text-xs text-slate-400">SĐT: {{ selectedContact.phone || 'Chưa cập nhật' }}</p>
                    <p class="text-xs text-slate-400">Email: {{ selectedContact.email || 'Chưa cập nhật' }}</p>
                    <div class="flex gap-2 mt-2" v-if="selectedContact.id">
                      <div class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium text-slate-400">
                        Doanh thu: <span class="font-bold text-emerald-600">{{ formatCurrency(selectedContact.totalRevenue || 0) }}</span>
                      </div>
                      <div class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium text-slate-400">
                        Đơn hàng: <span class="font-bold text-slate-300">{{ selectedContact.orderCount || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 2: Products Selection -->
            <div v-if="currentStep === 2" class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">2. Danh sách sản phẩm</h3>
                <v-btn 
                  size="small" 
                  color="emerald-600" 
                  variant="outlined" 
                  prepend-icon="mdi-plus" 
                  class="font-bold text-xs"
                  @click="addProductRow"
                >
                  Thêm dòng
                </v-btn>
              </div>

              <div class="space-y-3">
                <div v-for="(item, index) in orderItems" :key="index" class="flex items-center gap-3 p-4 rounded-xl border" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                  <div class="flex-grow">
                    <v-text-field
                      v-model="item.productName"
                      placeholder="Nhập tên sản phẩm..."
                      variant="outlined"
                      color="emerald-600"
                      density="compact"
                      hide-details
                      class="rounded-xl"
                    />
                  </div>
                  <div style="width: 80px;">
                    <v-text-field
                      v-model.number="item.quantity"
                      type="number"
                      label="SL"
                      min="1"
                      variant="outlined"
                      color="emerald-600"
                      density="compact"
                      hide-details
                      class="rounded-xl"
                    />
                  </div>
                  <div style="width: 140px;">
                    <v-text-field
                      v-model.number="item.unitPrice"
                      type="number"
                      label="Đơn giá"
                      variant="outlined"
                      color="emerald-600"
                      density="compact"
                      hide-details
                      suffix="đ"
                      class="rounded-xl"
                    />
                  </div>
                  <div>
                    <v-btn 
                      icon="mdi-delete-outline" 
                      color="red" 
                      variant="text" 
                      size="small"
                      :disabled="orderItems.length === 1"
                      @click="removeProductRow(index)"
                    />
                  </div>
                </div>
              </div>

              <!-- Price adjustments -->
              <div class="grid grid-cols-2 gap-4 mt-6">
                <v-text-field
                  v-model.number="shippingFee"
                  type="number"
                  label="Phí vận chuyển (đ)"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
                <v-text-field
                  v-model.number="discountAmount"
                  type="number"
                  label="Giảm giá (đ)"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
              </div>
            </div>

            <!-- Step 3: Shipping Address -->
            <div v-if="currentStep === 3" class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">3. Thông tin người nhận & Địa chỉ</h3>
                <v-btn
                  v-if="selectedContact"
                  size="x-small"
                  color="emerald-600"
                  variant="tonal"
                  prepend-icon="mdi-content-copy"
                  class="font-bold text-xs"
                  @click="autofillContactAddress"
                >
                  Lấy thông tin khách hàng
                </v-btn>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <v-text-field
                  v-model="shippingAddress.receiverName"
                  label="Họ và tên người nhận *"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
                <v-text-field
                  v-model="shippingAddress.receiverPhone"
                  label="Số điện thoại nhận *"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
              </div>

              <div class="grid grid-cols-3 gap-4">
                <v-text-field
                  v-model="shippingAddress.receiverProvince"
                  label="Tỉnh / Thành phố *"
                  placeholder="Ví dụ: Hà Nội"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
                <v-text-field
                  v-model="shippingAddress.receiverDistrict"
                  label="Quận / Huyện *"
                  placeholder="Ví dụ: Cầu Giấy"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
                <v-text-field
                  v-model="shippingAddress.receiverWard"
                  label="Phường / Xã *"
                  placeholder="Ví dụ: Dịch Vọng Hậu"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
              </div>

              <v-text-field
                v-model="shippingAddress.receiverAddress"
                label="Địa chỉ chi tiết (Số nhà, ngõ, đường...) *"
                variant="outlined"
                color="emerald-600"
                density="comfortable"
                class="rounded-xl"
              />

              <!-- Map preview simulator -->
              <div class="p-4 rounded-xl border flex items-center gap-3" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                <v-icon color="emerald-600" size="24">mdi-map-marker-radius</v-icon>
                <div class="flex-grow">
                  <div class="text-[11px] font-bold text-slate-400 uppercase">Mô phỏng bản đồ địa chỉ</div>
                  <div class="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                    {{ fullAddressText || 'Vui lòng điền địa chỉ để xác định vị trí giao hàng' }}
                  </div>
                </div>
                <v-chip v-if="fullAddressText" size="x-small" color="emerald-600" variant="flat" class="font-bold text-white px-2">Đã định vị</v-chip>
              </div>
            </div>

            <!-- Step 4: Delivery Options -->
            <div v-if="currentStep === 4" class="space-y-4">
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">4. Cấu hình vận chuyển & COD</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Carrier selection card -->
                <div 
                  class="p-5 rounded-[20px] border cursor-pointer transition-all duration-200" 
                  :class="selectedCarrier === 'viettelpost' ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : (isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200')"
                  @click="selectedCarrier = 'viettelpost'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <v-icon color="emerald-600">mdi-truck-fast</v-icon>
                      <span class="font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">Viettel Post API</span>
                    </div>
                    <v-icon v-if="selectedCarrier === 'viettelpost'" color="emerald-600">mdi-check-circle</v-icon>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-2">Tạo vận đơn tự động, đồng bộ trạng thái webhook thời gian thực.</p>
                  <div class="mt-4 flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-400">Trọng lượng (Grams):</span>
                    <div style="width: 100px;">
                      <v-text-field
                        v-model.number="weightGrams"
                        type="number"
                        density="compact"
                        hide-details
                        variant="outlined"
                        color="emerald-600"
                        class="rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>

                <!-- Custom Delivery / Walk-in card -->
                <div 
                  class="p-5 rounded-[20px] border cursor-pointer transition-all duration-200" 
                  :class="selectedCarrier === 'self' ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' : (isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200')"
                  @click="selectedCarrier = 'self'"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <v-icon color="slate-400">mdi-walk</v-icon>
                      <span class="font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-800'">Tự vận chuyển / Khách lấy</span>
                    </div>
                    <v-icon v-if="selectedCarrier === 'self'" color="emerald-600">mdi-check-circle</v-icon>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-2">Khách mua trực tiếp hoặc cửa hàng tự vận hành ship hàng.</p>
                </div>
              </div>

              <!-- Payment details -->
              <div class="p-5 rounded-[20px] border mt-6" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">Thu hộ tiền (COD)</h4>
                
                <div class="flex items-center justify-between mb-4">
                  <div class="text-xs font-semibold" :class="isDark ? 'text-slate-300' : 'text-slate-600'">Thu hộ COD bằng tổng tiền hàng:</div>
                  <v-switch 
                    v-model="codMatchesTotal" 
                    color="emerald-600" 
                    hide-details
                    density="compact"
                  />
                </div>

                <v-text-field
                  v-if="!codMatchesTotal"
                  v-model.number="codAmount"
                  type="number"
                  label="Số tiền thu hộ COD (đ)"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  class="rounded-xl"
                />
                <div v-else class="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
                  Số tiền thu hộ COD sẽ tự động cập nhật là: <span class="text-emerald-600">{{ formatCurrency(orderTotal) }}</span>
                </div>
              </div>
            </div>

            <!-- Step 5: Final Review -->
            <div v-if="currentStep === 5" class="space-y-4">
              <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">5. Kiểm tra thông tin đơn hàng</h3>

              <div class="space-y-4">
                <!-- Customer info summary -->
                <div class="p-4 rounded-xl border" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                  <div class="text-xs font-bold uppercase text-slate-400 mb-2">Khách hàng</div>
                  <div v-if="selectedContact" class="text-sm">
                    <strong>{{ selectedContact.fullName }}</strong> - {{ selectedContact.phone || 'Không có SĐT' }}
                  </div>
                  <div v-else class="text-sm text-red-500">Chưa chọn khách hàng</div>
                </div>

                <!-- Products list table summary -->
                <div class="rounded-xl border overflow-hidden" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                  <div class="p-3 bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase text-slate-400">Chi tiết sản phẩm</div>
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b dark:border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                        <th class="p-3">Sản phẩm</th>
                        <th class="p-3 text-right" style="width: 50px;">SL</th>
                        <th class="p-3 text-right" style="width: 100px;">Đơn giá</th>
                        <th class="p-3 text-right" style="width: 100px;">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, idx) in orderItems" :key="idx" class="border-b last:border-b-0 dark:border-slate-800">
                        <td class="p-3 font-semibold">{{ item.productName || 'Chưa nhập tên' }}</td>
                        <td class="p-3 text-right">{{ item.quantity }}</td>
                        <td class="p-3 text-right">{{ formatCurrency(item.unitPrice) }}</td>
                        <td class="p-3 text-right font-bold">{{ formatCurrency(item.quantity * item.unitPrice) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Delivery summary -->
                <div class="p-4 rounded-xl border" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200'">
                  <div class="text-xs font-bold uppercase text-slate-400 mb-2">Địa chỉ giao hàng & Thu hộ COD</div>
                  <div class="text-sm space-y-1">
                    <div><strong>Người nhận:</strong> {{ shippingAddress.receiverName }} - {{ shippingAddress.receiverPhone }}</div>
                    <div><strong>Địa chỉ:</strong> {{ fullAddressText }}</div>
                    <div><strong>Nhà vận chuyển:</strong> {{ selectedCarrier === 'viettelpost' ? 'Viettel Post API' : 'Tự giao hàng' }}</div>
                    <div class="mt-2 text-base">
                      <strong>Thu hộ COD:</strong> <span class="text-emerald-600 font-bold">{{ formatCurrency(codMatchesTotal ? orderTotal : codAmount) }}</span>
                    </div>
                  </div>
                </div>

                <v-textarea
                  v-model="notes"
                  label="Ghi chú đơn hàng (Không bắt buộc)"
                  variant="outlined"
                  color="emerald-600"
                  density="comfortable"
                  rows="2"
                  class="rounded-xl mt-4"
                  placeholder="Ví dụ: Giao hàng giờ hành chính..."
                />
              </div>
            </div>
          </div>

          <!-- Wizard Actions footer -->
          <div class="flex justify-between items-center pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
            <v-btn 
              variant="outlined" 
              color="slate-400" 
              :disabled="currentStep === 1" 
              @click="prevStep"
              class="font-bold text-xs"
            >
              Quay lại
            </v-btn>
            <div class="flex gap-2">
              <v-btn variant="text" color="slate-400" @click="closeWizard" class="font-bold text-xs">Hủy</v-btn>
              <v-btn 
                v-if="currentStep < 5" 
                color="emerald-600" 
                variant="flat" 
                class="text-white font-bold"
                :disabled="!isStepValid"
                @click="nextStep"
              >
                Tiếp tục
              </v-btn>
              <v-btn 
                v-else 
                color="emerald-600" 
                variant="flat" 
                class="text-white font-bold"
                :loading="submitting"
                :disabled="!isStepValid"
                @click="handleSubmit"
              >
                Hoàn thành & Tạo đơn
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Right: Sticky Order Summary Card (30% width) -->
        <div class="lg:col-span-4 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-6">
          <div class="sticky top-6 p-5 rounded-[20px] border space-y-4" :class="isDark ? 'bg-[#112240] border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 dark:border-slate-800">Tóm tắt đơn hàng</h3>
            
            <!-- Customer Summary -->
            <div class="space-y-1">
              <div class="text-[10px] uppercase font-bold text-slate-400">Khách hàng</div>
              <div v-if="selectedContact" class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {{ selectedContact.fullName }}
              </div>
              <div v-else class="text-xs text-slate-400 italic">Chưa chọn khách hàng</div>
            </div>

            <!-- Items summary list -->
            <div class="space-y-2">
              <div class="text-[10px] uppercase font-bold text-slate-400">Sản phẩm ({{ orderItems.length }})</div>
              <div class="max-h-36 overflow-y-auto space-y-2 pr-1">
                <div v-for="(item, idx) in orderItems" :key="idx" class="flex justify-between items-center text-xs">
                  <span class="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{{ item.productName || 'Chưa đặt tên' }}</span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">
                    {{ item.quantity }}x {{ formatCurrency(item.unitPrice) }}
                  </span>
                </div>
              </div>
            </div>

            <v-divider class="dark:border-slate-800" />

            <!-- Fee details -->
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-slate-400">
                <span>Tạm tính hàng:</span>
                <span class="font-bold text-slate-700 dark:text-slate-300">{{ formatCurrency(orderSubtotal) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Phí vận chuyển:</span>
                <span class="font-bold text-emerald-600">+{{ formatCurrency(shippingFee) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Giảm giá:</span>
                <span class="font-bold text-red-500">-{{ formatCurrency(discountAmount) }}</span>
              </div>
              <v-divider class="my-2 dark:border-slate-800" />
              <div class="flex justify-between text-sm font-bold text-slate-800 dark:text-slate-100">
                <span>Tổng cộng:</span>
                <span class="text-emerald-600 text-base">{{ formatCurrency(orderTotal) }}</span>
              </div>
              <div class="flex justify-between text-[11px] text-slate-400 mt-2">
                <span>COD thu hộ:</span>
                <span class="font-bold text-slate-600 dark:text-slate-300">
                  {{ formatCurrency(codMatchesTotal ? orderTotal : codAmount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { api } from '@/api';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'order-created', 'snack']);

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// Wizard steps definition
const steps = [
  { name: 'Khách hàng' },
  { name: 'Sản phẩm' },
  { name: 'Địa chỉ' },
  { name: 'Vận chuyển' },
  { name: 'Xác nhận' }
];

const currentStep = ref(1);
const submitting = ref(false);

// Contacts list from database
const contacts = ref<any[]>([]);
const selectedCustomerId = ref('');
const selectedContact = ref<any | null>(null);
const showNewContactForm = ref(false);

// New contact inline state
const newContact = reactive({
  fullName: '',
  phone: '',
  source: 'Zalo Official Account'
});

// Order items list
const orderItems = ref<any[]>([
  { productName: '', quantity: 1, unitPrice: 0 }
]);

const shippingFee = ref(30000);
const discountAmount = ref(0);
const notes = ref('');

// Shipping details
const shippingAddress = reactive({
  receiverName: '',
  receiverPhone: '',
  receiverProvince: '',
  receiverDistrict: '',
  receiverWard: '',
  receiverAddress: ''
});

// Carrier selection
const selectedCarrier = ref('viettelpost');
const weightGrams = ref(500);

// COD values
const codMatchesTotal = ref(true);
const codAmount = ref(0);

// Computed address text
const fullAddressText = computed(() => {
  const { receiverAddress, receiverWard, receiverDistrict, receiverProvince } = shippingAddress;
  if (!receiverProvince && !receiverDistrict && !receiverWard && !receiverAddress) return '';
  return [receiverAddress, receiverWard, receiverDistrict, receiverProvince].filter(Boolean).join(', ');
});

// Order pricing calculations
const orderSubtotal = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
});

const orderTotal = computed(() => {
  const total = orderSubtotal.value + shippingFee.value - discountAmount.value;
  return total > 0 ? total : 0;
});

// Step validation computed property
const isStepValid = computed(() => {
  if (currentStep.value === 1) {
    return !!selectedCustomerId.value;
  }
  if (currentStep.value === 2) {
    return orderItems.value.length > 0 && orderItems.value.every(item => item.productName.trim() !== '' && item.quantity > 0 && item.unitPrice >= 0);
  }
  if (currentStep.value === 3) {
    const { receiverName, receiverPhone, receiverProvince, receiverDistrict, receiverWard, receiverAddress } = shippingAddress;
    return !!(receiverName.trim() && receiverPhone.trim() && receiverProvince.trim() && receiverDistrict.trim() && receiverWard.trim() && receiverAddress.trim());
  }
  if (currentStep.value === 4) {
    if (selectedCarrier.value === 'viettelpost') {
      return weightGrams.value > 0;
    }
    return true;
  }
  return true;
});

// Step color formatting
function getStepClass(stepNumber: number) {
  if (currentStep.value === stepNumber) {
    return isDark.value ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]';
  }
  if (currentStep.value > stepNumber) {
    return 'bg-emerald-500 text-white';
  }
  return isDark.value ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-400 border border-slate-200';
}

function nextStep() {
  if (currentStep.value < 5 && isStepValid.value) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

// Fetch database contacts for list
async function loadContacts() {
  try {
    const res = await api.get('/contacts', { params: { limit: 200 } });
    contacts.value = res.data.contacts ?? res.data ?? [];
  } catch (err: any) {
    console.error('Failed to load contacts for checkout wizard:', err);
  }
}

function onContactChanged(val: string) {
  const found = contacts.value.find(c => c.id === val);
  selectedContact.value = found || null;
}

// Inline contact creation
async function handleCreateContact() {
  if (!newContact.fullName.trim() || !newContact.phone.trim()) {
    emit('snack', 'Vui lòng điền đủ Họ tên và SĐT', 'error');
    return;
  }

  try {
    const res = await api.post('/contacts', newContact);
    const created = res.data.contact || res.data;
    emit('snack', 'Tạo khách hàng mới thành công!');
    await loadContacts();
    selectedCustomerId.value = created.id;
    selectedContact.value = created;
    showNewContactForm.value = false;
  } catch (err: any) {
    console.error('Failed to create inline contact:', err);
    emit('snack', err.response?.data?.error || 'Không thể tạo khách hàng', 'error');
  }
}

// Copy contact details directly to shipping fields
function autofillContactAddress() {
  if (!selectedContact.value) return;
  shippingAddress.receiverName = selectedContact.value.fullName || '';
  shippingAddress.receiverPhone = selectedContact.value.phone || '';
  emit('snack', 'Đã lấy Họ tên & SĐT từ thông tin khách hàng.');
}

// Product list helpers
function addProductRow() {
  orderItems.value.push({ productName: '', quantity: 1, unitPrice: 0 });
}

function removeProductRow(idx: number) {
  orderItems.value.splice(idx, 1);
}

function closeWizard() {
  emit('update:modelValue', false);
  resetWizard();
}

function resetWizard() {
  currentStep.value = 1;
  selectedCustomerId.value = '';
  selectedContact.value = null;
  orderItems.value = [{ productName: '', quantity: 1, unitPrice: 0 }];
  shippingFee.value = 30000;
  discountAmount.value = 0;
  notes.value = '';
  shippingAddress.receiverName = '';
  shippingAddress.receiverPhone = '';
  shippingAddress.receiverProvince = '';
  shippingAddress.receiverDistrict = '';
  shippingAddress.receiverWard = '';
  shippingAddress.receiverAddress = '';
  selectedCarrier.value = 'viettelpost';
  weightGrams.value = 500;
  codMatchesTotal.value = true;
  codAmount.value = 0;
}

// Wizard Final Submission
async function handleSubmit() {
  submitting.value = true;
  try {
    const payload = {
      customerId: selectedCustomerId.value,
      items: orderItems.value,
      shippingFee: shippingFee.value,
      discountAmount: discountAmount.value,
      codAmount: codMatchesTotal.value ? orderTotal.value : codAmount.value,
      notes: notes.value,
      shippingAddressJson: JSON.stringify(shippingAddress)
    };

    const res = await api.post('/logistics/orders', payload);
    const createdOrder = res.data;

    // Trigger shipment automatically if Viettel Post was selected
    if (selectedCarrier.value === 'viettelpost' && createdOrder.id) {
      try {
        await api.post('/logistics/shipments', {
          orderId: createdOrder.id,
          weightGrams: weightGrams.value
        });
        emit('snack', 'Đã tạo đơn hàng & tạo vận đơn Viettel Post thành công!');
      } catch (shipErr: any) {
        console.error('Auto shipment creation failed:', shipErr);
        emit('snack', 'Tạo đơn hàng thành công, nhưng tạo vận đơn tự động thất bại.', 'warning');
      }
    } else {
      emit('snack', 'Tạo đơn hàng thành công!');
    }

    emit('order-created');
    closeWizard();
  } catch (err: any) {
    console.error('Failed to submit order wizard:', err);
    emit('snack', err.response?.data?.error || 'Tạo đơn hàng thất bại', 'error');
  } finally {
    submitting.value = false;
  }
}

function formatCurrency(val: number) {
  if (val === undefined || val === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

onMounted(() => {
  loadContacts();
});
</script>

<style scoped>
.v-btn {
  letter-spacing: 0.5px;
}
</style>
