// src/utils/mockData.js
// Mock data used for frontend-only demo mode (no backend required).
// Replace with real API calls via api.js for production.

export const MOCK_ANALYSIS = {
  project_name: "FastAPI E-Commerce Backend",
  language: "Python",
  framework: "FastAPI",
  total_files: 42,
  total_lines: 3840,
  dependencies: ["fastapi", "sqlalchemy", "pydantic", "redis", "celery", "alembic", "stripe", "jwt"],
  entry_points: ["main.py", "app/api/v1/router.py", "app/workers/celery_app.py"],
  summary:
    "Production-grade e-commerce REST API built with FastAPI. Handles JWT authentication, product catalog, cart & order processing, Stripe payments, and async email notifications via Celery workers.",
  architecture_overview:
    "Layered architecture: Router → Service → Repository → Model. JWT auth middleware on protected routes. Redis for session caching. Celery + Redis for async task queue. PostgreSQL as primary data store.",
  data_flow:
    "HTTP Request → FastAPI Router → JWT Middleware → Service Layer → Repository (SQLAlchemy ORM) → PostgreSQL. Async operations dispatched to Celery queue via Redis broker.",
  file_ranking: [
    { file: "main.py", importance: 98, purpose: "App entry, middleware chain setup" },
    { file: "app/api/v1/auth.py", importance: 92, purpose: "JWT login, register, token refresh" },
    { file: "app/services/order_service.py", importance: 88, purpose: "Order lifecycle & Stripe payments" },
    { file: "app/models/user.py", importance: 85, purpose: "User ORM model + relations" },
    { file: "app/core/security.py", importance: 82, purpose: "Password hashing, JWT utilities" },
    { file: "app/api/v1/products.py", importance: 78, purpose: "Product CRUD endpoints" },
    { file: "app/workers/email_worker.py", importance: 71, purpose: "Async email task queue" },
    { file: "app/db/session.py", importance: 65, purpose: "SQLAlchemy session factory" },
  ],
};

export const MOCK_LEARNING = {
  estimated_total_time: "6-8 hours",
  prerequisite_knowledge: ["Python basics", "REST APIs", "SQL fundamentals", "HTTP protocol"],
  steps: [
    {
      step: 1,
      title: "Start at the Entry Point",
      description: "Understand app initialization, middleware chain, and how FastAPI is configured.",
      files_to_read: ["main.py", "app/core/config.py"],
      key_concepts: ["ASGI", "Middleware", "CORS", "Lifespan events"],
      estimated_time: "30 minutes",
    },
    {
      step: 2,
      title: "Understand the Data Models",
      description: "Learn the SQLAlchemy ORM models and how they map to database tables.",
      files_to_read: ["app/models/user.py", "app/models/product.py", "app/models/order.py"],
      key_concepts: ["ORM", "SQLAlchemy", "Relationships", "Migrations"],
      estimated_time: "45 minutes",
    },
    {
      step: 3,
      title: "Trace the Auth Flow",
      description: "Follow JWT authentication from login → token generation → protected route access.",
      files_to_read: ["app/api/v1/auth.py", "app/core/security.py", "app/dependencies/auth.py"],
      key_concepts: ["JWT", "OAuth2", "Password hashing", "Dependency injection"],
      estimated_time: "60 minutes",
    },
    {
      step: 4,
      title: "Explore the Service Layer",
      description: "Understand business logic separation and how services orchestrate repositories.",
      files_to_read: ["app/services/order_service.py", "app/services/product_service.py"],
      key_concepts: ["Service pattern", "Repository pattern", "Business logic"],
      estimated_time: "45 minutes",
    },
    {
      step: 5,
      title: "Async Tasks with Celery",
      description: "Understand background job processing for emails, notifications, and heavy operations.",
      files_to_read: ["app/workers/celery_app.py", "app/workers/email_worker.py"],
      key_concepts: ["Celery", "Redis broker", "Async tasks", "Worker processes"],
      estimated_time: "40 minutes",
    },
    {
      step: 6,
      title: "Payment Integration",
      description: "Trace a complete order from cart to Stripe payment to fulfillment.",
      files_to_read: ["app/services/order_service.py", "app/api/v1/payments.py"],
      key_concepts: ["Stripe webhooks", "Idempotency", "Payment lifecycle"],
      estimated_time: "50 minutes",
    },
  ],
};

export const MOCK_FLOWS = [
  {
    name: "HTTP Request Flow",
    description: "Full lifecycle of an API request",
    text_representation:
      "Client Request\n    ↓\nFastAPI Router\n    ↓\nJWT Middleware\n    ↓\nRoute Handler\n    ↓\nService Layer\n    ↓\nRepository (ORM)\n    ↓\nPostgreSQL\n    ↓\nJSON Response",
    nodes: ["Client", "Router", "Auth MW", "Handler", "Service", "Repository", "Database", "Response"],
    type: "request",
  },
  {
    name: "Authentication Flow",
    description: "User login and token validation",
    text_representation:
      "POST /auth/login\n    ↓\nValidate Credentials\n    ↓\nHash & Compare\n    ↓\nGenerate JWT\n    ↓\nReturn Token\n    ↓\n(Subsequent requests)\n    ↓\nVerify JWT Signature\n    ↓\nExtract User Context",
    nodes: ["Login Endpoint", "User Lookup", "Password Verify", "JWT Generator", "Token Response", "JWT Validator", "User Context"],
    type: "auth",
  },
  {
    name: "Order Processing Flow",
    description: "End-to-end order lifecycle",
    text_representation:
      "POST /orders\n    ↓\nValidate Cart Items\n    ↓\nCalculate Total\n    ↓\nStripe Payment Intent\n    ↓\nConfirm Payment\n    ↓\nCreate Order Record\n    ↓\nDispatch Email Task\n    ↓\nReturn Order ID",
    nodes: ["Order Request", "Cart Validation", "Price Calc", "Stripe API", "Payment Confirm", "DB Write", "Celery Queue", "Email Worker"],
    type: "business",
  },
];

export const EXAMPLE_REPOS = [
  { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
  { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
  { label: "django/django", url: "https://github.com/django/django" },
];

export const PROTOTYPE_SCREENS = [
  { name: "Login", route: "/login", icon: "🔐", desc: "Authentication screen", components: ["LoginForm", "EmailInput", "PasswordInput", "SubmitButton"] },
  { name: "Dashboard", route: "/dashboard", icon: "◈", desc: "Main overview", components: ["StatsGrid", "RecentOrders", "QuickActions", "Sidebar"] },
  { name: "Products", route: "/products", icon: "📦", desc: "Product catalog", components: ["ProductGrid", "SearchBar", "FilterPanel", "Pagination"] },
  { name: "Orders", route: "/orders", icon: "🛒", desc: "Order management", components: ["OrderTable", "StatusBadge", "DateFilter", "ExportBtn"] },
  { name: "Settings", route: "/settings", icon: "⚙", desc: "Configuration", components: ["ProfileForm", "SecurityTab", "NotifPanel", "SaveBtn"] },
];
