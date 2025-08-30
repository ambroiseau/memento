# Memento PDF Renderer Service

A Node.js/TypeScript service for generating PDF albums from family posts and photos.

## Features

- Generate PDF albums from family posts within a date range
- A5 page format with professional layout
- Cover page with family name and period
- One post per page with images
- Footer page with branding
- Upload to Supabase Storage
- Job tracking with status updates

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env
```

3. Configure environment variables in `.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
PORT=3001
```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Build and start:
```bash
npm run build
npm start
```

## API Endpoints

### POST /render

Generate a PDF album for a family within a date range.

**Request Body:**
```json
{
  "family_id": "uuid",
  "start": "2024-01-01",
  "end": "2024-01-31",
  "requested_by": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "pdf_url": "https://...",
  "page_count": 15
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Setup

Run the SQL migration to create the required table:

```sql
-- Execute the contents of sql/create-render-jobs-table.sql
```

## Testing

Test the service with curl:

```bash
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{
    "family_id": "your-family-id",
    "start": "2024-01-01",
    "end": "2024-01-31",
    "requested_by": "your-user-id"
  }'
```

## Architecture

- **Fastify**: Web framework
- **Puppeteer**: PDF generation from HTML
- **Supabase**: Database and storage
- **TypeScript**: Type safety

## File Structure

```
src/
├── config.ts          # Configuration and environment validation
├── types.ts           # TypeScript interfaces
├── compose.ts         # HTML composition for PDF
├── server.ts          # Fastify server setup
└── handlers/
    └── render.ts      # PDF generation handler
```

## Deployment

The service can be deployed to any Node.js hosting platform:

- **Vercel**: Use `vercel.json` configuration
- **Railway**: Direct deployment from GitHub
- **Heroku**: Use Procfile
- **Docker**: Use provided Dockerfile

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes |
| `PORT` | Server port | No (default: 3001) |
