# Development Guide

## Prerequisites

- **Node.js**: 18.x LTS or newer
- **npm**: 9.x or newer (or pnpm alternative)
- **MySQL**: 8.0 or newer
- **Git**: Latest version
- **Code Editor**: VS Code recommended

## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/lenguyentrinh/FE-Ecommerce.git
cd ecommerce
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure database connection
# Edit .env file with your MySQL credentials:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USERNAME=root
# DB_PASSWORD=your_password
# DB_NAME=ecommerce
# JWT_SECRET=your-secret-key-here
# PORT=3000

# Start development server (with watch mode)
npm run start:dev

# Terminal output should show:
# [Nest] 12345  - 06/22/2026, 2:00:00 PM     LOG [NestFactory] Nest application successfully started +234ms
# [Nest] 12345  - 06/22/2026, 2:00:00 PM     LOG [InstanceLoader] AuthModule dependencies initialized +123ms
```

**Backend running on**: `http://localhost:3000`
**API Docs**: `http://localhost:3000/api` (Swagger)

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start development server
npm run dev

# Terminal output should show:
# ▲ Next.js 16.0.1
# - Local: http://localhost:3001
# - Environments: .env.local
```

**Frontend running on**: `http://localhost:3001`

## Development Workflow

### Starting Development Session

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - MySQL** (if not system service):
```bash
# macOS
brew services start mysql

# Windows (in WSL/PowerShell)
mysql.server start

# Linux
sudo systemctl start mysql
```

### File Watching & Hot Reload

**Backend**: NestJS watch mode
- Detects TypeScript changes
- Automatically rebuilds and restarts
- No manual restart needed

**Frontend**: Next.js HMR (Hot Module Replacement)
- Updates code without full page reload
- Preserves component state when possible
- Shows errors in overlay

### Testing

#### Backend Unit Tests

```bash
cd backend

# Run all tests
npm run test

# Run specific test file
npm run test -- auth.service

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e
```

#### Frontend Testing

Currently no tests configured. Consider adding:
- Jest for unit tests
- React Testing Library for component tests
- Playwright/Cypress for E2E tests

### Building for Production

**Backend**:
```bash
cd backend
npm run build

# Runs: nest build
# Creates: dist/ directory with compiled code
# Output ready for deployment
```

**Frontend**:
```bash
cd frontend
npm run build

# Runs: next build
# Creates: .next/ directory with optimized production bundle
# Generates: standalone server if configured
```

## Code Structure & Conventions

### Backend (NestJS)

**Naming Conventions**:
- Controllers: `*.controller.ts` (e.g., `auth.controller.ts`)
- Services: `*.service.ts` (e.g., `auth.service.ts`)
- Entities: `*.entity.ts` (e.g., `user.entity.ts`)
- DTOs: `*.dto.ts` (e.g., `login.dto.ts`)
- Modules: `*.module.ts` (e.g., `auth.module.ts`)
- Strategies: `*.strategies.ts` (e.g., `jwt.strategies.ts`)

**Directory Structure**:
```
src/
├── modules/
│   └── [feature]/
│       ├── [feature].module.ts
│       ├── [feature].controller.ts
│       ├── [feature].service.ts
│       ├── strategies/          (if auth)
│       ├── entities/
│       ├── dto/
│       └── [feature].spec.ts
├── config/
├── database/
└── common/
```

**Module Pattern**:
```typescript
// auth.module.ts
@Module({
  imports: [UsersModule, PassportModule, JwtModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

**Service Dependency Injection**:
```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}
}
```

### Frontend (Next.js)

**Naming Conventions**:
- Page components: `page.tsx`
- Layout components: `layout.tsx`
- Components: `PascalCase` (e.g., `Button.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useAuth.ts`)
- Types: `PascalCase` (e.g., `User.ts`, `Product.ts`)
- Utilities: `camelCase` (e.g., `helpers.ts`, `constants.ts`)

**Directory Structure**:
```
app/
├── (auth)/
│   ├── login/
│   │   ├── page.tsx
│   │   └── LoginForm.tsx
│   ├── signup/
│   │   ├── page.tsx
│   │   └── SignupForm.tsx
│   └── ...
├── layout.tsx
├── page.tsx
└── globals.css

