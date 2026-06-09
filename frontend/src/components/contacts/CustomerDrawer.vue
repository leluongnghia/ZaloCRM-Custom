<template>
  <v-navigation-drawer
    v-model="isVisible"
    location="right"
    :width="750"
    temporary
    class="customer-drawer border-l"
    :theme="isDark ? 'dark' : 'light'"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="p-4 border-b flex items-center justify-between shrink-0" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
        <div>
          <h2 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <v-icon color="emerald-600">mdi-account-edit</v-icon>
            {{ contact ? 'Chi tiết khách hàng' : 'Thêm khách hàng mới' }}
          </h2>
          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            {{ contact ? 'Cập nhật hồ sơ và hoạt động CRM' : 'Thêm thông tin danh bạ vào hệ thống ZaloCRM' }}
          </p>
        </div>
        <v-btn icon size="small" variant="text" @click="closeDrawer">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Main Form Area -->
      <div class="flex-1 overflow-y-auto p-5 space-y-6">
        <!-- AI Assist Notification Card -->
        <div 
          class="p-4 rounded-[20px] border flex items-start gap-3 relative overflow-hidden"
          :class="isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/20 border-emerald-100/50'"
        >
          <v-icon size="18" class="text-emerald-500 mt-0.5">mdi-robot</v-icon>
          <div class="space-y-1">
            <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Trợ lý AI phân loại</span>
            <p class="text-xs leading-relaxed" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
              Điền họ tên và nguồn khách hàng để AI tự động gợi ý phân loại Tag, Điểm ưu tiên và Giai đoạn chăm sóc phù hợp.
            </p>
            <div v-if="aiSuggestions.show" class="flex flex-wrap gap-1.5 mt-2">
              <span class="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Gợi ý Tag: {{ aiSuggestions.tags.join(', ') }}
              </span>
              <span class="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                Ưu tiên: {{ aiSuggestions.priority }}
              </span>
              <button 
                @click="applyAiSuggestions"
                class="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold ml-1.5 underline"
              >
                Áp dụng gợi ý
              </button>
            </div>
          </div>
        </div>

        <!-- Section 1: Basic Info -->
        <div class="space-y-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Thông tin cơ bản</span>
          <div class="grid grid-cols-2 gap-4">
            <v-text-field
              v-model="form.fullName"
              label="Họ và tên *"
              placeholder="Nhập họ tên đầy đủ"
              density="comfortable"
              variant="outlined"
              hide-details
              @update:model-value="triggerAiScan"
            />
            <v-text-field
              v-model="form.phone"
              label="Số điện thoại *"
              placeholder="Ví dụ: 0987654321"
              density="comfortable"
              variant="outlined"
              hide-details
            />
          </div>
          <v-text-field
            v-model="form.email"
            label="Địa chỉ Email"
            placeholder="name@company.com"
            type="email"
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </div>

        <!-- Section 2: Business Info -->
        <div class="space-y-4 border-t pt-5" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Thông tin phân loại</span>
          <div class="grid grid-cols-2 gap-4">
            <v-select
              v-model="form.source"
              label="Nguồn tiếp cận"
              :items="SOURCE_OPTIONS"
              item-title="text"
              item-value="value"
              density="comfortable"
              variant="outlined"
              hide-details
              @update:model-value="triggerAiScan"
            />
            <v-select
              v-model="form.customerType"
              label="Loại khách hàng"
              :items="['B2C Cá nhân', 'B2B Doanh nghiệp', 'Đại lý sỉ']"
              density="comfortable"
              variant="outlined"
              hide-details
            />
          </div>
          <v-combobox
            v-model="form.tags"
            label="Nhãn phân loại (Tags)"
            multiple
            chips
            closable-chips
            placeholder="Nhập tag và ấn Enter"
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </div>

        <!-- Section 3: CRM Details -->
        <div class="space-y-4 border-t pt-5" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Thông tin CRM & Chăm sóc</span>
          <div class="grid grid-cols-2 gap-4">
            <v-select
              v-model="form.status"
              label="Giai đoạn bán hàng (Lifecycle)"
              :items="STATUS_OPTIONS"
              item-title="text"
              item-value="value"
              density="comfortable"
              variant="outlined"
              hide-details
            />
            <v-select
              v-model="form.assignedUserId"
              label="Sale phụ trách"
              :items="salespersonOptions"
              item-title="text"
              item-value="value"
              density="comfortable"
              variant="outlined"
              hide-details
            />
          </div>
          <v-text-field
            v-model="form.nextAppointment"
            label="Ngày hẹn tiếp theo"
            type="date"
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </div>

        <!-- Section 4: Notes & Additional Info -->
        <div class="space-y-4 border-t pt-5" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Thông tin bổ sung</span>
          <v-textarea
            v-model="form.notes"
            label="Ghi chú chi tiết"
            rows="3"
            placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt của khách hàng..."
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </div>
      </div>

      <!-- Action Footer (Sticky) -->
      <div 
        class="p-4 border-t flex items-center justify-end gap-2.5 shrink-0"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-slate-50 border-slate-100'"
      >
        <v-btn
          variant="outlined"
          color="slate-500"
          @click="closeDrawer"
          class="font-bold text-xs"
        >
          Hủy bỏ
        </v-btn>
        
        <v-btn
          color="success"
          variant="flat"
          class="text-white font-bold text-xs"
          :loading="saving"
          @click="saveContact(null)"
        >
          Lưu khách hàng
        </v-btn>

        <!-- Multi Action CTA Options -->
        <v-btn
          color="slate-800"
          variant="flat"
          class="text-white font-bold text-xs"
          :loading="saving"
          @click="saveContact('order')"
        >
          Lưu & Tạo đơn hàng
        </v-btn>
        
        <v-btn
          color="emerald-700"
          variant="flat"
          class="text-white font-bold text-xs"
          :loading="saving"
          @click="saveContact('appt')"
        >
          Lưu & Hẹn khám
        </v-btn>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';
import { SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';
import { api } from '@/api/index';

const props = defineProps<{
  modelValue: boolean;
  contact: Contact | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const isVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
const router = useRouter();

const saving = ref(false);
const salespersonOptions = ref<{ text: string; value: string }[]>([]);

const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  source: '',
  customerType: 'B2C Cá nhân',
  tags: [] as string[],
  status: 'new',
  assignedUserId: '',
  nextAppointment: '',
  notes: '',
});

const aiSuggestions = reactive({
  show: false,
  tags: [] as string[],
  priority: 'Bình thường',
  status: 'new',
});

// Load user options
onMounted(async () => {
  try {
    const res = await api.get('/users');
    const users = Array.isArray(res.data) ? res.data : res.data.users || [];
    salespersonOptions.value = users.map((u: any) => ({
      text: u.fullName || u.email,
      value: u.id,
    }));
  } catch {}
});

// Watch contact prop to populate form
watch(() => props.contact, (newVal) => {
  if (newVal) {
    form.fullName = newVal.fullName || '';
    form.phone = newVal.phone || '';
    form.email = newVal.email || '';
    form.source = newVal.source || '';
    form.status = newVal.status || 'new';
    form.assignedUserId = newVal.assignedUserId || '';
    form.nextAppointment = newVal.nextAppointment ? newVal.nextAppointment.split('T')[0] : '';
    form.notes = newVal.notes || '';
    
    // Parse tags safely
    if (newVal.tags) {
      try {
        form.tags = typeof newVal.tags === 'string' ? JSON.parse(newVal.tags) : newVal.tags;
      } catch {
        form.tags = Array.isArray(newVal.tags) ? newVal.tags : [];
      }
    } else {
      form.tags = [];
    }
  } else {
    // Reset form
    form.fullName = '';
    form.phone = '';
    form.email = '';
    form.source = '';
    form.customerType = 'B2C Cá nhân';
    form.tags = [];
    form.status = 'new';
    form.assignedUserId = '';
    form.nextAppointment = '';
    form.notes = '';
    aiSuggestions.show = false;
  }
}, { immediate: true });

function closeDrawer() {
  emit('update:modelValue', false);
}

// AI suggestions logic
function triggerAiScan() {
  if (!form.fullName || !form.source) {
    aiSuggestions.show = false;
    return;
  }

  aiSuggestions.show = true;
  
  // Predict tags and lifecycle based on inputs
  if (form.source === 'FB' || form.source === 'TT') {
    aiSuggestions.tags = ['Mạng xã hội', 'Bán lẻ'];
    aiSuggestions.priority = 'Bình thường';
    aiSuggestions.status = 'new';
  } else if (form.source === 'GT') {
    aiSuggestions.tags = ['Được giới thiệu', 'Tiềm năng cao'];
    aiSuggestions.priority = 'Ưu tiên cao';
    aiSuggestions.status = 'interested';
  } else {
    aiSuggestions.tags = ['Khách vãng lai'];
    aiSuggestions.priority = 'Bình thường';
    aiSuggestions.status = 'new';
  }
}

function applyAiSuggestions() {
  aiSuggestions.tags.forEach(t => {
    if (!form.tags.includes(t)) form.tags.push(t);
  });
  form.status = aiSuggestions.status;
  aiSuggestions.show = false;
}

// Save customer
async function saveContact(nextAction: 'order' | 'appt' | null) {
  if (!form.fullName || !form.phone) {
    alert('Họ tên và Số điện thoại là bắt buộc!');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      email: form.email || null,
      source: form.source || null,
      status: form.status || 'new',
      assignedUserId: form.assignedUserId || null,
      nextAppointment: form.nextAppointment ? new Date(form.nextAppointment).toISOString() : null,
      notes: form.notes || null,
      tags: form.tags,
    };

    let savedContactId = '';

    if (props.contact) {
      // Update
      await api.put(`/contacts/${props.contact.id}`, payload);
      savedContactId = props.contact.id;
    } else {
      // Create
      const res = await api.post('/contacts', payload);
      savedContactId = res.data.id;
    }

    emit('saved');
    closeDrawer();

    // Route actions if requested
    if (nextAction === 'order') {
      router.push({ path: '/orders', query: { create: 'true', contactId: savedContactId } });
    } else if (nextAction === 'appt') {
      router.push({ path: '/appointments', query: { contactId: savedContactId } });
    }
  } catch (err) {
    console.error('Failed to save contact:', err);
    alert('Đã xảy ra lỗi khi lưu khách hàng.');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.customer-drawer :deep(.v-field) {
  border-radius: var(--radius-element) !important;
}
</style>
