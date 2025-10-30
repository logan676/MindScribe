import { useState, useEffect } from 'react';
import { Mic, Pause, Play, Square, Loader, User, Calendar, ArrowLeft, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAudioRecorder, type AudioDevice } from '../hooks/useAudioRecorder';
import { api } from '../services/api';
import { formatDuration } from '../lib/utils';


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
  const [showPatientSelect, setShowPatientSelect] = useState(true);
  const [waveformKey, setWaveformKey] = useState(0);

  // Audio device selection
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  // Confirmation modal
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  const { state, debugInfo, startRecording, pauseRecording, resumeRecording, stopRecording, getAudioDevices, error } =
    useAudioRecorder();

  // Force waveform to re-render more frequently for smooth animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isRecording && !state.isPaused) {
      interval = setInterval(() => {
        setWaveformKey(prev => prev + 1);
      }, 50); // Update every 50ms for smooth animation
    }
    return () => clearInterval(interval);
  }, [state.isRecording, state.isPaused]);

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

  // Load audio devices on mount
  useEffect(() => {
    async function loadAudioDevices() {
      setIsLoadingDevices(true);
      try {
        const devices = await getAudioDevices();
        setAudioDevices(devices);
        // Auto-select the first device if available
        if (devices.length > 0) {
          setSelectedDeviceId(devices[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to load audio devices:', err);
      } finally {
        setIsLoadingDevices(false);
      }
    }
    loadAudioDevices();
  }, [getAudioDevices]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handleStartSession = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient first');
      return;
    }

    if (!selectedDeviceId && audioDevices.length > 0) {
      alert('Please select a microphone first');
      return;
    }

    try {
      console.log('🎯 Creating session for patient:', selectedPatientId);

      // Create session
      const response = await api.createSession(selectedPatientId);
      console.log('✅ Session created:', response.sessionId);

      setSessionId(response.sessionId);
      setShowPatientSelect(false);

      // Start recording with selected device
      console.log('🎬 Starting recording with device:', selectedDeviceId || 'default');
      await startRecording(selectedDeviceId || undefined);
      console.log('✅ Recording started successfully');
    } catch (err) {
      console.error('❌ Failed to create session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      alert(`Failed to start session: ${errorMessage}`);
    }
  };

  const handleStopClick = () => {
    setShowStopConfirmation(true);
  };

  const handleConfirmStop = async () => {
    setShowStopConfirmation(false);

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

      // Show uploading state
      setIsProcessing(true);

      console.log('📤 Uploading recording...', {
        sessionId,
        blobSize: audioBlob.size,
        blobType: audioBlob.type,
      });

      // Upload to backend
      try {
        await api.uploadRecording(sessionId, audioBlob);
        console.log('✅ Upload successful');
      } catch (uploadErr) {
        console.error('❌ Upload failed:', uploadErr);
        throw new Error(`Upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`);
      }

      // Navigate to session status page
      // The backend should automatically start transcription after upload
      console.log('🎯 Navigating to status page');
      console.log('💡 Backend should automatically process transcription');
      navigate(`/sessions/status/${sessionId}`);
    } catch (err) {
      console.error('❌ Failed to stop and upload recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload recording. Please try again.';
      alert(errorMessage);
      setIsProcessing(false);
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

          {/* Microphone Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Microphone
            </label>
            <div className="relative">
              <Headphones className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                disabled={isLoadingDevices}
              >
                <option value="">
                  {isLoadingDevices ? 'Loading microphones...' : audioDevices.length === 0 ? 'No microphones found' : 'Choose a microphone...'}
                </option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
            {audioDevices.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                💡 If you're using external earphones/headphones with a mic, select them above
              </p>
            )}
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
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="mb-6">
            <Loader className="w-20 h-20 text-blue-600 mx-auto animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Uploading Recording...</h2>
          <p className="text-gray-600">Please wait while we upload your recording to the server</p>
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

        {/* Waveform Visualization - Shows real-time audio input */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 h-32 flex items-center justify-center">
          {state.isRecording && !state.isPaused ? (
            <div className="flex items-center gap-1 h-full" key={waveformKey}>
              {Array.from({ length: 50 }).map((_, i) => {
                // Create a wave effect based on audio level and position
                const time = waveformKey * 0.1;
                const phase = (time + i * 0.3) % (Math.PI * 2);

                // Base wave animation (subtle when no sound)
                const baseHeight = 8 + Math.sin(phase) * 6;

                // Audio boost - scale the audio level more carefully
                // Normalize audioLevel (0-100) to a reasonable multiplier (0-3)
                const normalizedAudio = Math.min(100, state.audioLevel) / 100;
                const audioBoost = normalizedAudio * 70; // Max additional height of 70%

                // Add some randomness based on position for more natural look
                const positionVariance = Math.sin(i * 0.5 + phase) * normalizedAudio * 10;

                const height = Math.min(95, baseHeight + audioBoost + positionVariance);

                // Color intensity based on audio level
                const isActive = state.audioLevel > 5;

                return (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-75"
                    style={{
                      height: `${height}%`,
                      opacity: isActive ? 0.7 + (normalizedAudio * 0.3) : 0.4,
                      backgroundColor: isActive ? '#3b82f6' : '#93c5fd',
                      boxShadow: isActive ? '0 0 4px rgba(59, 130, 246, 0.5)' : 'none',
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-gray-400">Audio waveform will appear when recording starts</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {!state.isRecording && !state.isPaused && (
            <button
              onClick={() => startRecording(selectedDeviceId || undefined)}
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
                onClick={handleStopClick}
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
                onClick={handleStopClick}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                <Square className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Control Labels */}
        <div className="flex items-center justify-center gap-8 mb-6 text-sm text-gray-600">
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

        {/* Recording Status Panel */}
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Recording Status
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-2 rounded">
              <div className="text-gray-500 mb-1">Microphone Access</div>
              <div className={`font-bold ${debugInfo.hasPermission ? 'text-green-600' : 'text-red-600'}`}>
                {debugInfo.hasPermission ? '✓ Connected' : '✗ Not Connected'}
              </div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-gray-500 mb-1">Recording Status</div>
              <div className={`font-bold ${debugInfo.streamActive ? 'text-green-600' : 'text-gray-600'}`}>
                {debugInfo.streamActive ? '● Recording' : '○ Not Recording'}
              </div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-gray-500 mb-1">Audio Quality</div>
              <div className="font-bold text-gray-900">
                {debugInfo.sampleRate ? `${(debugInfo.sampleRate / 1000).toFixed(0)} kHz` : 'N/A'}
              </div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="text-gray-500 mb-1">Recording Size</div>
              <div className="font-bold text-purple-600">
                {(debugInfo.totalSize / 1024).toFixed(2)} KB
              </div>
            </div>
            <div className="bg-white p-2 rounded col-span-2">
              <div className="text-gray-500 mb-1">Voice Detection</div>
              <div className={`font-semibold ${
                state.audioLevel > 5 ? 'text-green-600' : state.audioLevel > 0.5 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {state.audioLevel > 5 ? '🔊 Voice detected!' : state.audioLevel > 0.5 ? '🔉 Weak sound' : '🔇 No sound'}
              </div>
            </div>
          </div>
        </div>

        {/* Low Audio Warning - Fixed position notification (only after 15 seconds) */}
        {state.isRecording && !state.isPaused && state.audioLevel < 1 && state.duration > 15 && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg p-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <h4 className="font-bold text-yellow-900 mb-2">Microphone Not Picking Up Sound</h4>
                  <div className="text-xs text-yellow-800 space-y-1">
                    <p>• <strong>Speak louder</strong> or move closer to the microphone</p>
                    <p>• <strong>Check microphone selection</strong> above (scroll up)</p>
                    <p>• <strong>Verify microphone isn't muted</strong> in system settings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title and Message */}
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              End Session and Transcribe?
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              This will stop the recording and start the transcription process. You will not be able to restart the recording.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowStopConfirmation(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStop}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
