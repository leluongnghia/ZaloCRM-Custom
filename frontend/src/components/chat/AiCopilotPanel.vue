<template>
  <div 
    class="flex flex-col h-full border-l transition-all duration-300"
    :class="isDark ? 'bg-[#112240] border-[#1D2D50] text-slate-200' : 'bg-white border-slate-100 text-slate-700'"
    style="width: 300px; flex-shrink: 0; overflow-y: auto;"
  >
    <!-- Header -->
    <div class="p-3 border-b flex items-center gap-2" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'">
      <v-icon size="18" class="text-emerald-500">mdi-robot-outline</v-icon>
      <span class="font-bold text-xs uppercase tracking-wider">AI CRM Copilot</span>
    </div>

    <!-- No Conversation Selected -->
    <div v-if="!conversation" class="p-6 text-center text-slate-400 text-xs">
      Chọn hội thoại để xem phân tích trợ lý AI
    </div>

    <!-- Active AI Insights -->
    <div v-else class="p-4 space-y-5">
      <!-- Sentiment & Purchase Intent Bento -->
      <div 
        class="p-3 rounded-2xl border flex flex-col gap-3"
        :class="isDark ? 'bg-[#1D2D50]/30 border-[#1D2D50]' : 'bg-slate-50 border-slate-100'"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Sắc thái hội thoại</span>
          <v-chip 
            size="x-small" 
            :color="sentimentColor" 
            class="font-bold text-white"
          >
            {{ sentimentText }}
          </v-chip>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 uppercase">Ý định mua hàng</span>
          <v-chip 
            size="x-small" 
            :color="intentColor" 
            class="font-bold text-white"
          >
            {{ intentText }}
          </v-chip>
        </div>
      </div>

      <!-- AI Summary -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tóm tắt cuộc hội thoại</span>
        <div 
          class="p-3.5 rounded-2xl text-xs space-y-2 border leading-relaxed"
          :class="isDark ? 'bg-[#1D2D50]/20 border-[#1D2D50] text-slate-300' : 'bg-slate-50/50 border-slate-100 text-slate-600'"
        >
          <ul class="list-disc pl-4 space-y-1">
            <li v-for="(point, idx) in summaryPoints" :key="idx">{{ point }}</li>
          </ul>
        </div>
      </div>

      <!-- Suggested Reply -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phản hồi gợi ý</span>
        <div 
          class="p-3.5 rounded-2xl border flex flex-col gap-3"
          :class="isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50/20 border-emerald-100/50'"
        >
          <p class="text-xs italic leading-relaxed" :class="isDark ? 'text-emerald-300' : 'text-emerald-800'">
            "{{ suggestedResponse }}"
          </p>
          <v-btn
            size="small"
            color="success"
            variant="flat"
            class="text-white font-bold"
            prepend-icon="mdi-send-check"
            @click="$emit('use-reply', suggestedResponse)"
          >
            Sử dụng phản hồi này
          </v-btn>
        </div>
      </div>

      <!-- Recommended Next Action -->
      <div class="space-y-2">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hành động tiếp theo</span>
        <div 
          class="p-3.5 rounded-2xl border flex items-start gap-2.5"
          :class="isDark ? 'bg-amber-950/10 border-amber-900/20' : 'bg-amber-50/20 border-amber-100/50'"
        >
          <v-icon size="16" class="text-amber-500 mt-0.5">mdi-lightbulb-on-outline</v-icon>
          <div class="flex-1 space-y-1">
            <p class="text-xs font-bold" :class="isDark ? 'text-slate-200' : 'text-slate-800'">Gợi ý hành động:</p>
            <p class="text-[11px]" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ nextAction }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import type { Conversation, Message } from '@/composables/use-chat';

const props = defineProps<{
  conversation: Conversation | null;
  messages: Message[];
}>();

defineEmits<{
  'use-reply': [reply: string];
}>();

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');

// Simple heuristics for sentiment analysis
const sentimentColor = computed(() => {
  const analysis = getSentimentAnalysis();
  if (analysis === 'angry') return 'error';
  if (analysis === 'happy') return 'success';
  return 'info';
});

const sentimentText = computed(() => {
  const analysis = getSentimentAnalysis();
  if (analysis === 'angry') return 'Khó chịu 😠';
  if (analysis === 'happy') return 'Tích cực 😊';
  return 'Trung lập 😐';
});

function getSentimentAnalysis(): 'happy' | 'angry' | 'neutral' {
  if (props.messages.length === 0) return 'neutral';
  
  const text = props.messages.map(m => m.content || '').join(' ').toLowerCase();
  
  const angryWords = ['chậm', 'lâu', 'tệ', 'kém', 'bực', 'hoàn tiền', 'lừa', 'không được', 'sao chưa'];
  const happyWords = ['cảm ơn', 'tốt', 'ok', 'dạ', 'đẹp', 'ưng ý', 'nhanh', 'nhiệt tình'];
  
  let angryCount = 0;
  let happyCount = 0;
  
  angryWords.forEach(w => { if (text.includes(w)) angryCount++; });
  happyWords.forEach(w => { if (text.includes(w)) happyCount++; });
  
  if (angryCount > happyCount) return 'angry';
  if (happyCount > angryCount) return 'happy';
  return 'neutral';
}

// Simple heuristics for purchase intent
const intentColor = computed(() => {
  const score = getPurchaseIntentScore();
  if (score >= 70) return 'success';
  if (score >= 30) return 'warning';
  return 'secondary';
});

const intentText = computed(() => {
  const score = getPurchaseIntentScore();
  if (score >= 70) return `Cao (${score}%) ⚡`;
  if (score >= 30) return `Vừa (${score}%) 🏷️`;
  return `Thấp (${score}%) 🔍`;
});

