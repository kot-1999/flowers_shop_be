-- Trigger function
CREATE OR REPLACE FUNCTION update_translation_slugs()
    RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW."en" IS DISTINCT FROM OLD."en" THEN
        NEW."enSlug" := create_slug(NEW."en");
    END IF;

    IF TG_OP = 'INSERT' OR NEW."ua" IS DISTINCT FROM OLD."ua" THEN
        NEW."uaSlug" := create_slug(NEW."ua");
    END IF;

    IF TG_OP = 'INSERT' OR NEW."de" IS DISTINCT FROM OLD."de" THEN
        NEW."deSlug" := create_slug(NEW."de");
    END IF;

    IF TG_OP = 'INSERT' OR NEW."sk" IS DISTINCT FROM OLD."sk" THEN
        NEW."skSlug" := create_slug(NEW."sk");
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS translation_slugs_trigger ON "translations";

CREATE TRIGGER translation_slugs_trigger
    BEFORE INSERT OR UPDATE ON "translations"
    FOR EACH ROW
EXECUTE FUNCTION update_translation_slugs();

-- Populate existing records
UPDATE "translations"
SET
    "enSlug" = create_slug("en"),
    "uaSlug" = create_slug("ua"),
    "deSlug" = create_slug("de"),
    "skSlug" = create_slug("sk");