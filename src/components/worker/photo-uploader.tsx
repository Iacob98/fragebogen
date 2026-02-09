"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/constants";
import type { PhotoCategoryKey } from "@/lib/constants";

interface UploadedFile {
  id: number;
  filename: string;
  previewUrl: string;
}

interface CategoryPhotoUploaderProps {
  category: PhotoCategoryKey;
  label: string;
  required: number;
  disabled?: boolean;
  onFilesChange: (ids: number[]) => void;
}

export function CategoryPhotoUploader({
  category,
  label,
  required,
  disabled = false,
  onFilesChange,
}: CategoryPhotoUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const isFull = files.length >= required;

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError(`Тип файла не разрешён: ${file.name}`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Файл слишком большой: ${file.name} (макс. 10МБ)`);
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Загрузка не удалась");
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
      const remaining = required - files.length;

      if (fileArray.length > remaining) {
        setError(`Максимум ${required} фото в этой категории`);
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
    [files, onFilesChange, required, category]
  );

  const removeFile = (id: number) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.id));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) handleFiles(e.dataTransfer.files);
    },
    [handleFiles, disabled]
  );

  return (
    <div className={`space-y-2 rounded-lg border p-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{label}</h4>
        <div className="flex items-center gap-1.5">
          {isFull && !disabled && (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <Badge variant={isFull && !disabled ? "default" : "secondary"} className="text-xs">
            {files.length}/{required}
          </Badge>
        </div>
      </div>

      {!disabled && (
        <>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-lg p-3 text-center hover:border-primary transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading || isFull}
                  className="flex-1 sm:flex-none h-9 text-sm"
                >
                  <Upload className="h-4 w-4 mr-1.5" />
                  Галерея
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => cameraRef.current?.click()}
                  disabled={uploading || isFull}
                  className="flex-1 sm:flex-none h-9 text-sm"
                >
                  <Camera className="h-4 w-4 mr-1.5" />
                  Камера
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
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка...
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <div key={file.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.previewUrl}
                    alt={file.filename}
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {disabled && (
        <p className="text-xs text-muted-foreground">Отключено (нет радиатора)</p>
      )}
    </div>
  );
}
