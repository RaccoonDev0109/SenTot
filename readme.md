# SenTot (Frontend)

Danh sách dưới đây tổng hợp **gần như toàn bộ chức năng hiện có trong code frontend** (kể cả phần mới dừng ở UI/mock và có thể chưa dùng được hoàn chỉnh).

## Ghi chú trạng thái

- **Done**: dùng được end-to-end trong phạm vi frontend + mock data/service.
- **Mock**: có service/dữ liệu giả lập (JSON + delay), không có backend/persistence thật.
- **UI-only**: chủ yếu là giao diện/điều hướng, chưa nối dữ liệu hoặc chưa có hành động nghiệp vụ thật.
- **Chưa khép kín**: có service hỗ trợ nhưng UI chưa có luồng đầy đủ (ví dụ edit/delete/cancel).

## Điều hướng & cấu trúc ứng dụng (Expo Router)

- **Root layout** (**Done**)
  - `Stack` cho các nhánh: `/(auth)`, `/(tabs)`, `+not-found`.
  - Bọc toàn app bằng `AuthProvider` (context auth).
- **Auth routes** (**Done/Mock**)
  - `/(auth)/login`: đăng nhập.
  - `/(auth)/register`: đăng ký.
- **Tab routes** (**Done**)
  - Tabs chính: `Home`, `Pets`, `Clinics`, `Chat`, `Profile`.
  - Có custom bottom tab + nút home trung tâm (UI).
- **Nested stacks theo module** (**Done**)
  - `pets`: `index`, `create`, `[id]`, `vaccination`.
  - `clinics`: `index`, `[id]`, `appointment`.
  - `profile`: `index`, `edit`, `appointments`, `notifications`, `settings`, `help`.
- **Not Found screen** (**Done**)
  - `+not-found` cho route không tồn tại.

## Xác thực & phiên đăng nhập

- **Auth context/hook** (**Done/Mock**)
  - `useAuth`: `user`, `isAuthenticated`, `isLoading`.
  - Actions: `login`, `register`, `logout`.
- **Auth service** (**Mock**)
  - `authService` kiểm tra thông tin từ `data/users.json`.
  - Giả lập delay mạng.
- **Login** (**Done/Mock**)
  - Validate input + hiển thị lỗi.
  - Thành công điều hướng vào `/(tabs)`.
- **Register** (**Done/Mock**)
  - Validate input + đăng ký (mock).
  - Thành công điều hướng về `login`.
- **Logout** (**Done/Mock**)
  - Xóa user khỏi context + điều hướng về `/(auth)/login`.
- **Guard route tự động** (**UI-only/Chưa khép kín**)
  - Điều hướng chủ yếu dựa vào `router.replace` ở màn hình, chưa thấy cơ chế auto-redirect toàn cục dựa trên `isAuthenticated` cho mọi route edge-case.

## Home (Dashboard)

- **Trang Home** (**Done/UI + Mock data**) 
  - Greeting theo giờ + avatar/user header.
  - Section hiển thị nhanh:
    - thú cưng (nhấn vào detail / nút thêm mới),
    - phòng khám gần bạn (list/card),
    - lịch hẹn sắp tới (card),
    - services grid, tips, promo, bài viết, hotline (nội dung demo).

## Pets (Thú cưng)

- **Danh sách thú cưng** (**Done/Mock**) 
  - `pets/index`: list + refresh + CTA thêm thú cưng.
- **Tạo hồ sơ thú cưng** (**Done/Mock**) 
  - `pets/create`: form tạo mới, gọi `petService.createPet`.
- **Chi tiết thú cưng** (**Done/UI + Mock**) 
  - `pets/[id]`: hiển thị chi tiết theo nhiều tab (hồ sơ/nhật ký/y tế…).
  - Có các khối UI như biểu đồ cân nặng, timeline vaccine, lịch sử khám (dữ liệu demo/hiển thị).
- **Thêm lịch tiêm vaccine** (**Done/Mock**) 
  - `pets/vaccination`: chọn pet, vaccine, ngày, ghi chú; gọi `petService.createVaccination`.
- **Sửa/Xóa thú cưng** (**Chưa khép kín**) 
  - `petService` có `update`/`delete` nhưng UI chưa thấy flow edit/delete rõ ràng.

## Clinics (Phòng khám) & Appointments (Lịch hẹn)

- **Danh sách phòng khám** (**Done/Mock**) 
  - `clinics/index`: list phòng khám.
  - Tìm kiếm theo tên/địa chỉ/dịch vụ (UI + filter).
  - Lọc category (UI).
- **Chi tiết phòng khám** (**Done/UI + Mock**) 
  - `clinics/[id]`: thông tin, dịch vụ, cơ sở vật chất, gallery, review demo.
  - CTA đặt lịch / gọi điện (UI).
- **Đặt lịch hẹn** (**Done/Mock**) 
  - `clinics/appointment`: chọn pet, chọn clinic (nếu có), ngày/giờ, ghi chú.
  - Gọi `clinicService.createAppointment`.
