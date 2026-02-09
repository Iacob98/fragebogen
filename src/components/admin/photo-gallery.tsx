"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: number;
  filename: string;
}

interface PhotoGalleryProps {
  attachments: Attachment[];
}

export function PhotoGallery({ attachments }: PhotoGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Fotos</p>;
  }

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? attachments.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === attachments.length - 1 ? 0 : i + 1));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att, idx) => (
          <button
            key={att.id}
            onClick={() => {
              setCurrentIndex(idx);
              setOpen(true);
            }}
            className="w-20 h-20 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/attachments/${att.id}`}
              alt={att.filename}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative flex items-center justify-center bg-black min-h-[60vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {attachments.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 text-white hover:bg-white/20"
                  onClick={prev}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-white hover:bg-white/20"
                  onClick={next}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/attachments/${attachments[currentIndex].id}`}
              alt={attachments[currentIndex].filename}
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
          <div className="p-3 text-center text-sm text-muted-foreground">
            {attachments[currentIndex].filename} ({currentIndex + 1}/
            {attachments.length})
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
