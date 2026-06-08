<template>
  <div class="pe-4 pb-12 space-y-6 max-w-[1600px] mx-auto">
    <!-- Clean Header Area -->
    <div class="flex items-center justify-between mt-2 mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Tổng quan hệ thống
        </h1>
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
          Theo dõi thời gian thực chỉ số Zalo CRM và hoạt động tương tác khách hàng.
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <div 
          class="border px-3 py-1.5 rounded-xl flex items-center gap-2.5 shadow-sm bg-white border-slate-100 dark:bg-[#112240] dark:border-[#1D2D50]"
        >
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">Đồng bộ tự động</span>
        </div>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="#10b981" class="rounded-full mb-4" height="3" />

    <!-- 1. AI Copilot Panel (Insights, alerts and recommendations) -->
    <div 
      class="border rounded-[20px] p-5 shadow-sm relative overflow-hidden transition-all duration-300"
      :class="isDark ? 'bg-[#112240]/50 border-emerald-950/30' : 'bg-emerald-50/40 border-emerald-100/60'"
    >
      <div class="flex items-center gap-2 mb-3">
        <div class="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <v-icon size="16">mdi-robot</v-icon>
        </div>
        <span class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">AI Copilot Insights</span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex gap-3 items-start">
          <div class="p-1.5 rounded-xl bg-orange-100/60 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 mt-0.5">
            <v-icon size="16">mdi-clock-alert-outline</v-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Nhắc nhở chăm sóc</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Có 4 lịch hẹn tái khám hôm nay chưa liên hệ xác nhận với khách hàng.</div>
          </div>
        </div>

        <div class="flex gap-3 items-start">
          <div class="p-1.5 rounded-xl bg-emerald-100/60 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mt-0.5">
            <v-icon size="16">mdi-account-star-outline</v-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Cơ hội chuyển đổi</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Phát hiện 3 khách hàng Zalo mới hỏi về bảng giá dịch vụ có tiềm năng cao.</div>
          </div>
        </div>

        <div class="flex gap-3 items-start">
          <div class="p-1.5 rounded-xl bg-blue-100/60 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 mt-0.5">
            <v-icon size="16">mdi-message-alert-outline</v-icon>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">Tin nhắn chờ lâu</div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Có 2 tin nhắn từ khách hàng VIP đã đợi phản hồi hơn 15 phút.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. KPI Overview -->
    <KpiCards :kpi="kpi" />

    <!-- Main Content Bento Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- 3. Message Analytics (Daily Trend Chart) -->
      <div class="lg:col-span-2">
        <MessageVolumeChart :data="messageVolume" />
      </div>

      <!-- 4. Sales Pipeline -->
      <div>
        <PipelineChart :data="pipeline" />
      </div>

      <!-- 5. Customer Sources -->
      <div>
        <SourceChart :data="sources" />
      </div>

      <!-- 6. Calendar Overview Widget -->
      <div 
        class="border rounded-[20px] p-5 shadow-sm flex flex-col justify-between"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Lịch Hẹn Hôm Nay</h3>
            <v-icon size="16" class="text-slate-400">mdi-calendar-month</v-icon>
          </div>
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1D2D50]/30 border border-slate-100/50 dark:border-transparent">
              <div class="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
              <div class="flex-1 text-left">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Trần Thị Hoa - Tái khám da liễu</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Thời gian: 14:30 | Bác sĩ Minh</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1D2D50]/30 border border-slate-100/50 dark:border-transparent">
              <div class="w-1.5 h-10 bg-emerald-500 rounded-full"></div>
              <div class="flex-1 text-left">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Nguyễn Văn Bình - Tư vấn liệu trình</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Thời gian: 16:00 | Sale Hương</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1D2D50]/30 border border-slate-100/50 dark:border-transparent opacity-60">
              <div class="w-1.5 h-10 bg-rose-500 rounded-full"></div>
              <div class="flex-1 text-left">
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Phạm Văn Minh - Đã trễ lịch hẹn</div>
                <div class="text-[10px] text-rose-500 mt-0.5">Thời gian hẹn: 10:00 (Gọi lại ngay)</div>
              </div>
            </div>
          </div>
        </div>
        <button 
          class="w-full text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-4"
        >
          Xem toàn bộ lịch hẹn
        </button>
      </div>

      <!-- 7. Activity Feed Widget -->
      <div 
        class="border rounded-[20px] p-5 shadow-sm flex flex-col justify-between"
        :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-white border-slate-100'"
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Hoạt Động Gần Đây</h3>
            <v-icon size="16" class="text-slate-400">mdi-pulse</v-icon>
          </div>
          <div class="space-y-3">
            <div class="flex items-start gap-3 text-left">
              <v-avatar size="24" color="emerald-lighten-4" class="mt-0.5">
                <span class="text-[9px] font-bold text-emerald-800">KH</span>
              </v-avatar>
              <div>
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Khách hàng mới từ Zalo OA</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Khách hàng "Lê Minh Tuấn" đã quét mã QR quan tâm Zalo OA.</div>
                <div class="text-[9px] text-slate-400 mt-0.5">5 phút trước</div>
              </div>
            </div>
            <div class="flex items-start gap-3 text-left">
              <v-avatar size="24" color="blue-lighten-4" class="mt-0.5">
                <span class="text-[9px] font-bold text-blue-800">LH</span>
              </v-avatar>
              <div>
                <div class="text-[11px] font-bold text-slate-800 dark:text-slate-200">Đặt lịch hẹn thành công</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Sale Mai đã xác nhận lịch hẹn cho "Trần Thị Hoa".</div>
                <div class="text-[9px] text-slate-400 mt-0.5">12 phút trước</div>
              </div>
            </div>
          </div>
        </div>
        <button 
          class="w-full text-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-4"
        >
          Xem nhật ký hoạt động
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart.vue';
import PipelineChart from '@/components/dashboard/PipelineChart.vue';
import SourceChart from '@/components/dashboard/SourceChart.vue';
import { useDashboard } from '@/composables/use-dashboard';
import { useTheme } from 'vuetify';

const {
  kpi, messageVolume, pipeline, sources,
  loading, fetchAll,
} = useDashboard();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

onMounted(() => fetchAll());
</script>

