CREATE OR REPLACE FUNCTION public.requesting_user_id() RETURNS text AS $$
DECLARE
  auth_header text;
  token text;
  payload text;
BEGIN
  -- Coba ambil dari header Authorization
  BEGIN
    auth_header := current_setting('request.headers', true)::json->>'authorization';
  EXCEPTION WHEN OTHERS THEN
    auth_header := NULL;
  END;

  IF auth_header IS NULL OR auth_header NOT ILIKE 'Bearer %' THEN
    RETURN NULLIF(
      coalesce(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claim.sub', true)
      ), ''
    )::text;
  END IF;

  token := substr(auth_header, 8);
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
