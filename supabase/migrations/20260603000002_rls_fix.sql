CREATE OR REPLACE FUNCTION public.requesting_user_id() RETURNS text AS $$
  SELECT NULLIF(
    coalesce(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claim.sub', true)
    ), ''
  )::text;
$$ LANGUAGE SQL stable;
