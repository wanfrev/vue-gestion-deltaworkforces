<template>
  <ReciboDetalle :recibo="recibo" @back="$emit('back')" @print="$emit('print')" />
</template>

<script setup lang="ts">
import type { Recibo } from '../types/payroll'
import ReciboDetalle from './payroll/ReciboDetalle.vue'

defineProps<{
  recibo: Recibo
}>()

defineEmits<{
  back: []
  print: []
}>()
</script>
