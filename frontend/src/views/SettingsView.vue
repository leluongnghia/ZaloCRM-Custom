<template>
  <div class="pe-4 pb-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8 mt-2">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
          <div class="p-2 bg-emerald-50 rounded-xl">
            <v-icon size="28" color="emerald-600">mdi-shield-crown-outline</v-icon>
          </div>
          Admin Dashboard
        </h1>
        <p class="text-[15px] text-slate-500 mt-2 font-medium">Quản lý nâng cao, người dùng và cập nhật hệ thống</p>
      </div>

      <div class="flex items-center gap-4">
        <button 
          v-if="authStore.isOwner"
          @click="handleSystemUpdate" 
          :disabled="sysUpdating"
          class="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-200 transition-all font-semibold disabled:opacity-50"
        >
          <v-icon size="18" :class="{'animate-spin': sysUpdating}">mdi-github</v-icon>
          <span>{{ sysUpdating ? 'Đang cập nhật...' : 'Cập nhật từ Git' }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Sidebar / Tab Menu -->
      <div class="lg:col-span-3">
        <div class="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm sticky top-6">
          <div class="space-y-1">
            <button 
              @click="tab = 'users'" 
              :class="tab === 'users' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            >
              <v-icon size="20">mdi-account-group-outline</v-icon>
              <span>Nhân viên</span>
            </button>
            <button 
              @click="tab = 'teams'" 
              :class="tab === 'teams' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            >
              <v-icon size="20">mdi-account-multiple-outline</v-icon>
              <span>Đội nhóm</span>
            </button>
            <button 
              @click="tab = 'org'" 
              :class="tab === 'org' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            >
              <v-icon size="20">mdi-domain</v-icon>
              <span>Tổ chức</span>
            </button>
            <button 
              @click="tab = 'system'" 
              :class="tab === 'system' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left"
            >
              <v-icon size="20">mdi-server-network</v-icon>
              <span>Hệ thống</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="lg:col-span-9">
        
        <!-- =================== USERS TAB =================== -->
        <div v-if="tab === 'users'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="text-h6 font-bold text-slate-800">Danh sách nhân sự</div>
            <button v-if="authStore.isAdmin" @click="openCreate" class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
              <v-icon size="18">mdi-plus</v-icon>
              Thêm nhân viên
            </button>
          </div>

          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center justify-between">
            {{ error }}
            <v-icon @click="error = ''" class="cursor-pointer">mdi-close</v-icon>
          </div>

          <div class="border border-slate-200 rounded-2xl overflow-hidden">
            <table class="w-full text-left text-sm whitespace-nowrap">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th class="px-6 py-4 font-semibold">Tài khoản (Email)</th>
                  <th class="px-6 py-4 font-semibold">Vai trò</th>
                  <th class="px-6 py-4 font-semibold">Trạng thái</th>
                  <th class="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="loading" class="bg-white">
                  <td colspan="4" class="px-6 py-8 text-center text-slate-400">Đang tải dữ liệu...</td>
                </tr>
                <tr v-else-if="users.length === 0" class="bg-white">
                  <td colspan="4" class="px-6 py-8 text-center text-slate-400">Chưa có nhân viên nào.</td>
                </tr>
                <tr v-for="item in users" :key="item.id" class="bg-white hover:bg-slate-50/80 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-800">{{ item.fullName }}</div>
                    <div class="text-slate-500 text-xs">{{ item.email }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span :class="roleClasses(item.role)" class="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase">{{ roleLabel(item.role) }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                       <span class="relative flex h-2 w-2">
                        <span v-if="item.isActive" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2" :class="item.isActive ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                      </span>
                      <span :class="item.isActive ? 'text-slate-700' : 'text-slate-400'">{{ item.isActive ? 'Hoạt động' : 'Vô hiệu' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button v-if="authStore.isAdmin" @click="openEdit(item)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Sửa">
                        <v-icon size="18">mdi-pencil</v-icon>
                      </button>
                      <button v-if="authStore.isAdmin" @click="openPassword(item)" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Đổi mật khẩu">
                        <v-icon size="18">mdi-lock-reset</v-icon>
                      </button>
                      <button v-if="authStore.isOwner && item.id !== authStore.user?.id" @click="confirmDelete(item)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <v-icon size="18">mdi-delete-outline</v-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- =================== TEAMS TAB =================== -->
        <div v-if="tab === 'teams'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <TeamManagement />
        </div>

        <!-- =================== ORG TAB =================== -->
        <div v-if="tab === 'org'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <OrgSettings />
        </div>

        <!-- =================== SYSTEM TAB =================== -->
        <div v-if="tab === 'system'" class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div class="flex items-center gap-3 mb-8">
            <div class="p-2 bg-blue-50 rounded-xl">
              <v-icon color="blue-600">mdi-server-network</v-icon>
            </div>
            <h3 class="text-xl font-bold text-slate-800">Trạng thái máy chủ</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-center">
              <div class="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">
                <v-icon size="16">mdi-source-branch</v-icon> Phiên bản
              </div>
              <div class="text-2xl font-bold text-slate-800">
                {{ sysLoading ? 'Đang kiểm tra...' : (systemVersion?.version || '1.0.0') }}
              </div>
              <div class="text-xs font-mono text-slate-400 mt-1 uppercase">{{ systemVersion?.commit || 'n/a' }}</div>
            </div>

            <div class="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-center">
               <div class="text-sm font-semibold text-slate-500 mb-1 flex items-center gap-2">
                <v-icon size="16">mdi-calendar-clock</v-icon> Lần cập nhật cuối
              </div>
              <div class="text-emerald-600 font-bold">
                 {{ sysLoading ? 'Đang kiểm tra...' : (systemVersion?.date || 'n/a').split(' ')[0] }}
              </div>
            </div>
          </div>

          <div class="bg-slate-800 text-white rounded-2xl p-6">
            <h4 class="font-bold mb-2 flex items-center gap-2 text-white">
              <v-icon>mdi-terminal</v-icon> Cập nhật hệ thống rảnh tay
            </h4>
            <p class="text-sm text-slate-300 mb-6 leading-relaxed">
              Bạn có thể cập nhật ZaloCRM lên phiên bản mới nhất từ Github chỉ với một chạm. Hệ thống sẽ tự động kéo nhánh main, rebuild Docker và khởi động lại.
            </p>
            
            <button 
              v-if="authStore.isOwner"
              @click="handleSystemUpdate"
              :disabled="sysUpdating"
              class="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors w-full md:w-auto"
            >
              <v-icon :class="{'animate-spin': sysUpdating}">mdi-autorenew</v-icon>
              {{ sysUpdating ? 'Đang tiến hành Pull & Build...' : 'Tiến hành Cập nhật ngay' }}
            </button>
            <div v-else class="text-sm text-red-300 flex items-center gap-2">
              <v-icon size="16">mdi-alert</v-icon> Bạn không có quyền khởi chạy lệnh này. (Cần Chủ Sở Hữu)
            </div>
          </div>

          <div v-if="sysUpdateResult" class="mt-6">
            <div :class="sysUpdateResult.message.includes('thành công') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'" class="p-4 rounded-xl border font-medium mb-4">
              {{ sysUpdateResult.message }}
            </div>
            
            <details class="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-pointer group">
              <summary class="p-4 font-semibold text-slate-700 select-none flex items-center gap-2">
                <v-icon size="18" class="group-open:rotate-90 transition-transform">mdi-chevron-right</v-icon> 
                Nhật ký triển khai (Log Console)
              </summary>
              <div class="p-4 bg-[#0F172A] border-t border-slate-200">
                <pre class="text-emerald-400 text-[11px] font-mono whitespace-pre-wrap leading-tight max-h-[300px] overflow-y-auto w-full custom-scroll">{{ sysUpdateResult.output }}</pre>
              </div>
            </details>
          </div>
          
          <div v-if="sysError" class="mt-6 bg-red-50 text-red-600 p-4 border border-red-200 rounded-xl text-sm font-medium">
            {{ sysError }}
          </div>
        </div>

      </div>
    </div>

    <!-- Create/Edit/Pass/Delete Modals (Styling overlay) -->
    <!-- Create Dialog -->
    <v-dialog v-model="showCreate" max-width="440">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-bold text-lg text-slate-800">Thêm nhân sự mới</h3>
          <button @click="showCreate = false" class="text-slate-400 hover:text-slate-600"><v-icon>mdi-close</v-icon></button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Họ tên *</label><input v-model="form.fullName" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email liên hệ *</label><input v-model="form.email" type="email" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Mật khẩu *</label><input v-model="form.password" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Vai trò</label>
            <select v-model="form.role" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors cursor-pointer text-slate-700">
              <option value="member">Nhân viên thông thường</option>
              <option value="admin">Quản trị viên bộ phận</option>
            </select>
          </div>
          <p v-if="dialogError" class="text-red-500 text-sm font-medium">{{ dialogError }}</p>
        </div>
        <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button @click="showCreate = false" class="px-5 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Hủy</button>
          <button @click="handleCreate" :disabled="saving" class="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow hover:bg-emerald-500 transition-colors disabled:opacity-50">Lưu thông tin</button>
        </div>
      </div>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEdit" max-width="440">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-bold text-lg text-slate-800">Chỉnh sửa thông tin</h3>
          <button @click="showEdit = false" class="text-slate-400 hover:text-slate-600"><v-icon>mdi-close</v-icon></button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Họ tên</label><input v-model="form.fullName" type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Email</label><input v-model="form.email" type="email" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <div v-if="authStore.isOwner">
            <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Vai trò</label>
            <select v-model="form.role" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors cursor-pointer text-slate-700">
              <option value="member">Nhân viên thông thường</option>
              <option value="admin">Quản trị viên bộ phận</option>
              <option value="owner">Chủ sở hữu hệ thống (Owner)</option>
            </select>
          </div>
          <p v-if="dialogError" class="text-red-500 text-sm font-medium">{{ dialogError }}</p>
        </div>
        <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button @click="showEdit = false" class="px-5 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Hủy</button>
          <button @click="handleUpdate" :disabled="saving" class="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow hover:bg-emerald-500 transition-colors disabled:opacity-50">Cập nhật ngay</button>
        </div>
      </div>
    </v-dialog>

    <!-- Pass Dialog -->
    <v-dialog v-model="showPassword" max-width="400">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div class="p-6 border-b border-slate-100">
          <h3 class="font-bold text-lg text-slate-800">Đặt lại mật khẩu</h3>
          <p class="text-sm text-slate-500 mt-1">Cho tài khoản: <b>{{ selectedUser?.email }}</b></p>
        </div>
        <div class="p-6">
          <div><label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nhập Mật khẩu mới</label><input v-model="newPassword" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 transition-colors"></div>
          <p v-if="dialogError" class="text-red-500 text-sm font-medium mt-2">{{ dialogError }}</p>
        </div>
         <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button @click="showPassword = false" class="px-5 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Hủy</button>
          <button @click="handlePassword" :disabled="saving" class="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold shadow hover:bg-blue-500 transition-colors disabled:opacity-50">Xác nhận</button>
        </div>
      </div>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="showDelete" max-width="400">
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 text-center">
        <div class="p-6 pt-8">
          <div class="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><v-icon size="32">mdi-alert</v-icon></div>
          <h3 class="font-bold text-xl text-slate-800 mb-2">Vô hiệu hóa nhân sự?</h3>
          <p class="text-sm text-slate-500">Bạn có chắc chắn muốn vô hiệu hóa <b>{{ selectedUser?.fullName }}</b>? Người này sẽ không thể đăng nhập vào hệ thống nữa.</p>
        </div>
         <div class="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-center gap-3">
          <button @click="showDelete = false" class="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">Hủy</button>
          <button @click="handleDelete" :disabled="saving" class="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold shadow hover:bg-red-500 transition-colors disabled:opacity-50">Vô hiệu hóa</button>
        </div>
      </div>
    </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUsers, type OrgUser } from '@/composables/use-users';
import { useAuthStore } from '@/stores/auth';
import TeamManagement from '@/components/settings/TeamManagement.vue';
import OrgSettings from '@/components/settings/OrgSettings.vue';
import { useSystem } from '@/composables/use-system';

const { users, loading, error, fetchUsers, createUser, updateUser, resetPassword, deleteUser } = useUsers();
const authStore = useAuthStore();
const {
  version: systemVersion,
  loading: sysLoading,
  updating: sysUpdating,
  error: sysError,
  updateResult: sysUpdateResult,
  fetchVersion,
  updateSystem
} = useSystem();

const tab = ref('users');
const showCreate = ref(false);
const showEdit = ref(false);
const showPassword = ref(false);
const showDelete = ref(false);
const saving = ref(false);
const dialogError = ref('');
const newPassword = ref('');
const selectedUser = ref<OrgUser | null>(null);

const form = ref({ fullName: '', email: '', password: '', role: 'member' });

function roleClasses(role: string) {
  if (role === 'owner') return 'bg-purple-100 text-purple-700';
  if (role === 'admin') return 'bg-blue-100 text-blue-700';
  return 'bg-slate-100 text-slate-600';
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Chủ Hệ Thống';
  if (role === 'admin') return 'Quản trị viên';
  return 'Nhân viên';
}

function openCreate() {
  form.value = { fullName: '', email: '', password: '', role: 'member' };
  dialogError.value = '';
  showCreate.value = true;
}

function openEdit(user: OrgUser) {
  selectedUser.value = user;
  form.value = { fullName: user.fullName, email: user.email, password: '', role: user.role };
  dialogError.value = '';
  showEdit.value = true;
}

function openPassword(user: OrgUser) {
  selectedUser.value = user;
  newPassword.value = '';
  dialogError.value = '';
  showPassword.value = true;
}

function confirmDelete(user: OrgUser) {
  selectedUser.value = user;
  showDelete.value = true;
}

async function handleCreate() {
  saving.value = true;
  dialogError.value = '';
  const res = await createUser(form.value);
  saving.value = false;
  if (res.ok) { showCreate.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleUpdate() {
  if (!selectedUser.value) return;
  saving.value = true;
  dialogError.value = '';
  const res = await updateUser(selectedUser.value.id, { fullName: form.value.fullName, email: form.value.email, role: form.value.role });
  saving.value = false;
  if (res.ok) { showEdit.value = false; } else { dialogError.value = res.error || ''; }
}

async function handlePassword() {
  if (!selectedUser.value) return;
  saving.value = true;
  dialogError.value = '';
  const res = await resetPassword(selectedUser.value.id, newPassword.value);
  saving.value = false;
  if (res.ok) { showPassword.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleDelete() {
  if (!selectedUser.value) return;
  saving.value = true;
  const res = await deleteUser(selectedUser.value.id);
  saving.value = false;
  if (res.ok) { showDelete.value = false; }
}

async function handleSystemUpdate() {
  if (!confirm('Hệ thống sẽ kéo bản mới nhất từ Github và khởi động lại. Cần 1-2 phút hoàn thành! Chắc chắn kết tục?')) return;
  await updateSystem();
}

onMounted(() => {
  fetchUsers();
  fetchVersion();
});
</script>

<style scoped>
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
</style>
