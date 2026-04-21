# SenTot Backend

Backend API theo tài liệu `backend.txt` + `db.txt`.

## Yêu cầu

- Node.js 18+ (khuyến nghị 20+)
- PostgreSQL

## Cấu hình

Tạo file `.env` từ `.env.example` và chỉnh:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`

## Chạy lần đầu

```bash
npm i
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## URL

- Healthcheck: `GET /health`
- API base: `/api/v1`
- Swagger: `GET /api/v1/docs`

## Seed admin

Mặc định seed tạo admin:

- email: `admin@sentot.local`
- password: `Admin@123456`

Có thể override bằng ENV:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PHONE`
- `SEED_ADMIN_PASSWORD`

