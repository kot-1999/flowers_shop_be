CREATE OR REPLACE FUNCTION update_user_slugs()
    RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT, always generate slugs
    -- For UPDATE, only regenerate if the field changed
    IF TG_OP = 'INSERT' OR NEW."firstName" IS DISTINCT FROM OLD."firstName" THEN
        NEW."firstNameSlug" := create_slug(NEW."firstName");
    END IF;

    IF TG_OP = 'INSERT' OR NEW."lastName" IS DISTINCT FROM OLD."lastName" THEN
        NEW."lastNameSlug" := create_slug(NEW."lastName");
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
DROP TRIGGER IF EXISTS user_slugs_trigger ON "users";
CREATE TRIGGER user_slugs_trigger
    BEFORE INSERT OR UPDATE ON "users"
    FOR EACH ROW
EXECUTE FUNCTION update_user_slugs();

-- Populate existing records
UPDATE "users"
SET
    "firstNameSlug" = create_slug("firstName"),
    "lastNameSlug" = create_slug("lastName")
WHERE "deletedAt" IS NULL;