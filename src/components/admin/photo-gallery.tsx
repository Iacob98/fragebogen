"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_KEYS, type PhotoCategoryKey } from "@/lib/constants";

interface Attachment {
  id: number;
  filename: string;
  category?: string | null;
}

interface PhotoGalleryProps {
  attachments: Attachment[];
  grouped?: boolean;
  hasRadiator?: boolean;
}

export function PhotoGallery({ attachments, grouped = false, hasRadiator = false }: PhotoGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Fotos</p>;
  }

  const prev = () =>
    setCurrentIndex((i) => (i === 0 ? attachments.length - 1 : i - 1));
  const next = () =>
    setCurrentIndex((i) => (i === attachments.length - 1 ? 0 : i + 1));

  const openLightbox = (globalIndex: number) => {
    setCurrentIndex(globalIndex);
    setOpen(true);
  };

  const renderThumbnail = (att: Attachment, globalIndex: number) => (
    <button
      key={att.id}
      onClick={() => openLightbox(globalIndex)}
      className="w-20 h-20 rounded border overflow-hidden hover:ring-2 ring-primary transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/attachments/${att.id}`}
        alt={att.filename}
        className="w-full h-full object-cover"
      />
    </button>
  );

  const lightbox = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Foto Ansicht</DialogTitle>
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
          {attachments[currentIndex].filename}
          {attachments[currentIndex].category && (
            <span className="ml-2 text-xs">
              [{PHOTO_CATEGORIES[attachments[currentIndex].category as PhotoCategoryKey]?.label || attachments[currentIndex].category}]
            </span>
          )}
          {" "}({currentIndex + 1}/{attachments.length})
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!grouped) {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => renderThumbnail(att, idx))}
        </div>
        {lightbox}
      </>
    );
  }

  // Group by category
  const grouped_map = new Map<string, { att: Attachment; globalIndex: number }[]>();
  const uncategorized: { att: Attachment; globalIndex: number }[] = [];

  attachments.forEach((att, idx) => {
    if (att.category) {
      if (!grouped_map.has(att.category)) grouped_map.set(att.category, []);
      grouped_map.get(att.category)!.push({ att, globalIndex: idx });
    } else {
      uncategorized.push({ att, globalIndex: idx });
    }
  });

  return (
    <>
      <div className="space-y-4">
        {PHOTO_CATEGORY_KEYS.map((key) => {
          if (key === "RADIATOR" && !hasRadiator) return null;
          const items = grouped_map.get(key) || [];
          const cat = PHOTO_CATEGORIES[key];
          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-medium">{cat.label}</h4>
                <Badge
                  variant={items.length === cat.required ? "default" : "secondary"}
                  className="text-xs"
                >
                  {items.length}/{cat.required}
                </Badge>
              </div>
              {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {items.map(({ att, globalIndex }) => renderThumbnail(att, globalIndex))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Keine Fotos</p>
              )}
            </div>
          );
        })}

        {uncategorized.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Sonstige</h4>
            <div className="flex flex-wrap gap-2">
              {uncategorized.map(({ att, globalIndex }) => renderThumbnail(att, globalIndex))}
            </div>
          </div>
        )}
      </div>
      {lightbox}
    </>
  );
}
