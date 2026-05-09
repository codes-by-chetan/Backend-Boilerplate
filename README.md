# Backend Boilerplate

A production-ready Node.js + Express + PostgreSQL backend boilerplate with built-in authentication, logging, validation, and middleware patterns. Perfect for jumpstarting API projects with best practices.

## Features

✅ **Authentication & Authorization**
- JWT-based access & refresh tokens
- Secure refresh token rotation
- Built-in admin user bootstrapping
- Role-based access control (RBAC)

✅ **Database**
- PostgreSQL with Prisma ORM
- Automatic schema migration & seeding
- Database bootstrapping on first run
- Connection pooling & SSL/TLS support

✅ **Logging & Monitoring**
- Structured JSON logging with Winston
- Request/Response logging middleware
- Database query logging
- Configurable log levels (debug, info, warn, error)

✅ **Security**
- Request validation with Joi
- Bcrypt password hashing
- CORS protection
- Rate limiting
- Error handling middleware

✅ **Developer Experience**
- Hot-reload with Nodemon
- Environment validation
- Request context tracking
- Organized module structure
- Reusable middleware

## Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/) or use Docker)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd backend_boilerplate

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials
nano .env

# 4. Start the development server
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Configuration

This boilerplate supports **flexible database configuration** to work in any environment:

### Option 1: Connection String (Recommended for Production)

Set a single `DATABASE_URL` environment variable:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

**Use cases:**
- Production deployments
- Cloud database services (AWS RDS, Neon, Supabase, etc.)
- Docker/Container environments
- CI/CD pipelines

### Option 2: Individual Components (Recommended for Development)

Configure database components separately:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=backend_boilerplate
```

**Use cases:**
- Local development
- Quick prototyping
- Easier troubleshooting

### Priority Order

The application checks for database configuration in this order:

1. `DATABASE_URL` (if set)
2. `POSTGRES_INTERNAL_URL` (for Vercel)
3. `POSTGRES_URL` (platform-specific)
4. `RENDER_DATABASE_URL` (for Render)
5. Individual components: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Note:** Use only ONE method. Mixing them is not recommended.

## Configuration Guide

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` **OR** individual `DB_*` | PostgreSQL connection | `postgresql://...` |
| `JWT_ACCESS_SECRET` | Access token signing key (min 16 chars) | `your-secret-key-here` |
| `JWT_REFRESH_SECRET` | Refresh token signing key (min 16 chars) | `your-secret-key-here` |

### Optional Variables

