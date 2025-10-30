#!/bin/bash

# Test script for uploading m4a file

echo "Creating session..."
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"patientId":"94b1d337-4e66-4169-a1d4-508dfb72e95e"}' | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"
echo ""
echo "Uploading audio file..."
curl -s -X POST "http://localhost:3001/api/sessions/$SESSION_ID/recording" \
  -F "audio=@/Users/HONGBGU/Downloads/Spritely.m4a" | jq '.'
