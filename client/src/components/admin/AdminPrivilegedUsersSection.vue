<template>
  <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-base font-semibold text-delta-text">Admins and Superadmins</h3>
        <p class="text-sm text-gray-600">Visible only for superadmin users.</p>
      </div>
      <span class="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {{ users.length }} users
      </span>
    </div>

    <div class="mt-4 rounded-xl border border-slate-200 bg-white">
      <div class="hidden grid-cols-[1.5fr_auto_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <p>User</p>
        <p>Role</p>
        <p class="text-right">{{ users.length }} user{{ users.length === 1 ? '' : 's' }}</p>
      </div>

      <div v-if="loading" class="p-4 text-sm text-slate-500">Loading users...</div>

      <div v-else-if="users.length" class="max-h-[400px] divide-y divide-slate-100 overflow-y-auto bg-white">
        <div
          v-for="user in users"
          :key="`privileged-user-${user.id}`"
          class="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_auto_auto] md:items-center"
        >
          <div>
            <p class="text-sm font-semibold text-slate-900">{{ user.username }}</p>
            <p class="text-xs text-slate-500">ID {{ user.id }}</p>
          </div>

          <span
            class="inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
            :class="user.role === 'superadmin' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'"
          >
            {{ user.role }}
          </span>

          <div class="flex justify-start md:justify-end">
            <button
              type="button"
              class="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="deletingUserId === user.id || !user.canDelete"
              @click="emit('delete-user', user)"
            >
              {{ deletingUserId === user.id ? 'Deleting...' : user.canDelete ? 'Delete' : 'Current user' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="p-4 text-sm text-slate-500">No admins or superadmins found.</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { PrivilegedUser } from '../../api/admin'

defineProps<{
  users: PrivilegedUser[]
  loading: boolean
  deletingUserId: number | null
}>()

const emit = defineEmits<{
  (event: 'delete-user', user: PrivilegedUser): void
}>()
</script>
