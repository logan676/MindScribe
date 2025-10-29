import type { Request } from 'express';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  role: 'clinician' | 'admin';
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  clientId: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  patientId: string;
  userId: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'scheduled' | 'recording' | 'processing' | 'transcribing' | 'completed' | 'draft';
  transcriptionStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  recordingUrl?: string;
  recordingPath?: string;
  transcriptUrl?: string;
  notesUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speaker: 'therapist' | 'client';
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
  createdAt: Date;
}

export interface ClinicalNote {
  id: string;
  sessionId: string;
  userId: string;
  type: 'soap' | 'dare';
  status: 'draft' | 'final' | 'signed';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  description?: string;
  action?: string;
  response?: string;
  evaluation?: string;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface AssemblyAITranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  utterances?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string;
  }>;
  error?: string;
}

export interface DeepSeekNoteRequest {
  transcript: string;
  noteType: 'soap' | 'dare';
  patientContext?: {
    name: string;
    history?: string;
  };
}

export interface DeepSeekNoteResponse {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  description?: string;
  action?: string;
  response?: string;
  evaluation?: string;
}
