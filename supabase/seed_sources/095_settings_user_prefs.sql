BEGIN;

-- Precondition: Ensure users exist
DO $$
DECLARE
  v_user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM user_profiles;
  IF v_user_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No user profiles found';
  END IF;
END $$;

-- 1) Seed User Preferences
WITH users_data AS (
  SELECT user_id, tenant_id FROM user_profiles
)
INSERT INTO user_preferences (user_id, tenant_id, defaults)
SELECT 
  u.user_id,
  u.tenant_id,
  jsonb_build_object(
    'timezone', 'Asia/Dubai',
    'language', 'en',
    'landing_page', '/overview',
    'auto_refresh', true,
    'compact_view', false
  )
FROM users_data u
ON CONFLICT (user_id) DO UPDATE SET defaults = EXCLUDED.defaults;

-- 2) Seed Notification Preferences
WITH users_data AS (
  SELECT user_id, tenant_id FROM user_profiles
)
INSERT INTO notification_preferences (user_id, tenant_id, channels, digest_frequency, quiet_hours)
SELECT 
  u.user_id,
  u.tenant_id,
  jsonb_build_object(
    'email', true,
    'sms', false,
    'push', true,
    'slack', true
  ),
  'daily',
  jsonb_build_object(
    'enabled', true,
    'start', '22:00',
    'end', '07:00'
  )
FROM users_data u
ON CONFLICT (user_id) DO UPDATE SET 
  channels = EXCLUDED.channels,
  digest_frequency = EXCLUDED.digest_frequency,
  quiet_hours = EXCLUDED.quiet_hours;

-- Post-seed validation
DO $$
DECLARE
  v_pref_count INTEGER;
  v_notif_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pref_count FROM user_preferences;
  SELECT COUNT(*) INTO v_notif_count FROM notification_preferences;
  
  IF v_pref_count < 8 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 8 user_preferences, got %', v_pref_count;
  END IF;
  
  IF v_notif_count < 8 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 8 notification_preferences, got %', v_notif_count;
  END IF;
END $$;

COMMIT;
