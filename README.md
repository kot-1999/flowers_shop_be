# Flowers Shop

- Frontend repo: https://github.com/kot-1999/flowers_shop_fe

## Content

- [About Flower Shop](#about-flower-shop)
- [How to start](#how-to-start)
    - [Prerequisites](#prerequisites)
    - [Run application](#run-application)
    - [Google OAuth setup](#google-oauth-setup)
    - [Stripe payment setup](#stripe-payment-setup)
    - [Shippo shipping setup](#shippo-shipping-setup)
    - [Ollama AI Assistant setup](#ollama-ai-assistant-setup)
    - [Test data](#test-data)
- [Useful links](#useful-links)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Backend and DevOps features](#backend-and-devops-features)
- [Application Overview](#application-overview)
    - [Application From Customer Perspective](#application-from-customer-perspective)
    - [Application From Admin Perspective](#application-from-admin-perspective)
    - [Authentication Flows](#authentication-flows)
    - [Basket and Checkout Flow](#basket-and-checkout-flow)
    - [Payment Processing](#payment-processing)
    - [Shipping Management](#shipping-management)
    - [Email Notifications](#email-notifications)
    - [AI Assistant](#ai-assistant)
- [License](#license)

---

## How to start

---

### Prerequisites
- Ensure that Docker Engine alongside Docker Desktop are installed on your system;
- `docker compose` must be available;
- Install Stripe CLI for local webhook testing;
- Install Ollama for running the local AI assistant.

---

### Run application

Following steps describe how to run the application in **dev** mode on local machine

Feel free to copy-paste following commands.

**1. Clone GitHub repo:**

```terminaloutput
git clone https://github.com/kot-1999/flowers_shop_be.git
```

**2. Enter the directory:**

```terminaloutput
cd flowers_shop_be
```

**3. Create `.env.dev` file. Feel free to copy-paste the following script:**

```terminaloutput
cat <<EOF > .env.dev
NODE_ENV=dev
PORT=3000

ENCRYPTION_KEY=someKey

COOKIE_SECRET_KEY=someSalt

JWT_SECRET=jwt_secret
JWT_EXPIRES_IN=1h

POSTGRES_URL=postgresql://admin:postgres@dev_postgres:54321/development
POSTGRES_PORT=54321
POSTGRES_USER=admin
POSTGRES_PASSWORD=postgres
POSTGRES_DB=development

EMAIL_HOST=mailhog
EMAIL_SMTP_PORT=1025
EMAIL_HTTP_PORT=8025
EMAIL_USER=admin
EMAIL_PASSWORD=mailhog
EMAIL_FROM_ADDRESS=app@dev.com

REDIS_PORT=6379
REDIS_HOST=redis
REDIS_PASSWORD=redisDevPass
REDIS_MAX_MEMORY=256

S3_ACCESS_KEY_ID=admin
S3_SECRET_ACCESS_KEY=secretKey
S3_REGION=eu-west-2
S3_ENDPOINT=http://localstack_dev:9000
S3_PORT=9000

ALLOW_CONFIG_MUTATIONS=true

EOF
```

> 📝 Given environmental file profides config for docker containers.
> It doesn't carry any secret variables or keys.

**4. When all preparations are done run the application in one of two ways:**
```terminaloutput
## Using npm
npm run docker:dev

## Directly via docker compose
docker compose  --env-file .env.dev --profile dev up
```

![Docker Startup](./docs/screenshots/docker-up.png)

When the application is up and running you can open the app on localhost http://localhost:3000


> 📝 Starting time varies from one machine to another.
> Running the project might take from several seconds up to several minutes depending on the internet speed and hardware.

> ⚠️ Though the application is running now, but it's functionality is not complete

---

### Ollama AI Assistant setup

The application supports integration with a local AI assistant powered by Ollama.

The AI service is optional and can be enabled by providing the following environment variables:

```env
OLLAMA_URL=http://localhost:11434
MODEL=ai-assistant:latest
```

The project includes npm scripts for creating and running the local model:

```
# Create AI model from the provided Modelfile
npm run ollama:create

# Run the AI assistant
npm run ollama:run

# Rebuild and restart the model
npm run ollama:rebuild
```

The model configuration is located in:

```
ollama/
└── Modelfile
```

The AI service communicates with Ollama through the configured HTTP 
endpoint and can be disabled by removing the related environment variables.

> ⚠️ It is recommended to run the Ollama model through the system terminal instead of the IDE, as GPU support may not work correctly when launched from the IDE.

---

### Stripe payment setup

The application uses Stripe for payment processing and webhook handling.

To enable Stripe integration:

1. Create a Stripe account: https://dashboard.stripe.com/

2. Install Stripe CLI: `npm i -g @stripe/cli`

3. Authenticate Stripe CLI: `stripe login`

4. Start forwarding Stripe events to the local backend: `npm run stripe:webhooks`

```env
# This one you can get from your stripe profile dashboard (Step 1)
STRIPE_API_SECRET=your_stripe_test_secret_key

# After running stripe webhook you'll get your webhook key (Step 4)
# Example: whsec_0024e5e5c39f404bb8f37681ce9010ef178e34c6b6638096bb473bb2b4036111
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

### Shippo shipping setup

The application uses Shippo API for shipping rate calculation, shipping label, and delivery management.

Shippo provides integration with multiple shipping carriers and allows the application to retrieve available shipping rates based on destination address, package weight, and shipping preferences. :contentReference[oaicite:0]{index=0}

To enable shipping functionality:

1. Create a Shippo account at https://apps.goshippo.com/settings/api

2. Generate a test API key from the Shippo dashboard.

For local development add the following environment variable:

```env
POST_API_KEY=shippo_test_your_api_key
```

---

### Google OAuth setup

The application supports authentication through Google OAuth 2.0, allowing users to register and log in using their Google accounts.

To enable Google authentication:

1. Create OAuth credentials in Google Cloud Console at https://console.cloud.google.com/apis/credentials

2. Configure the OAuth consent screen and create an OAuth 2.0 Client ID.

3. Add the following environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Configure the authorized redirect URI `http://localhost:3000/api/v1/authorization/google/redirect`

The integration provides:

- New user registration through Google account;
- Existing account linking;
- Secure OAuth 2.0 authorization flow;

### Test data

The application automatically seeds the database when running in the development environment.

The seeding process creates a realistic dataset including:

- Users
- Categories
- Flower products
- Item types
- Selectionists
- Product tags
- Product pricing
- Addresses

The amount of generated data is configurable through the application configuration.

> ⚠️ Seeded data is intended for development and testing purposes only.

---

## Useful links

Once the application is running, the following services will be available:

- **http://localhost:3000**  
  Backend API entry point

- **http://localhost:3000/api/docs**  
  Swagger API documentation

- **http://localhost:8025**  
  Mailhog interface for viewing outgoing emails

---

## Environment Variables

The application is configured through environment variables. The table below describes every supported variable and its purpose.

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Application environment (`dev`, `test`, `prod`) |
| `PORT` | Backend server port |
| `ENCRYPTION_KEY` | Symmetric encryption key used by the application |
| `COOKIE_SECRET_KEY` | Secret used to sign session cookies |
| `JWT_SECRET` | Secret used to sign JWT access tokens |
| `JWT_EXPIRES_IN` | JWT token expiration time |
| `POSTGRES_URL` | PostgreSQL connection string |
| `POSTGRES_PORT` | PostgreSQL port |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `EMAIL_HOST` | SMTP server host |
| `EMAIL_SMTP_PORT` | SMTP server port |
| `EMAIL_HTTP_PORT` | MailHog web interface port |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASSWORD` | SMTP password |
| `EMAIL_FROM_ADDRESS` | Default sender email address |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_PASSWORD` | Redis password |
| `REDIS_MAX_MEMORY` | Redis maximum memory allocation |
| `SENTRY_DNS` | Sentry DSN for error monitoring |
| `S3_ACCESS_KEY_ID` | AWS S3 / LocalStack access key |
| `S3_SECRET_ACCESS_KEY` | AWS S3 / LocalStack secret key |
| `S3_REGION` | S3 region |
| `S3_ENDPOINT` | S3 endpoint (LocalStack in development) |
| `S3_PORT` | S3 service port |
| `ALLOW_CONFIG_MUTATIONS` | Allows runtime configuration mutations |
| `OLLAMA_URL` | Ollama server URL |
| `MODEL` | Ollama model name |
| `POST_API_KEY` | Shippo API key |
| `STRIPE_API_SECRET` | Stripe Secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

A complete example configuration can be found in `.env.dev`.

---

## Tech Stack

The backend is built with a modern TypeScript ecosystem focused on scalability, maintainability, and developer experience.

| Category | Technologies |
|----------|--------------|
| **Language** | TypeScript, Node.js |
| **Framework** | Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM |
| **Authentication** | JWT, Passport.js, Google OAuth 2.0 |
| **Sessions** | express-session, Redis |
| **Caching** | Redis |
| **Validation** | Joi |
| **API Documentation** | Swagger UI, swagger-autogen |
| **Payments** | Stripe |
| **Shipping** | Shippo |
| **Cloud Storage** | AWS S3 SDK, LocalStack |
| **Internationalization** | i18next |
| **Email** | Nodemailer, MailHog |
| **AI Integration** | Ollama (Qwen2.5-VL) |
| **Security** | Helmet, Express Rate Limit, CryptoJS |
| **Logging** | Winston |
| **Monitoring** | Sentry |
| **Testing** | Mocha, Chai, Supertest, Faker |
| **Linting** | ESLint |
| **Containerization** | Docker, Docker Compose |
| **Development Tools** | Nodemon, ts-node, cross-env |
| **Version Control** | Git, GitHub |

---

## Database Schema

The project uses **PostgreSQL** together with **Prisma ORM**. The schema is designed around a normalized multilingual catalog, allowing translations to be shared across products, categories, item types, tags, and florists.

### Main entities

| Entity | Description |
|---------|-------------|
| **User** | Customer and administrator accounts |
| **Address** | User shipping addresses |
| **Translation** | Multi-language strings (EN, UA, DE, SK) |
| **Category** | Product categories |
| **Good** | Flower products |
| **Pricing** | Product variants with quantity and price |
| **ItemType** | Product size/type information |
| **Selectionist** | Flower creator/florist |
| **Tag** | Product tags |
| **BasketItem** | Shopping cart items |
| **Order** | Customer orders |
| **OrderItem** | Snapshot of purchased products |
| **GoodTag** | Many-to-many relation between products and tags |


![Database Schema](./docs/screenshots/db-schema.png)
Unified Modeling Language (UML) Diagram

### Highlights

- UUID primary keys
- Soft delete support
- Automatic timestamps
- Translation-based localization
- Normalized pricing model
- Order snapshots preserve historical data
- Many-to-many product tagging
- Optimized indexes for searching and filtering


---

## Project Structure

The project follows a layered architecture with a clear separation between routing, controllers, services, and database access.

```text
flowers_shop_be/
│
├── config/                 # Environment-specific application configuration
├── locales/                # Translation files
├── ollama/                 # Local AI model configuration
├── prisma/                 # Prisma (Database) schema and migrations
├── scripts/                # Seeding and utility scripts
├── src/
│   ├── controllers/        # HTTP request handlers
│   ├── middlewares/        # Express middlewares
│   ├── routes/             # API routes
│   ├── services/           # Business logic & external integrations
│   ├── types/              # TypeScript types
│   └── utils/              # Shared utilities
│
├── tests/                  # Unit and integration tests
├── docker-compose.base.yml # Shared images for docker services
├── docker-compose.yml      # Docker services
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

---

## Backend and DevOps features

- **Dockerized Development Environment** — Complete development stack powered by Docker Compose.
- **Express + TypeScript** — Strongly typed REST API.
- **Prisma ORM** — PostgreSQL database access, migrations and schema management.
- **JWT Authentication** — Secure API authentication for emails or one time use links.
- **Google OAuth** — Sign in using Google accounts.
- **Redis Sessions** — Session storage and future caching.
- **Stripe Integration** — Secure payment processing and webhook handling.
- **Shippo Integration** — Shipping rates, shipment creation and tracking.
- **AWS S3 Compatible Storage** — Product image uploads using LocalStack or AWS S3.
- **Internationalization (i18next)** — English, Ukrainian, German and Slovak translations.
- **OpenStreetMap Integration** — Address validation and geolocation.
- **Ollama AI Integration** — Local AI assistant support.
- **Email Service** — Registration and password recovery emails.
- **Swagger Documentation** — Automatically generated REST API documentation.
- **Redis Rate Limiting** — API protection against abuse.
- **Helmet Security Policies** — Secure HTTP headers and Content Security Policy.
- **AES Encryption & SHA-256 Hashing** — Secure storage of sensitive information.
- **Soft Deletes** — Recoverable database records.
- **Logging** — Winston with daily log rotation.
- **Sentry Monitoring** — Error tracking and performance monitoring.
- **GitHub Actions** — Continuous Integration pipeline.
- **Mocha & Chai Testing** — Unit and integration tests.

# Application Overview

The Flower Shop backend powers a modern e-commerce platform for ordering flowers online.

Customers can browse the product catalogue, search for flowers, add products to their shopping basket, calculate shipping costs, complete secure payments, and track their orders.

Administrators have access to a management dashboard where they can maintain the catalogue, manage pricing, process orders, and monitor customer purchases.

---

## Application From Customer Perspective

The customer application focuses on providing a smooth shopping experience from product discovery to delivery.

Customers can:

- Browse flower categories
- Search products
- View detailed product information
- Add products to basket
- Manage quantities
- Save delivery addresses
- Calculate shipping rates
- Pay securely using Stripe
- Track order status
- Manage personal profile

### Home Page

![Home - Dark Theme](./docs/screenshots/home-dark.png)

Landing page displaying featured flower collections.

![Home - Light Theme](./docs/screenshots/home-white.png)

White theme support

---

### Shopping Basket

![Shopping Cart](./docs/screenshots/cart.png)

Customer shopping basket before checkout.

---

### Checkout

The checkout process is divided into multiple intuitive steps to provide a smooth purchasing experience. Customers are guided through entering recipient information, selecting a delivery address, choosing the preferred shipping option with real-time carrier rates provided by Shippo, securely completing the payment via Stripe, and finally reviewing the order before confirmation.

The application validates user input at every step, calculates product and shipping costs in real time, and prevents users from continuing until all required information has been provided.


![Checkout - Customer Information](./docs/screenshots/checkout-1.png)

**Step 1 – Customer Information**  
Enter the recipient's personal information including name and email address.

![Checkout - Delivery Address](./docs/screenshots/checkout-2.png)

**Step 2 – Delivery Address**  
Provide the shipping address where the flowers should be delivered.

![Checkout - Shipping Method](./docs/screenshots/checkout-3.png)

**Step 3 – Shipping Method**  
Select one of the available shipping options with real-time rates calculated by Shippo.

![Checkout - Payment](./docs/screenshots/checkout-4.png)

**Step 4 – Order Review**  
Review all order details, including products, shipping, and pricing before placing the order.

![Checkout - Order Review](./docs/screenshots/checkout-5.png)

**Step 5 – Payment**  
Complete the payment securely using Stripe. Apple Pay and Google Pay are supported on compatible devices and browsers.

![Checkout - Confirmation](./docs/screenshots/checkout-6.png)

**Step 6 – Confirmation**  
The order is successfully created and the customer receives an order confirmation.


---

### Orders

![Orders](./docs/screenshots/orders.png)

Customer order history.

---

### Order Details

![Order Details](./docs/screenshots/order-details.png)

![Order Shipping Details](./docs/screenshots/order-details-shipping.png)

Detailed order information including shipping details and tracking.
State update is available for admin only.

---

### Profile

![Profile](./docs/screenshots/profile.png)

User profile and address management.

---

## Application From Admin Perspective

The administration panel provides complete control over the product catalogue and customer orders.

Administrators can:

- Manage categories
- Manage flower products
- Upload product images
- Configure pricing
- Manage selectionists
- Manage tags
- Review customer orders
- Update order statuses
- Monitor shipping progress

### Products Management

![Goods Management](./docs/screenshots/website-management-goods.png)

Catalogue management interface.

---

### Product Editor

![Edit Product](./docs/screenshots/website-management-edit-product.png)

Create and edit flower products.

---

## Authentication Flows

The backend supports multiple authentication methods.

- Email & Password
- Google OAuth
- JWT Authentication
- Session Authentication
- Password Reset

### Sign In

![Sign In](./docs/screenshots/signin.png)

User authentication page.

---

## Basket and Checkout Flow

```text
Browse Products
        ↓
Add Product to Basket
        ↓
Update Quantities
        ↓
Provide Delivery Address
        ↓
Retrieve Shipping Rates
        ↓
Choose Shipping Method
        ↓    
Create Order
        ↓
Stripe Payment
        ↓
Retrieve invoice

```

---

## Payment Processing

Payments are handled securely through Stripe.

Features include:

- Payment Intents
- Stripe Elements
- Webhooks
- Automatic payment confirmation
- Invoice generation support
- Refund support

---

## Shipping Management

Shipping is powered by Shippo.

The backend automatically:

- Calculates shipping rates
- Creates shipments
- Stores shipping transactions
- Supports customs information
- Stores tracking numbers

---

## Email Notifications

The application sends transactional emails for important events.

Current templates include:

- User registration
- Password reset

---

## AI Assistant

The backend supports integration with locally hosted Large Language Models through Ollama.

Features include:

- Local inference
- Product assistance
- AI-powered backend endpoints
- Custom Model file configuration

---

## License

This project is licensed under the Apache-2.0 License.