# Code Organization Summary

### Backend Directory Tree

```
backend/
├── src/
│   ├── main.ts                 # Bootstrap, CORS, Swagger, validation pipes
│   ├── app.module.ts           # Root module (all feature modules imported)
│   ├── config/
│   │   ├── app.config.ts
│   │   └── jwt.config.ts
│   ├── database/
│   │   └── database.config.ts  # TypeORM MySQL configuration
│   ├── modules/                # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   └── mail/
│   └── common/utils/           # Shared utilities
├── test/                        # E2E tests
├── dist/                        # Compiled output
├── package.json
├── tsconfig.json
├── .eslintrc.js
└── .prettierrc
```

### Frontend Directory Tree

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── ...
│   ├── product/page.tsx
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # Redux + Toaster setup
│   └── globals.css
├── components/                 # Shared components
│   ├── Button.tsx
│   ├── inputs/
│   │   └── TextInput.tsx
│   └── layout/
├── features/                   # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── product/
├── store/                      # Redux state
│   ├── store.ts
│   ├── authSlice.ts
│   └── authThunk.ts
├── lib/                        # Utilities
│   ├── axiosClient.ts
│   ├── constants.ts
│   └── helpers.ts
├── types/                      # TypeScript types
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.js
```

---
