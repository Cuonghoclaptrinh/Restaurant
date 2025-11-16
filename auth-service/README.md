# Auth Service

## API
- `POST /api/auth/register` → Đăng ký
- `POST /api/auth/login` → Đăng nhập
- `POST /api/auth/admin` → Tạo admin (cần JWT + role ADMIN)

## Chạy local
```bash
npm install
npx prisma migrate dev --name init
node seedAdmin.js
npm run dev