<script setup>
import { nextTick, ref } from 'vue'
import axios from 'axios'
import Dashboard from './components/Dashboard.vue'
import LoginView from './components/LoginView.vue'
import ReciboPlantilla from './components/ReciboPlantilla.vue'
import { recibosMock } from './mockData'

const USE_LOCAL_MOCK = true

const isLoggedIn = ref(false)
const recibos = ref([])
const reciboSeleccionado = ref(null)

const cargarRecibos = async () => {
  if (USE_LOCAL_MOCK) {
    recibos.value = recibosMock
    return
  }

  try {
    const { data } = await axios.get('/api/recibos')
    recibos.value = data
  } catch (error) {
    console.error('No se pudieron cargar los recibos desde la API.', error)
    recibos.value = []
  }
}

const manejarLogin = async () => {
  isLoggedIn.value = true
  await cargarRecibos()
}

const cerrarSesion = () => {
  isLoggedIn.value = false
  reciboSeleccionado.value = null
}

const verDetalle = (recibo) => {
  reciboSeleccionado.value = recibo
}

const volverDashboard = () => {
  reciboSeleccionado.value = null
}

const descargarUltimoPDF = () => {
  if (!recibos.value.length) {
    return
  }

  imprimirRecibo(recibos.value[0])
}

const imprimirRecibo = async (recibo = null) => {
  if (recibo) {
    reciboSeleccionado.value = recibo
    await nextTick()
  }
  window.print()
}
</script>

<template>
  <LoginView v-if="!isLoggedIn" @login="manejarLogin" />

  <ReciboPlantilla
    v-else-if="reciboSeleccionado"
    :recibo="reciboSeleccionado"
    @back="volverDashboard"
    @print="imprimirRecibo()"
  />

  <Dashboard
    v-else
    :recibos="recibos"
    @view-details="verDetalle"
    @download-pdf="imprimirRecibo"
    @download-latest="descargarUltimoPDF"
    @logout="cerrarSesion"
  />
</template>