| Variable | Default | Options |
|----------|---------|---------|
| `NODE_ENV` | `development` | `development`, `test`, `production` |
| `PORT` | `5000` | Any valid port number |
| `LOG_LEVEL` | `debug` | `debug`, `info`, `warn`, `error` |
| `BOOTSTRAP_DB` | `true` | `true`, `false` |
| `BOOTSTRAP_ADMIN` | `true` | `true`, `false` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Valid time unit (e.g., `15m`, `1h`, `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Valid time unit |
| `BCRYPT_SALT_ROUNDS` | `12` | `8-15` (higher = slower but more secure) |
| `COOKIE_SECURE` | `false` | `true` for production with HTTPS |
| `TRUST_PROXY` | `false` | `true` if behind reverse proxy |

### See .env.example for all available options

```bash
cat .env.example
```

## Project Structure

```
backend_boilerplate/
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.js        # Environment validation & config object
│   │   └── logger.js     # Winston logger setup
│   │
│   ├── db/               # Database utilities
│   │   ├── bootstrap.js  # Database initialization & seeding
│   │   ├── bootstrap.sql # SQL schema
│   │   └── prisma.js     # Prisma connection
│   │
│   ├── lib/              # Core libraries
│   │   ├── prisma.js     # Prisma client singleton
│   │   └── request-store.js  # AsyncLocalStorage for request context
│   │
│   ├── middlewares/      # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   ├── validate.js   # Request validation (Joi)
│   │   ├── error-handler.js  # Centralized error handler
│   │   ├── rate-limit.js # Rate limiting
│   │   ├── request-logger.js # HTTP request logging
│   │   └── request-context.js # Request-scoped data storage
│   │
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication routes & controllers
│   │   └── logs/         # Logging endpoints
│   │
│   ├── routes/           # Route registration
│   │   ├── index.js      # Main route aggregator
│   │   └── auth.routes.js
│   │
│   ├── utils/            # Utility functions
│   │   ├── ApiError.js   # Custom error class
│   │   ├── ApiResponse.js # Standard response wrapper
│   │   ├── async-handler.js # Try-catch wrapper for async routes
│   │   └── token.js      # JWT utilities
│   │
│   ├── app.js            # Express app setup & middleware
│   └── index.js          # Application entry point
│
├── prisma/
│   └── schema.prisma     # Prisma database schema
│
├── public/               # Static files
│   └── admin/            # Admin dashboard HTML
│
├── .env.example          # Environment template
├── .env                  # Environment variables (not in git)
├── package.json
└── README.md
```

## API Endpoints

### Health Check

```bash
GET /api/v1/health
```

Response:
```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### Authentication

#### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

#### Refresh Token
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

#### Logout
```bash
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

## Scripts

```bash
# Development with hot-reload
npm run dev

# Production start
npm start

# Format code (if configured)
npm run format
```

## Database Setup

### First Time Setup

On first run with `BOOTSTRAP_DB=true` and `BOOTSTRAP_ADMIN=true`:

1. ✅ Creates the target database
2. ✅ Initializes schema from `bootstrap.sql`
3. ✅ Seeds admin user

### Manual Setup

```bash
# Create database
createdb backend_boilerplate

# Run schema
psql backend_boilerplate < src/db/bootstrap.sql
```

### Connect to PostgreSQL

```bash
# Using psql CLI
psql -h localhost -U postgres -d backend_boilerplate
```

## Authentication Usage

### Protected Routes

Add the `protect` middleware to require authentication:

```javascript
import { protect } from "../middlewares/auth.js";

router.get("/protected-endpoint", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
```

### Using JWT

The API uses Bearer tokens in the `Authorization` header:

```bash
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:5000/api/v1/auth/me
```

Access tokens are returned in JSON. Refresh tokens are also set as an `httpOnly` cookie.

## Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid credentials",
  "statusCode": 401
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Logging

### Log Levels

Set `LOG_LEVEL` to control verbosity:

```env
LOG_LEVEL=debug    # All messages
LOG_LEVEL=info     # Info and above
LOG_LEVEL=warn     # Warnings and above
LOG_LEVEL=error    # Errors only
```

### Log Files

Logs are stored in the `logs/` directory:

```
logs/
├── logs-*.html     # HTML formatted logs
└── error-*.log     # Error logs (if configured)
```

View logs:
```bash
# Open log viewer
open public/admin/log-viewer.html
```

## Security Considerations

### Before Production Deployment

- [ ] Change all default secrets in `.env`
- [ ] Set `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to strong values (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Set `COOKIE_SECURE=true` (requires HTTPS)
- [ ] Enable CORS properly (set specific origins in `CORS_ORIGIN`)
- [ ] Review rate limiting settings
- [ ] Ensure PostgreSQL has SSL/TLS enabled (`sslmode=require` in DATABASE_URL)
- [ ] Use strong admin password (change `ADMIN_PASSWORD`)
- [ ] Enable HTTPS on your production server
- [ ] Set up monitoring and alerting

### Password Policy

- Admin password: Default is `admin12345` (change immediately)
- User password: Minimum 8 characters (configured in auth validation)
- All passwords are hashed with bcrypt (12 salt rounds by default)

## Development

### Adding New Features

1. **Create a module** under `src/modules/`:
   ```
   src/modules/users/
   ├── users.controller.js
   ├── users.service.js
   ├── users.repository.js
   ├── users.validation.js
   └── users.routes.js
   ```

2. **Register in routes**:
   ```javascript
   // src/routes/index.js
   import usersRoutes from "../modules/users/users.routes.js";
   router.use("/users", usersRoutes);
   ```

3. **Add validation** in `users.validation.js`:
   ```javascript
   const createUserSchema = Joi.object({
     email: Joi.string().email().required(),
     name: Joi.string().required(),
   });
   ```

### Adding Middleware

Create new middleware in `src/middlewares/`:

```javascript
// src/middlewares/custom-middleware.js
export const customMiddleware = (req, res, next) => {
  // Your logic here
  next();
};
```

Register in `src/app.js`:
```javascript
app.use(customMiddleware);
```

## Troubleshooting

### Database Connection Error: "sslmode=require"

**Problem:** `error: connection is insecure (try using 'sslmode=require')`

**Solution:** Add `?sslmode=require` to your DATABASE_URL:
```env
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE :::5000`

**Solution:** Change PORT in .env or kill the process using the port:
```bash
# Find process using port 5000
lsof -i :5000
# Kill it
kill -9 <PID>
```

### JWT Secret Validation Error

**Problem:** Environment validation fails for JWT secrets

**Solution:** Ensure secrets are at least 16 characters:
```env
JWT_ACCESS_SECRET=min-16-character-secret-key-here
JWT_REFRESH_SECRET=another-strong-secret-key-here123
```

## CommonJS vs ESM

This project uses **ES Modules** (`import`/`export`). The `package.json` is configured with `"type": "module"`.

## Contributing

1. Follow the existing code structure
2. Use meaningful commit messages
3. Test changes before submitting
4. Update documentation for new features

## License

MIT

---

**Happy coding!** 🚀
