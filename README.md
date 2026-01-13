# SkyBook - Flight Booking System ✈️

SkyBook is a comprehensive, full-stack flight booking application built with the MERN stack (MongoDB, Express, React, Node.js). It features real-time seat availability updates, distributed locking for seat selection, secure payments via Stripe, and email notifications.

![SkyBook Banner](https://via.placeholder.com/1200x400?text=SkyBook+Flight+Reservation+System)

## 🚀 Features

-   **User Authentication**: Secure JWT-based signup and login.
-   **Flight Search**: Search for flights by source, destination, and date.
-   **Real-Time Seat Booking**:
    -   Interactive seat map.
    -   **Distributed Locking (Redis)**: Prevents double-booking by locking seats for 10 minutes during the payment process.
    -   **Real-Time Updates (Socket.io)**: Instantly reflects locked/booked seats across all connected clients.
-   **Secure Payments**: Integrated with **Stripe** for secure credit card transactions.
-   **Booking Management**:
    -   View booking history.
    -   Download/Print Invoices.
    -   Email confirmations (Nodemailer).
-   **Admin Dashboard**:
    -   Add, update, and delete flights.
    -   View all bookings for a specific flight.

## 🛠 Tech Stack

### Frontend
-   **React (Vite)**: Fast, modern UI library.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **Socket.io-client**: For real-time event handling.
-   **Axios**: For API requests.

### Backend
-   **Node.js & Express**: Robust REST API.
-   **MongoDB & Mongoose**: NoSQL database for flexible data modeling.
-   **Redis**: In-memory data store for distributed seat locking and caching.
-   **Socket.io**: Real-time bidirectional communication.
-   **Stripe API**: Payment processing.
-   **Nodemailer**: Email services.

## 📋 Prerequisites

Before running this project, ensure you have the following installed:
-   [Node.js](https://nodejs.org/) (v14+)
-   [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas)
-   [Redis](https://redis.io/download/) (Local or Cloud)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/suvomx1999/SkyBook.git
    cd SkyBook
    ```

2.  **Install Backend Dependencies**
    ```bash
    npm install
    ```

3.  **Install Frontend Dependencies**
    ```bash
    cd client
    npm install
    cd ..
    ```

4.  **Environment Variables**
    Create a `.env` file in the root directory and add the following:
    ```env
    NODE_ENV=development
    PORT=5001
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret_key
    STRIPE_SECRET_KEY=your_stripe_secret_key
    EMAIL_USER=your_email_address
    EMAIL_PASS=your_email_app_password
    CLIENT_URL=http://localhost:5173
    ```

    Create a `.env` file in the `client` directory:
    ```env
    VITE_API_URL=http://localhost:5001/api
    VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
    ```

5.  **Run the Application**
    You need three terminals:

    *Terminal 1: Redis Server*
    ```bash
    redis-server
    ```

    *Terminal 2: Backend Server*
    ```bash
    npm run server
    ```

    *Terminal 3: Frontend Client*
    ```bash
    npm run dev
    ```

    Access the app at `http://localhost:5173`.

## 👑 Admin Setup

By default, new users are regular users. To create an admin user:

**Local Development:**
```bash
node src/scripts/makeAdmin.js admin@example.com mypassword "Admin Name"
```

**Production:**
1.  Connect to your production DB.
2.  Run the script locally pointing to the prod DB.
    ```bash
    MONGO_URI=your_prod_mongo_uri node src/scripts/makeAdmin.js admin@example.com mypassword "Admin Name"
    ```

## 🚀 Deployment

### Backend (Render)
1.  Push code to GitHub.
2.  Create a **Web Service** on Render.
3.  Connect your repo.
4.  Add Environment Variables (`MONGO_URI`, `STRIPE_SECRET_KEY`, etc.).
5.  Deploy.

### Frontend (Vercel)
1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Set `Root Directory` to `client`.
4.  Add `VITE_API_URL` environment variable (Your Render Backend URL).
5.  Deploy.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request.

## 📄 License

This project is licensed under the MIT License.
