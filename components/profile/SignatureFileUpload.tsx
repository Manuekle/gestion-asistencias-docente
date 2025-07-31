'use client';

import { Upload } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface SignatureFileUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
}

export function SignatureFileUpload({ onFileSelect }: SignatureFileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 space-y-2 cursor-pointer transition-colors ${
        isDragActive ? 'bg-muted/50 border-primary' : 'hover:bg-muted/30'
      }`}>
      <input {...getInputProps()} />
      <Upload className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm font-normal">
        {isDragActive ? 'Suelta la imagen aquí' : 'Seleccionar archivo'}
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Arrastra y suelta la imagen, o haz clic para seleccionar
      </p>
    </div>
  );
}
