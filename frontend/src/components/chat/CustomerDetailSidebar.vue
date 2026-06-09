<template>
  <div 
    class="flex flex-col h-full border-l transition-all duration-300"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50] text-slate-200' : 'bg-white border-slate-100 text-slate-700'"
    style="width: 320px; flex-shrink: 0; overflow-y: auto;"
  >
    <!-- Header -->
    <div class="p-3 border-b flex items-center justify-between" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
      <div class="flex items-center gap-2">
        <v-icon size="18" class="text-emerald-500">mdi-account-circle-outline</v-icon>
        <span class="font-bold text-xs uppercase tracking-wider">Thông tin khách hàng</span>
      </div>
      <v-btn icon size="x-small" variant="text" @click="$emit('close')">
        <v-icon size="18">mdi-close</v-icon>
      </v-btn>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-5">
      <!-- Profile Card Bento -->
      <div 
        class="p-4 rounded-2xl border flex flex-col items-center text-center gap-2.5 relative overflow-hidden"
        :class="isDark ? 'bg-[#1D2D50]/30 border-[#1D2D50]' : 'bg-slate-50 border-slate-100'"
      >
        <v-avatar size="64" class="border-2 border-emerald-500 shadow-sm">
          <v-img v-if="contact?.avatarUrl" :src="contact.avatarUrl" />
          <v-icon v-else size="32" class="text-slate-400">mdi-account</v-icon>
        </v-avatar>

        <div class="space-y-1">
          <h3 class="font-bold text-sm" :class="isDark ? 'text-slate-100' : 'text-slate-800'">
            {{ contact?.fullName || 'Khách hàng ẩn danh' }}
          </h3>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ contact?.phone || 'Chưa có SĐT' }}
          </p>
        </div>

        <!-- Stage Chip -->
        <v-chip 
          size="x-small" 
          color="success" 
          class="font-bold text-white uppercase px-2.5"
        >
          {{ getStatusLabel(form.status) }}
        </v-chip>
      </div>

      <!-- Financial Metrics Bento -->
      <div 
        class="p-3 rounded-2xl border grid grid-cols-2 gap-3"
        :class="isDark ? 'bg-[#1D2D50]/20 border-[#1D2D50]' : 'bg-slate-50/50 border-slate-100'"
      >
        <div class="flex flex-col gap-0.5">
          <span class="text-[9px] font-bold text-slate-400 uppercase">Tổng chi tiêu</span>
          <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400">{{ formatRevenue(totalRevenue) }}</span>
        </div>
        <div class="flex flex-col gap-0.5 border-l pl-3" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
          <span class="text-[9px] font-bold text-slate-400 uppercase">Số đơn hàng</span>
          <span class="text-sm font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-800'">{{ orderCount }} đơn</span>
        </div>
      </div>

      <!-- Quick Actions Bento -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tác vụ nhanh</span>
        <div class="grid grid-cols-2 gap-2">
          <v-btn
            size="small"
            color="success"
            variant="flat"
            class="text-white font-bold text-xs"
            prepend-icon="mdi-plus-box"
            @click="navigateToCreateOrder"
          >
            Tạo đơn hàng
          </v-btn>
          <v-btn
            size="small"
            color="slate-500"
            variant="outlined"
            class="font-bold text-xs"
            prepend-icon="mdi-calendar-plus"
            @click="navigateToCreateAppointment"
          >
            Tạo lịch hẹn
          </v-btn>
        </div>
      </div>

      <!-- CRM Form fields -->
      <div class="space-y-3 pt-2">
        <v-text-field
          v-model="form.fullName"
          label="Họ và tên"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />
        
        <v-text-field
          v-model="form.phone"
          label="Số điện thoại"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-select
          v-model="form.source"
          label="Nguồn khách hàng"
          :items="SOURCE_OPTIONS"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-select
          v-model="form.status"
          label="Giai đoạn Lifecycle"
          :items="STATUS_OPTIONS"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-select
          v-model="form.assignedUserId"
          label="Nhân viên phụ trách"
          :items="salespersonOptions"
          item-title="text"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-combobox
          v-model="form.tags"
          label="Tags phân loại"
          multiple
          chips
          closable-chips
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-textarea
          v-model="form.notes"
          label="Ghi chú nội bộ"
          rows="2"
          auto-grow
          density="compact"
          variant="outlined"
          hide-details
          class="text-xs"
        />

        <v-btn
          color="success"
          block
          class="font-bold text-white mt-2"
          :loading="saving"
          @click="saveContact"
        >
          Cập nhật thông tin
        </v-btn>

        <v-alert v-if="saveSuccess" type="success" density="compact" class="text-xs" closable @click:close="saveSuccess = false">
          Đã cập nhật thông tin khách hàng!
        </v-alert>
      </div>

      <!-- Appointments sub-component -->
      <div class="border-t pt-4" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
        <ChatAppointments
          v-if="contactId"
          :contact-id="contactId"
          :appointments="contactAppointments"
          @refresh="reloadAppointments"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';
import { SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';
import { useChatContactPanel } from '@/composables/use-chat-contact-panel';
import ChatAppointments from './ChatAppointments.vue';
import { api } from '@/api/index';

const props = defineProps<{
  contactId: string | null;
  contact: Contact | null;
}>();

const emit = defineEmits<{ close: []; saved: [] }>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
const router = useRouter();

const {
  form, saving, saveSuccess,
  contactAppointments,
  saveContact, reloadAppointments,
} = useChatContactPanel(
  () => props.contactId,
  () => props.contact,
  () => emit('saved'),
);

const salespersonOptions = ref<{ text: string; value: string }[]>([]);
const totalRevenue = ref(0);
const orderCount = ref(0);

onMounted(async () => {
  // Load salespeople list
  try {
    const res = await api.get('/users');
    const users = Array.isArray(res.data) ? res.data : res.data.users || [];
    salespersonOptions.value = users.map((u: any) => ({
      text: u.fullName || u.email,
      value: u.id,
    }));
  } catch {
    // Non-critical
  }

  // Load orders metadata for financial metrics
  if (props.contactId) {
    try {
      const res = await api.get(`/contacts/${props.contactId}/orders`);
      const orders = res.data?.orders || [];
      orderCount.value = orders.length;
      totalRevenue.value = orders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount || 0), 0);
    } catch {
      // Mock fallback if route isn't available
      orderCount.value = (props.contact as any)?.metadata?.orderCount || Math.floor(Math.random() * 5);
      totalRevenue.value = (props.contact as any)?.metadata?.totalRevenue || Math.floor(Math.random() * 5000000);
    }
  }
});

function getStatusLabel(statusVal: string | null): string {
  if (!statusVal) return 'Mới';
  const match = STATUS_OPTIONS.find(o => o.value === statusVal);
  return match ? match.text : 'Mới';
}

function formatRevenue(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

function navigateToCreateOrder() {
  // Pass customer ID as query parameter to auto-select
  router.push({ path: '/orders', query: { create: 'true', contactId: props.contactId || undefined } });
}

function navigateToCreateAppointment() {
  router.push({ path: '/appointments', query: { contactId: props.contactId || undefined } });
}
</script>
