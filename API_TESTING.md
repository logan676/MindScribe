# API Testing Guide

This guide provides example curl commands to test all API endpoints.

## Prerequisites

- Backend server running on `http://localhost:3001`
- PostgreSQL database set up and running
- API keys configured in `.env`

## Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

## API Info

```bash
curl http://localhost:3001/api
```

## Sessions API

### Create a New Session

First, you'll need a patient ID. For testing, let's create one directly in the database:

```sql
-- Connect to PostgreSQL
psql mindscribe

-- Create a test user
INSERT INTO users (email, first_name, last_name, role)
VALUES ('test@example.com', 'Test', 'Clinician', 'clinician')
RETURNING id;

-- Note the user ID, then create a test patient
INSERT INTO patients (user_id, first_name, last_name, client_id, date_of_birth)
VALUES ('YOUR_USER_ID', 'John', 'Doe', 'TEST001', '1990-01-01')
RETURNING id;
```

Now create a session:

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "YOUR_PATIENT_ID"
  }'
```

### Get All Sessions

```bash
curl http://localhost:3001/api/sessions
```

### Get Single Session

```bash
curl http://localhost:3001/api/sessions/SESSION_ID
```

### Upload Recording

```bash
curl -X POST http://localhost:3001/api/sessions/SESSION_ID/recording \
  -F "audio=@/path/to/your/audio/file.webm"
```

### Update Session

```bash
curl -X PATCH http://localhost:3001/api/sessions/SESSION_ID \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "endTime": "2024-01-01T12:00:00Z"
  }'
```

## Clinical Notes API

### Generate Note with AI

```bash
curl -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "noteType": "soap"
  }'
```

Or for DARE notes:

```bash
curl -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "noteType": "dare"
  }'
```

### Create Note Manually

```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "YOUR_SESSION_ID",
    "type": "soap",
    "subjective": "Patient reports feeling anxious.",
    "objective": "Patient appears alert and oriented.",
    "assessment": "Generalized Anxiety Disorder.",
    "plan": "Continue CBT therapy."
  }'
```

### Get Note

```bash
curl http://localhost:3001/api/notes/NOTE_ID
```

### Update Note

```bash
curl -X PUT http://localhost:3001/api/notes/NOTE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "subjective": "Updated subjective section.",
    "plan": "Updated treatment plan."
  }'
```

### Sign Note

```bash
curl -X POST http://localhost:3001/api/notes/NOTE_ID/sign
```

### Get Notes for Session

```bash
curl http://localhost:3001/api/notes/session/SESSION_ID
```

## Testing Workflow

### Complete End-to-End Test

1. **Create a session:**
```bash
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"patientId": "YOUR_PATIENT_ID"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
echo "Created session: $SESSION_ID"
```

2. **Upload audio recording:**
```bash
curl -X POST http://localhost:3001/api/sessions/$SESSION_ID/recording \
  -F "audio=@test-recording.webm"
```

3. **Wait for transcription to complete** (check logs or poll the session endpoint)

4. **Generate clinical note:**
```bash
NOTE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"noteType\": \"soap\"}")

NOTE_ID=$(echo $NOTE_RESPONSE | jq -r '.note.id')
echo "Generated note: $NOTE_ID"
```

5. **Update the note:**
```bash
curl -X PUT http://localhost:3001/api/notes/$NOTE_ID \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "Continue therapy with focus on stress management."
  }'
```

6. **Sign the note:**
```bash
curl -X POST http://localhost:3001/api/notes/$NOTE_ID/sign
```

## Error Testing

### Test Invalid Session ID

```bash
curl http://localhost:3001/api/sessions/invalid-id
```

Expected: 404 Not Found

### Test Missing Required Fields

```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: 400 Bad Request

### Test Invalid Note Type

```bash
curl -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "noteType": "invalid"
  }'
```

Expected: 400 Bad Request

## Monitoring Transcription Progress

The transcription happens asynchronously. You can monitor progress by repeatedly querying the session:

```bash
# Check every 5 seconds
watch -n 5 'curl -s http://localhost:3001/api/sessions/SESSION_ID | jq .session.transcription_status'
```

Possible statuses:
- `pending` - Transcription queued
- `in_progress` - Currently transcribing
- `completed` - Transcription finished
- `failed` - Transcription failed

## Database Verification

You can verify the data in PostgreSQL:

```bash
# Connect to database
psql mindscribe

# Check sessions
SELECT id, patient_id, status, transcription_status, created_at
FROM sessions
ORDER BY created_at DESC
LIMIT 5;

# Check transcript segments
SELECT session_id, speaker, substring(text, 1, 50) as text_preview
FROM transcript_segments
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY start_time;

# Check clinical notes
SELECT id, session_id, type, status, signed_at
FROM clinical_notes
ORDER BY created_at DESC
LIMIT 5;
```

## Testing AssemblyAI Integration

To test the AssemblyAI integration with a sample audio file:

1. **Get a test audio file:**
```bash
# Download a sample audio file
curl -o test-audio.mp3 "https://github.com/AssemblyAI-Examples/audio-examples/raw/main/20230607_me_canadian_wildfires.mp3"
```

2. **Create session and upload:**
```bash
SESSION_ID="..."  # From create session response
curl -X POST http://localhost:3001/api/sessions/$SESSION_ID/recording \
  -F "audio=@test-audio.mp3"
```

3. **Monitor server logs** to see transcription progress

## Testing DeepSeek Integration

Once you have a session with a completed transcript:

```bash
curl -X POST http://localhost:3001/api/notes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_WITH_TRANSCRIPT",
    "noteType": "soap"
  }'
```

The response will contain AI-generated clinical notes.

## Performance Testing

### Test Large File Upload

```bash
# Create a large audio file (for testing)
dd if=/dev/zero of=large-audio.webm bs=1M count=100

# Upload it
time curl -X POST http://localhost:3001/api/sessions/SESSION_ID/recording \
  -F "audio=@large-audio.webm"
```

### Concurrent Requests

```bash
# Test multiple sessions being created at once
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/sessions \
    -H "Content-Type: application/json" \
    -d '{"patientId": "YOUR_PATIENT_ID"}' &
done
wait
```

## Troubleshooting

If you encounter issues:

1. **Check server logs** - Most errors will be logged
2. **Verify database connection** - Ensure PostgreSQL is running
3. **Check API keys** - Verify AssemblyAI and DeepSeek keys are correct
4. **Inspect network tab** - Use browser DevTools for frontend testing
5. **Check file permissions** - Ensure uploads/ directory is writable

## Using Postman

Import this collection into Postman for easier testing:

```json
{
  "info": {
    "name": "MindScribe API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/health"
      }
    },
    {
      "name": "Create Session",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/sessions",
        "body": {
          "mode": "raw",
          "raw": "{\"patientId\": \"YOUR_PATIENT_ID\"}"
        }
      }
    }
  ]
}
```

Save this as `mindscribe-api.postman_collection.json` and import into Postman.
