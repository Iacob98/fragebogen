export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
export const ITEMS_PER_PAGE = 25;

export const PHOTO_CATEGORIES = {
  IN_HOUSE: { label: "Фото в доме", required: 1 },
  CONNECTION_ROUTE: { label: "Фото подключки (трасса)", required: 1 },
  CONNECTION_INSIDE_NO_INSULATION: { label: "Фото подключки внутри без изоляции", required: 2 },
  INSIDE_ROUTE_NO_INSULATION: { label: "Фото трассы без изоляции внутри дома", required: 5 },
  AIR_OPEN: { label: "Воздухан открытый", required: 5 },
  INSULATION: { label: "Изоляция", required: 5 },
  RADIATOR: { label: "Радиатор", required: 9, conditional: true },
  CLEAN_OUTSIDE: { label: "Чистота на объекте — Снаружи", required: 3 },
  CLEAN_INSIDE: { label: "Чистота на объекте — Внутри", required: 3 },
} as const;

export type PhotoCategoryKey = keyof typeof PHOTO_CATEGORIES;

export const PHOTO_CATEGORY_KEYS = Object.keys(PHOTO_CATEGORIES) as PhotoCategoryKey[];

export function getRequiredCategories(hasRadiator: boolean): PhotoCategoryKey[] {
  return PHOTO_CATEGORY_KEYS.filter(
    (key) => key !== "RADIATOR" || hasRadiator
  );
}

export function getExpectedPhotoCount(hasRadiator: boolean): number {
  return getRequiredCategories(hasRadiator).reduce(
    (sum, key) => sum + PHOTO_CATEGORIES[key].required,
    0
  );
}
