import { useState, useEffect } from 'react';
import { Mic, Pause, Play, Square, CheckCircle, Loader, User, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { api } from '../services/api';
import { formatDuration } from '../lib/utils';

type ProcessingStep = 'uploading' | 'processing' | 'transcribing' | 'complete';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  client_id: string;
}

export function NewSession() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<string>('follow-up');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('uploading');
  const [showPatientSelect, setShowPatientSelect] = useState(true);

  const { state, startRecording, pauseRecording, resumeRecording, stopRecording, error } =
    useAudioRecorder();

  // Fetch patients on mount
  useEffect(() => {
    async function loadPatients() {
      try {
        const response = await api.getPatients();
        setPatients(response.patients || []);
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setIsLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleStartSession = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    try {
      // Create session
      const response = await api.createSession(selectedPatientId);
      setSessionId(response.sessionId);
      setShowPatientSelect(false);

      // Start recording
      await startRecording();
    } catch (err) {
      console.error('Failed to create session:', err);
      alert('Failed to start session. Please try again.');
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

      // Simulate progress (in production, poll the backend for actual status)
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

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'uploading':
        return 'Uploading recording...';
      case 'processing':
        return 'Processing audio...';
      case 'transcribing':
        return 'Transcribing session...';
      case 'complete':
        return 'Complete! Redirecting to notes...';
    }
  };

  if (showPatientSelect) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Session</h1>
          <p className="text-gray-600">Select a patient to start recording</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Patient Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Patient
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                disabled={isLoadingPatients}
              >
                <option value="">
                  {isLoadingPatients ? 'Loading patients...' : 'Choose a patient...'}
                </option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} ({patient.client_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Session Type */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Session Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSessionType('initial')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  sessionType === 'initial'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Initial Assessment
              </button>
              <button
                onClick={() => setSessionType('follow-up')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  sessionType === 'follow-up'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Follow-up
              </button>
              <button
                onClick={() => setSessionType('couples')}
                className={`px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                  sessionType === 'couples'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                Couples Therapy
              </button>
            </div>
          </div>

          {/* Session Info */}
          {selectedPatient && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Session Details</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Patient:</span> {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p>
                  <span className="font-medium">Client ID:</span> {selectedPatient.client_id}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{' '}
                  {sessionType === 'initial'
                    ? 'Initial Assessment'
                    : sessionType === 'follow-up'
                    ? 'Follow-up'
                    : 'Couples Therapy'}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartSession}
            disabled={!selectedPatientId}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Mic className="w-6 h-6" />
            Start Recording Session
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="mb-6">
            {processingStep === 'complete' ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            ) : (
              <Loader className="w-20 h-20 text-blue-600 mx-auto animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getProcessingMessage()}</h2>
          <p className="text-gray-600 mb-6">Please wait while we process your recording</p>

          {/* Processing Steps */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <div
              className={`flex items-center gap-2 ${
                processingStep === 'uploading' ? 'text-blue-600' : 'text-green-600'
              }`}
            >
              {processingStep === 'uploading' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="w-12 h-px bg-gray-300" />
            <div
              className={`flex items-center gap-2 ${
                processingStep === 'processing'
                  ? 'text-blue-600'
                  : ['transcribing', 'complete'].includes(processingStep)
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {processingStep === 'processing' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : ['transcribing', 'complete'].includes(processingStep) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span className="text-sm font-medium">Process</span>
            </div>
            <div className="w-12 h-px bg-gray-300" />
            <div
              className={`flex items-center gap-2 ${
                processingStep === 'transcribing'
                  ? 'text-blue-600'
                  : processingStep === 'complete'
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {processingStep === 'transcribing' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : processingStep === 'complete' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span className="text-sm font-medium">Transcribe</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recording Session</h1>
        <p className="text-gray-600">
          {selectedPatient && `${selectedPatient.first_name} ${selectedPatient.last_name}`} - Session #{sessionId?.slice(-6)}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8">
        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="text-6xl font-bold text-gray-900 mb-2 font-mono">
            {formatDuration(state.duration)}
          </div>
          <div className="flex items-center justify-center gap-2">
            {state.isRecording && !state.isPaused && (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-medium">Recording</span>
              </>
            )}
            {state.isPaused && (
              <span className="text-yellow-600 font-medium">Paused</span>
            )}
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 h-32 flex items-center justify-center">
          {state.isRecording && !state.isPaused ? (
            <div className="flex items-center gap-1 h-full">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full transition-all duration-150"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    opacity: 0.3 + Math.random() * 0.7,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-400">Audio waveform will appear here</div>
          )}
        </div>

        {/* Audio Level Indicator */}
        {state.isRecording && !state.isPaused && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Audio Level</span>
              <span>{Math.round(state.audioLevel * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-100"
                style={{ width: `${state.audioLevel * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!state.isRecording && !state.isPaused && (
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
            >
              <Mic className="w-8 h-8" />
            </button>
          )}

          {state.isRecording && !state.isPaused && (
            <>
              <button
                onClick={pauseRecording}
                className="w-16 h-16 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Pause className="w-6 h-6" />
              </button>
              <button
                onClick={handleStopRecording}
                className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Square className="w-8 h-8" />
              </button>
            </>
          )}

          {state.isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Play className="w-6 h-6" />
              </button>
              <button
                onClick={handleStopRecording}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Square className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Control Labels */}
        <div className="flex items-center justify-center gap-8 mt-4 text-sm text-gray-600">
          {!state.isRecording && !state.isPaused && <span>Click to start recording</span>}
          {state.isRecording && !state.isPaused && (
            <>
              <span>Pause</span>
              <span>Stop & Save</span>
            </>
          )}
          {state.isPaused && (
            <>
              <span>Resume</span>
              <span>Stop & Save</span>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
