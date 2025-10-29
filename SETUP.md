# MindScribe - Setup Guide

Complete step-by-step guide to set up and run the MindScribe application locally.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and npm
- **PostgreSQL** 14+ database server
- **Git** (optional, for version control)

## API Keys Required

You'll need to sign up for the following services and obtain API keys:

1. **AssemblyAI** - For audio transcription
   - Sign up at: https://www.assemblyai.com/
   - Get your API key from the dashboard

2. **DeepSeek** - For AI-powered clinical note generation
   - Sign up at: https://platform.deepseek.com/
   - Get your API key from the dashboard

## Step 1: Database Setup

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE mindscribe;

# Create user (optional)
CREATE USER mindscribe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mindscribe TO mindscribe_user;

# Exit
\q
```

## Step 2: Backend Setup

### 1. Navigate to server directory
```bash
cd server
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Configuration in `.env`:**
```env
# Database - Update with your credentials
PGHOST=localhost
PGPORT=5432
PGDATABASE=mindscribe
PGUSER=postgres
PGPASSWORD=your_actual_password

# API Keys - REQUIRED
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# JWT Secret - Generate a secure random string
JWT_SECRET=generate_a_secure_random_string_here

# Other settings (defaults are fine for development)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
```

### 4. Build TypeScript
```bash
npm run build
```

### 5. Start the server
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will:
- Automatically create all database tables on first run
- Start on http://localhost:3001
- Display a startup banner when ready

## Step 3: Frontend Setup

### 1. Open a new terminal and navigate to client directory
```bash
cd client
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables (optional)
```bash
# Copy the example file
cp .env.example .env

# The default values should work for local development
```

### 4. Start the development server
```bash
npm run dev
```

The frontend will start on http://localhost:5173

## Step 4: Verify Installation

### Test Backend
Open your browser or use curl:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### Test Frontend
Open your browser and navigate to:
```
http://localhost:5173
```

You should see the MindScribe dashboard.

## Step 5: Test the Application

### 1. Start a Recording Session
1. Click "Start New Session" on the dashboard
2. Allow microphone access when prompted
3. Click the red microphone button to start recording
4. Speak for a few seconds
5. Click "End Session & Transcribe"

### 2. View Transcription Progress
- The page will show the transcription progress
- AssemblyAI will process the audio (takes 1-3 minutes)
- You'll be redirected to the clinical notes page when complete

### 3. Generate Clinical Notes
- The transcript will appear on the left side
- Click "Generate Notes" to create SOAP/DARE notes using AI
- Edit the generated notes as needed
- Click "Finalize & Sign" when complete

## Common Issues and Solutions

### Issue: "Database connection error"
**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check your database credentials in `.env`
- Ensure the database exists: `psql -l`

### Issue: "Failed to upload audio"
**Solution:**
- Check that the `uploads/` directory exists
- Verify the `UPLOAD_DIR` path in `.env`
- Check file size limits in `.env`

### Issue: "Transcription failed"
**Solution:**
- Verify your AssemblyAI API key is correct
- Check AssemblyAI account has credits
- Review server logs for detailed error messages

### Issue: "Note generation failed"
**Solution:**
- Verify your DeepSeek API key is correct
- Check DeepSeek account status
- Review server logs for API errors

### Issue: "CORS errors in browser"
**Solution:**
- Verify `CORS_ORIGIN` in server `.env` matches frontend URL
- Restart the backend server after changing `.env`

## Development Workflow

### Running Tests (when implemented)
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test

# E2E tests
npm run test:e2e
```

### Building for Production

**Frontend:**
```bash
cd client
npm run build
# Output will be in client/dist/
```

**Backend:**
```bash
cd server
npm run build
# Output will be in server/dist/
```

## Project Structure

```
NovoPsych/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks (including useAudioRecorder)
│   │   ├── services/          # API client
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Main app component
│   └── package.json
│
├── server/                     # Express backend
│   ├── src/
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic (AssemblyAI, DeepSeek)
│   │   ├── config/            # Database configuration
│   │   ├── types/             # TypeScript types
│   │   └── index.ts           # Server entry point
│   ├── uploads/               # Audio file storage
│   └── package.json
│
├── README.md                   # Project overview
├── SETUP.md                    # This file
└── .gitignore
```

## Next Steps

After successful setup:

1. **Review Security**: Update all secret keys and passwords
2. **Configure OAuth**: Set up Google/Microsoft OAuth for production
3. **Set up HTTPS**: Use SSL certificates for production deployment
4. **Configure Backups**: Set up automated database backups
5. **Review HIPAA Compliance**: Ensure all security requirements are met

## Getting Help

If you encounter issues:

1. Check the server logs in the terminal
2. Check browser console for frontend errors
3. Review the API endpoint documentation in README.md
4. Verify all environment variables are set correctly

## Production Deployment

For production deployment, you'll need to:

1. Use a production-ready PostgreSQL instance
2. Set `NODE_ENV=production`
3. Use strong, unique secrets for JWT and encryption
4. Enable HTTPS with SSL certificates
5. Set up proper CORS policies
6. Configure file storage (e.g., AWS S3) instead of local storage
7. Set up monitoring and logging
8. Implement rate limiting and security headers

See the deployment guide (coming soon) for detailed instructions.
