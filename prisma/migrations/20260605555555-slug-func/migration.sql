CREATE OR REPLACE FUNCTION create_slug(text_input TEXT)
    RETURNS TEXT AS $$
BEGIN
    RETURN trim(both '-' from
                regexp_replace(
                        regexp_replace(
                                lower(text_input),
                                '[^a-zа-яіїєґ0-9\s-]',
                                '',
                                'gi'
                        ),
                        '\s+',
                        '-',
                        'g'
                )
           );
END;
$$ LANGUAGE plpgsql IMMUTABLE;