# Deployment Guide for SkyBook

SkyBook is configured for a split deployment:
- **Backend**: Deployed on **Render** (Node.js + Redis).
- **Frontend**: Deployed on **Vercel** (React + Vite).

---

## 1. Backend Deployment (Render)

The project includes a `render.yaml` file that automates the backend setup.

1.  **Push your code to GitHub/GitLab**.
2.  Log in to [Render](https://dashboard.render.com/).
3.  Click **New +** -> **Blueprint**.
4.  Connect your repository.
5.  Render will detect `render.yaml` and prompt you to approve the services:
    - `skybook-api` (Web Service)
    - `skybook-redis` (Redis)
6.  **Environment Variables**:
    Render will ask for these values (defined in `render.yaml` as `sync: false`):
    - `MONGO_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas).
    - `STRIPE_SECRET_KEY`: Your Stripe Secret Key.
    - `EMAIL_USER`: Gmail address for notifications.
    - `EMAIL_PASS`: App Password for the Gmail account.
    - `CLIENT_URL`: The URL of your frontend (you will get this *after* deploying the frontend, e.g., `https://skybook.vercel.app`). For now, you can leave it blank or use `http://localhost:5173`.

7.  Click **Apply**. Render will deploy the backend and Redis.
8.  **Copy the Backend URL**: Once deployed, copy the URL of the `skybook-api` service (e.g., `https://skybook-api.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **Add New...** -> **Project**.
3.  Import your SkyBook repository.
4.  **Configure Project**:
    - **Root Directory**: Click "Edit" and select `client` (since the frontend is in the `client` folder).
    - **Framework Preset**: Vite (should be detected automatically).
    - **Environment Variables**:
      Add the following variable:
      - `VITE_API_URL`: The Backend URL you copied from Render, appended with `/api`.
        - Example: `https://skybook-api.onrender.com/api`
5.  Click **Deploy**.

---

## 3. Final Connection

1.  Once the frontend is live on Vercel, copy its URL (e.g., `https://skybook.vercel.app`).
2.  Go back to your **Render Dashboard** -> **skybook-api** -> **Environment**.
3.  Update the `CLIENT_URL` variable to your new Vercel URL.
4.  Save changes. Render will automatically redeploy.

## Troubleshooting

- **CORS Errors**: Ensure `CLIENT_URL` in Render matches your Vercel URL exactly (no trailing slash).
- **Socket Connection Failed**: Ensure `VITE_API_URL` is set correctly in Vercel. The app automatically handles stripping `/api` for the socket connection.
