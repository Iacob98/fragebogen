-- Rename photo category key from CONNECTION_INSIDE_NO_INSULATION to FOAM_HOLE
UPDATE "Attachment"
SET "category" = 'FOAM_HOLE'
WHERE "category" = 'CONNECTION_INSIDE_NO_INSULATION';
