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
    RETURN NEW;
END;
$$;
