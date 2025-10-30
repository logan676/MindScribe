import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
}

export interface DebugInfo {
  hasPermission: boolean;
  streamActive: boolean;
  mediaRecorderState: string;
  mimeType: string;
  sampleRate: number;
  channelCount: number;
  audioChunks: number;
  totalSize: number;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
}

export interface UseAudioRecorderReturn {
  state: RecordingState;
  debugInfo: DebugInfo;
  startRecording: (deviceId?: string) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  getAudioDevices: () => Promise<AudioDevice[]>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
  });
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasPermission: false,
    streamActive: false,
    mediaRecorderState: 'inactive',
    mimeType: '',
    sampleRate: 0,
    channelCount: 0,
    audioChunks: 0,
    totalSize: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const durationIntervalRef = useRef<number>();
  const animationFrameRef = useRef<number>();

  // Audio level monitoring - using useRef to avoid stale closure
  const monitorAudioLevelRef = useRef<() => void>();

  monitorAudioLevelRef.current = () => {
    if (!analyzerRef.current) {
      console.warn('⚠️ No analyzer available for audio monitoring');
      return;
    }

    // Try both frequency and time domain data
    const freqArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    const timeArray = new Uint8Array(analyzerRef.current.fftSize);

    analyzerRef.current.getByteFrequencyData(freqArray);
    analyzerRef.current.getByteTimeDomainData(timeArray);

    // Calculate average volume from frequency data
    const freqAverage = freqArray.reduce((a, b) => a + b) / freqArray.length;
    const normalizedLevel = (freqAverage / 255) * 100;

    // Calculate RMS from time domain data (more accurate for speech)
    let sumSquares = 0;
    for (let i = 0; i < timeArray.length; i++) {
      const normalized = (timeArray[i] - 128) / 128; // Normalize to -1 to 1
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / timeArray.length);
    const rmsLevel = rms * 100;

    // Use the higher of the two methods
    const finalLevel = Math.max(normalizedLevel, rmsLevel);

    // Log every 60 frames (roughly once per second at 60fps)
    if (Math.random() < 0.017) {
      console.log('🎵 Audio level:', {
        freqAverage: freqAverage.toFixed(2),
        freqLevel: normalizedLevel.toFixed(2) + '%',
        rmsLevel: rmsLevel.toFixed(2) + '%',
        finalLevel: finalLevel.toFixed(2) + '%',
        freqSample: Array.from(freqArray.slice(0, 10)),
        timeSample: Array.from(timeArray.slice(0, 10)),
        freqMax: Math.max(...Array.from(freqArray)),
        timeMax: Math.max(...Array.from(timeArray)),
      });
    }

    setState((prev) => ({ ...prev, audioLevel: finalLevel }));

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevelRef.current!);
  };

  const monitorAudioLevel = useCallback(() => {
    if (monitorAudioLevelRef.current) {
      monitorAudioLevelRef.current();
    }
  }, []);

  // Get available audio devices
  const getAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    try {
      console.log('🎧 Enumerating audio devices...');

      // First, request permission to access microphone
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Then enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        }));

      console.log('🎧 Found audio input devices:', audioInputs);
      return audioInputs;
    } catch (err) {
      console.error('❌ Error enumerating devices:', err);
      return [];
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async (deviceId?: string) => {
    try {
      setError(null);
      audioChunksRef.current = [];

      console.log('🎤 Requesting microphone access...');
      console.log('Selected device ID:', deviceId || 'default');

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            }
          : {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
            },
      };

      console.log('📋 Audio constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('✅ Microphone access granted!');
      console.log('📊 Stream details:', {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length,
      });

      streamRef.current = stream;

      // Set up audio analysis
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      console.log('🔊 AudioContext created:', {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate,
      });

      // Resume AudioContext if it's suspended (common browser behavior)
      if (audioContext.state === 'suspended') {
        console.log('⏸️ AudioContext is suspended, attempting to resume...');
        await audioContext.resume();
        console.log('▶️ AudioContext resumed, new state:', audioContext.state);
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      console.log('📈 Audio analyzer configured:', {
        fftSize: analyzer.fftSize,
        frequencyBinCount: analyzer.frequencyBinCount,
        smoothingTimeConstant: analyzer.smoothingTimeConstant,
      });

      // Test the analyzer immediately
      const testArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(testArray);
      console.log('🧪 Initial audio test:', {
        firstValues: Array.from(testArray.slice(0, 10)),
        hasNonZero: testArray.some(v => v > 0),
      });

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      console.log('🎙️ MediaRecorder created:', {
        mimeType,
        state: mediaRecorder.state,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 Audio chunk received:', {
            size: event.data.size,
            totalChunks: audioChunksRef.current.length,
          });
          // Update debug info
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          setDebugInfo((prev) => ({
            ...prev,
            audioChunks: audioChunksRef.current.length,
            totalSize,
            mediaRecorderState: mediaRecorder.state,
          }));
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      console.log('▶️ MediaRecorder started');

      // Update debug info
      const audioTrack = stream.getAudioTracks()[0];
      const settings = audioTrack.getSettings();

      console.log('🎚️ Audio track settings:', {
        label: audioTrack.label,
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState,
        sampleRate: settings.sampleRate,
        channelCount: settings.channelCount,
      });

      setDebugInfo({
        hasPermission: true,
        streamActive: stream.active,
        mediaRecorderState: mediaRecorder.state,
        mimeType,
        sampleRate: settings.sampleRate || 0,
        channelCount: settings.channelCount || 0,
        audioChunks: 0,
        totalSize: 0,
      });

      // Start duration counter
      setState((prev) => ({ ...prev, isRecording: true, duration: 0 }));

      durationIntervalRef.current = window.setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Start audio level monitoring
      console.log('🎶 Starting audio level monitoring...');
      monitorAudioLevel();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('❌ Error starting recording:', err);
      console.error('Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }, [monitorAudioLevel]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState((prev) => ({ ...prev, isPaused: true }));

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState((prev) => ({ ...prev, isPaused: false }));

      durationIntervalRef.current = window.setInterval(() => {
        setState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      monitorAudioLevel();
    }
  }, [monitorAudioLevel]);

  // Stop recording
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        resolve(audioBlob);

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setState({
          isRecording: false,
          isPaused: false,
          duration: 0,
          audioLevel: 0,
        });
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    state,
    debugInfo,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    getAudioDevices,
    error,
  };
}
