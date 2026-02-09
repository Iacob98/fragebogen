"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { MAX_FILES, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/constants";

interface UploadedFile {
  id: number;
  filename: string;
  previewUrl: string;
}

interface PhotoUploaderProps {
  onFilesChange: (ids: number[]) => void;
}

export function PhotoUploader({ onFilesChange }: PhotoUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(`Dateityp nicht erlaubt: ${file.name}`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Datei zu groß: ${file.name} (max. 10MB)`);
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Upload fehlgeschlagen");
      return null;
    }

    const data = await res.json();
    return {
      id: data.id,
      filename: data.filename,
      previewUrl: URL.createObjectURL(file),
    };
  };

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const fileArray = Array.from(fileList);
      const remaining = MAX_FILES - files.length;

      if (fileArray.length > remaining) {
        setError(`Maximal ${MAX_FILES} Fotos erlaubt`);
        return;
      }

      setError(null);
      setUploading(true);

      const results: UploadedFile[] = [];
      for (const file of fileArray) {
        const result = await uploadFile(file);
        if (result) results.push(result);
      }

      const newFiles = [...files, ...results];
      setFiles(newFiles);
      onFilesChange(newFiles.map((f) => f.id));
      setUploading(false);
    },
    [files, onFilesChange]
  );

  const removeFile = (id: number) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const isMaxReached = files.length >= MAX_FILES;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center hover:border-primary transition-colors"
      >
        <div className="flex flex-col items-center gap-3">
          <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground hidden sm:block">
            Fotos hierher ziehen oder
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || isMaxReached}
              className="flex-1 sm:flex-none h-11 sm:h-9 text-sm"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Galerie
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraRef.current?.click()}
              disabled={uploading || isMaxReached}
              className="flex-1 sm:flex-none h-11 sm:h-9 text-sm"
            >
              <Camera className="h-4 w-4 mr-1.5" />
              Kamera
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept={ALLOWED_MIME_TYPES.join(",")}
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">
            Max. {MAX_FILES} Fotos, je max. 10MB
          </p>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Wird hochgeladen...
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((file) => (
            <div key={file.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.previewUrl}
                alt={file.filename}
                className="w-20 h-20 sm:w-20 sm:h-20 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
