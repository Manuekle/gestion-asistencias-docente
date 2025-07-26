'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, File, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ComponentPropsWithRef } from 'react';
import { useId, useRef, useState } from 'react';

/**
 * Returns a human-readable file size.
 * @param bytes - The size of the file in bytes.
 * @returns A string representing the file size in a human-readable format.
 */
export const getReadableFileSize = (bytes: number) => {
  if (bytes === 0) return '0 KB';

  const suffixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.floor(bytes / Math.pow(1024, i)) + ' ' + suffixes[i];
};

interface FileUploadDropZoneProps {
  /** The class name of the drop zone. */
  className?: string;
  /**
   * A hint text explaining what files can be dropped.
   */
  hint?: string;
  /**
   * Disables dropping or uploading files.
   */
  isDisabled?: boolean;
  /**
   * Specifies the types of files that the server accepts.
   * Examples: "image/*", ".pdf,image/*", "image/*,video/mpeg,application/pdf"
   */
  accept?: string;
  /**
   * Allows multiple file uploads.
   */
  allowsMultiple?: boolean;
  /**
   * Maximum file size in bytes.
   */
  maxSize?: number;
  /**
   * Callback function that is called with the list of dropped files
   * when files are dropped on the drop zone.
   */
  onDropFiles?: (files: FileList) => void;
  /**
   * Callback function that is called with the list of unaccepted files
   * when files are dropped on the drop zone.
   */
  onDropUnacceptedFiles?: (files: FileList) => void;
  /**
   * Callback function that is called with the list of files that exceed
   * the size limit when files are dropped on the drop zone.
   */
  onSizeLimitExceed?: (files: FileList) => void;
}

export const FileUploadDropZone = ({
  className,
  hint,
  isDisabled,
  accept,
  allowsMultiple = true,
  maxSize,
  onDropFiles,
  onDropUnacceptedFiles,
  onSizeLimitExceed,
}: FileUploadDropZoneProps) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const isFileTypeAccepted = (file: File): boolean => {
    if (!accept) return true;

    // Split the accept string into individual types
    const acceptedTypes = accept.split(',').map(type => type.trim());

    return acceptedTypes.some(acceptedType => {
      // Handle file extensions (e.g., .pdf, .doc)
      if (acceptedType.startsWith('.')) {
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return extension === acceptedType.toLowerCase();
      }

      // Handle wildcards (e.g., image/*)
      if (acceptedType.endsWith('/*')) {
        const typePrefix = acceptedType.split('/')[0];
        return file.type.startsWith(`${typePrefix}/`);
      }

      // Handle exact MIME types (e.g., application/pdf)
      return file.type === acceptedType;
    });
  };

  const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const processFiles = (files: File[]): void => {
    // Reset the invalid state when processing files.
    setIsInvalid(false);

    const acceptedFiles: File[] = [];
    const unacceptedFiles: File[] = [];
    const oversizedFiles: File[] = [];

    // If multiple files are not allowed, only process the first file
    const filesToProcess = allowsMultiple ? files : files.slice(0, 1);

    filesToProcess.forEach(file => {
      // Check file size first
      if (maxSize && file.size > maxSize) {
        oversizedFiles.push(file);
        return;
      }

      // Then check file type
      if (isFileTypeAccepted(file)) {
        acceptedFiles.push(file);
      } else {
        unacceptedFiles.push(file);
      }
    });

    // Handle oversized files
    if (oversizedFiles.length > 0 && typeof onSizeLimitExceed === 'function') {
      const dataTransfer = new DataTransfer();
      oversizedFiles.forEach(file => dataTransfer.items.add(file));

      setIsInvalid(true);
      onSizeLimitExceed(dataTransfer.files);
    }

    // Handle accepted files
    if (acceptedFiles.length > 0 && typeof onDropFiles === 'function') {
      const dataTransfer = new DataTransfer();
      acceptedFiles.forEach(file => dataTransfer.items.add(file));
      onDropFiles(dataTransfer.files);
    }

    // Handle unaccepted files
    if (unacceptedFiles.length > 0 && typeof onDropUnacceptedFiles === 'function') {
      const unacceptedDataTransfer = new DataTransfer();
      unacceptedFiles.forEach(file => unacceptedDataTransfer.items.add(file));

      setIsInvalid(true);
      onDropUnacceptedFiles(unacceptedDataTransfer.files);
    }

    // Clear the input value to ensure the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    handleDragOut(event);
    processFiles(Array.from(event.dataTransfer.files));
  };

  const handleInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files || []));
  };

  return (
    <div
      data-dropzone
      onDragOver={handleDragIn}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragEnd={handleDragOut}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background px-6 py-8 text-center transition-colors hover:bg-muted/50',
        isDraggingOver && 'border-primary bg-primary/5',
        isDisabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1 text-center">
        <div className="flex justify-center gap-1 text-center">
          <input
            ref={inputRef}
            id={id}
            type="file"
            className="sr-only"
            disabled={isDisabled}
            accept={accept}
            multiple={allowsMultiple}
            onChange={handleInputFileChange}
          />
          <label htmlFor={id} className="flex cursor-pointer text-sm">
            <Button
              variant="link"
              size="sm"
              disabled={isDisabled}
              onClick={() => inputRef.current?.click()}
              className="p-0 h-auto font-normal"
            >
              Click para subir <span className="md:hidden">y adjuntar archivos</span>
            </Button>
          </label>
          <span className="text-sm text-muted-foreground max-md:hidden">o arrastrar y soltar</span>
        </div>
        <p
          className={cn(
            'text-xs text-muted-foreground transition-colors',
            isInvalid && 'text-destructive'
          )}
        >
          {hint || 'SVG, PNG, JPG or GIF (max. 800x400px)'}
        </p>
      </div>
    </div>
  );
};

