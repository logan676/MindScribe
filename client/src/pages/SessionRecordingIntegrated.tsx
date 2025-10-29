import { useState, useEffect } from 'react';
import { Mic, Pause, Square, StopCircle, CheckCircle, Loader } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { api } from '../services/api';
import { formatDuration } from '../lib/utils';

type ProcessingStep = 'uploading' | 'processing' | 'transcribing' | 'complete';

export function SessionRecordingIntegrated() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('uploading');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { state, startRecording, pauseRecording, resumeRecording, stopRecording, error } =
    useAudioRecorder();

  // Create session when component mounts
  useEffect(() => {
    const createSession = async () => {
      if (!clientId) return;

      try {
        const response = await api.createSession(clientId);
        setSessionId(response.sessionId);
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    };

    createSession();
  }, [clientId]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const handleStopRecording = async () => {
    if (!sessionId) {
      alert('Session not created yet. Please try again.');
      return;
    }

    try {
      // Stop recording and get audio blob
      const audioBlob = await stopRecording();

      if (!audioBlob) {
        throw new Error('No audio data recorded');
      }

      // Start processing
      setIsProcessing(true);
      setProcessingStep('uploading');

      // Upload to backend
      await api.uploadRecording(sessionId, audioBlob);

      // Simulate progress (in production, you'd poll the backend)
      setProcessingStep('processing');
      setTimeout(() => setProcessingStep('transcribing'), 3000);
      setTimeout(() => {
        setProcessingStep('complete');
        // Navigate to notes page after a short delay
        setTimeout(() => navigate(`/notes/${sessionId}`), 2000);
      }, 8000);

    } catch (err) {
      console.error('Failed to stop and upload recording:', err);
      alert('Failed to upload recording. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    const steps = [
      {
        id: 'uploading',
        label: 'Recording Complete & Uploaded',
        description: `Duration: ${formatDuration(state.duration)}`,
        status: processingStep === 'uploading' ? 'in_progress' : 'complete',
      },
      {
        id: 'processing',
        label: 'Processing Audio',
        description: 'Splitting audio into segments for analysis.',
        status:
          processingStep === 'uploading'
            ? 'pending'
            : processingStep === 'processing'
            ? 'in_progress'
            : 'complete',
      },
      {
        id: 'transcribing',
        label: 'Generating Transcript',
        description: 'Identifying speakers and converting speech to text.',
        status:
          processingStep === 'uploading' || processingStep === 'processing'
            ? 'pending'
            : processingStep === 'transcribing'
            ? 'in_progress'
            : 'complete',
      },
    ];

    const progress =
      processingStep === 'uploading'
        ? 33
        : processingStep === 'processing'
        ? 66
        : processingStep === 'transcribing'
        ? 90
        : 100;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">
            Sessions / Client #{clientId || 'Unknown'} / New Recording
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Session with Client #{clientId || 'Unknown'}
          </h1>
          <p className="text-gray-600 mt-1">{new Date().toLocaleDateString()}</p>
        </div>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-blue-600 mb-4">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Transcription in Progress</span>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your session recording has been securely uploaded and is now being
              transcribed. This process is fully automated and HIPAA compliant.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">
                Status:{' '}
                <span className="text-blue-600">
                  {processingStep === 'uploading'
                    ? 'Uploading'
                    : processingStep === 'processing'
                    ? 'Processing Audio'
                    : processingStep === 'transcribing'
                    ? 'Generating Transcript'
                    : 'Complete'}
                </span>
              </span>
              <span className="text-gray-600">Est. completion: ~2 minutes</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Processing Steps */}
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {step.status === 'complete' ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  ) : step.status === 'in_progress' ? (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-semibold ${
                      step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </h3>
                  <p
                    className={`text-sm ${
                      step.status === 'pending' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 mt-8 pt-8 border-t">
            <button onClick={() => navigate('/sessions')} className="btn-secondary">
              Back to Sessions
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            You can safely navigate away from this page. We will notify you when the
            transcription is complete.
          </p>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          All recordings are end-to-end encrypted and HIPAA compliant.
        </div>
      </div>
    );
  }

  // Recording Interface
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">
          Sessions / Client #{clientId || 'Unknown'} / New Recording
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Session with Client #{clientId || 'Unknown'}
        </h1>
        <p className="text-gray-600 mt-1">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="card p-8">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center gap-2 mb-4 ${
              state.isRecording && !state.isPaused
                ? 'text-red-600'
                : state.isPaused
                ? 'text-orange-600'
                : 'text-gray-600'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                state.isRecording && !state.isPaused
                  ? 'bg-red-600 animate-pulse'
                  : state.isPaused
                  ? 'bg-orange-600'
                  : 'bg-gray-400'
              }`}
            />
            <span className="font-semibold">
              {state.isRecording && !state.isPaused
                ? 'Recording in Progress'
                : state.isPaused
                ? 'Recording Paused'
                : 'Ready to Record'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-gray-900 mb-6">
            {formatDuration(state.duration)}
          </div>

          {/* Audio Waveform Visualization */}
          <div className="flex items-center justify-center gap-1 h-16 mb-8">
            {Array.from({ length: 20 }, (_, i) => i).map((i) => {
              const height =
                state.isRecording && !state.isPaused
                  ? Math.min(state.audioLevel + Math.random() * 30, 100)
                  : state.isPaused
                  ? 20
                  : 10;
              return (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-100 ${
                    state.isRecording && !state.isPaused ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-6">
            {!state.isRecording ? (
              <>
                <button disabled className="p-4 bg-gray-100 rounded-full text-gray-400 cursor-not-allowed">
                  <Pause className="w-6 h-6" />
                </button>
                <button
                  onClick={handleStartRecording}
                  className="p-8 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                >
                  <Mic className="w-10 h-10 text-white" />
                </button>
                <button disabled className="p-4 bg-gray-100 rounded-full text-gray-400 cursor-not-allowed">
                  <Square className="w-6 h-6" />
                </button>
              </>
            ) : state.isPaused ? (
              <>
                <button
                  onClick={resumeRecording}
                  className="p-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Pause className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={resumeRecording}
                  className="p-8 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                >
                  <Mic className="w-10 h-10 text-white" />
                </button>
                <button
                  onClick={handleStopRecording}
                  className="p-4 bg-gray-800 hover:bg-gray-900 rounded-full transition-colors"
                >
                  <Square className="w-6 h-6 text-white" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={pauseRecording}
                  className="p-4 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <Pause className="w-6 h-6 text-gray-700" />
                </button>
                <button className="p-8 bg-red-600 rounded-full animate-pulse">
                  <Mic className="w-10 h-10 text-white" />
                </button>
                <button
                  onClick={handleStopRecording}
                  className="p-4 bg-gray-800 hover:bg-gray-900 rounded-full transition-colors"
                >
                  <Square className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>

          {!state.isRecording && (
            <p className="text-gray-600 mt-4 text-sm">
              Click the microphone to start recording
            </p>
          )}
        </div>

        {/* End Session Button */}
        {state.isRecording && (
          <div className="flex justify-center mt-8 pt-8 border-t">
            <button
              onClick={handleStopRecording}
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              <StopCircle className="w-5 h-5" />
              End Session & Transcribe
            </button>
          </div>
        )}

        {/* Microphone Selection */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <Mic className="w-5 h-5 text-gray-400" />
            <select className="flex-1 input-field">
              <option>Built-in Microphone (Default)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pre-Recording Checklist */}
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          Pre-Recording Checklist
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Check your microphone is selected and working.</li>
          <li>• Inform the client you are starting the recording.</li>
          <li>• Minimize potential background noise.</li>
        </ul>
      </div>

      <div className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        All recordings are end-to-end encrypted and HIPAA compliant.
      </div>
    </div>
  );
}
