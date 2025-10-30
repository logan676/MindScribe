import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Loader, ArrowLeft, FileAudio, Brain, FileText } from 'lucide-react';
import { api } from '../services/api';

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
  transcription_error: string | null;
  audio_file_path: string | null;
  recording_path: string | null;
  created_at: string;
}

interface NotesStatus {
  hasNotes: boolean;
  isGenerating: boolean;
}

export function SessionStatus() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notesStatus, setNotesStatus] = useState<NotesStatus>({ hasNotes: false, isGenerating: false });
  const [noteGenerationAttempted, setNoteGenerationAttempted] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;

      try {
        const response = await api.getSession(sessionId);
        setSession(response.session);

        // Check if notes exist
        try {
          const notesResponse = await api.getSessionNotes(sessionId);
          const hasNotes = notesResponse.notes && notesResponse.notes.length > 0;
          setNotesStatus(prev => ({ ...prev, hasNotes }));

          // If transcription is complete but notes don't exist and we haven't attempted generation yet
          if (response.session.transcription_status === 'completed' && !hasNotes && !noteGenerationAttempted) {
            setNoteGenerationAttempted(true);
            generateNotesAutomatically(sessionId);
          }
        } catch (err) {
          console.log('No notes found yet');
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();

    // Poll for status updates every 5 seconds
    const interval = setInterval(loadSession, 5000);

    return () => clearInterval(interval);
  }, [sessionId, noteGenerationAttempted]);

  // Automatically generate notes when transcription completes
  async function generateNotesAutomatically(sessionId: string) {
    try {
      setNotesStatus(prev => ({ ...prev, isGenerating: true }));
      console.log('🤖 Automatically generating clinical notes...');

      // Generate SOAP notes by default
      await api.generateNote(sessionId, 'soap');

      console.log('✅ Clinical notes generated successfully');
      setNotesStatus({ hasNotes: true, isGenerating: false });
    } catch (err) {
      console.error('❌ Failed to generate notes automatically:', err);
      setNotesStatus(prev => ({ ...prev, isGenerating: false }));
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button onClick={() => navigate('/patients')} className="btn-primary">
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'in_progress':
      case 'processing':
        return <Loader className="w-8 h-8 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-600" />;
      default:
        return <Clock className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/patients')}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Status</h1>
        <p className="text-gray-600">
          {session.first_name} {session.last_name} - Session #{sessionId.slice(-6)}
        </p>
      </div>

      {/* Status Overview Card */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Complete ✓</h2>

        <div className="space-y-4">
          {/* Recording Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileAudio className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Recording Uploaded</h3>
                <p className="text-sm text-gray-600">Audio file has been successfully uploaded to the server</p>
                {session.audio_file_path && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">{session.audio_file_path}</p>
                )}
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>

          {/* Session Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">{getStatusIcon(session.status)}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Session Status</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Current Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
                    {getStatusText(session.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Session created at {new Date(session.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Processing Pipeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Backend Processing Pipeline</h3>
                <p className="text-xs text-gray-500">Multi-stage AI analysis and transcription</p>
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="space-y-3 ml-9">
              {/* Step 1: Transcription */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">Audio Transcription</span>
                    {(session.transcription_status === 'pending' || session.transcription_status === 'in_progress') && (
                      <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                    )}
                    {session.transcription_status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {session.transcription_status === 'pending' && 'Waiting to start transcription...'}
                    {session.transcription_status === 'in_progress' && 'Converting audio to text using AI...'}
                    {session.transcription_status === 'completed' && 'Audio successfully transcribed'}
                    {session.transcription_status === 'failed' && 'Transcription failed'}
                  </p>
                  {session.transcription_status === 'failed' && session.transcription_error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <p className="text-xs text-red-700 font-mono">{session.transcription_error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Speaker Diarization */}
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                  session.transcription_status === 'completed' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${session.transcription_status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                      Speaker Analysis
                    </span>
                    {session.transcription_status === 'in_progress' && (
                      <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                    )}
                    {session.transcription_status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {session.transcription_status === 'pending' && 'Pending transcription completion...'}
                    {session.transcription_status === 'in_progress' && 'Identifying different speakers...'}
                    {session.transcription_status === 'completed' && 'Speakers identified and labeled'}
                    {session.transcription_status === 'failed' && 'Not available'}
                  </p>
                </div>
              </div>

              {/* Step 3: Conversation Segmentation */}
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                  session.transcription_status === 'completed' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${session.transcription_status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                      Chat View Generation
                    </span>
                    {session.transcription_status === 'in_progress' && (
                      <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                    )}
                    {session.transcription_status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {session.transcription_status === 'pending' && 'Pending transcription completion...'}
                    {session.transcription_status === 'in_progress' && 'Processing conversation segments...'}
                    {session.transcription_status === 'completed' && 'Conversation formatted as chat messages'}
                    {session.transcription_status === 'failed' && 'Not available'}
                  </p>
                </div>
              </div>

              {/* Step 4: Chat View Ready */}
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                  session.transcription_status === 'completed' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  4
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${session.transcription_status === 'completed' ? 'text-gray-900' : 'text-gray-400'}`}>
                      Chat View Ready
                    </span>
                    {session.transcription_status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {session.transcription_status === 'pending' && 'Pending transcription completion...'}
                    {session.transcription_status === 'in_progress' && 'Waiting for processing to complete...'}
                    {session.transcription_status === 'completed' && 'Transcript available in chat format'}
                    {session.transcription_status === 'failed' && 'Not available'}
                  </p>
                </div>
              </div>

              {/* Step 5: AI Clinical Notes Generation */}
              <div className="flex items-start gap-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 ${
                  notesStatus.hasNotes ? 'bg-green-100 text-green-600' :
                  notesStatus.isGenerating ? 'bg-blue-100 text-blue-600' :
                  session.transcription_status === 'completed' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  5
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-medium ${
                      notesStatus.hasNotes || notesStatus.isGenerating || session.transcription_status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      AI Clinical Notes Generation
                    </span>
                    {notesStatus.isGenerating && (
                      <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {notesStatus.hasNotes && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {session.transcription_status !== 'completed' && 'Pending transcription completion...'}
                    {session.transcription_status === 'completed' && notesStatus.isGenerating && 'Generating SOAP notes using AI...'}
                    {session.transcription_status === 'completed' && notesStatus.hasNotes && 'Clinical notes generated and ready to review'}
                    {session.transcription_status === 'completed' && !notesStatus.isGenerating && !notesStatus.hasNotes && 'Preparing to generate notes...'}
                    {session.transcription_status === 'failed' && 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p className="font-semibold text-gray-900">Backend Processing</p>
              <p className="text-sm text-gray-600">The server will process your audio file and generate a transcription using AssemblyAI</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p className="font-semibold text-gray-900">AI Note Generation</p>
              <p className="text-sm text-gray-600">Once transcription is complete, AI will generate clinical notes (SOAP/DARE format)</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p className="font-semibold text-gray-900">Review & Edit</p>
              <p className="text-sm text-gray-600">You can review, edit, and finalize the notes in the Clinical Notes page</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => navigate('/patients')}
              className="btn-secondary"
            >
              Go to Patients
            </button>
            <button
              onClick={() => navigate(`/notes/${sessionId}`)}
              disabled={!notesStatus.hasNotes}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                notesStatus.hasNotes
                  ? 'btn-primary'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4" />
              {notesStatus.isGenerating ? 'Generating Notes...' : 'View Clinical Notes'}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> This page auto-refreshes every 5 seconds. You can navigate away and check back later.
          </p>
        </div>
      </div>

      {/* Debug Information Card */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Debug Information</h2>

        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