export interface FileListItemProps {
  /** The name of the file. */
  name: string;
  /** The size of the file. */
  size: number;
  /** The upload progress of the file. */
  progress: number;
  /** Whether the file failed to upload. */
  failed?: boolean;
  /** The class name of the file list item. */
  className?: string;
  /** The function to call when the file is deleted. */
  onDelete?: () => void;
  /** The function to call when the file upload is retried. */
  onRetry?: () => void;
}

export const FileListItemProgressBar = ({
  name,
  size,
  progress,
  failed,
  onDelete,
  onRetry,
  className,
}: FileListItemProps) => {
  const isComplete = progress === 100;

  return (
    <motion.li
      layout="position"
      className={cn(
        'relative flex gap-3 rounded-lg border bg-card p-4 shadow-sm',
        failed && 'border-destructive',
        className
      )}
    >
      <File className="h-10 w-10 shrink-0 text-muted-foreground" />

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full max-w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-normal">{name}</p>

            <div className="mt-1 flex items-center gap-2">
              <p className="truncate text-xs text-muted-foreground whitespace-nowrap">
                {getReadableFileSize(size)}
              </p>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-1">
                {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
                {isComplete && <p className="text-xs font-medium text-green-600">Completado</p>}

                {!isComplete && !failed && (
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                )}
                {!isComplete && !failed && (
                  <p className="text-xs text-muted-foreground">Subiendo...</p>
                )}

                {failed && <XCircle className="h-4 w-4 text-destructive" />}
                {failed && <p className="text-xs font-medium text-destructive">Error</p>}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 -mt-1 -mr-1 self-start"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {!failed && (
          <div className="mt-2 w-full">
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {failed && (
          <div className="mt-2 flex gap-3">
            <Button
              variant="link"
              size="sm"
              onClick={onRetry}
              className="h-auto p-0 text-destructive text-xs"
            >
              Intentar de nuevo
            </Button>
          </div>
        )}
      </div>
    </motion.li>
  );
};

export const FileListItemProgressFill = ({
  name,
  size,
  progress,
  failed,
  onDelete,
  onRetry,
  className,
}: FileListItemProps) => {
  const isComplete = progress === 100;

  return (
    <motion.li
      layout="position"
      className={cn('relative flex gap-3 overflow-hidden rounded-lg border bg-card p-4', className)}
    >
      {/* Progress fill */}
      <div
        style={{ transform: `translateX(-${100 - progress}%)` }}
        className={cn(
          'absolute inset-0 size-full bg-muted transition-transform duration-75 ease-linear',
          isComplete && 'opacity-0'
        )}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Border overlay for failed state */}
      {failed && (
        <div className="absolute inset-0 size-full rounded-[inherit] border-2 border-destructive" />
      )}

      <File className="relative h-10 w-10 shrink-0 text-muted-foreground" />

      <div className="relative flex min-w-0 flex-1">
        <div className="relative flex min-w-0 flex-1 flex-col items-start">
          <div className="w-full min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{name}</p>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {failed ? 'Subida fallida, por favor intenta de nuevo' : getReadableFileSize(size)}
              </p>

              {!failed && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-1">
                    {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {!isComplete && <UploadCloud className="h-4 w-4 text-muted-foreground" />}

                    <p className="text-xs text-muted-foreground">{progress}%</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {failed && (
            <div className="mt-2 flex gap-3">
              <Button
                variant="link"
                size="sm"
                onClick={onRetry}
                className="h-auto p-0 text-destructive"
              >
                Intentar de nuevo
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 -mt-1 -mr-1 self-start"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.li>
  );
};

const FileUploadRoot = (props: ComponentPropsWithRef<'div'>) => (
  <div {...props} className={cn('flex flex-col gap-4', props.className)}>
    {props.children}
  </div>
);

const FileUploadList = (props: ComponentPropsWithRef<'ul'>) => (
  <ul {...props} className={cn('flex flex-col gap-3', props.className)}>
    <AnimatePresence initial={false}>{props.children}</AnimatePresence>
  </ul>
);

export const FileUpload = {
  Root: FileUploadRoot,
  List: FileUploadList,
  DropZone: FileUploadDropZone,
  ListItemProgressBar: FileListItemProgressBar,
  ListItemProgressFill: FileListItemProgressFill,
};
