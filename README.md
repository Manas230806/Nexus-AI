# Nexus AI

Nexus AI is a full-stack collaboration platform that combines real-time chat, authenticated workspaces, project organization, note-taking, file uploads, and AI-assisted conversation history.

## What this project includes

- Full-stack architecture with a TypeScript backend and a Next.js frontend
- Real-time messaging powered by Socket.IO
- JWT authentication for secure user sessions
- MongoDB database for users, workspaces, messages, notes, and AI conversations
- A structured workspace UI for chat rooms, channels, and project data
- Docker Compose support for local development

## Tech stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Socket.IO client
- Backend: Node.js, Express, TypeScript, Mongoose, JWT, Socket.IO server
- Database: MongoDB
- Containerization: Docker Compose

## Repository structure

- `frontend/` — Next.js app router frontend with chat UI, auth pages, and workspace components
- `backend/` — Express API server with auth, REST APIs, Socket.IO message handling, and MongoDB models
- `docker-compose.yml` — Local compose stack for MongoDB, backend, and frontend

## Features

- User registration and login with JWT authentication
- Protected workspace and chat routes
- Real-time chat rooms and message broadcasting
- Message history retrieval and live updates
- AI conversation storage and backend API scaffolding
- File upload support and team workspace data models

## Requirements

- Node.js 20+
- npm
- MongoDB running locally or via Docker

## Environment setup

Create a `.env` file in `backend/`:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/nexus_ai
JWT_SECRET=supersecret
```

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Local development

From the repo root:

```bash
npm install
npm run dev
```

Then visit:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`

### Run backend only

```bash
npm --workspace backend run dev
```

### Run frontend only

```bash
npm --workspace frontend run dev
```

## Build for production

```bash
npm run build
```

## Docker

Use Docker Compose for a local stack:

```bash
docker compose up --build
```

This starts:

- MongoDB on `27017`
- Backend on `4000`
- Frontend on `3000`

## Notes

- The backend server connects to MongoDB and exposes authenticated REST and Socket.IO APIs.
- The frontend uses Next.js with client-side chat components and workspace routing.
- If you want, I can also add a polished `.env.example` and more detailed deployment instructions.