- **Xem lịch hẹn trong Profile** (**Done/UI-only**) 
  - `profile/appointments`: hiển thị upcoming/past, hiện dùng dữ liệu mảng cục bộ trong file (không lấy từ service).
- **Hủy/đổi lịch hẹn** (**Chưa khép kín**) 
  - `clinicService` có hủy appointment nhưng UI chưa thấy luồng hủy/đổi lịch nối service thật.

## Chat (Trợ lý)

- **Chat 1-1** (**Done/Mock**) 
  - `chat`: gửi/nhận tin nhắn, cuộn danh sách tin nhắn.
  - Quick questions (gợi ý câu hỏi).
  - Typing indicator (giả lập đang gõ).
- **Chat service** (**Mock**) 
  - `chatService` trả lời theo keyword/intent từ `data/chatResponses.json`.

## Profile (Cá nhân)

- **Trang profile chính** (**Done/Mock**) 
  - Hiển thị thông tin user + stats (UI).
  - Menu điều hướng đến các màn con.
  - Logout.
- **Chỉnh sửa hồ sơ** (**Done/UI-only**) 
  - `profile/edit`: form edit (chủ yếu UI, chưa thấy lưu/persist ra data thật).
- **Thông báo** (**Done/UI-only**) 
  - `profile/notifications`: list thông báo, mark as read / mark all.
- **Cài đặt** (**Done/UI-only**) 
  - `profile/settings`: các toggle + action item (alert mô phỏng).
- **Trợ giúp/FAQ** (**Done/UI-only**) 
  - `profile/help`: FAQ expand/collapse + contact support (UI).

## Thành phần UI tái sử dụng (Design System mini)

- **UI kit** (**Done**) 
  - `components/ui`: `Button`, `Input`, `Card`, `Badge`, `Avatar`, `AnimatedPress`, `AnimatedSegmentedControl`.
- **Component theo domain** (**Done**) 
  - `PetCard`, `ClinicCard`, `ChatBubble`.
- **Theme/Colors** (**Done**) 
  - `constants/Colors.ts`, `constants/Theme.ts` (spacing, radius, typography, shadow, semantic colors).
- **Mapping ảnh thú cưng** (**Done**) 
  - `constants/PetImages.ts` + `assets/images/pets/*`.

## Dữ liệu & service layer (Mock data)

- **Data JSON** (**Mock**) 
  - `data/`: `users`, `pets`, `clinics`, `appointments`, `vaccinations`, `chatResponses`.
- **Service layer** (**Mock**) 
  - `services/`: `authService`, `petService`, `clinicService`, `chatService`.
  - Giả lập async/delay; thao tác create/update/delete thường chỉ tác động dữ liệu runtime (không lưu bền vững).
- **TypeScript types** (**Done**) 
  - `types/index.ts`: `User`, `Pet`, `Clinic`, `Appointment`, `Vaccination`, `ChatMessage`, ...

## Assets

- **Ảnh & banner** (**Done**) 
  - Ảnh pet, banner pet id, icon pin map, v.v.

## Các giới hạn hiện tại (tổng hợp nhanh)

- **Không có backend thật**: đa số tính năng dùng **mock JSON/service** → reload app có thể mất dữ liệu tạo mới.
- **Một số luồng chưa khép kín**: edit/delete pet, cancel/reschedule appointment (service có thể có nhưng UI chưa có flow hoàn chỉnh).
- **Một số màn dùng dữ liệu hardcode**: ví dụ danh sách appointments trong profile, review/facility nội dung demo.

---

## Tài liệu định hướng Backend (cho Website) dựa trên chức năng hiện có

### 1) Phạm vi: làm Backend cho Website (chưa cần App)

- **Mục tiêu**: xây dựng backend (API + database + admin ops) để phục vụ **phiên bản website** của dự án, dựa trên các module đã có ở frontend: Auth, Pets, Clinics, Appointments, Profile, Notifications, Settings, Help/FAQ, Content.
- **Không làm (trong scope này)**: các chức năng **AI** (chat bot/AI assistant) và các luồng realtime/phức tạp nếu chưa cần.
- **Nguyên tắc**: những phần frontend đang là mock/local JSON sẽ được chuyển thành dữ liệu bền vững (DB), có phân quyền, audit log cơ bản, và chuẩn hóa nghiệp vụ đặt lịch.

### 2) Entity tham gia (gần như toàn bộ)

> Danh sách dưới đây ưu tiên bám sát những gì đã xuất hiện trong UI/service/mock data, đồng thời bổ sung một số entity “backend bắt buộc có” để vận hành ổn định.

- **Identity & Access**
  - `User`
  - `Role` (ví dụ: `customer`, `clinic_staff`, `admin`) *(backend cần)*
  - `Session` / `RefreshToken` (nếu dùng JWT refresh) *(backend cần)*
  - `PasswordResetToken` / `EmailVerificationToken` *(backend cần)*
