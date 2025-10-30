# Enhanced Backend Processing Logs - Troubleshooting Guide

## Overview

This document explains the enhanced logging system added to the MindScribe backend to track every step of the processing pipeline for easy troubleshooting.

## Log Locations

- **Console Output**: All logs appear in the terminal when running `npm run dev`
- **Log Files**:
  - `server/logs/application-YYYY-MM-DD.log` - All logs (14-day retention)
  - `server/logs/error-YYYY-MM-DD.log` - Error logs only (30-day retention)

## Processing Pipeline Overview

```
1. Audio Upload → 2. Transcription Pipeline → 3. AI Note Generation
```

---

## 1. Audio Upload Process

### Log Markers

```
📤 ========== AUDIO UPLOAD STARTED ==========
📁 Audio file received
💾 Saving file path to database
✅ File path saved to database successfully
🚀 Starting async transcription pipeline
✅ ========== AUDIO UPLOAD COMPLETED ==========
```

### Example Log Output

```log
2025-10-30 19:35:52 [info]: 📤 ========== AUDIO UPLOAD STARTED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:35:52 [info]: 📁 Audio file received
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  filename: "recording.webm"
  size: "2.45 MB"
  mimetype: "audio/webm"
  path: "uploads/recording-1234567890.webm"

2025-10-30 19:35:52 [info]: 💾 Saving file path to database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:35:52 [info]: ✅ File path saved to database successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  status: "processing"

2025-10-30 19:35:52 [info]: 🚀 Starting async transcription pipeline
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:35:52 [info]: ✅ ========== AUDIO UPLOAD COMPLETED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
```

### Troubleshooting Upload Issues

**Issue**: No audio file received
```log
❌ Audio upload failed: No file provided
```
**Solution**: Check frontend recorder, ensure file is being sent in multipart/form-data

**Issue**: Session not found in database
```log
❌ Session not found in database
```
**Solution**: Verify session was created before upload, check session ID

---

## 2. Transcription Pipeline (7 Steps)

### Log Markers

```
🎬 ========== TRANSCRIPTION PIPELINE STARTED ==========
📝 Step 1/7: Initializing transcription
📂 Step 2/7: Reading audio file from disk
☁️ Step 3/7: Uploading audio to AssemblyAI
🎤 Step 4/7: Creating transcription job with speaker diarization
⏳ Step 5/7: Polling for transcription completion
🗣️ Step 6/7: Processing utterances (speaker diarization)
💾 Step 7/7: Saving transcript segments to database
🎉 ========== TRANSCRIPTION PIPELINE COMPLETED ==========
```

### Detailed Step-by-Step Logs

#### **Step 1: Initialize**
```log
2025-10-30 19:35:52 [info]: 🎬 ========== TRANSCRIPTION PIPELINE STARTED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:35:52 [info]: 📝 Step 1/7: Initializing transcription
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:35:52 [info]: ✅ Step 1/7: Database updated - status set to "pending"
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
```

#### **Step 2: Read Audio File**
```log
2025-10-30 19:35:52 [info]: 📂 Step 2/7: Reading audio file from disk
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  filePath: "uploads/recording-1234567890.webm"

2025-10-30 19:35:52 [info]: ✅ Step 2/7: Audio file read successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  fileSize: "2.45 MB"
  bufferSize: "2.45 MB"
  readTime: "23ms"
```

#### **Step 3: Upload to AssemblyAI**
```log
2025-10-30 19:35:53 [info]: ☁️ Step 3/7: Uploading audio to AssemblyAI
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  bufferSize: "2.45 MB"

2025-10-30 19:35:55 [info]: ✅ Step 3/7: Audio uploaded to AssemblyAI successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  audioUrl: "https://cdn.assemblyai.com/upload/..."
  uploadTime: "1842ms"
  uploadSpeed: "1.33 MB/s"
```

#### **Step 4: Create Transcription Job**
```log
2025-10-30 19:35:55 [info]: 🎤 Step 4/7: Creating transcription job with speaker diarization
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  features: ["speaker_labels", "punctuate", "format_text"]
  language: "en"

2025-10-30 19:35:55 [info]: ✅ Step 4/7: Transcription job created
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."
  createTime: "341ms"

2025-10-30 19:35:55 [info]: 💾 Database updated - status set to "in_progress"
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
```

#### **Step 5: Poll for Completion**
```log
2025-10-30 19:35:55 [info]: ⏳ Step 5/7: Polling for transcription completion (checks every 3s)
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."

2025-10-30 19:35:55 [info]: 🔄 Poll #1: Transcription status = "queued"
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."
  elapsedTime: "0.1s"

2025-10-30 19:35:58 [info]: 🔄 Poll #2: Transcription status = "processing"
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."
  elapsedTime: "3.2s"

2025-10-30 19:36:01 [info]: 🔄 Poll #3: Transcription status = "processing"
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."
  elapsedTime: "6.3s"

2025-10-30 19:36:04 [info]: ✅ Step 5/7: Transcription completed by AssemblyAI
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  transcriptId: "5f8e3b2a-..."
  pollCount: 4
  totalWaitTime: "9.5s"
  averagePollTime: "2.4s"
  transcriptStatus: "completed"
  audioLength: "145s"
```