function getPurchaseIntentScore(): number {
  if (props.messages.length === 0) return 0;
  
  const text = props.messages.map(m => m.content || '').join(' ').toLowerCase();
  let score = 10; // base score
  
  if (text.includes('giá') || text.includes('bao nhiêu') || text.includes('đơn giá')) score += 20;
  if (text.includes('mua') || text.includes('đặt hàng') || text.includes('lấy thêm')) score += 30;
  if (text.includes('sỉ') || text.includes('bán buôn') || text.includes('chiết khấu')) score += 20;
  if (text.includes('ship') || text.includes('phí vận chuyển') || text.includes('giao')) score += 10;
  
  return Math.min(100, score);
}

// Simple dynamic summary points generator
const summaryPoints = computed(() => {
  const points = [];
  const clientMessages = props.messages.filter(m => m.senderType === 'contact');
  const text = props.messages.map(m => m.content || '').join(' ').toLowerCase();

  if (clientMessages.length === 0) {
    return ['Khách hàng chưa nhắn tin hoặc hội thoại vừa được khởi tạo.'];
  }

  points.push(`Khách hàng liên hệ qua kênh Zalo OA.`);
  
  if (text.includes('giá') || text.includes('bao nhiêu')) {
    points.push('Khách hàng đang tìm hiểu và hỏi về giá cả sản phẩm.');
  }
  if (text.includes('ship') || text.includes('giao')) {
    points.push('Đang thảo luận về phương thức vận chuyển và địa chỉ giao hàng.');
  }
  if (text.includes('sỉ') || text.includes('chiết khấu')) {
    points.push('Khách hàng quan tâm đến chính sách giá sỉ hoặc chiết khấu số lượng lớn.');
  }
  if (text.includes('remind') || text.includes('lịch hẹn') || text.includes('khám')) {
    points.push('Có nhắc đến việc lên lịch hẹn hoặc thời gian gặp mặt.');
  }

  if (points.length === 1) {
    points.push('Khách hàng hỏi thông tin hỗ trợ chung về dịch vụ của shop.');
  }

  // Add a final point about activity status
  const lastMsg = props.messages[props.messages.length - 1];
  if (lastMsg) {
    if (lastMsg.senderType === 'contact') {
      points.push('Đang chờ phản hồi và tư vấn từ điều hành viên.');
    } else {
      points.push('Tư vấn viên đã trả lời. Theo dõi thêm phản hồi từ khách hàng.');
    }
  }

  return points;
});

// Dynamic suggested response generator
const suggestedResponse = computed(() => {
  if (props.messages.length === 0) return 'Chào bạn, bên mình có thể hỗ trợ gì cho bạn ạ?';
  
  const lastMsg = props.messages[props.messages.length - 1];
  const lastText = (lastMsg?.content || '').toLowerCase();
  const name = props.conversation?.contact?.fullName || 'anh/chị';

  if (lastText.includes('giá') || lastText.includes('bao nhiêu')) {
    return `Chào ${name}, sản phẩm này bên em đang có giá ưu đãi là 450,000 VND ạ. Nếu ${name} lấy số lượng nhiều từ 5 cái bên em sẽ hỗ trợ chiết khấu thêm nhé!`;
  }
  if (lastText.includes('ship') || lastText.includes('địa chỉ')) {
    return `Dạ bên em giao hàng toàn quốc ạ. ${name} cho em xin thông tin địa chỉ cụ thể để em kiểm tra phí ship và thời gian dự kiến giao hàng chính xác cho mình nhé!`;
  }
  if (lastText.includes('chậm') || lastText.includes('lâu') || lastText.includes('sao chưa')) {
    return `Dạ em chân thành xin lỗi ${name} vì sự chậm trễ này ạ. Em đang kiểm tra lại đơn vận đơn với bên vận chuyển ngay lập tức và sẽ báo lại cho mình trong 5 phút nữa nhé!`;
  }
  if (lastText.includes('cảm ơn') || lastText.includes('ok') || lastText.includes('tốt')) {
    return `Dạ vâng ạ, rất vui được hỗ trợ ${name}. Nếu có bất kỳ thắc mắc nào khác, ${name} cứ nhắn tin cho em nhé. Chúc ${name} một ngày tốt lành!`;
  }

  return `Dạ em chào ${name}, em là trợ lý của shop. Em có thể giúp gì cho ${name} trong việc đặt hàng hay tư vấn sản phẩm không ạ?`;
});

// recommended next actions
const nextAction = computed(() => {
  const text = props.messages.map(m => m.content || '').join(' ').toLowerCase();
  
  if (text.includes('mua') || text.includes('đặt hàng') || text.includes('lấy')) {
    return 'Khách hàng có ý định mua hàng rõ ràng. Nhấn nút "Tạo đơn hàng" ở thanh Quick Actions để lên đơn ngay lập tức.';
  }
  if (text.includes('hẹn') || text.includes('gặp') || text.includes('khám')) {
    return 'Lên lịch hẹn làm việc hoặc tư vấn trực tiếp. Nhấn "Tạo lịch hẹn" ở thanh bên để ghi nhận lịch trình.';
  }
  if (text.includes('chậm') || text.includes('lâu') || text.includes('chưa nhận')) {
    return 'Kiểm tra trạng thái đơn hàng của khách hàng trong phần Logistics và liên hệ điều phối viên để giải quyết gấp.';
  }
  return 'Tiếp tục trò chuyện tư vấn để hiểu thêm nhu cầu, phân loại nhãn (tags) khách hàng tiềm năng.';
});
</script>
