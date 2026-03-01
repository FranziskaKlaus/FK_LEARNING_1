import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Video, Mic, FileText, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'video' | 'audio' | 'document';
}

interface MediaUploaderProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  'video/*': ['.mp4', '.webm', '.mov', '.ogg'],
  'audio/*': ['.mp3', '.wav', '.ogg', '.webm'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function getFileType(file: File): 'image' | 'video' | 'audio' | 'document' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

function FileIcon({ type }: { type: string }) {
  const cls = 'w-8 h-8';
  if (type === 'image') return <Image className={`${cls} text-blue-500`} />;
  if (type === 'video') return <Video className={`${cls} text-purple-500`} />;
  if (type === 'audio') return <Mic className={`${cls} text-green-500`} />;
  return <FileText className={`${cls} text-orange-500`} />;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaUploader({ files, onChange, maxFiles = 10 }: MediaUploaderProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null);
    if (rejected.length > 0) {
      const reasons = rejected.map(r => r.errors.map((e: any) => e.message).join(', ')).join('; ');
      setError(`Some files were rejected: ${reasons}`);
    }

    if (files.length + accepted.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadedFile[] = accepted.map(file => ({
      file,
      type: getFileType(file),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    onChange([...files, ...newFiles]);
  }, [files, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview!);
    }
    newFiles.splice(index, 1);
    onChange(newFiles);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop files here...' : 'Upload evidence files'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Photos, videos, audio recordings, documents (PDF, DOC)
        </p>
        <p className="text-xs text-gray-400">Up to {maxFiles} files, max 50MB each</p>
        <button type="button" className="mt-3 text-xs text-blue-600 hover:underline font-medium">
          Browse files
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                {f.preview ? (
                  <img src={f.preview} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-gray-200 flex-shrink-0">
                    <FileIcon type={f.type} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-400">{formatSize(f.file.size)} • {f.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