components/
├── Button.tsx
├── ProductCard.tsx
├── home/
│   ├── HomeCarousel.tsx
│   └── BestSellerSection.tsx
└── layout/

features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── product/

store/
├── store.ts
├── authSlice.ts
└── authThunk.ts

services/
├── api.ts
└── authAPI.ts
```

**Component Pattern**:
```typescript
// components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Hook Pattern**:
```typescript
// features/auth/hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loginLoading } = useSelector(
    (state: RootState) => state.auth
  );
  
  return { user, isAuthenticated, loginLoading, dispatch };
}
```

## Common Development Tasks

### Adding a New API Endpoint

**1. Backend - Create DTO** (`backend/src/modules/auth/dto/new.dto.ts`):
```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export default class NewDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  data: string;
}
```

**2. Backend - Update Service** (`backend/src/modules/auth/auth.service.ts`):
```typescript
async newEndpoint(dto: NewDto) {
  // Business logic
  return { message: 'Success' };
}
```

**3. Backend - Update Controller** (`backend/src/modules/auth/auth.controller.ts`):
```typescript
@Post('new-endpoint')
newEndpoint(@Body() newDto: NewDto) {
  return this.authService.newEndpoint(newDto);
}
```

**4. Frontend - Create API Service** (`frontend/services/authAPI.ts`):
```typescript
interface NewPayload {
  email: string;
  data: string;
}

const newAPI = async (data: NewPayload) => {
  const res = await api.post("/auth/new-endpoint", data);
  return res.data;
};
```

**5. Frontend - Create Thunk** (`frontend/store/authThunk.ts`):
```typescript
export const newThunk = createAsyncThunk(
  "auth/new",
  async (data: NewPayload, { rejectWithValue }) => {
    try {
      return await newAPI(data);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed');
    }
  }
);
```

**6. Frontend - Update Slice** (`frontend/store/authSlice.ts`):
```typescript
.addCase(newThunk.pending, (state) => {
  state.newLoading = true;
})
.addCase(newThunk.fulfilled, (state) => {
  state.newLoading = false;
})
.addCase(newThunk.rejected, (state) => {
  state.newLoading = false;
})
```

### Adding a New Page

**1. Create Directory**: `frontend/app/[route]/`
**2. Create Page**: `frontend/app/[route]/page.tsx`
```typescript
export default function PageName() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Page Title</h1>
    </div>
  );
}
```

**3. Add Navigation**: Update `Header.tsx` with link
```typescript
<Link href="/new-route" className="nav-link">
  New Page
</Link>
```

### Adding a New Component

**1. Create Component**: `frontend/components/NewComponent.tsx`
```typescript
interface NewComponentProps {
  title: string;
  children: React.ReactNode;
}

export default function NewComponent({
  title,
  children,
}: NewComponentProps) {
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

**2. Use in Page**:
```typescript
import NewComponent from '@/components/NewComponent';

export default function Page() {
  return (
    <NewComponent title="Example">
      <p>Content</p>
    </NewComponent>
  );
}
```

## Code Style & Standards

### TypeScript Configuration

**Strict Mode Enabled**:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Linting

**Backend**:
```bash
cd backend
npm run lint
npm run lint -- --fix     # Auto-fix
```

**Frontend**:
```bash
cd frontend
npm run lint
npm run lint -- --fix     # Auto-fix
```

**ESLint Configuration**:
- TypeScript support
- Recommended rules enabled
- No console warnings in production

### Formatting

**Using Prettier** (optional integration):
```bash
# Format all files
npm run format

# Format specific file
npx prettier --write src/file.ts
```

## Debugging

### Backend Debugging

**VS Code Debugger**:
```bash
cd backend
npm run debug:ts

