-- Sprint 14: Uppercase existing user names and saved repair text fields
-- DO NOT touch: narratives (AI output, already uppercase), contacts (emails are case-sensitive),
-- users.email, users.username (email casing preserved per RFC, username derived from email)

-- Uppercase user first/last names
UPDATE public.users
SET first_name = UPPER(first_name)
WHERE first_name IS NOT NULL
  AND first_name <> UPPER(first_name);

UPDATE public.users
SET last_name = UPPER(last_name)
WHERE last_name IS NOT NULL
  AND last_name <> UPPER(last_name);

-- Uppercase saved_repairs text fields
-- UPPER(NULL) returns NULL in Postgres, so this is safe for nullable columns
UPDATE public.saved_repairs
SET
  template_name       = UPPER(template_name),
  make                = UPPER(make),
  model               = UPPER(model),
  customer_concern    = UPPER(customer_concern),
  codes_present       = UPPER(codes_present),
  diagnostics_performed = UPPER(diagnostics_performed),
  root_cause          = UPPER(root_cause),
  repair_performed    = UPPER(repair_performed),
  repair_verification = UPPER(repair_verification),
  recommended_action  = UPPER(recommended_action)
WHERE TRUE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
