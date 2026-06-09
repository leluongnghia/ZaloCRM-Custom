<template>
  <div 
    class="flex h-full w-full overflow-hidden transition-all duration-300 rounded-[20px] border"
    :class="isDark ? 'bg-[#0A192F] border-[#1D2D50]' : 'bg-white border-slate-100'"
  >
    <!-- LEFT PANEL: Inbox Filters & Navigation -->
    <ChatSidebar
      :conversations="conversations"
      v-model:activeFilter="activeFilter"
      v-model:selectedAccountId="accountFilter"
      @update:selectedAccountId="onFilterAccount"
      v-model:selectedTag="selectedTag"
      :unread-total="unreadTotal"
      :filter-counts="filterCounts"
      :account-options="accountOptions"
    />

    <!-- MIDDLE PANEL: Conversation List (Resizable) -->
    <div class="relative flex flex-col border-r h-full" :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'" :style="{ width: leftWidth + 'px' }">
      <ConversationList
        :conversations="filteredConversations"
        :selected-id="selectedConvId"
        :loading="loadingConvs"
        v-model:search="searchQuery"
        @select="selectConversation"
        @filter-account="onFilterAccount"
      />
      <!-- Resize handle -->
      <div class="resize-handle" @mousedown="startResize('left', $event)" />
    </div>

    <!-- RIGHT PANEL: Chat Area & Context Sidebar (Flexible Center) -->
    <div class="flex-1 flex h-full overflow-hidden">
      <!-- Active Message Thread -->
      <MessageThread
        :conversation="selectedConv"
        :messages="messages"
        :loading="loadingMsgs"
        :sending="sendingMsg"
        @send="sendMessage"
        @toggle-contact-panel="showRightSidebar = !showRightSidebar"
        :show-contact-panel="showRightSidebar"
        style="flex: 1; min-width: 300px;"
      />

      <!-- Right Tabbed Sidebar (Customer Info + AI Copilot) -->
      <div 
        v-if="showRightSidebar && selectedConv" 
        class="flex flex-col border-l h-full"
        :class="isDark ? 'border-[#1D2D50]' : 'border-slate-100'"
        :style="{ width: rightWidth + 'px' }"
      >
        <!-- Tab Headers -->
        <div class="flex border-b text-xs shrink-0" :class="isDark ? 'bg-[#112240] border-[#1D2D50]' : 'bg-slate-50 border-slate-100'">
          <button 
            @click="activeRightTab = 'customer'"
            class="flex-1 py-3 font-bold text-center border-b-2 transition-all duration-200"
            :class="activeRightTab === 'customer'
              ? (isDark ? 'border-[#10B981] text-[#10B981]' : 'border-emerald-600 text-emerald-700')
              : 'border-transparent text-slate-400 hover:text-slate-600'"
          >
            Khách hàng
          </button>
          <button 
            @click="activeRightTab = 'ai'"
            class="flex-1 py-3 font-bold text-center border-b-2 transition-all duration-200"
            :class="activeRightTab === 'ai'
              ? (isDark ? 'border-[#10B981] text-[#10B981]' : 'border-emerald-600 text-emerald-700')
              : 'border-transparent text-slate-400 hover:text-slate-600'"
          >
            Trợ lý AI
          </button>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-hidden relative">
          <CustomerDetailSidebar
            v-if="activeRightTab === 'customer' && selectedConv.contact"
            :contact-id="selectedConv.contact.id"
            :contact="selectedConv.contact"
            @close="showRightSidebar = false"
            @saved="fetchConversations()"
          />
          <AiCopilotPanel
            v-else-if="activeRightTab === 'ai'"
            :conversation="selectedConv"
            :messages="messages"
            @use-reply="onUseAiReply"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import ConversationList from '@/components/chat/ConversationList.vue';
import MessageThread from '@/components/chat/MessageThread.vue';
import ChatSidebar from '@/components/chat/ChatSidebar.vue';
import CustomerDetailSidebar from '@/components/chat/CustomerDetailSidebar.vue';
import AiCopilotPanel from '@/components/chat/AiCopilotPanel.vue';
import { useChat } from '@/composables/use-chat';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/index';

const theme = useTheme();
const isDark = computed(() => theme.global.name.value === 'dark');
const authStore = useAuthStore();

const {
  conversations, selectedConvId, selectedConv, messages,
  loadingConvs, loadingMsgs, sendingMsg, searchQuery, accountFilter,
  fetchConversations, selectConversation, sendMessage,
  initSocket, destroySocket,
} = useChat();

