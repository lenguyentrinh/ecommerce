# Ecommerce Monorepo - Project Documentation

## Overview

This is a full-stack ecommerce application built as a monorepo with two main parts:

- **Backend**: NestJS API server with TypeORM and MySQL database
- **Frontend**: Next.js 16 application with React 19, Redux Toolkit, and TypeScript

## Quick Navigation

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Development Guide](./development-guide.md)

---

## Architecture Overview

### Monorepo Structure

```
ecommerce/
├── backend/                 # NestJS API Server
│   ├── src/
│   │   ├── main.ts         # Application bootstrap
│   │   ├── app.module.ts   # Root module
│   │   ├── modules/
│   │   │   ├── auth/       # Authentication module
│   │   │   ├── users/      # User management module
│   │   │   └── mail/       # Email service module
│   │   ├── database/       # Database configuration
│   │   └── config/         # Application configuration
│   └── package.json
│
├── frontend/                # Next.js Frontend Application
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth route group (login, signup, verify-email)
│   │   ├── product/        # Product pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable components
│   ├── features/           # Feature modules (auth, product)
│   ├── store/              # Redux state management
│   ├── services/           # API services
│   └── package.json
│
└── docs/                    # Project documentation
```

---

## Technology Stack

### Backend (NestJS)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS 11.0.1 | Backend application framework |
| **Language** | TypeScript 5.7.3 | Type-safe JavaScript |
| **Database** | MySQL 8.0 | Relational database |
| **ORM** | TypeORM 0.3.28 | Object-Relational Mapping |
| **Authentication** | Passport JWT | JWT-based auth strategy |
| **Validation** | class-validator, class-transformer | DTO validation |
| **Security** | bcrypt | Password hashing |
| **Email** | Nodemailer | Email service |
| **API Docs** | Swagger/OpenAPI | API documentation |
| **Testing** | Jest | Unit and integration tests |

### Frontend (Next.js)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16.0.1 | React meta-framework with SSR |
| **UI Framework** | React 19.2.0 | UI component library |
| **Language** | TypeScript 5.x | Type-safe JavaScript |
| **State Mgmt** | Redux Toolkit 2.11.2 | Global state management |
| **Async Logic** | Redux Thunk 3.1.0 | Async action handling |
| **HTTP Client** | Axios 1.13.2 | HTTP requests |
| **Forms** | React Hook Form 7.66.0 | Form state management |
| **Styling** | TailwindCSS 4.0 | Utility-first CSS |
| **UI Components** | react-icons 5.5.0 | Icon library |
| **Notifications** | react-hot-toast 2.6.0 | Toast notifications |
| **Fonts** | Google Fonts (Nunito, Geist Mono) | Typography |

---

## Project Structure

### Backend Directory

**Location**: `backend/`

```
backend/src/
├── main.ts                  # NestJS bootstrap with CORS, validation pipes, Swagger
├── app.module.ts           # Root application module
├── app.controller.ts       # Health check endpoints
├── app.service.ts          # Root service
├── config/
│   ├── app.config.ts       # Application config
│   ├── jwt.config.ts       # JWT configuration
├── database/
│   └── database.config.ts  # TypeORM MySQL configuration
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts       # Auth endpoints
│   │   ├── auth.service.ts          # Auth business logic
│   │   ├── strategies/
│   │   │   └── jwt.strategies.ts    # Passport JWT strategy
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       ├── signup.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       ├── verify-email.dto.ts
│   │       ├── send-otp.dto.ts
│   │       ├── verify-otp.dto.ts
│   │       └── reset-password.dto.ts
│   ├── users/
│   │   ├── user.module.ts
│   │   ├── user.service.ts          # User CRUD operations
│   │   └── entities/
│   │       └── user.entity.ts       # User database schema
│   └── mail/
│       ├── mail.module.ts
│       └── mail.service.ts          # Email sending logic
└── common/
    └── utils/
        └── hash.util.ts             # Password hashing utilities
```

### Frontend Directory

**Location**: `frontend/`

