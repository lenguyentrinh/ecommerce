# Backend API

NestJS-based REST API server for the e-commerce platform.

## Getting Started

### Installation

```bash
pnpm install
```

### Environment Setup

Create a `.env` file in the backend directory with the following variables:

```env
DATABASE_URL=mysql://root:password@localhost:3306/ecommerce
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d
NODE_ENV=development
```

### Running the Server

```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run start:prod

# Watch mode
pnpm run start
```

The server will be available at `http://localhost:3001`

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Project Structure

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── products/     # Product catalog
│   ├── orders/       # Order processing
│   └── ...
├── common/           # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── database/         # Database configuration
└── main.ts          # Application entry point
```

## API Documentation

See `../docs/api-contracts.md` for complete API endpoint documentation and request/response schemas.

Key endpoints:
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /products` - List products
- `POST /orders` - Create order
- `GET /users/:id` - Get user details

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Database

Uses MySQL for data persistence. See `../docs/data-models.md` for schema details.

## Building for Production

```bash
pnpm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Debugging

Enable debug logs with:
```bash
DEBUG=nest:* pnpm run start:dev
```

## Support

For questions or issues, refer to:
- NestJS Documentation: https://docs.nestjs.com
- Project Documentation: `../docs/`
