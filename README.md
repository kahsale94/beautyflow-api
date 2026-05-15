# 💈 Beautyflow (Automated Scheduling System)

A backend API for managing service-based businesses such as barbershops, salons, and clinics.

The project was built with **FastAPI**, **SQLAlchemy**, **PostgreSQL**, and **Alembic**, providing authentication, business scoping, appointment scheduling, professional availability, services, clients, users, and external automation integrations.

## 📈 Features

- Business management
- User authentication with JWT
- Role-based authorization
- Business-scoped access control
- Client management
- Professional management
- Service management
- Weekly professional availability
- Available time slot generation
- Appointment creation and management
- Appointment status flow: scheduled, canceled, completed
- Appointment conflict prevention at database level
- External integration authentication
- Business integration configuration
- Request logging middleware
- Basic rate limiting middleware
- PostgreSQL migrations with Alembic

## 🛠️ Technologies

### 🗄️ Backend

- Python 3.14
- FastAPI
- SQLAlchemy
- Pydantic
- PostgreSQL
- Alembic
- JWT authentication
- Passlib / bcrypt

### 🔧 Infrastructure

- Docker
- Docker Compose
- PostgreSQL 16
- Redis 7.2
- External Docker networks
- Uvicorn

## 🏢 Project Organization

### 🗃️ Structure

```
📂 beautyflow-api/
│
├── alembic/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── src/
│   ├── api/
│   │   └── v1/
│   │       ├── appointment_routes.py
│   │       ├── auth_routes.py
│   │       ├── availability_routes.py
│   │       ├── business_integration_routes.py
│   │       ├── business_routes.py
│   │       ├── client_routes.py
│   │       ├── integration_routes.py
│   │       ├── professional_routes.py
│   │       ├── service_routes.py
│   │       └── user_routes.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── database.py
│   │
│   ├── middlewares/
│   │   └── logging_middleware.py
│   │
│   ├── models/
│   │   ├── appointment_model.py
│   │   ├── availability_model.py
│   │   ├── business_integration_model.py
│   │   ├── business_model.py
│   │   ├── client_model.py
│   │   ├── integration_model.py
│   │   ├── professional_model.py
│   │   ├── professional_service_model.py
│   │   ├── service_model.py
│   │   └── user_model.py
│   │
│   ├── repositories/
│   ├── schemas/
│   ├── security/
│   ├── services/
│   ├── utils/
│   │   └── normalize.py
│   │
│   ├── dependecies.py
│   └── main.py
│
├── Dockerfile
├── docker-compose.yml
├── alembic.ini
├── requirements.txt
└── README.md

```

## 🏗️ Architecture

The backend follows a layered architecture:

- **API Routes** → HTTP endpoints grouped by domain
- **Services** → Business rules and validation logic
- **Repositories** → Database access with SQLAlchemy
- **Models** → ORM entities and database relationships
- **Schemas** → Request and response validation with Pydantic
- **Security** → Authentication, authorization, token handling, and business scope
- **Middlewares** → Logging and rate limiting
- **Core** → Database connection and environment configuration

## 🔐 Authentication and Authorization

The API uses JWT-based authentication with different token contexts:

- **User token**
- **Integration token**
- **Business integration token**

User roles available in the system:

| Role | Description |
|------|-------------|
| super_admin | Full access to all businesses and administrative resources |
| admin | Business-level administrative access |
| user | Standard business user access |

Business-scoped endpoints use the authenticated user context to determine which business can be accessed.

For `super_admin` users, the business scope must be provided through the `X-Business-ID` header.

## 🧩 Main API Modules