```
frontend/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout with Header, Footer
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── providers.tsx        # Redux & Toaster providers
│   ├── (auth)/              # Auth route group
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── LoginForm.tsx
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── verify-email/
│   │   │   ├── page.tsx
│   │   │   └── VerifyEmailForm.tsx
│   │   └── forgotPassword/
│   │       ├── page.tsx
│   │       ├── ForgotPasswordByEmailForm.tsx
│   │       ├── otp/
│   │       │   ├── page.tsx
│   │       │   └── otpForm.tsx
│   │       └── reset/
│   │           ├── page.tsx
│   │           └── ResetPasswordForm.tsx
│   ├── product/
│   │   └── page.tsx
│   ├── my-account/
│   │   └── page.tsx
│   ├── logout/
│   │   └── page.tsx
│   └── about-me/
│       └── page.tsx
├── components/              # Reusable components
│   ├── Button.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   ├── inputs/
│   │   └── TextInput.tsx
│   ├── home/
│   │   ├── BestSellerSection.tsx
│   │   └── HomeCarousel.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── features/                # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── services/
│   │       └── authApi.ts
│   └── product/
│       ├── components/
│       │   └── ProductList.tsx
│       ├── hooks/
│       │   └── useProducts.ts
│       └── services/
│           └── productApi.ts
├── hooks/                   # Custom hooks
│   └── useToggle.ts
├── lib/                     # Utilities and helpers
│   ├── axiosClient.ts       # Axios HTTP client
│   ├── constants.ts
│   ├── helpers.ts
│   └── toast.tsx
├── store/                   # Redux state management
│   ├── store.ts             # Redux store configuration
│   ├── authSlice.ts         # Auth reducer and actions
│   └── authThunk.ts         # Async auth thunks
├── services/                # API services
│   ├── api.ts               # Base API client
│   └── authAPI.ts           # Auth API endpoints
├── types/                   # TypeScript type definitions
│   ├── user.ts
│   └── product.ts
└── next.config.ts
```

---

## API Documentation

### Authentication Endpoints

See [API Contracts](./api-contracts.md) for complete API documentation.

**Base URL**: `http://localhost:3000` (backend server)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/signup` | Register new user account |
| POST | `/auth/login` | Authenticate user with email/password |
| POST | `/auth/verify-email` | Verify email address with OTP code |
| POST | `/auth/send-otp` | Send OTP code to email |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/forgot-password` | Initiate password reset process |
| POST | `/auth/reset-password` | Reset password with new password |

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm package manager
- MySQL 8.0+ running locally or remotely

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and JWT credentials

# Run database migrations (if applicable)
npm run typeorm migration:run

# Start development server
npm run start:dev

# Backend runs on http://localhost:3000 (or configured PORT)
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start development server
npm run dev

# Frontend runs on http://localhost:3001
```

---

## Key Features

### Authentication System

- **User Registration**: Email-based signup with OTP verification
- **JWT Authentication**: Secure token-based authentication
- **Password Reset**: Multi-step password recovery via email OTP
- **Email Verification**: Automated email verification with OTP codes
- **Session Management**: Cookie-based JWT storage (httpOnly)

### Database Schema

- **Users Table**: Stores user profile, credentials, and authentication state
- **Password Security**: Bcrypt hashing with salt rounds
- **OTP Management**: Time-limited one-time passwords for verification

### Frontend State Management

- **Redux Toolkit**: Centralized auth state
- **Redux Thunk**: Async API operations
- **Form Management**: React Hook Form for validation and submission

---

## Development

See [Development Guide](./development-guide.md) for:
- Development workflow
- Running tests
- Code standards
- Building for production
- Troubleshooting

---

## Integration Architecture

See [Integration Architecture](./integration-architecture.md) for details on:
- Frontend-to-Backend communication
- Authentication flow
- API contract validation
- Error handling patterns

---

## Code Quality & Standards

- **Language**: TypeScript with strict mode enabled
- **Linting**: ESLint for code quality
- **Formatting**: Prettier for code formatting
- **Testing**: Jest for unit and integration tests
- **API Docs**: Swagger/OpenAPI specification

---

## Related Documentation

- [Architecture - Backend](./architecture-backend.md)
- [Architecture - Frontend](./architecture-frontend.md)
- [API Contracts & Endpoints](./api-contracts.md)
- [Data Models & Schema](./data-models.md)
- [Component Inventory](./component-inventory.md)
- [Source Tree Analysis](./source-tree-analysis.md)

---

## Contact & Support

For issues, questions, or contributions, please refer to the project repository.

**Last Updated**: 2026-06-22
**Documentation Version**: 1.0.0
