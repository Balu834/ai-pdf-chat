-- Run each query ONE AT A TIME and share every result

-- QUERY 1: What triggers exist on auth.users?
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';

-- QUERY 2: Does handle_new_user exist? Is it SECURITY DEFINER?
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- QUERY 3: What tables exist in public schema?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
