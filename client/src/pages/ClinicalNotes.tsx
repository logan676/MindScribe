import { useState, useEffect } from 'react';
import { Save, FileText, Lock, Clock, Sparkles, ArrowLeft, Loader } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type NoteType = 'soap' | 'dare';

interface Session {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  client_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  status: string;
  transcription_status: string;
}

interface TranscriptSegment {
  id: string;
  speaker: 'therapist' | 'client';
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

interface ClinicalNote {
  id: string;
  type: 'soap' | 'dare';
  status: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  description?: string;
  action?: string;
  response?: string;
  evaluation?: string;
}

export function ClinicalNotes() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [existingNote, setExistingNote] = useState<ClinicalNote | null>(null);

  const [noteType, setNoteType] = useState<NoteType>('soap');

  // SOAP fields
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  // DARE fields
  const [description, setDescription] = useState('');
  const [action, setAction] = useState('');
  const [response, setResponse] = useState('');
  const [evaluation, setEvaluation] = useState('');

  // Fetch session data, transcript, and notes
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId) return;

      try {
        setIsLoading(true);

        // Fetch session details
        const sessionResponse = await api.getSession(sessionId);
        setSession(sessionResponse.session);

        // Fetch transcript segments if available
        if (sessionResponse.session.transcription_status === 'completed') {
          try {
            const transcriptResponse = await api.getTranscriptSegments(sessionId);
            setTranscriptSegments(transcriptResponse.segments || []);
          } catch (err) {
            console.error('Failed to load transcript:', err);
          }
        }

        // Try to fetch existing notes for this session
        try {
          const noteResponse = await api.getSessionNotes(sessionId);
          if (noteResponse.notes && noteResponse.notes.length > 0) {
            // Use the first note if multiple exist
            const note = noteResponse.notes[0];
            setExistingNote(note);
            setNoteType(note.type);

            // Populate fields based on note type
            if (note.type === 'soap') {
              setSubjective(note.subjective || '');
              setObjective(note.objective || '');
              setAssessment(note.assessment || '');
              setPlan(note.plan || '');
            } else {
              setDescription(note.description || '');
              setAction(note.action || '');
              setResponse(note.response || '');
              setEvaluation(note.evaluation || '');
            }
          }
        } catch (err) {
          // No existing note is fine
          console.log('No existing note found');
        }

      } catch (err) {
        console.error('Failed to load session data:', err);
        alert('Failed to load session data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadSessionData();
  }, [sessionId]);

  // Format milliseconds to MM:SS
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate duration in minutes
  const getDurationMinutes = (duration: number) => {
    return Math.round(duration / 60);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading session data...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 mb-4">Session not found</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Left Panel - Transcript */}
      <div className="w-1/3 flex flex-col">
        <div className="card flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Session Transcript
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
              <Clock className="w-4 h-4" />
              {formatDate(session.date)} - {getDurationMinutes(session.duration)} min duration
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {session.transcription_status === 'completed' && transcriptSegments.length > 0 ? (
              transcriptSegments.map((segment) => (
                <div
                  key={segment.id}
                  className={`${
                    segment.speaker === 'therapist'
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'bg-gray-50 border-l-4 border-gray-300'
                  } p-4 rounded-r-lg`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-semibold uppercase ${
                        segment.speaker === 'therapist'
                          ? 'text-blue-700'
                          : 'text-gray-700'
                      }`}
                    >
                      {segment.speaker === 'therapist' ? 'Therapist' : 'Client'}
                    </span>
                    <span className="text-xs text-gray-500">{formatTime(segment.start_time)}</span>
                  </div>
                  <p className="text-sm text-gray-900">{segment.text}</p>
                </div>
              ))
            ) : session.transcription_status === 'in_progress' ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader className="w-8 h-8 mb-3 animate-spin" />
                <p>Transcription in progress...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mb-3" />
                <p>No transcript available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Clinical Notes */}
      <div className="flex-1 flex flex-col">
        <div className="card flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Client: {session.first_name} {session.last_name} - Session Note
              </h1>
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                <Lock className="w-4 h-4" />
                HIPAA Compliant
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900">
                {existingNote
                  ? existingNote.status === 'signed'
                    ? 'Signed & Finalized'
                    : existingNote.status === 'final'
                    ? 'Final (Pending Signature)'
                    : 'Draft'
                  : 'New Note'}
              </span>
              {!existingNote && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>

            {/* Note Type Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setNoteType('soap')}
                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                  noteType === 'soap'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                SOAP Note
              </button>
              <button
                onClick={() => setNoteType('dare')}
                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                  noteType === 'dare'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DARE Note
              </button>
            </div>
          </div>

          {/* Note Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl space-y-6">
              {/* AI Generated Badge */}
              {existingNote && (
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
                    <Sparkles className="w-4 h-4" />
                    AI-Generated Text
                  </div>
                </div>
              )}

              {noteType === 'soap' ? (
                <>
                  {/* Subjective */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Subjective
                    </label>
                    <textarea
                      value={subjective}
                      onChange={(e) => setSubjective(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Client's reported symptoms, concerns, and subjective experience..."
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Objective
                    </label>
                    <textarea
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Observable facts, mental status exam, clinical observations..."
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Assessment
                    </label>
                    <textarea
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Clinical interpretation, diagnosis, progress evaluation..."
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Plan
                    </label>
                    <textarea
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Treatment plan, interventions, next steps, homework..."
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Description */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Describe what happened during the session..."
                    />
                  </div>

                  {/* Action */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Action
                    </label>
                    <textarea
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="What actions or interventions were taken..."
                    />
                  </div>

                  {/* Response */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Response
                    </label>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="How the client responded to interventions..."
                    />
                  </div>

                  {/* Evaluation */}
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-3">
                      Evaluation
                    </label>
                    <textarea
                      value={evaluation}
                      onChange={(e) => setEvaluation(e.target.value)}
                      className="w-full h-32 input-field resize-none"
                      placeholder="Evaluation of session and next steps..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <button className="text-gray-600 hover:text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              View History
            </button>

            <div className="flex gap-3">
              <button className="btn-secondary">Save Draft</button>
              <button className="btn-primary">
                <Save className="w-4 h-4 inline mr-2" />
                Finalize & Sign
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
