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
- [Team](#team)
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
git clone https://github.com/kot-1999/RestB_BE.git
```

**2. Enter the directory:**

```terminaloutput
cd RestB_BE
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