#### **Step 6: Process Utterances**
```log
2025-10-30 19:36:04 [info]: 🗣️ Step 6/7: Processing utterances (speaker diarization)
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:36:04 [info]: ✅ Step 6/7: Utterances processed successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  totalUtterances: 42
  processTime: "15ms"
  speakers:
    therapist: 21
    client: 21
  averageConfidence: "0.923"
```

#### **Step 7: Save to Database**
```log
2025-10-30 19:36:04 [info]: 💾 Step 7/7: Saving transcript segments to database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  segmentCount: 42

2025-10-30 19:36:04 [info]: 💾 Progress: 10/42 segments saved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  progress: "23.8%"

2025-10-30 19:36:04 [info]: 💾 Progress: 20/42 segments saved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  progress: "47.6%"

2025-10-30 19:36:04 [info]: 💾 Progress: 30/42 segments saved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  progress: "71.4%"

2025-10-30 19:36:04 [info]: 💾 Progress: 40/42 segments saved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  progress: "95.2%"

2025-10-30 19:36:04 [info]: 💾 Progress: 42/42 segments saved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  progress: "100.0%"

2025-10-30 19:36:04 [info]: ✅ Step 7/7: All transcript segments saved to database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  segmentCount: 42
  saveTime: "342ms"
  averageTimePerSegment: "8.1ms"
```

#### **Final Summary**
```log
2025-10-30 19:36:04 [info]: 🏁 Finalizing session status
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:36:04 [info]: 🎉 ========== TRANSCRIPTION PIPELINE COMPLETED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  totalDuration: "12.85s"
  breakdown:
    readFile: "23ms"
    uploadToAssemblyAI: "1842ms"
    createTranscript: "341ms"
    waitForCompletion: "9.5s"
    processUtterances: "15ms"
    saveToDatabase: "342ms"
  results:
    totalSegments: 42
    therapistSegments: 21
    clientSegments: 21
```

### Troubleshooting Transcription Issues

**Issue**: File read error
```log
❌ ========== TRANSCRIPTION FAILED ==========
error: "ENOENT: no such file or directory"
```
**Solution**: Check file path is correct, verify uploads directory exists and has proper permissions

**Issue**: AssemblyAI upload failure
```log
❌ ========== TRANSCRIPTION FAILED ==========
error: "AssemblyAI upload failed: 401 Unauthorized"
```
**Solution**: Check ASSEMBLYAI_API_KEY in .env file is valid

**Issue**: Transcription job fails
```log
❌ ========== TRANSCRIPTION FAILED ==========
error: "Transcription failed: Audio file format not supported"
```
**Solution**: Ensure audio format is supported (webm, mp3, wav, etc.)

**Issue**: Database save error
```log
❌ ========== TRANSCRIPTION FAILED ==========
error: "invalid input syntax for type integer: \"1.6\""
```
**Solution**: This was fixed in the recent schema update. Ensure migrations ran successfully.

---

## 3. AI Note Generation Process

### Log Markers

```
🧠 ========== AI NOTE GENERATION STARTED ==========
📝 Step 1/5: Validating request
📂 Step 2/5: Fetching transcript segments from database
📝 Step 3/5: Formatting transcript for AI processing
🤖 Step 4/5: Calling DeepSeek API to generate clinical note
💾 Step 5/5: Saving clinical note to database
🎉 ========== AI NOTE GENERATION COMPLETED ==========
```

### Detailed Step-by-Step Logs

#### **Step 1: Validation**
```log
2025-10-30 19:36:10 [info]: 🧠 ========== AI NOTE GENERATION STARTED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "soap"

2025-10-30 19:36:10 [info]: 📝 Step 1/5: Validating request
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "soap"

2025-10-30 19:36:10 [info]: ✅ Step 1/5: Validation passed
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "soap"
```

#### **Step 2: Fetch Transcript**
```log
2025-10-30 19:36:10 [info]: 📂 Step 2/5: Fetching transcript segments from database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:36:10 [info]: ✅ Step 2/5: Transcript segments fetched successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  segmentCount: 42
  queryTime: "15ms"
  speakers:
    therapist: 21
    client: 21
```

#### **Step 3: Format Transcript**
```log
2025-10-30 19:36:10 [info]: 📝 Step 3/5: Formatting transcript for AI processing
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:36:10 [info]: 👤 Fetching patient context
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"

2025-10-30 19:36:10 [info]: ✅ Patient context retrieved
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  patientName: "John Doe"

2025-10-30 19:36:10 [info]: ✅ Step 3/5: Transcript formatted successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  formatTime: "2ms"
  transcriptSize: "8.32 KB"
  transcriptLength: 8521
  wordCount: 1432
  estimatedTokens: 1862
```

