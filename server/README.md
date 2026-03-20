# Backend Nómina (MVC)

Backend con Node.js + Express + Sequelize siguiendo patrón MVC.

## Estructura

```
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  index.js
```

## Variables de entorno

Define en `.env`:

```
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_db
JWT_SECRET=tu_secreto_jwt
TEMP_PASSWORD=password_temporal
COMPANY_CURRENCY=MXN
# Opcional: logo PNG/JPG en Base64 (sin o con prefijo data:image/...)
COMPANY_LOGO_BASE64=
```

## Endpoints

- `POST /api/login`
- `POST /api/admin/importar-nomina` (JWT admin)
- `GET /api/mis-recibos` (JWT)
- `GET /api/mis-recibos/:id/pdf` (JWT)
- `GET /api/recibos` (JWT, alias)
- `GET /api/recibos/:id/pdf` (JWT, alias)

### Importación de nómina

El endpoint `POST /api/admin/importar-nomina` acepta:

- `nominaData`: arreglo JSON de registros
- `csv`: texto CSV con encabezados (email, nombre, fecha/fecha_pago, totalNeto/total_neto/monto, periodo o periodo_inicio+periodo_fin)

## Ejecutar

```bash
npm install
npm run dev
```

## Nota de login

`authController` compara contraseña con `bcrypt` contra `users.password_hash`.
Para probar login necesitas tener usuarios creados con hash válido.