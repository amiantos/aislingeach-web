# Aislingeach Web

A locally-run web application for generating AI images using the AI Horde network.

## Features

- Submit image generation requests to AI Horde
- Track ongoing and recent requests
- Browse generated images in a photo library view
- Filter images by request or keywords
- Sequential request processing to avoid overwhelming the Horde servers

## Tech Stack

- **Backend**: Express.js with SQLite database
- **Frontend**: Vue 3 with Vite
- **Storage**: File system for images, SQLite for metadata

## Development

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Create a `.env` file with your AI Horde API key:
   ```
   HORDE_API_KEY=your_api_key_here
   PORT=8005
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

   - Backend runs on http://localhost:8005
   - Frontend runs on http://localhost:5178

## Docker Deployment

```bash
docker-compose up -d
```

The application will be available at http://localhost:8005

## Project Structure

```
aislingeach-web/
├── server/           # Express backend
│   ├── db/          # Database setup and models
│   ├── routes/      # API endpoints
│   ├── services/    # Business logic (Horde API, queue manager)
│   └── server.js    # Entry point
├── vue_client/      # Vue 3 frontend
├── data/            # Persistent storage (images, database)
└── docker-compose.yml
```
