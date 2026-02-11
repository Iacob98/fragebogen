import { z } from "zod";
import { PHOTO_CATEGORIES, PHOTO_CATEGORY_KEYS, type PhotoCategoryKey } from "./constants";

const photoCategoryEnum = z.enum(
  PHOTO_CATEGORY_KEYS as [PhotoCategoryKey, ...PhotoCategoryKey[]]
);

export const submissionSchema = z
  .object({
    mtTeam: z.string().min(1, "MT Team ist erforderlich"),
    dehpNumber: z.string().min(1, "DEHP Nummer ist erforderlich"),
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    lastName: z.string().min(1, "Nachname ist erforderlich"),
    address: z.string().optional(),
    comment: z.string().optional(),
    hasRadiator: z.boolean(),
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
    attachments: z.record(photoCategoryEnum, z.array(z.number().int())),
  })
  .superRefine((data, ctx) => {
    for (const key of PHOTO_CATEGORY_KEYS) {
      const cat = PHOTO_CATEGORIES[key];
      const ids = data.attachments[key] || [];

      if (key === "RADIATOR") {
        if (!data.hasRadiator && ids.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${cat.label}: фото не разрешены без радиатора`,
            path: ["attachments", key],
          });
        }
        if (data.hasRadiator && ids.length > cat.max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${cat.label}: максимум ${cat.max} фото, загружено ${ids.length}`,
            path: ["attachments", key],
          });
        }
        continue;
      }

      if (ids.length < cat.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${cat.label}: минимум ${cat.min} фото, загружено ${ids.length}`,
          path: ["attachments", key],
        });
      }
      if (ids.length > cat.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${cat.label}: максимум ${cat.max} фото, загружено ${ids.length}`,
          path: ["attachments", key],
        });
      }
    }
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
