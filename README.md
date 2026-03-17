# 📚 LMS – Library Management System

Hệ thống quản lý thư viện số – Dev 1: Authentication & User Module

---

## 📁 Cấu trúc thư mục

```
lms/
├── backend/                  # Node.js + Express + MongoDB
│   ├── config/
│   │   ├── db.js             # Kết nối MongoDB
│   │   └── jwt.js            # Tạo / verify JWT
│   ├── controllers/
│   │   ├── authController.js # Register, Login, Google OAuth
│   │   └── userController.js # Profile CRUD, Change password
│   ├── middleware/
│   │   └── authMiddleware.js # protect + authorize(roles)
│   ├── models/
│   │   └── User.js           # User schema (5 roles)
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth/*
│   │   └── userRoutes.js     # /api/users/*
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/                 # React 18
    ├── public/index.html
    └── src/
        ├── App.jsx           # Router + providers
        ├── index.js
        ├── context/
        │   └── AuthContext.jsx   # Global auth state
        ├── services/
        │   └── api.js            # Axios + JWT interceptor
        ├── components/
        │   ├── Navbar.jsx        # Role-aware navigation
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── HomePage.jsx
        │   └── UnauthorizedPage.jsx
        └── styles/
            ├── global.css
            ├── auth.css
            └── profile.css
```

---

## 🚀 Hướng dẫn cài đặt

### 1. Backend

```bash
cd backend
cp .env.example .env
# Điền đầy đủ các biến môi trường vào .env
npm install
npm run dev      # chạy ở http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Điền REACT_APP_GOOGLE_CLIENT_ID vào .env
npm install
npm start        # chạy ở http://localhost:3000
```

---

## 🔑 Biến môi trường

### Backend `.env`

| Biến               | Mô tả                     | Ví dụ                              |
| ------------------ | ------------------------- | ---------------------------------- |
| `PORT`             | Port server               | `5000`                             |
| `MONGODB_URI`      | Connection string MongoDB | `mongodb://localhost:27017/lms_db` |
| `JWT_SECRET`       | Secret key để ký JWT      | chuỗi random dài                   |
| `JWT_EXPIRE`       | Thời hạn JWT              | `7d`                               |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID    | từ Google Cloud Console            |
| `FRONTEND_URL`     | URL frontend (CORS)       | `http://localhost:3000`            |

### Frontend `.env`

| Biến                         | Mô tả                  |
| ---------------------------- | ---------------------- |
| `REACT_APP_API_URL`          | URL API backend        |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint             | Mô tả                  | Auth |
| ------ | -------------------- | ---------------------- | ---- |
| POST   | `/api/auth/register` | Đăng ký tài khoản      | ❌   |
| POST   | `/api/auth/login`    | Đăng nhập (email+pw)   | ❌   |
| POST   | `/api/auth/google`   | Đăng nhập Google OAuth | ❌   |

### Books

| Method | Endpoint                  | Mô tả                             | Auth                |
| ------ | ------------------------- | --------------------------------- | ------------------- |
| GET    | `/api/books`              | Danh sách sách (có search/filter) | ❌ Public           |
| GET    | `/api/books/:id`          | Chi tiết sách                     | ❌ Public           |
| POST   | `/api/books`              | Thêm sách mới                     | ✅ Admin, Librarian |
| PUT    | `/api/books/:id`          | Cập nhật sách                     | ✅ Admin, Librarian |
| DELETE | `/api/books/:id`          | Xóa sách                          | ✅ Admin only       |
| PUT    | `/api/books/:id/quantity` | Cập nhật số lượng sách            | ✅ Admin, Librarian |

### Users

| Method | Endpoint                     | Mô tả                 | Auth          |
| ------ | ---------------------------- | --------------------- | ------------- |
| GET    | `/api/users/profile`         | Lấy thông tin cá nhân | ✅ Any role   |
| PUT    | `/api/users/profile`         | Cập nhật hồ sơ        | ✅ Any role   |
| PUT    | `/api/users/change-password` | Đổi mật khẩu          | ✅ Any role   |
| GET    | `/api/users`                 | Danh sách users       | ✅ Admin only |

---

## 👥 Roles trong hệ thống

| Role        | Mô tả                                     |
| ----------- | ----------------------------------------- |
| `admin`     | Toàn quyền hệ thống                       |
| `librarian` | Quản lý sách, mượn trả, xử lý đề xuất     |
| `lecturer`  | Đề xuất sách, mượn trả, đọc sách online   |
| `student`   | Tìm kiếm, mượn trả, đọc sách online       |
| `guest`     | Xem danh sách sách công khai (chưa login) |

---

## 🔒 Bảo mật

- **Mật khẩu** được hash bằng `bcryptjs` (salt 10 rounds)
- **JWT** expire sau 7 ngày, chứa `{ id, role }`
- **Google OAuth** verify token phía server bằng `google-auth-library`
- `password` field có `select: false` — không bao giờ trả về trong response
- **Role-based middleware**: `authorize('admin', 'librarian')` dùng được cho mọi route

---

## 🔧 Google OAuth Setup

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project → **APIs & Services** → **Credentials**
3. Tạo **OAuth 2.0 Client ID** (Web application)
4. Thêm Authorized origins: `http://localhost:3000`
5. Thêm Authorized redirect URIs: `http://localhost:3000`
6. Copy **Client ID** vào cả `.env` backend và frontend

---

## 🔍 Book Search & Filter Parameters

### GET `/api/books`

| Parameter   | Type    | Mô tả                             | Ví dụ                                |
| ----------- | ------- | --------------------------------- | ------------------------------------ |
| `search`    | string  | Tìm kiếm theo title, author, isbn | `?search=harry`                      |
| `category`  | string  | Filter theo category ID           | `?category=60f1b2b3c4d5e6f7g8h9i0j1` |
| `author`    | string  | Filter theo tác giả               | `?author=J.K.Rowling`                |
| `publisher` | string  | Filter theo nhà xuất bản          | `?publisher=Kim Đồng`                |
| `year_from` | number  | Filter từ năm xuất bản            | `?year_from=2020`                    |
| `year_to`   | number  | Filter đến năm xuất bản           | `?year_to=2023`                      |
| `available` | boolean | Chỉ hiện sách có sẵn              | `?available=true`                    |
| `page`      | number  | Số trang (default: 1)             | `?page=2`                            |
| `limit`     | number  | Số kết quả/trang (default: 10)    | `?limit=20`                          |
| `sort`      | string  | Trường sắp xếp                    | `?sort=title`                        |
| `order`     | string  | Thứ tự (asc/desc, default: desc)  | `?order=asc`                         |

---

## 📊 Book Quantity Tracking

Hệ thống tự động theo dõi số lượng sách:

- **quantity**: Tổng số bản sao trong thư viện
- **available**: Số bản sao có sẵn để mượn
- **status**: Trạng thái sách (available/unavailable/maintenance)

Khi cập nhật số lượng, hệ thống tự động điều chỉnh `available` để đảm bảo không vượt quá `quantity`.

---

## 🧩 Tích hợp với Dev khác

```js
// Dùng middleware trong route của Dev khác
const { protect, authorize } = require("./middleware/authMiddleware");

// Ví dụ route sách - Dev 2
router.post("/books", protect, authorize("admin", "librarian"), addBook);
router.get("/books", addBook); // public
```
