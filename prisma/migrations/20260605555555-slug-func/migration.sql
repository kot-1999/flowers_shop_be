CREATE OR REPLACE FUNCTION create_slug(text_input TEXT)
    RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
                REGEXP_REPLACE(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),'\s+', '-', 'g'
        )
       );
END;
$$ LANGUAGE plpgsql IMMUTABLE;