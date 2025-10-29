export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  clientId: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Session {
  id: string;
  patientId: string;
  patient?: Patient;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
  status: 'scheduled' | 'recording' | 'processing' | 'transcribing' | 'completed' | 'draft';
  transcriptionStatus?: 'pending' | 'in_progress' | 'completed' | 'failed';
  recordingUrl?: string;
  transcriptUrl?: string;
  notesUrl?: string;
}

export interface TranscriptSegment {
  id: string;
  sessionId: string;
  speaker: 'therapist' | 'client';
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface ClinicalNote {
  id: string;
  sessionId: string;
  type: 'soap' | 'dare';
  status: 'draft' | 'final' | 'signed';
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  // DARE format
  description?: string;
  action?: string;
  response?: string;
  evaluation?: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: Patient;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  role: 'clinician' | 'admin';
  avatarUrl?: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export interface TranscriptionProgress {
  status: 'idle' | 'uploading' | 'processing_audio' | 'generating_transcript' | 'completed' | 'error';
  progress: number; // 0-100
  estimatedCompletion?: number; // seconds
  error?: string;
}