const activeFilter = ref('all');
const selectedTag = ref<string | null>(null);
const activeRightTab = ref<'customer' | 'ai'>('customer');
const showRightSidebar = ref(true);

const accountOptions = ref<{ text: string; value: string }[]>([]);

function onFilterAccount(id: string | null) {
  accountFilter.value = id;
  fetchConversations();
}

function isToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

const unreadTotal = computed(() => {
  return conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
});

const filterCounts = computed(() => {
  const counts = { unread: 0, assigned: 0, waiting: 0, followup: 0, ai: 0 };
  const userId = authStore.user?.id;
  
  conversations.value.forEach(c => {
    if (c.unreadCount > 0) counts.unread++;
    if (userId && c.contact?.assignedUserId === userId) counts.assigned++;
    if (!c.isReplied) counts.waiting++;
    if (c.contact?.nextAppointment && isToday(c.contact.nextAppointment)) counts.followup++;
    
    const lastMsgContent = c.messages?.[0]?.content?.toLowerCase() || '';
    const hasHighIntent = lastMsgContent.match(/(giá|mua|sỉ|ship|đặt hàng|giao|bao nhiêu)/);
    if (c.unreadCount > 0 && (!c.isReplied || hasHighIntent)) counts.ai++;
  });
  return counts;
});

const filteredConversations = computed(() => {
  let list = conversations.value;
  const userId = authStore.user?.id;

  if (activeFilter.value === 'unread') {
    list = list.filter(c => c.unreadCount > 0);
  } else if (activeFilter.value === 'assigned') {
    list = list.filter(c => userId && c.contact?.assignedUserId === userId);
  } else if (activeFilter.value === 'waiting') {
    list = list.filter(c => !c.isReplied);
  } else if (activeFilter.value === 'followup') {
    list = list.filter(c => c.contact?.nextAppointment && isToday(c.contact.nextAppointment));
  } else if (activeFilter.value === 'ai') {
    list = list.filter(c => {
      const lastMsgContent = c.messages?.[0]?.content?.toLowerCase() || '';
      const hasHighIntent = lastMsgContent.match(/(giá|mua|sỉ|ship|đặt hàng|giao|bao nhiêu)/);
      return c.unreadCount > 0 && (!c.isReplied || hasHighIntent);
    });
  }

  if (selectedTag.value) {
    list = list.filter(c => {
      if (!c.contact?.tags) return false;
      try {
        const parsed = typeof c.contact.tags === 'string' ? JSON.parse(c.contact.tags) : c.contact.tags;
        return Array.isArray(parsed) && parsed.includes(selectedTag.value);
      } catch {
        return false;
      }
    });
  }

  return list;
});

function onUseAiReply(reply: string) {
  sendMessage(reply);
}

const leftWidth = ref(parseInt(localStorage.getItem('chat-left-width') || '320'));
const rightWidth = ref(parseInt(localStorage.getItem('chat-right-width') || '320'));

let resizing: 'left' | 'right' | null = null;
let startX = 0;
let startWidth = 0;

function startResize(panel: 'left' | 'right', e: MouseEvent) {
  resizing = panel;
  startX = e.clientX;
  startWidth = panel === 'left' ? leftWidth.value : rightWidth.value;
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResize(e: MouseEvent) {
  if (!resizing) return;
  const diff = e.clientX - startX;
  if (resizing === 'left') {
    leftWidth.value = Math.max(240, Math.min(500, startWidth + diff));
  } else {
    rightWidth.value = Math.max(280, Math.min(500, startWidth - diff));
  }
}

function stopResize() {
  if (resizing) {
    localStorage.setItem('chat-left-width', String(leftWidth.value));
    localStorage.setItem('chat-right-width', String(rightWidth.value));
  }
  resizing = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onMounted(async () => {
  fetchConversations();
  initSocket();

  try {
    const res = await api.get('/zalo-accounts');
    const accounts = Array.isArray(res.data) ? res.data : res.data.accounts || [];
    accountOptions.value = accounts.map((a: any) => ({
      text: a.displayName || a.zaloUid || a.id,
      value: a.id,
    }));
  } catch {}
});

onUnmounted(() => {
  destroySocket();
});

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchConversations(), 300);
});
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
  transition: background 0.2s;
}

.resize-handle:hover,
.resize-handle:active {
  background: rgba(16, 185, 129, 0.3); /* Emerald green drag glow */
}
</style>
