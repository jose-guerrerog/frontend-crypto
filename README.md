# 🧮 Crypto Portfolio Tracker (Frontend)

This is the frontend for a full-stack cryptocurrency portfolio tracker built with **Next.js**, **TypeScript**, and **Tailwind CSS**. Users can create portfolios, track live crypto prices, and view profit/loss over time. Powered by a Django backend and real-time WebSocket price updates from the CoinGecko API.

### 🌐 Live Demo
🔗 https://frontend-crypto-nine.vercel.app

---

## 🚀 Features

- Create and manage multiple crypto portfolios
- Submit buy/sell transactions
- View real-time price updates via WebSockets
- Track live portfolio metrics (value, P&L)
- Fully responsive UI built with Tailwind CSS
- Backend powered by Django + Redis + CoinGecko API

---

## 🛠️ Tech Stack

- **Frontend Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **Data Source:** Django REST API + WebSocket (via Django Channels)
- **Hosting:** Vercel (Frontend), Render (Backend), Neon (PostgreSQL), Redis

---

## 🔗 Backend Repository

🖥️ [backend-crypto](https://github.com/jose-guerrerog/backend-crypto)

---

## 📦 Setup & Installation

```bash
git clone https://github.com/jose-guerrerog/frontend-crypto.git
cd frontend-crypto
npm install
npm run dev
⚠️ Make sure the backend is running locally or deployed. 