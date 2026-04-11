<script setup>
// ─── AdminBankingSettings ─────────────────────────────────────────────────────
// Admin sets up bank accounts shown to students on the payment page.

import { ref, onMounted }     from 'vue'
import { useBankingSettings } from '../../composables/useBankingSettings'
import { useToast }           from '../../composables/useToast'
import AppSpinner             from '../../components/ui/AppSpinner.vue'

const toast = useToast()
const { settings, loading, fetchAllSettings, addSetting, updateSetting, deleteSetting } = useBankingSettings()

const showForm   = ref(false)
const saving     = ref(false)
const confirmDel = ref(null) // id of account pending delete confirmation

const form = ref({
  bankName: '', accountNumber: '', accountName: '', isActive: true,
})

onMounted(() => fetchAllSettings())

function resetForm() {
  form.value = { bankName: '', accountNumber: '', accountName: '', isActive: true }
  showForm.value = false
}

async function handleAdd() {
  if (!form.value.bankName.trim() || !form.value.accountNumber.trim() || !form.value.accountName.trim()) {
    toast.error('Please fill in bank name, account number, and account name.')
    return
  }
  saving.value = true
  try {
    await addSetting({ ...form.value })
    await fetchAllSettings()
    toast.success('Bank account added.')
    resetForm()
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    saving.value = false
  }
}

async function toggleActive(setting) {
  try {
    await updateSetting(setting.id, { isActive: !setting.isActive })
    setting.isActive = !setting.isActive
    toast.success(setting.isActive ? 'Account activated.' : 'Account deactivated.')
  } catch {
    toast.error('Failed to update.')
  }
}

async function handleDelete(id) {
  try {
    await deleteSetting(id)
    await fetchAllSettings()
    confirmDel.value = null
    toast.success('Bank account removed.')
  } catch {
    toast.error('Failed to delete.')
  }
}
</script>

<template>
  <div class="animate-fade-in max-w-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-surface-900">Banking Settings</h1>
        <p class="text-xs text-surface-400 mt-0.5">Bank accounts shown to students on the payment page</p>
      </div>
      <button @click="showForm = !showForm" class="btn-primary text-sm">
        {{ showForm ? 'Cancel' : '+ Add Account' }}
      </button>
    </div>

    <!-- Add form -->
    <div v-if="showForm" class="card p-5 space-y-4 mb-6 border-2 border-primary-200 bg-primary-50/30">
      <h2 class="font-semibold text-surface-900 text-sm">New Bank Account</h2>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label">Bank Name <span class="text-red-500">*</span></label>
          <input v-model="form.bankName" type="text" class="input" placeholder="KBZ Bank" />
        </div>
        <div>
          <label class="label">Account Number <span class="text-red-500">*</span></label>
          <input v-model="form.accountNumber" type="text" class="input" placeholder="123456789" />
        </div>
      </div>

      <div>
        <label class="label">Account Name <span class="text-red-500">*</span></label>
        <input v-model="form.accountName" type="text" class="input" placeholder="SkillBridge Co., Ltd." />
      </div>

      <label class="flex items-center gap-3 cursor-pointer select-none">
        <div
          class="relative w-10 h-5 rounded-full transition-colors"
          :class="form.isActive ? 'bg-primary-600' : 'bg-surface-300'"
          @click="form.isActive = !form.isActive"
        >
          <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            :class="form.isActive ? 'translate-x-5' : 'translate-x-0'" />
        </div>
        <span class="text-sm font-medium text-surface-800">
          {{ form.isActive ? 'Active (visible to students)' : 'Inactive (hidden)' }}
        </span>
      </label>

      <div class="flex gap-3 pt-2">
        <button @click="handleAdd" :disabled="saving" class="btn-primary">
          <svg v-if="saving" class="w-4 h-4 animate-spin mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ saving ? 'Saving…' : 'Save Account' }}
        </button>
        <button @click="resetForm" class="btn-ghost">Cancel</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12"><AppSpinner /></div>

    <!-- Empty state -->
    <div v-else-if="settings.length === 0" class="card p-10 text-center text-surface-400">
      <p class="text-3xl mb-2">🏦</p>
      <p class="font-medium text-surface-600">No bank accounts configured yet.</p>
      <p class="text-sm mt-1">Click "Add Account" to set up your first payment method.</p>
    </div>

    <!-- Account list -->
    <div v-else class="space-y-4">
      <div v-for="setting in settings" :key="setting.id" class="card p-5">
        <div class="flex items-start gap-4">
          <!-- Info -->
          <div class="flex-1 space-y-1 min-w-0">
            <p class="font-bold text-surface-900">{{ setting.bankName }}</p>
            <p class="text-sm text-surface-600">
              <span class="text-surface-400 text-xs">Account No. </span>
              <span class="font-mono font-semibold">{{ setting.accountNumber }}</span>
            </p>
            <p class="text-sm text-surface-600">
              <span class="text-surface-400 text-xs">Name </span>{{ setting.accountName }}
            </p>
            <span
              class="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
              :class="setting.isActive ? 'bg-success-100 text-success-700' : 'bg-surface-100 text-surface-500'"
            >
              {{ setting.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 shrink-0">
            <button @click="toggleActive(setting)" class="btn-ghost text-xs border border-surface-200">
              {{ setting.isActive ? 'Deactivate' : 'Activate' }}
            </button>
            <button
              v-if="confirmDel !== setting.id"
              @click="confirmDel = setting.id"
              class="btn-ghost text-xs text-red-500 border border-red-200"
            >
              Delete
            </button>
            <template v-else>
              <button @click="handleDelete(setting.id)" class="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium">Confirm Delete</button>
              <button @click="confirmDel = null" class="text-xs text-surface-400">Cancel</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
