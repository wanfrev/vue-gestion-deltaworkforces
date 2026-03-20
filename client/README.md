# Frontend Nómina (Modo Local)

Este cliente ya incluye el flujo base de empleado con datos estáticos:

- Login UI (acepta cualquier correo + contraseña no vacíos)
- Dashboard con 4 recibos de pago mock
- Vista en pantalla del recibo
- Descarga PDF temporal con `window.print()`

## Ejecutar en local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Activar API real después (Railway)

En `src/App.vue` cambia:

```js
const USE_LOCAL_MOCK = true
```

a:

```js
const USE_LOCAL_MOCK = false
```

Con eso el frontend deja de usar `src/mockData.js` y empieza a consultar `GET /api/recibos`.
