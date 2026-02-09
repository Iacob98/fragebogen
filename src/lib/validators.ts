import { z } from "zod";

export const submissionSchema = z.object({
  mtTeam: z.string().min(1, "MT Team ist erforderlich"),
  dehpNumber: z.string().min(1, "DEHP Nummer ist erforderlich"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  comment: z.string().optional(),
  items: z
    .array(
      z.object({
        materialId: z.number().int().positive(),
        qty: z.number().int().min(0),
      })
    )
    .refine((items) => items.some((item) => item.qty > 0), {
      message: "Mindestens ein Material muss angegeben werden",
    }),
  attachmentIds: z.array(z.number().int()).optional(),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const exportParamsSchema = z.object({
  type: z.enum(["submissions", "object", "team", "report"]),
  from: z.string().optional(),
  to: z.string().optional(),
  mtTeam: z.string().optional(),
  dehpNumber: z.string().optional(),
});

export type ExportParams = z.infer<typeof exportParamsSchema>;
