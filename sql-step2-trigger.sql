-- STEP 2 of 2 — Run this AFTER step 1 succeeds
-- Creates the trigger that stops "Database error saving new user"

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

  INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_plans (user_id, plan, subscription_status, updated_at)
  VALUES (NEW.id, 'free', 'inactive', NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent, updated_at)
  VALUES (NEW.id, 10, 10, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_stats (user_id, total_questions, total_pdfs, updated_at)
  VALUES (NEW.id, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] user=% err=% state=%', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;  -- never block signup
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Confirm trigger and function exist
SELECT 'trigger' AS type, trigger_name AS name
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
UNION ALL
SELECT 'function', routine_name
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