- **Pets**
  - `Pet`
  - `PetSpecies` / `PetBreed` *(tuỳ chọn, nếu muốn danh mục chuẩn)*
  - `PetWeightRecord` *(phục vụ biểu đồ cân nặng)*
  - `MedicalRecord` *(khám/điều trị, đơn thuốc, ghi chú… nếu có)*
  - `Vaccination` / `VaccinationRecord`
  - `VaccineType` *(danh mục loại vaccine)*
- **Clinics**
  - `Clinic`
  - `ClinicService` *(danh mục dịch vụ của phòng khám)*
  - `ClinicFacility` *(cơ sở vật chất)*
  - `ClinicGalleryImage` *(ảnh gallery)*
  - `ClinicReview` *(đánh giá/nhận xét)*
  - `ClinicSchedule` / `WorkingHours` *(giờ làm việc)*
  - `ClinicStaff` *(nhân sự phòng khám, gắn với user nếu cần)*
- **Appointments**
  - `Appointment`
  - `AppointmentStatus` (ví dụ: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`)
  - `AppointmentNote` *(ghi chú của khách/clinic)*
- **Notifications & Settings**
  - `Notification`
  - `UserNotificationState` (read/unread) *(nếu tách bảng)*
  - `UserSetting` *(các toggle settings)*
- **Help/FAQ & Content (đang là UI demo)**
  - `FaqItem`
  - `SupportTicket` / `ContactRequest` *(nếu có “liên hệ hỗ trợ” dạng form)*
  - `ContentArticle` *(tips/bài viết)*
  - `Promotion` *(promo/ưu đãi)*
  - `ServiceCategory` *(nhóm dịch vụ/filter UI)*
- **Hệ thống**
  - `FileAsset` *(upload avatar/pet photo/clinic gallery)*
  - `AuditLog` *(ghi lại hành động quan trọng)*

### 3) Actor tham gia

- **Guest (Khách vãng lai)**: truy cập nội dung công khai (clinics list/detail, bài viết/promo), đăng ký/đăng nhập.
- **Customer / Pet Owner (Người dùng đã đăng nhập)**: quản lý thú cưng, đặt lịch, xem lịch hẹn, nhận thông báo, cập nhật hồ sơ, cài đặt.
- **Clinic Staff (Nhân viên phòng khám)**: quản lý thông tin phòng khám (dịch vụ/ảnh/giờ làm), xử lý lịch hẹn (xác nhận/đổi/hủy), phản hồi ticket (nếu có).
- **Admin (Quản trị hệ thống)**: quản lý user/role, duyệt/khóa clinic, quản trị nội dung (FAQ/articles/promo), cấu hình danh mục.
- **System (Hệ thống)**: gửi thông báo, nhắc lịch, chạy job định kỳ (cron), ghi audit log.

### 4) Chức năng Backend cần làm (loại trừ AI)

#### 4.1 Auth & User

- **Đăng ký**: tạo user, hash password, validate unique email/phone, verify email (tuỳ chọn).
- **Đăng nhập/đăng xuất**: session/JWT, refresh token (tuỳ kiến trúc).
- **Quên mật khẩu/đặt lại mật khẩu**.
- **Quản lý hồ sơ người dùng**: xem/sửa profile, đổi mật khẩu.
- **Phân quyền (RBAC)**: customer/clinic_staff/admin + middleware authorize.
- **Quản lý user (admin)**: list/search, khóa/mở, gán role.

#### 4.2 Pets

- **CRUD thú cưng**: tạo/sửa/xóa/xem danh sách/xem chi tiết.
- **Upload ảnh thú cưng** (tuỳ chọn, nhưng website thường cần).
- **Theo dõi cân nặng**: CRUD `PetWeightRecord` (để vẽ chart).
- **Hồ sơ y tế** (tuỳ chọn theo roadmap):
  - CRUD medical record/visit history (để thay phần UI demo thành dữ liệu thật).
- **Tiêm phòng**
  - CRUD vaccination record.
  - Danh mục vaccine type.
  - Nhắc lịch tiêm (notification job).

#### 4.3 Clinics (Directory)

- **Danh bạ phòng khám**
  - List + pagination.
  - Search theo tên/địa chỉ/dịch vụ.
  - Filter theo category/dịch vụ.
  - Detail clinic: thông tin, dịch vụ, cơ sở vật chất, gallery, đánh giá.
- **Quản lý phòng khám (clinic_staff/admin)**
  - CRUD clinic info, working hours, services, facilities.
  - Upload gallery images.
  - Quản lý staff (gắn user vào clinic).
- **Reviews**
  - Customer tạo review sau khi có appointment completed (rule backend).
  - Clinic/Admin quản lý phản hồi/ẩn review (tuỳ chính sách).

#### 4.4 Appointments (Đặt lịch)

- **Tạo lịch hẹn**: chọn pet + clinic + timeslot + ghi chú.
- **Quy tắc timeslot/giờ làm việc**
  - Validate slot theo working hours.
  - Chống trùng lịch (lock/transaction).
- **Xem lịch hẹn**
  - Customer: lịch của mình (upcoming/past).
  - Clinic staff: lịch của clinic, filter theo ngày/trạng thái.
- **Cập nhật trạng thái**
  - Confirm / reschedule / cancel / complete / no_show.
  - Lưu lý do hủy/đổi lịch.
- **Nhắc lịch**
  - Gửi notification/email trước giờ hẹn (cron).

#### 4.5 Notifications

- **Tạo và gửi thông báo**
  - In-app notifications (DB).
  - (Tuỳ chọn) email/SMS/push (nếu có hạ tầng).
- **Đọc/đánh dấu đã đọc**
  - Mark read từng cái / mark all.
- **Luồng trigger**
  - Appointment created/confirmed/cancelled, vaccine due, promo mới, v.v.

#### 4.6 Settings

- **Lưu/đọc cài đặt người dùng**
  - Các toggle tương tự UI settings.
- **Cài đặt thông báo**
  - Opt-in/out theo kênh (in-app/email/SMS).

#### 4.7 Help/FAQ & Support

- **FAQ**
  - Public API để lấy danh sách FAQ.
  - Admin CRUD FAQ item.
- **Contact/Support ticket (đề xuất làm thật)**
  - Customer gửi yêu cầu hỗ trợ.
  - Admin/clinic staff xử lý, gán người phụ trách, trạng thái ticket.

#### 4.8 Content (Tips/Articles/Promotions)

- **Bài viết / tips**
  - Public list/detail, phân loại/tag.
  - Admin CRUD + lịch publish.
- **Promotion**
  - Public list/detail promo, điều kiện áp dụng.
  - Admin CRUD.
- **Service categories**
  - Danh mục để filter/search (đồng bộ UI).

#### 4.9 Tính năng kỹ thuật “backend cần có”

- **Upload/Quản lý file**: avatar user, ảnh pet, ảnh clinic (storage local/S3).
- **Validation & Error handling chuẩn**: schema validation, error codes.
- **Logging/Audit log**: hành động nhạy cảm (login, đổi role, hủy lịch, v.v.).
- **Rate limit**: chống spam login/register/contact.
- **API docs**: OpenAPI/Swagger.
- **Seed dữ liệu**: import từ các file JSON hiện có để bootstrap DB.

---

## Đề xuất thêm tính năng thú vị để thu hút khách hàng (Website)

- **Đặt lịch theo “khung giờ trống” (real availability)**: hiển thị calendar slots theo clinic + tự chặn trùng lịch → trải nghiệm đặt lịch giống các nền tảng lớn.
- **Nhắc lịch thông minh** (không AI): vaccine/appointment reminders qua email + in-app + lịch cá nhân (ICS/Google Calendar link).
- **Sổ sức khỏe thú cưng (Pet Health Passport)**: lưu hồ sơ tiêm phòng/khám bệnh, xuất PDF khi cần (đi khám/đi du lịch).
- **Ưu đãi theo thành viên (Loyalty)**: tích điểm theo số lần đặt lịch, đổi voucher/giảm giá dịch vụ.
- **So sánh phòng khám**: so sánh theo dịch vụ, giá tham khảo, rating, khoảng cách (nếu có location), giờ mở cửa.
- **Hồ sơ phòng khám “verified”**: xác minh giấy phép/địa chỉ → tăng độ tin cậy, thu hút khách.
- **Chương trình “Gói chăm sóc định kỳ”**: gói vaccine/khám tổng quát theo tháng/quý, tự nhắc lịch và theo dõi tiến độ.

---

## Backend (Website) — Tổng kết triển khai thực tế

Phần dưới đây mô tả **những gì đã được code thật** trong thư mục backend này (API + DB + Auth), dựa trên tài liệu thiết kế `backend.txt` và `db.txt`.

### Ngôn ngữ & công nghệ đã dùng

- **Ngôn ngữ**: **TypeScript** (Node.js)
- **Framework**: **Express**
- **Database**: **PostgreSQL**
- **ORM/Migrations**: **Prisma** (schema + migrate + seed)
- **Auth**: **JWT access token** + **JWT refresh token** (rotation + revoke)
- **Validation**: **Zod**
- **Security/ops**: `helmet`, `cors`, `express-rate-limit`
- **Logging**: `pino` + `pino-http` (có `x-request-id`)
- **API Docs**: Swagger UI (`/api/v1/docs`) *(hiện mới là khung; có thể bổ sung OpenAPI chi tiết sau)*

### Những gì đã làm (theo module)

- **Database schema**: đã dựng `prisma/schema.prisma` theo `db.txt` (Identity, Pets, Vaccinations, Clinics, Appointments, Notifications, Settings, FAQ/Content, File assets, Audit log…).
- **Seed dữ liệu**: `prisma/seed.ts`
  - Seed roles: `customer`, `clinic_staff`, `admin`
  - Tạo **admin mặc định** và **1 clinic mẫu**
- **Error format thống nhất**: mọi lỗi trả về 1 format:
  - `code` (string), `message` (string), `details` (optional), `requestId` (optional)
- **RBAC/Ownership**:
  - Có middleware `requireAuth`, `requireRole`
  - Pets/Vaccinations enforce ownership (ownerId)
  - Clinic management enforce staff/admin
- **Appointments “vững” mức tối thiểu**:
  - Chống trùng slot bằng unique `(clinic_id, date_time)`
  - State transitions + audit log + notification triggers

### Cấu trúc thư mục code (đã tạo)

- `src/server.ts`: chạy HTTP server
- `src/app.ts`: cấu hình Express (cors/helmet/rate-limit/logging/routes/error handler)
- `src/routes/v1/*`: routes `/api/v1`
- `src/services/*`: business logic
- `src/middlewares/*`: auth/rbac/validate/error
- `src/db/prisma.ts`: Prisma client
- `prisma/schema.prisma`, `prisma/seed.ts`

### Cấu hình môi trường (ENV)

Tạo `.env` từ `.env.example` và chỉnh các biến:

- **Bắt buộc**:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Khuyến nghị**:
  - `CORS_ORIGIN` (domain website)
  - `PORT`

Seed admin có thể override:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PHONE`
- `SEED_ADMIN_PASSWORD`

### Cách vận hành (run) chi tiết

#### 1) Cài dependencies

```bash
npm i
```

#### 2) Tạo DB + migrate

Bạn cần PostgreSQL đang chạy và `DATABASE_URL` đúng.

```bash
npx prisma migrate dev --name init
```

#### 3) Seed dữ liệu

```bash
npm run db:seed
```

#### 4) Chạy dev

```bash
npm run dev
```

Kiểm tra:

- `GET /health` → `{ "ok": true }`
- `GET /api/v1` → `{ name, version }`

#### 5) Build & chạy production (cơ bản)

```bash
npm run build
npm start
```

### Danh sách endpoint đã có (đúng spec tối thiểu)

Base URL: `/api/v1`  
Auth header: `Authorization: Bearer <accessToken>`

#### Auth & User

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `PATCH /me`
- `PATCH /me/password`

#### Pets & Vaccinations

- `GET /pets`
- `POST /pets`
- `GET /pets/:id`
- `PATCH /pets/:id`
- `DELETE /pets/:id`
- `GET /pets/:petId/vaccinations`
- `POST /pets/:petId/vaccinations`
- `PATCH /vaccinations/:id`
- `DELETE /vaccinations/:id`

#### Clinics

- Public:
  - `GET /clinics` (pagination + search)
  - `GET /clinics/:id`
  - `GET /clinics/:id/services`
- Staff/Admin:
  - `PATCH /clinics/:id`
  - `POST /clinics/:id/services`
  - `DELETE /clinics/:id/services/:serviceId`
  - `GET /clinics/:id/working-hours`
  - `PUT /clinics/:id/working-hours`
  - `GET /clinics/:clinicId/appointments`

#### Appointments

- `POST /appointments`
- `GET /appointments` (customer scope)
- `PATCH /appointments/:id/status` (confirm|cancel|reschedule|complete|no_show)

#### Notifications

- `GET /notifications`
- `POST /notifications/mark-all-read`
- `POST /notifications/:id/read`

#### Admin (RBAC: admin)

- `GET /admin/users`
- `PATCH /admin/users/:id/status`
- `PUT /admin/users/:id/roles`

### Cách test (manual) toàn bộ chức năng đang có

Các lệnh dưới đây dùng `curl`. Nếu bạn dùng Windows PowerShell, có thể cần chạy trong Git Bash (đang ok với project này).

#### 0) Set biến tiện dụng

```bash
BASE_URL="http://localhost:4000/api/v1"
```

#### 1) Register

```bash
curl -sS -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test1@example.com","phone":"0900000001","password":"Test@123456"}'
```

#### 2) Login → lấy accessToken/refreshToken

```bash
TOKENS=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","password":"Test@123456"}')
echo "$TOKENS"
ACCESS_TOKEN=$(TOKENS="$TOKENS" node -p 'JSON.parse(process.env.TOKENS).accessToken')
REFRESH_TOKEN=$(TOKENS="$TOKENS" node -p 'JSON.parse(process.env.TOKENS).refreshToken')
```

#### 3) Me (get/update/change password)

```bash
curl -sS "$BASE_URL/me" -H "Authorization: Bearer $ACCESS_TOKEN"

curl -sS -X PATCH "$BASE_URL/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"fullName":"Test User Updated"}'

curl -sS -X PATCH "$BASE_URL/me/password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"currentPassword":"Test@123456","newPassword":"Test@654321"}'
```

#### 4) Pets CRUD

```bash
PET=$(curl -sS -X POST "$BASE_URL/pets" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Milo","species":"dog","breed":"Mixed","gender":"male","birthDate":"2023-01-01","weightKg":5.2}')
echo "$PET"
PET_ID=$(PET="$PET" node -p 'JSON.parse(process.env.PET).pet.id')

curl -sS "$BASE_URL/pets" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -sS "$BASE_URL/pets/$PET_ID" -H "Authorization: Bearer $ACCESS_TOKEN"

curl -sS -X PATCH "$BASE_URL/pets/$PET_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"weightKg":5.7}'
```

#### 5) Vaccinations CRUD

```bash
VACC=$(curl -sS -X POST "$BASE_URL/pets/$PET_ID/vaccinations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"vaccineName":"Rabies","date":"2030-01-01","nextDueDate":"2031-01-01","notes":"first shot"}')
echo "$VACC"
VACC_ID=$(VACC="$VACC" node -p 'JSON.parse(process.env.VACC).vaccination.id')

curl -sS "$BASE_URL/pets/$PET_ID/vaccinations" -H "Authorization: Bearer $ACCESS_TOKEN"

curl -sS -X PATCH "$BASE_URL/vaccinations/$VACC_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"notes":"updated"}'
```

#### 6) Clinics (public list/detail/services)

```bash
curl -sS "$BASE_URL/clinics?page=1&pageSize=10"
```

Seed có tạo 1 clinic mẫu. Lấy clinicId từ response rồi test:

```bash
CLINICS=$(curl -sS "$BASE_URL/clinics?page=1&pageSize=10")
CLINIC_ID=$(CLINICS="$CLINICS" node -p 'JSON.parse(process.env.CLINICS).items[0].id')

curl -sS "$BASE_URL/clinics/$CLINIC_ID"
curl -sS "$BASE_URL/clinics/$CLINIC_ID/services"
```

#### 7) Create appointment + chống trùng slot

```bash
APPT=$(curl -sS -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "{\"petId\":\"$PET_ID\",\"clinicId\":\"$CLINIC_ID\",\"dateTime\":\"2030-01-01T10:00:00.000Z\",\"notes\":\"demo\"}")
echo "$APPT"
APPT_ID=$(APPT="$APPT" node -p 'JSON.parse(process.env.APPT).appointment.id')

curl -sS "$BASE_URL/appointments?filter=upcoming" -H "Authorization: Bearer $ACCESS_TOKEN"
```

Thử tạo **trùng slot** (kỳ vọng 409):

```bash
curl -sS -X POST "$BASE_URL/appointments" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "{\"petId\":\"$PET_ID\",\"clinicId\":\"$CLINIC_ID\",\"dateTime\":\"2030-01-01T10:00:00.000Z\"}"
```

#### 8) Appointment status transitions

Customer có thể `cancel` (nếu còn upcoming):

```bash
curl -sS -X PATCH "$BASE_URL/appointments/$APPT_ID/status" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"cancel","reason":"change plan"}'
```

Các action `confirm/reschedule/complete/no_show` cần **clinic_staff/admin**.

#### 9) Notifications

```bash
curl -sS "$BASE_URL/notifications?page=1&pageSize=20" -H "Authorization: Bearer $ACCESS_TOKEN"
curl -sS -X POST "$BASE_URL/notifications/mark-all-read" -H "Authorization: Bearer $ACCESS_TOKEN" -i
```

#### 10) Admin (list users, lock, set roles)

Login admin (mặc định seed):

```bash
ADMIN=$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sentot.local","password":"Admin@123456"}')
ADMIN_TOKEN=$(ADMIN="$ADMIN" node -p 'JSON.parse(process.env.ADMIN).accessToken')

curl -sS "$BASE_URL/admin/users?page=1&pageSize=20" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Lock user:

```bash
USER_ID=$(curl -sS "$BASE_URL/admin/users?page=1&pageSize=1" -H "Authorization: Bearer $ADMIN_TOKEN" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).items[0].id' 2>/dev/null)
curl -sS -X PATCH "$BASE_URL/admin/users/$USER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"locked"}'
```

> Lưu ý: nếu bạn không dùng được pipe + `node` như trên, hãy lấy `userId` thủ công từ `GET /admin/users`.

---

## Test bằng Postman (khuyến nghị) — Bộ testcase đầy đủ

Mục tiêu: bạn chỉ cần bấm Send theo đúng thứ tự, Postman sẽ tự lưu `accessToken` và các `id` cần thiết vào Environment để test toàn bộ API.

### 0) Chuẩn bị (bắt buộc)

- Bạn đã chạy server bằng `npm run dev`
- API mặc định: `http://localhost:4000`
- Base API: `http://localhost:4000/api/v1`

### 1) Tạo Environment trong Postman

Postman → **Environments** → **Create Environment** đặt tên `SenTot Local` và tạo variables:

- **`baseUrl`**: `http://localhost:4000/api/v1`
- **`accessToken`**: *(để trống)*
- **`refreshToken`**: *(để trống)*
- **`petId`**: *(để trống)*
- **`clinicId`**: *(để trống)*
- **`appointmentId`**: *(để trống)*
- **`vaccinationId`**: *(để trống)*
- **`userIdToLock`**: *(để trống)*

Nhớ chọn Environment `SenTot Local` ở góc phải Postman trước khi test.

### 2) Tạo Collection và set Authorization mặc định

1. Tạo **Collection** tên `SenTot API`
2. Vào Collection → tab **Authorization**
   - Type: **Bearer Token**
   - Token: `{{accessToken}}`

Từ giờ các request trong collection sẽ tự gắn header:

- `Authorization: Bearer {{accessToken}}`

> Riêng `login/register/refresh/logout` thì không cần token.

### 3) Quy ước body trong Postman

Trong mỗi request:

- Tab **Body** → chọn **raw** → chọn **JSON**
- Header `Content-Type: application/json` Postman thường tự thêm, nếu thiếu thì bạn thêm thủ công.

---

## A) Testcases — Customer flow (end-to-end)

### TC-A1 — Register customer

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/register`
- **Body**:

```json
{
  "fullName": "Test User",
  "email": "test1@example.com",
  "phone": "0900000001",
  "password": "Test@123456"
}
```

- **Expected**: `201 Created` và response có `user`

> Nếu báo `409 CONFLICT` thì email/phone đã tồn tại → đổi email/phone.

### TC-A2 — Login customer (lưu token tự động)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`
- **Body**:

```json
{
  "email": "test1@example.com",
  "password": "Test@123456"
}
```

- **Expected**: `200 OK`, có `accessToken`, `refreshToken`
- Tab **Tests** (dán để auto-save token):

```javascript
const json = pm.response.json();
pm.environment.set("accessToken", json.accessToken);
pm.environment.set("refreshToken", json.refreshToken);
```

### TC-A3 — Get profile

- **Method**: `GET`
- **URL**: `{{baseUrl}}/me`
- **Expected**: `200 OK` (token đã tự gắn từ Collection)

### TC-A4 — Update profile

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/me`
- **Body**:

```json
{
  "fullName": "Test User Updated"
}
```

- **Expected**: `200 OK`

### TC-A5 — Create pet (lưu `petId`)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/pets`
- **Body**:

```json
{
  "name": "Milo",
  "species": "dog",
  "breed": "Mixed",
  "gender": "male",
  "birthDate": "2023-01-01",
  "weightKg": 5.2
}
```

- **Expected**: `201 Created` + `pet.id`
- **Tests**:

```javascript
const json = pm.response.json();
pm.environment.set("petId", json.pet.id);
```

### TC-A6 — List pets

- **Method**: `GET`
- **URL**: `{{baseUrl}}/pets`
- **Expected**: `200 OK`, có `items`

### TC-A7 — Get pet by id

- **Method**: `GET`
- **URL**: `{{baseUrl}}/pets/{{petId}}`
- **Expected**: `200 OK`

### TC-A8 — Update pet

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/pets/{{petId}}`
- **Body**:

```json
{
  "weightKg": 5.7
}
```

- **Expected**: `200 OK`

### TC-A9 — Create vaccination (lưu `vaccinationId`)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/pets/{{petId}}/vaccinations`
- **Body**:

```json
{
  "vaccineName": "Rabies",
  "date": "2030-01-01",
  "nextDueDate": "2031-01-01",
  "notes": "first shot"
}
```

- **Expected**: `201 Created` + `vaccination.id`
- **Tests**:

```javascript
const json = pm.response.json();
pm.environment.set("vaccinationId", json.vaccination.id);
```

### TC-A10 — List vaccinations of pet

- **Method**: `GET`
- **URL**: `{{baseUrl}}/pets/{{petId}}/vaccinations`
- **Expected**: `200 OK`

### TC-A11 — Update vaccination

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/vaccinations/{{vaccinationId}}`
- **Body**:

```json
{
  "notes": "updated"
}
```

- **Expected**: `200 OK`

### TC-A12 — List clinics (public) (lưu `clinicId`)

- **Method**: `GET`
- **URL**: `{{baseUrl}}/clinics?page=1&pageSize=10`
- **Expected**: `200 OK`, có `items`
- **Tests** (lấy clinic đầu tiên từ seed):

```javascript
const json = pm.response.json();
pm.environment.set("clinicId", json.items[0].id);
```

> Lưu ý: `clinicId` phải là UUID hợp lệ (v1-v5). Nếu bạn thấy id dạng `00000000-0000-0000-0000-...` thì hãy chạy lại seed để lấy clinic seed mới.

### TC-A13 — Clinic detail + services

- `GET {{baseUrl}}/clinics/{{clinicId}}`
- `GET {{baseUrl}}/clinics/{{clinicId}}/services`

### TC-A14 — Create appointment (lưu `appointmentId`)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/appointments`
- **Body**:

```json
{
  "petId": "{{petId}}",
  "clinicId": "{{clinicId}}",
  "dateTime": "2030-01-01T10:00:00.000Z",
  "notes": "demo"
}
```

- **Expected**: `201 Created`
- **Tests**:

```javascript
const json = pm.response.json();
pm.environment.set("appointmentId", json.appointment.id);
```

### TC-A15 — Anti double-booking (trùng slot phải fail)

Gửi lại **y hệt** TC-A14 một lần nữa.

- **Expected**: `409` và message kiểu “Timeslot already booked”

### TC-A16 — List my appointments

- `GET {{baseUrl}}/appointments?filter=upcoming`
- `GET {{baseUrl}}/appointments?filter=past`

### TC-A17 — Customer cancel appointment

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/appointments/{{appointmentId}}/status`
- **Body**:

```json
{
  "action": "cancel",
  "reason": "change plan"
}
```

- **Expected**: `200 OK`

### TC-A18 — Notifications (sau khi tạo/hủy lịch sẽ có)

- `GET {{baseUrl}}/notifications?page=1&pageSize=20`
- `POST {{baseUrl}}/notifications/mark-all-read` → expected `204`

### TC-A19 — Refresh token (rotation)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/refresh`
- **Body**:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

- **Lưu ý quan trọng**:
  - Body phải là JSON hợp lệ (không thừa dấu `"`).
  - Trong Postman nhớ chọn **Body → raw → JSON**.

- **Expected**: `200 OK` và trả về `accessToken` + `refreshToken` mới
- **Tests** (cập nhật token mới):

```javascript
const json = pm.response.json();
pm.environment.set("accessToken", json.accessToken);
pm.environment.set("refreshToken", json.refreshToken);
```

### TC-A20 — Logout (revoke refresh token)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/logout`
- **Body**:

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

- **Expected**: `204 No Content`

---

## B) Testcases — Admin flow (quản trị)

Vì các API quản trị/phòng khám nâng cao cần quyền, bạn login admin seed để test phần còn lại.

### TC-B1 — Login admin (seed)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/auth/login`
- **Body**:

```json
{
  "email": "admin@sentot.local",
  "password": "Admin@123456"
}
```

- **Tests** (ghi đè token trong environment để gọi admin APIs):

```javascript
const json = pm.response.json();
pm.environment.set("accessToken", json.accessToken);
pm.environment.set("refreshToken", json.refreshToken);
```

### TC-B2 — Admin list users (lưu 1 userId bất kỳ để lock)

- **Method**: `GET`
- **URL**: `{{baseUrl}}/admin/users?page=1&pageSize=20`
- **Expected**: `200 OK`
- **Tests**:

```javascript
const json = pm.response.json();
pm.environment.set("userIdToLock", json.items[0].id);
```

### TC-B3 — Lock user

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/admin/users/{{userIdToLock}}/status`
- **Body**:

```json
{
  "status": "locked"
}
```

- **Expected**: `204 No Content`

### TC-B4 — Set roles user

- **Method**: `PUT`
- **URL**: `{{baseUrl}}/admin/users/{{userIdToLock}}/roles`
- **Body**:

```json
{
  "roles": ["customer"]
}
```

- **Expected**: `204 No Content`

---

## C) Testcases — Clinic management (dùng admin để test “staff/admin” endpoints)

Admin có thể gọi các endpoint staff/admin để test đầy đủ module clinic.

### TC-C1 — Update clinic info (admin)

- **Method**: `PATCH`
- **URL**: `{{baseUrl}}/clinics/{{clinicId}}`
- **Body**:

```json
{
  "openHoursText": "08:00 - 20:00"
}
```

- **Expected**: `200 OK`

### TC-C2 — Add clinic service (admin)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/clinics/{{clinicId}}/services`
- **Body**:

```json
{
  "name": "Xét nghiệm"
}
```

- **Expected**: `201 Created`

### TC-C3 — Put working hours (admin)

- **Method**: `PUT`
- **URL**: `{{baseUrl}}/clinics/{{clinicId}}/working-hours`
- **Body** (ví dụ mở cả tuần 08:00-20:00):

```json
{
  "items": [
    { "dayOfWeek": 0, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 1, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 2, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 3, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 4, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 5, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" },
    { "dayOfWeek": 6, "isClosed": false, "openTime": "08:00", "closeTime": "20:00" }
  ]
}
```

- **Expected**: `200 OK`

### TC-C4 — Get working hours (admin)

- `GET {{baseUrl}}/clinics/{{clinicId}}/working-hours`

### TC-C5 — Clinic appointments (admin)

- `GET {{baseUrl}}/clinics/{{clinicId}}/appointments?status=pending`

