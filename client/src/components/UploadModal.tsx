import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Trash2, CheckCircle, AlertCircle, User, ArrowRight, Loader } from 'lucide-react';
import { api } from '../services/api';

interface UploadFile {
  id: string;
  file: File;  // Store the actual File object
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress?: number;
  uploadedSize?: number;
  errorMessage?: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  client_id: string;
  date_of_birth: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadStep = 'select-file' | 'select-patient' | 'uploading' | 'complete';

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>('select-file');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<UploadFile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.webm'];

  // Load patients when modal opens
  useEffect(() => {
    if (isOpen && currentStep === 'select-patient') {
      loadPatients();
    }
  }, [isOpen, currentStep]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setCurrentStep('select-file');
    setFiles([]);
    setSelectedFile(null);
    setPatients([]);
    setSelectedPatient(null);
    setIsUploading(false);
  };

  const loadPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const response = await api.getPatients() as { patients: Patient[] };
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const isValidFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(extension);
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0]; // Only handle first file
    const isValid = isValidFile(file);

    const uploadFile: UploadFile = {
      id: `${Date.now()}-${Math.random()}`,
      file: file,
      name: file.name,
      size: file.size,
      status: isValid ? 'pending' : 'error',
      progress: 0,
      uploadedSize: 0,
      errorMessage: isValid ? undefined : 'Invalid file format. Supported: MP3, WAV, M4A, WEBM',
    };

    setFiles([uploadFile]);
    if (isValid) {
      setSelectedFile(uploadFile);
    }
  };

  const handleContinueToPatientSelection = () => {
    if (selectedFile) {
      setCurrentStep('select-patient');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setSelectedFile(null);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !selectedPatient) return;

    setCurrentStep('uploading');
    setIsUploading(true);

    try {
      // Step 1: Create session for the patient
      console.log('🔵 Step 1: Creating session for patient:', selectedPatient.id);
      let sessionResponse;
      let newSessionId;

      try {
        sessionResponse = await api.createSession(selectedPatient.id);
        console.log('✅ Session created:', sessionResponse);
        newSessionId = sessionResponse.sessionId;
        console.log('✅ Session ID:', newSessionId);
      } catch (err) {
        console.error('❌ Session creation failed:', err);
        throw new Error(`Failed to create session: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Step 2: Update file status to uploading
      setFiles([{ ...selectedFile, status: 'uploading', progress: 0 }]);

      // Step 3: Simulate upload progress for better UX
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => ({
            ...f,
            progress: Math.min((f.progress || 0) + 10, 90),
            uploadedSize: (f.size * Math.min((f.progress || 0) + 10, 90)) / 100,
          }))
        );
      }, 200);

      // Step 4: Upload the audio file to the backend
      console.log('🔵 Step 2: Uploading audio file to session:', newSessionId);
      console.log('📁 File details:', {
        name: selectedFile.file.name,
        size: selectedFile.file.size,
        type: selectedFile.file.type,
      });

      try {
        const uploadResponse = await api.uploadRecording(newSessionId, selectedFile.file);
        console.log('✅ Upload response:', uploadResponse);
      } catch (err) {
        clearInterval(progressInterval);
        console.error('❌ File upload failed:', err);
        throw new Error(`Failed to upload file: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Step 5: Complete the progress
      clearInterval(progressInterval);
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'complete',
          progress: 100,
          uploadedSize: f.size,
        }))
      );

      setCurrentStep('complete');
      console.log('✅ Upload complete! Redirecting to session status page...');

      // Navigate to session status page after a short delay
      setTimeout(() => {
        navigate(`/sessions/${newSessionId}`);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('❌ Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error',
          errorMessage: errorMessage,
        }))
      );
      setIsUploading(false);
      setCurrentStep('uploading'); // Stay on uploading step to show error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-50 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 z-10"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Header with Steps */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Session Recording</h1>
              <p className="text-gray-600 mb-6">
                Securely upload your pre-recorded audio files for transcription and analysis.
              </p>

              {/* Step Indicator */}
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${currentStep === 'select-file' ? 'text-blue-600' : currentStep === 'select-patient' || currentStep === 'uploading' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'select-file' ? 'bg-blue-100' : currentStep === 'select-patient' || currentStep === 'uploading' || currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {currentStep === 'select-patient' || currentStep === 'uploading' || currentStep === 'complete' ? '✓' : '1'}
                  </div>
                  <span className="text-sm font-medium">Select File</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300" />
                <div className={`flex items-center gap-2 ${currentStep === 'select-patient' ? 'text-blue-600' : currentStep === 'uploading' || currentStep === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'select-patient' ? 'bg-blue-100' : currentStep === 'uploading' || currentStep === 'complete' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {currentStep === 'uploading' || currentStep === 'complete' ? '✓' : '2'}
                  </div>
                  <span className="text-sm font-medium">Select Patient</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-300" />
                <div className={`flex items-center gap-2 ${currentStep === 'uploading' || currentStep === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'complete' ? 'bg-green-100 text-green-600' : currentStep === 'uploading' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {currentStep === 'complete' ? '✓' : '3'}
                  </div>
                  <span className="text-sm font-medium">Upload</span>
                </div>
              </div>
            </div>

            {/* Step 1: File Selection */}
            {currentStep === 'select-file' && (
              <div>
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`bg-white rounded-lg border-2 border-dashed p-12 mb-8 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Drag & drop your audio file here
                    </h3>
                    <p className="text-gray-600 mb-4">or click to browse</p>
                    <button
                      onClick={handleBrowseClick}
                      className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                    >
                      Select a File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".mp3,.wav,.m4a,.webm"
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Selected File */}
                {selectedFile && (
                  <div className="space-y-4 mb-8">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{selectedFile.name}</h4>
                          <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          onClick={handleRemoveFile}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleContinueToPatientSelection}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      Continue to Patient Selection
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {/* File with error */}
                {files.length > 0 && files[0].status === 'error' && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-8">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-900">Invalid File</h4>
                        <p className="text-sm text-red-700">{files[0].errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <p className="text-center text-sm text-gray-600">
                  Supported formats: MP3, WAV, M4A, WEBM. Your data is encrypted and HIPAA compliant.
                </p>
              </div>
            )}

            {/* Step 2: Patient Selection */}
            {currentStep === 'select-patient' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Patient</h3>
                  <p className="text-gray-600">Choose which patient this recording is for</p>
                </div>

                {isLoadingPatients ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3 mb-8 max-h-96 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedPatient?.id === patient.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            selectedPatient?.id === patient.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <User className={`w-6 h-6 ${selectedPatient?.id === patient.id ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">ID: {patient.client_id}</p>
                          </div>
                          {selectedPatient?.id === patient.id && (
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('select-file')}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={isLoadingPatients}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartUpload}
                    disabled={!selectedPatient || isLoadingPatients}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Start Upload
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Uploading */}
            {(currentStep === 'uploading' || currentStep === 'complete') && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {currentStep === 'complete' ? 'Upload Complete!' : 'Uploading...'}
                  </h3>
                  <p className="text-gray-600">
                    {currentStep === 'complete'
                      ? 'Redirecting to processing pipeline...'
                      : 'Please wait while we upload your recording'}
                  </p>
                </div>

                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-lg p-6 border border-gray-200"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          file.status === 'uploading'
                            ? 'bg-blue-50'
                            : file.status === 'complete'
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}
                      >
                        {file.status === 'uploading' && (
                          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                        )}
                        {file.status === 'complete' && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                        <p className="text-sm text-gray-600">
                          Patient: {selectedPatient?.first_name} {selectedPatient?.last_name}
                        </p>
                      </div>
                    </div>

                    {file.status === 'uploading' && (
                      <div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>
                            {formatFileSize(file.uploadedSize || 0)} / {formatFileSize(file.size)}
                          </span>
                          <span className="text-blue-600 font-medium">{Math.round(file.progress || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-300"
                            style={{ width: `${file.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {file.status === 'complete' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ Upload complete! Starting transcription...
                        </p>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{file.errorMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
