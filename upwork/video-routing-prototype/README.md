
---

##  Video Routing Prototype Local + VPS Instructions


#  Real-Time Admin/Client Camera Monitoring System

This project enables live camera routing using:

- Node.js + Socket.io backend (real-time logic)
- React + Vite frontend (admin panel + client view)
- VDO.Ninja (camera streaming)
- In-memory session tracking (admins, clients, assignments)

---

##  Project Structure

```

.
├── server/        ← Node.js (Socket.io API)
│   ├── server.ts
│   └── .env
├── client/        ← React + Vite frontend
│   ├── src/
│   └── .env
└── README.md

````

---

##  Requirements

```bash
# Node.js and npm
sudo apt update && sudo apt install nodejs npm -y

# Optional (recommended)
npm install -g pnpm pm2 serve
````

---

##  LOCAL DEVELOPMENT (Testing Setup)

### 1. Clone & Install

```bash
git clone https://github.com/kena-wakwoya/videorouting.git
cd videorouting
```

---

### 2. Start Backend (API)

```bash
cd server
npm install

# .env (for local dev)
echo "PORT=4000" > .env

# Start with ts-node
npx ts-node server.ts
```

---

### 3. Start Frontend (React + Vite)

```bash
cd ../client
npm install

# .env for local dev
echo "VITE_SOCKET_URL=http://localhost:4000" > .env

# Start Vite dev server
npm run dev
```

---

### 4. Open in Browser (Local Test)

* **Admin:** [http://localhost:5173/admin/admin1](http://localhost:5173/admin/admin1)
* **Client:** [http://localhost:5173/client/client_123456](http://localhost:5173/client/client_123456)


---

## VPS DEPLOYMENT (Production Setup)

### 1. Backend Setup (API)

```bash
cd server
npm install

# .env for VPS
echo "PORT=4000" > .env

# Run with PM2
pm2 start server.ts --name socket-api --interpreter ts-node
```

---

### 2. Frontend Setup (Vite Build)

```bash
cd ../client
npm install

# .env for VPS
echo "VITE_SOCKET_URL=http://<your-vps-ip>:4000" > .env

# Build the frontend
npm run build

# Serve the built app (optional way):
serve -s dist -l 3000

# OR use PM2:
pm2 serve dist 3000 --name client-ui
```

---

### 3. Open on Browser

* `http://<your-vps-ip>:3000/admin/admin3`
* `http://<your-vps-ip>:3000/client/client_987654`

---



## VPS WITH PM2 Commands

```bash
pm2 list                      # Show all processes
pm2 logs socket-api          # View API logs
pm2 logs client-ui           # View frontend logs
pm2 restart all              # Restart all apps
pm2 save                     # Save config for reboot
```

---



---

## How to Create a VDO.Ninja Stream for a Client

To allow each client to broadcast their camera, you will use [VDO.Ninja](https://vdo.ninja)'s **"push"** mode.

### Step-by-Step: Create Camera Stream for Client

1. Open this in your browser (replace `client_123456` with actual client ID):

```

[https://vdo.ninja/?push=client\_123456](https://vdo.ninja/?push=client_123456)

```

2. Allow camera/mic access in the browser

3. You’ll see a live camera preview — that means the stream is active

4. Now when this client is **connected to the socket server**, admins can view the stream in real-time

- So the admin doesn't need to install anything — just click and watch


