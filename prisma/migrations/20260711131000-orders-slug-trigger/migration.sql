-- Trigger function
CREATE OR REPLACE FUNCTION update_order_slugs()
    RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW."recipientFirstName" IS DISTINCT FROM OLD."recipientFirstName" THEN
        NEW."recipientFirstNameSlug" := create_slug(NEW."recipientFirstName");
    END IF;

    IF TG_OP = 'INSERT' OR NEW."recipientLastName" IS DISTINCT FROM OLD."recipientLastName" THEN
        NEW."recipientLastNameSlug" := create_slug(NEW."recipientLastName");
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS order_slugs_trigger ON "orders";

CREATE TRIGGER order_slugs_trigger
    BEFORE INSERT OR UPDATE ON "orders"
    FOR EACH ROW
EXECUTE FUNCTION update_order_slugs();

-- Populate existing records
UPDATE "orders"
SET
    "recipientFirstNameSlug" = create_slug("recipientFirstName"),
    "recipientLastNameSlug" = create_slug("recipientLastName");

-- Indexes
CREATE INDEX IF NOT EXISTS "orders_recipientFirstNameSlug_idx"
    ON "orders" ("recipientFirstNameSlug");

CREATE INDEX IF NOT EXISTS "orders_recipientLastNameSlug_idx"
    ON "orders" ("recipientLastNameSlug");