CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION create_slug(text_input TEXT)
    RETURNS TEXT AS $$
BEGIN
    RETURN trim(both '-' from
                regexp_replace(
                        regexp_replace(
                                regexp_replace(
                                        lower(unaccent(text_input)),
                                        '[^a-zа-яіїєґ0-9\s-]',
                                        '',
                                        'g'
                                ),
                                '\s+',
                                '-',
                                'g'
                        ),
                        '-+',
                        '-',
                        'g'
                )
           );
END;
$$ LANGUAGE plpgsql IMMUTABLE;