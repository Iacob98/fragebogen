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
  IN_HOUSE: { label: "Фото в доме", min: 1, max: 10 },
  CONNECTION_ROUTE: { label: "Фото подключки (трасса)", min: 1, max: 10 },
  FOAM_HOLE: { label: "Фото отверстия залитой пеной снаружи и внутри", min: 2, max: 10 },
  INSIDE_ROUTE_NO_INSULATION: { label: "Фото трассы без изоляции внутри дома", min: 5, max: 10 },
  AIR_OPEN: { label: "Воздухан открытый", min: 5, max: 10 },
  INSULATION: { label: "Изоляция", min: 5, max: 10 },
  RADIATOR: { label: "Радиатор", min: 0, max: 10, conditional: true },
  CLEAN_OUTSIDE: { label: "Чистота на объекте — Снаружи", min: 3, max: 10 },
  CLEAN_INSIDE: { label: "Чистота на объекте — Внутри", min: 3, max: 10 },
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
    (sum, key) => sum + PHOTO_CATEGORIES[key].min,
    0
  );
}