# Listens on port 9229
# Then open VS Code: Run > Connect to Port 9229
```

**Console Logging**:
```typescript
console.log('Debug info:', data);
console.error('Error:', error);
```

**NestJS Logger**:
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private logger = new Logger(MyService.name);

  async myMethod() {
    this.logger.log('Method called');
    this.logger.error('An error occurred', error.stack);
  }
}
```

### Frontend Debugging

**Browser DevTools**:
1. Open Chrome DevTools (F12)
2. Go to "Sources" tab
3. Select `webpack://` folder
4. Navigate to source file
5. Set breakpoints (click line number)
6. Reload page to hit breakpoint

**React DevTools Extension**:
- Install from Chrome Web Store
- Inspect component tree
- View props and state
- Edit state in real-time

**Redux DevTools Extension**:
- Install from Chrome Web Store
- View all actions dispatched
- Time-travel debugging
- Inspect state at each step

## Common Issues & Solutions

### Database Connection Error

**Error**: `connect ECONNREFUSED 127.0.0.1:3306`

**Solution**:
1. Ensure MySQL is running
2. Check `.env` credentials match your setup
3. Verify database exists: `mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce;"`
4. Check MySQL version: `mysql --version`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9    # macOS/Linux
netstat -ano | findstr :3000     # Windows

# Or change PORT in .env
PORT=3001
```

### Module Not Found

**Error**: `Cannot find module '@/components/Button'`

**Solution**:
1. Check tsconfig.json paths configuration
2. Verify file exists at expected location
3. Check file name matches import (case-sensitive)
4. Restart dev server

### CORS Error

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` is correct
2. Ensure backend CORS is configured properly
3. Verify backend is running
4. Check browser console for exact error

### JWT Token Invalid

**Error**: `401 Unauthorized: Invalid token`

**Solution**:
1. Verify JWT_SECRET in `.env` matches
2. Check token expiration time
3. Ensure cookie is being sent with requests
4. Check if user still exists in database

## Performance Optimization

### Frontend

**Next.js Optimization**:
- Enable Image Optimization: Use `next/image`
- Code Splitting: Automatic with routes
- Font Optimization: Using `next/font`
- Lazy Loading: Use `React.lazy()` for components

**React Optimization**:
- Memoize expensive components: `React.memo()`
- Use `useCallback` for stable function references
- Use `useMemo` for computed values
- Split large components into smaller ones

### Backend

**NestJS Optimization**:
- Enable caching: `@nestjs/cache-manager`
- Use database indexes
- Implement pagination for large queries
- Use select to fetch only needed fields

**Database Optimization**:
- Add indexes on frequently queried columns
- Use query analysis tools
- Monitor slow queries
- Consider query caching

## Environment Variables Reference

### Frontend `.env.local`

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend API endpoint |

### Backend `.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USERNAME` | `root` | MySQL user |
| `DB_PASSWORD` | (required) | MySQL password |
| `DB_NAME` | `ecommerce` | Database name |
| `JWT_SECRET` | (required) | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | `1d` | Token expiration time |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `FRONTEND_URL` | `http://localhost:3001` | Frontend origin for CORS |

## Deployment Checklist

- [ ] Build both backend and frontend
- [ ] Run tests and fix failures
- [ ] Check environment variables are configured
- [ ] Enable HTTPS/TLS
- [ ] Configure production database
- [ ] Set JWT_SECRET to strong random value
- [ ] Configure FRONTEND_URL in backend
- [ ] Update NEXT_PUBLIC_API_URL in frontend
- [ ] Enable production logging/monitoring
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Test authentication flows
- [ ] Verify CORS settings
- [ ] Monitor application logs
- [ ] Set up alerts for errors

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

## Support

For issues:
1. Check error messages carefully
2. Search project documentation
3. Review GitHub issues
4. Create detailed bug report

**Next Steps**: Review [Architecture Documentation](./architecture-backend.md) and [API Contracts](./api-contracts.md)
