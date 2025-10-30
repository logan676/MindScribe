import { useState, useRef } from 'react';
import { Upload, X, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'complete' | 'error';
  progress?: number;
  uploadedSize?: number;
  errorMessage?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.mp3', '.wav', '.m4a'];

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
    if (!selectedFiles) return;

    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => {
      const isValid = isValidFile(file);
      return {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        status: isValid ? 'uploading' : 'error',
        progress: isValid ? 0 : undefined,
        uploadedSize: 0,
        errorMessage: isValid ? undefined : 'Invalid file format. Please try again.',
      };
    });

    setFiles([...files, ...newFiles]);

    // Simulate upload progress for valid files
    newFiles.forEach((file) => {
      if (file.status === 'uploading') {
        simulateUpload(file.id);
      }
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'complete' as const, progress: 100 } : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === fileId) {
              return {
                ...f,
                progress,
                uploadedSize: (f.size * progress) / 100,
              };
            }
            return f;
          })
        );
      }
    }, 500);
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

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
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
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Session Recording</h1>
              <p className="text-gray-600">
                Securely upload your pre-recorded audio files for transcription and analysis.
              </p>
            </div>

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
                  accept=".mp3,.wav,.m4a"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload List */}
            {files.length > 0 && (
              <div className="space-y-4 mb-8">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`bg-white rounded-lg p-4 ${
                      file.status === 'error'
                        ? 'border-2 border-red-200'
                        : 'border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
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
                          <Upload className="w-6 h-6 text-blue-600" />
                        )}
                        {file.status === 'complete' && (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                        {file.status === 'uploading' && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>
                                {formatFileSize(file.uploadedSize || 0)} / {formatFileSize(file.size)}
                              </span>
                              <span className="text-blue-600 font-medium">{Math.round(file.progress || 0)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${file.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {file.status === 'complete' && (
                          <p className="text-sm text-gray-600">
                            {formatFileSize(file.size)} · Upload complete
                          </p>
                        )}
                        {file.status === 'error' && (
                          <p className="text-sm text-red-600">{file.errorMessage}</p>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                          file.status === 'complete'
                            ? 'hover:bg-gray-100'
                            : 'hover:bg-red-50'
                        }`}
                      >
                        {file.status === 'complete' ? (
                          <Trash2 className="w-5 h-5 text-gray-600" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <p className="text-center text-sm text-gray-600">
              Supported formats: MP3, WAV, M4A. Your data is encrypted and HIPAA compliant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
