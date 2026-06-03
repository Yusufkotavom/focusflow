CREATE OR REPLACE FUNCTION public.requesting_user_id() RETURNS text AS $$
DECLARE
  custom_header text;
  token text;
  payload text;
BEGIN
  -- Ambil token dari custom header 'x-clerk-token'
  BEGIN
    custom_header := current_setting('request.headers', true)::json->>'x-clerk-token';
  EXCEPTION WHEN OTHERS THEN
    custom_header := NULL;
  END;

  IF custom_header IS NULL THEN
    -- Fallback ke metode normal jika x-clerk-token tidak ada
    RETURN NULLIF(
      coalesce(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claim.sub', true)
      ), ''
    )::text;
  END IF;

  token := custom_header;
  payload := split_part(token, '.', 2);
  
  -- Replace characters for base64 decoding
  payload := replace(replace(payload, '-', '+'), '_', '/');
  
  -- Add padding
  WHILE length(payload) % 4 != 0 LOOP
    payload := payload || '=';
  END LOOP;
  
  BEGIN
    RETURN (convert_from(decode(payload, 'base64'), 'utf8')::json)->>'sub';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql stable security definer;