The API is versioned under the `/v1` prefix and is organized by business domain:

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/v1/auth` | Handles user login, token refresh, and integration authentication |
| Businesses | `/v1/businesses` | Manages business registration and business data |
| Users | `/v1/users` | Manages users, roles, profile access, activation, and deletion |
| Clients | `/v1/clients` | Manages client registration, updates, search, and deletion |
| Professionals | `/v1/professionals` | Manages professionals, search, activation, and deletion |
| Services | `/v1/services` | Manages the service catalog, including duration, price, and status |
| Availabilities | `/v1/availabilities` | Manages weekly professional availability and available time slots |
| Appointments | `/v1/appointments` | Handles scheduling, updates, cancellation, completion, and conflict validation |
| Integrations | `/v1/integrations` | Manages external automation integrations |
| Business Integrations | `/v1/business-integrations` | Links integrations to businesses and stores integration-specific configuration |

Appointments support the statuses `scheduled`, `canceled`, and `completed`.

The scheduling system validates professional availability and prevents conflicts using PostgreSQL constraints.

## 🔀 Integration Flow

The project includes an integration layer designed for external automation tools, such as n8n or other workflow systems.

### ⚙️ How it works

1. A global integration is created by a `super_admin`.
2. The integration receives an API token.
3. The integration authenticates through `/v1/auth/integration`.
4. The integration sends the business phone using the `X-Business-Phone` header.
5. The API validates the business integration link.
6. A temporary business integration token is returned.
7. The integration can access allowed business-scoped resources.

This allows external automation flows to interact with the API without using a normal user account.

## 🧠 Scheduling Rules

The appointment system validates:

- Client existence
- Professional existence
- Service existence
- Business ownership
- Professional active status
- Service active status
- Business timezone
- Start datetime with timezone
- Appointment must not be in the past
- Appointment must fit inside the professional availability range
- Appointment must not conflict with another scheduled appointment

Available slots are generated using a 15-minute step.

## 🗄️ Database

The project uses PostgreSQL with Alembic migrations.

Important database features used:

- Foreign keys with cascade delete
- PostgreSQL enums
- JSONB for integration configuration
- `pg_trgm` extension for normalized name search
- `btree_gist` extension for appointment conflict prevention
- Exclusion constraint to avoid overlapping appointments

## 🚀 How to Run the Project

### 1. Clone the repository

```
git clone https://github.com/kahsale94/beautyflow-api.git
cd beautyflow-api
```

### 2. Create a virtual environment

Linux/macOS:

```
python -m venv venv
source venv/bin/activate
```

Windows:

```
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install dependencies

```
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```
ENVIRONMENT=development

DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/beautyflow

ALGORITHM=HS256

USER_SECRET_KEY=your_user_secret_key
INTEGRATION_SECRET_KEY=your_integration_secret_key
BUSINESS_INTEGRATION_SECRET_KEY=your_business_integration_secret_key

USER_ACCESS_TOKEN_EXPIRE_MINUTES=30
USER_REFRESH_TOKEN_EXPIRE_DAYS=7
INTEGRATION_TOKEN_EXPIRE_DAYS=30
BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES=30

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=beautyflow

REDIS_PASSWORD=your_redis_password
```

#### Environment variables

| Variable | Description |
|----------|-------------|
| ENVIRONMENT | Application environment |
| DATABASE_URL | PostgreSQL connection URL |
| ALGORITHM | JWT algorithm |
| USER_SECRET_KEY | Secret key for user JWT tokens |
| INTEGRATION_SECRET_KEY | Secret key for integration JWT tokens |
| BUSINESS_INTEGRATION_SECRET_KEY | Secret key for business integration JWT tokens |
| USER_ACCESS_TOKEN_EXPIRE_MINUTES | User access token expiration time |
| USER_REFRESH_TOKEN_EXPIRE_DAYS | User refresh token expiration time |
| INTEGRATION_TOKEN_EXPIRE_DAYS | Integration token expiration time |
| BUSINESS_INTEGRATION_TOKEN_EXPIRE_MINUTES | Business integration token expiration time |
| POSTGRES_USER | PostgreSQL user used by Docker Compose |
| POSTGRES_PASSWORD | PostgreSQL password used by Docker Compose |
| POSTGRES_DB | PostgreSQL database name used by Docker Compose |
| REDIS_PASSWORD | Redis password used by Docker Compose |

### 5. Run database migrations

```
alembic upgrade head
```

### 6. Run the API locally

```
uvicorn src.main:app --reload
```

The API will be available at:

```
http://localhost:8000
```

In development mode, the interactive documentation is available at:

```
http://localhost:8000/docs
```

In production mode, API documentation is disabled.

## 🐳 Running with Docker Compose

The project includes a `docker-compose.yml` file with:

- PostgreSQL
- Redis
- Migration container
- Backend container

Before running Docker Compose, make sure the external networks exist:

```
docker network create beautyflow-network
docker network create n8n-network (for connection with n8n workflow)
```

Then run:

```
docker compose up -d --build
```

The migration service runs:

```
alembic upgrade head
```

After the database is healthy, the backend starts automatically.

## 📌 API Versioning

All routes are registered under:

`/v1`

Example:

```
/v1/auth/login
/v1/clients
/v1/services
/v1/appointments
```

## 💭 Considerations

This API was designed as the backend foundation for a scheduling and business management platform.

For larger production scenarios, the project can be improved with:

- Automated tests
- CI/CD pipeline
- More restrictive CORS configuration
- Centralized structured logging
- Redis-based distributed rate limiting
- Background jobs for asynchronous tasks
- Monitoring and observability
- More detailed API documentation

## 🔮 Next Steps

- Add automated tests with pytest
- Improve logging strategy
- Implement CI/CD
- Add production monitoring
- Improve rate limiting with Redis
- Add admin dashboard