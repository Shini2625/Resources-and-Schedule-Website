# Deploy Jacker on Render

## How the services fit together

This repository contains a React/Vite frontend and a Node/Express API. Deploy them as **two Render services** from the same GitHub repository:

1. **Backend:** a Render Web Service that serves the API and connects to the existing Aiven MySQL database.
2. **Frontend:** a Render Static Site that serves the built React app.

The existing Aiven database remains a separate service; it does not need to be redeployed.

## 1. Redeploy the backend API

The backend includes the signed-in shared-resource API and the forgot-password API. On startup it applies idempotent migrations that keep existing resources private and add the password-reset/session fields to `users`.

Use the existing backend Render service if it is already configured:

- **Repository:** `Shini2625/Resources-and-Schedule-Website`
- **Branch:** `main`
- **Root Directory:** `backend`
- **Build Command:** `npm ci`
- **Start Command:** `npm start`

Keep the existing Aiven, JWT, and R2 secrets on the **backend only**. Do not copy secrets into the frontend's `VITE_*` variables.

After the Static Site is created, set the backend environment variable `CLIENT_URL` to the frontend's exact origin, for example `https://jacker.onrender.com` (no path and no trailing slash), then redeploy the backend. The API uses credentialed CORS for browser authentication.

## 2. Create the frontend Static Site

In Render, create a **New → Static Site** and connect the same repository:

- **Repository:** `Shini2625/Resources-and-Schedule-Website`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm ci && npm run build`
- **Publish Directory:** `dist`
- **Environment Variable:**
  - `VITE_API_URL` = `https://jacker-cy30.onrender.com`

Use only the backend origin for `VITE_API_URL`; do **not** add `/api/v1`. The frontend API client appends that prefix automatically. Set the variable before building/deploying the Static Site.

If you add a custom domain or change the Render Static Site URL later, update the backend's `CLIENT_URL` to the new exact origin and redeploy the backend.

## 3. Configure forgot-password email

Password reset links are delivered through an SMTP email provider. In the **backend Web Service** environment settings, add:

- `SMTP_HOST` = your provider's SMTP host
- `SMTP_PORT` = `587` for STARTTLS, or `465` for implicit TLS
- `SMTP_USER` = your SMTP username
- `SMTP_PASS` = your SMTP password or provider-issued SMTP key
- `EMAIL_FROM` = a sender address verified with your email provider
- `FRONTEND_URL` = the exact frontend origin, such as `https://jacker.onrender.com`
- `SMTP_SECURE` = optional; use `true` for port `465` (the backend also enables secure mode automatically on `465`)

Keep SMTP credentials on the backend only. Keep `CLIENT_URL` set to the same frontend origin for CORS. Save the environment changes and redeploy the backend. Without the SMTP settings, the forgot-password page will explain that email reset is not yet configured. A reset link expires in 15 minutes, can be used once, and changing the password revokes existing sessions. Requests are rate-limited and the response does not reveal whether an email is registered.

To verify it, use **Forgot password?** with an account email and open the email link. If it does not arrive, check spam, the provider's verified-sender requirements, and the backend service logs.

## 4. SPA routing and R2 uploads

If Render asks for a rewrite rule, add:

- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** Rewrite

R2 readiness was checked against the live API: it reported configured, and the presigned `PUT` URL had a valid HTTPS signature. No object was uploaded during that check. For browser uploads, add the deployed frontend origin to the R2 bucket's CORS allowed origins and allow `PUT` with the `Content-Type` header. The backend environment should retain `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and (if used) `R2_PUBLIC_URL`.

## 5. Verify the deployment

1. Check the API: `https://jacker-cy30.onrender.com/api/v1/health`.
2. Open the Render Static Site, create/sign in to an account, and confirm dashboard data loads.
3. In **My courses**, add a resource and leave **Visibility** set to **Private — only you**. Confirm it shows a Private badge.
4. Change it to **Public — all signed-in Jacker users** and confirm it appears under **Shared library**. Only a signed-in account can browse that library; only the resource owner can change or delete the resource.
5. Try a small file upload after R2 bucket CORS is configured.

## Resource privacy note

The app enforces visibility on its authenticated API: private resource records are returned only to their owner, while public resource records appear in the shared library for signed-in Jacker users. **External links and any R2 URL configured as publicly accessible are still directly reachable by anyone who has that URL.** Do not use a public R2 URL for confidential files; strict private-file access would require a private bucket and authenticated, time-limited download URLs.