#### **Step 4: Call DeepSeek AI**
```log
2025-10-30 19:36:10 [info]: 🤖 Step 4/5: Calling DeepSeek API to generate clinical note
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "SOAP"
  patientName: "John Doe"
  transcriptWordCount: 1432

2025-10-30 19:36:15 [info]: ✅ Step 4/5: AI clinical note generated successfully
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "SOAP"
  apiDuration: "4.82s"
  sections:
    subjective: "342 chars"
    objective: "287 chars"
    assessment: "456 chars"
    plan: "398 chars"
    description: "none"
    action: "none"
    response: "none"
    evaluation: "none"
```

#### **Step 5: Save to Database**
```log
2025-10-30 19:36:15 [info]: 💾 Step 5/5: Saving clinical note to database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "soap"

2025-10-30 19:36:15 [info]: ✅ Step 5/5: Clinical note saved to database
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteId: "9d2f4c1a-..."
  saveTime: "12ms"

2025-10-30 19:36:15 [info]: 🎉 ========== AI NOTE GENERATION COMPLETED ==========
  sessionId: "a1e7957c-5b21-47b5-b992-36c3648d186d"
  noteType: "SOAP"
  noteId: "9d2f4c1a-..."
  totalDuration: "4837ms"
  breakdown:
    fetchTranscript: "15ms"
    formatTranscript: "2ms"
    aiGeneration: "4820ms"
    saveToDatabase: "12ms"
```

### Troubleshooting AI Note Generation Issues

**Issue**: No transcript found
```log
❌ No transcript found for session
```
**Solution**: Ensure transcription completed successfully before generating notes

**Issue**: DeepSeek API error
```log
❌ ========== AI NOTE GENERATION FAILED ==========
error: "DeepSeek API error: 401 Unauthorized"
```
**Solution**: Check DEEPSEEK_API_KEY in .env file

**Issue**: Invalid note type
```log
❌ Validation failed: Invalid note type
```
**Solution**: Use "soap" or "dare" as noteType

---

## How to View Logs

### Real-time Monitoring (Development)

```bash
# Terminal 1: Start server with logs
cd server
npm run dev

# Terminal 2: Watch error logs only
tail -f logs/error-$(date +%Y-%m-%d).log

# Terminal 3: Filter specific session
tail -f logs/application-$(date +%Y-%m-%d).log | grep "SESSION_ID_HERE"
```

### Searching Logs

```bash
# Find all errors for a session
grep "a1e7957c-5b21-47b5-b992-36c3648d186d" logs/application-2025-10-30.log | grep error

# Find transcription pipeline logs
grep "TRANSCRIPTION PIPELINE" logs/application-2025-10-30.log

# Find AI generation logs
grep "AI NOTE GENERATION" logs/application-2025-10-30.log

# Check specific step failures
grep "Step 3/7" logs/application-2025-10-30.log
```

### Log Analysis Tools

```bash
# Count errors by type
grep -o 'error: "[^"]*"' logs/error-2025-10-30.log | sort | uniq -c | sort -rn

# Find slow operations (> 5 seconds)
grep "Duration.*[5-9][0-9][0-9][0-9]ms\|Duration.*[0-9]s" logs/application-2025-10-30.log

# Track processing times per session
grep "totalDuration" logs/application-2025-10-30.log
```

---

## Common Error Patterns

### 1. File System Errors
```
ENOENT: no such file or directory
EACCES: permission denied
```
**Check**: File paths, directory permissions, disk space

### 2. API Errors
```
401 Unauthorized
429 Rate Limit Exceeded
500 Internal Server Error
```
**Check**: API keys, rate limits, API status

### 3. Database Errors
```
invalid input syntax for type integer
column "..." does not exist
relation "..." does not exist
```
**Check**: Database schema, migrations, data types

### 4. Network Errors
```
ETIMEDOUT
ECONNREFUSED
ENOTFOUND
```
**Check**: Internet connection, API endpoints, firewall

---

## Performance Benchmarks

### Expected Timings

| Step | Expected Duration | Alert If > |
|------|------------------|-----------|
| Audio Upload | < 100ms | 500ms |
| File Read | < 50ms | 200ms |
| AssemblyAI Upload | 1-3s (depends on file size) | 10s |
| Transcription Job Create | < 500ms | 2s |
| AssemblyAI Processing | 0.3x audio length | 2x audio length |
| Utterance Processing | < 100ms | 500ms |
| Database Save (per segment) | < 20ms | 100ms |
| DeepSeek API | 3-10s | 30s |

### Optimization Tips

1. **Slow Uploads**: Check network speed, consider compression
2. **Slow Transcription**: Normal for long audio files
3. **Slow Database Saves**: Add indexes, use batch inserts
4. **Slow AI Generation**: Use smaller transcript chunks

---

## Debug Mode

Enable verbose logging by setting in `.env`:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

This will show additional debug information for troubleshooting.

---

## Support

For issues not covered in this guide:
1. Check the log files for the full error stack trace
2. Search for the error message in the logs
3. Verify all environment variables are set correctly
4. Check the database schema is up to date
5. Open an issue on GitHub with relevant logs
