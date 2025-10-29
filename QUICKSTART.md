# Quick Start Guide

Get MindScribe running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] AssemblyAI API key
- [ ] DeepSeek API key

## 5-Minute Setup

### 1. Create Database (1 minute)

```bash
# Create the database
createdb mindscribe

# Or using psql
psql postgres -c "CREATE DATABASE mindscribe;"
```

### 2. Backend Setup (2 minutes)

```bash
# Navigate to server folder
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env and set these REQUIRED values:
# - PGPASSWORD (your PostgreSQL password)
# - ASSEMBLYAI_API_KEY
# - DEEPSEEK_API_KEY

# Start the server
npm run dev
```

Server starts on http://localhost:3001

### 3. Frontend Setup (2 minutes)

```bash
# Open a new terminal
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend starts on http://localhost:5173

## Verify It's Working

1. Open http://localhost:5173 in your browser
2. You should see the MindScribe dashboard
3. Check backend: http://localhost:3001/health

## Test the Full Flow

### Option A: With a Real Recording

1. Click "Start New Session"
2. Allow microphone access
3. Click the red mic button
4. Speak for 10-20 seconds
5. Click "End Session & Transcribe"
6. Wait 1-3 minutes for transcription
7. Clinical notes will be generated automatically

### Option B: With a Test File

```bash
# Download a test audio file
curl -o test.mp3 "https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3"

# Create a session and get the ID
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"patientId": "test-patient-id"}' | jq -r '.sessionId')

# Upload the audio
curl -X POST http://localhost:3001/api/sessions/$SESSION_ID/recording \
  -F "audio=@test.mp3"

# Check progress
curl http://localhost:3001/api/sessions/$SESSION_ID | jq .session.transcription_status

# When completed, generate notes
curl -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"noteType\": \"soap\"}"
```

## Common Issues

### "Database connection error"
```bash
# Check PostgreSQL is running
pg_isready

# If not running (macOS):
brew services start postgresql@14
```

### "Module not found"
```bash
# Make sure you ran npm install
cd server && npm install
cd ../client && npm install
```

### "Port already in use"
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

## What's Next?

- Read [SETUP.md](./SETUP.md) for detailed configuration
- See [API_TESTING.md](./API_TESTING.md) for API testing
- Check [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) for architecture details

## Getting API Keys

### AssemblyAI
1. Go to https://www.assemblyai.com/
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key

### DeepSeek
1. Go to https://platform.deepseek.com/
2. Create an account
3. Navigate to API keys section
4. Generate a new API key
5. Copy the key

## Environment Variables Quick Reference

### Backend `.env` (Required)
```env
PGPASSWORD=your_postgres_password
ASSEMBLYAI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
```

### Frontend `.env` (Optional)
```env
VITE_API_URL=http://localhost:3001/api
```

## Need Help?

1. Check the server console for error messages
2. Check browser console (F12) for frontend errors
3. Verify all environment variables are set
4. Make sure PostgreSQL is running
5. Ensure ports 3001 and 5173 are available

## Success Indicators

✅ Backend server shows startup banner
✅ Frontend opens in browser without errors
✅ Can navigate between pages
✅ Can access http://localhost:3001/health
✅ Database tables created automatically

If all checks pass, you're ready to record sessions!
