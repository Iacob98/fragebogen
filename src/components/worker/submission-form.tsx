"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhotoUploader } from "./photo-uploader";
import { Loader2, Send } from "lucide-react";

interface Material {
  id: number;
  name: string;
}

interface SubmissionFormProps {
  materials: Material[];
}

export function SubmissionForm({ materials }: SubmissionFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mtTeam, setMtTeam] = useState("");
  const [dehpNumber, setDehpNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [comment, setComment] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (const m of materials) init[m.id] = 0;
    return init;
  });
  const [attachmentIds, setAttachmentIds] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mtTeam.trim()) {
      setError("MT Team ist erforderlich");
      return;
    }
    if (!dehpNumber.trim()) {
      setError("DEHP Nummer ist erforderlich");
      return;
    }
    if (!firstName.trim()) {
      setError("Vorname ist erforderlich");
      return;
    }
    if (!lastName.trim()) {
      setError("Nachname ist erforderlich");
      return;
    }

    const items = materials
      .map((m) => ({
        materialId: m.id,
        qty: quantities[m.id] || 0,
      }))
      .filter((i) => i.qty > 0);

    if (items.length === 0) {
      setError("Mindestens ein Material muss angegeben werden");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mtTeam,
          dehpNumber,
          firstName,
          lastName,
          comment: comment || undefined,
          items,
          attachmentIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Senden");
        setSubmitting(false);
        return;
      }

      router.push("/form/success");
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Allgemeine Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mtTeam" className="text-sm">MT Team *</Label>
              <Input
                id="mtTeam"
                value={mtTeam}
                onChange={(e) => setMtTeam(e.target.value)}
                placeholder="z.B. MT 01"
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dehpNumber" className="text-sm">DEHP Nummer *</Label>
              <Input
                id="dehpNumber"
                value={dehpNumber}
                onChange={(e) => setDehpNumber(e.target.value)}
                placeholder="z.B. DEHP-001"
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-sm">Vorname *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-sm">Nachname *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11 sm:h-9 text-base sm:text-sm"
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-sm">Kommentar</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optionaler Kommentar..."
              rows={2}
              className="text-base sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Materialien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between gap-3 py-1.5 border-b border-border/50 last:border-0"
              >
                <Label className="flex-1 text-sm leading-tight min-w-0">
                  {material.name}
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  value={quantities[material.id] || ""}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [material.id]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-20 sm:w-24 h-10 sm:h-9 text-right text-base sm:text-sm shrink-0"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploader onFilesChange={setAttachmentIds} />
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Sticky submit button on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t sm:static sm:p-0 sm:border-0 sm:bg-transparent z-20">
        <Button
          type="submit"
          size="lg"
          className="w-full h-12 sm:h-11 text-base sm:text-sm"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Meldung absenden
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
