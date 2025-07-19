-- Function to create a new organization with the creator as owner
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  org_slug TEXT,
  org_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert the organization
  INSERT INTO organizations (name, slug, description, owner_id)
  VALUES (org_name, org_slug, org_description, auth.uid())
  RETURNING id INTO new_org_id;
  
  -- Add the creator as owner in organization_members
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'owner');
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite a user to an organization
CREATE OR REPLACE FUNCTION invite_user_to_org(
  org_id UUID,
  user_email TEXT,
  user_role TEXT DEFAULT 'editor'
)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  current_user_role TEXT;
BEGIN
  -- Check if current user has permission to invite
  SELECT get_user_org_role(org_id, auth.uid()) INTO current_user_role;
  
  IF current_user_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to invite users';
  END IF;
  
  -- Get the target user ID from email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Check if user is already a member
  IF is_org_member(org_id, target_user_id) THEN
    RAISE EXCEPTION 'User is already a member of this organization';
  END IF;
  
  -- Add the user to the organization
  INSERT INTO organization_members (org_id, user_id, role, invited_by)
  VALUES (org_id, target_user_id, user_role, auth.uid());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_org_stats(org_id UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  -- Check if user has access to this organization
  IF NOT is_org_member(org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied to organization statistics';
  END IF;
  
  SELECT json_build_object(
    'total_posts', (SELECT COUNT(*) FROM posts WHERE posts.org_id = $1),
    'published_posts', (SELECT COUNT(*) FROM posts WHERE posts.org_id = $1 AND status = 'published'),
    'scheduled_posts', (SELECT COUNT(*) FROM posts WHERE posts.org_id = $1 AND status = 'scheduled'),
    'draft_posts', (SELECT COUNT(*) FROM posts WHERE posts.org_id = $1 AND status = 'draft'),
    'connected_accounts', (SELECT COUNT(*) FROM accounts WHERE accounts.org_id = $1 AND is_active = true),
    'total_members', (SELECT COUNT(*) FROM organization_members WHERE organization_members.org_id = $1),
    'total_tasks', (SELECT COUNT(*) FROM tasks JOIN posts ON posts.id = tasks.post_id WHERE posts.org_id = $1),
    'completed_tasks', (SELECT COUNT(*) FROM tasks JOIN posts ON posts.id = tasks.post_id WHERE posts.org_id = $1 AND tasks.status = 'completed'),
    'failed_tasks', (SELECT COUNT(*) FROM tasks JOIN posts ON posts.id = tasks.post_id WHERE posts.org_id = $1 AND tasks.status = 'failed')
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post analytics
CREATE OR REPLACE FUNCTION get_post_analytics(
  org_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  analytics JSON;
BEGIN
  -- Check if user has access to this organization
  IF NOT is_org_member(org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied to organization analytics';
  END IF;
  
  SELECT json_build_object(
    'period', json_build_object(
      'start', start_date,
      'end', end_date
    ),
    'total_impressions', COALESCE(SUM(m.impressions), 0),
    'total_likes', COALESCE(SUM(m.likes), 0),
    'total_comments', COALESCE(SUM(m.comments), 0),
    'total_shares', COALESCE(SUM(m.shares), 0),
    'total_clicks', COALESCE(SUM(m.clicks), 0),
    'average_engagement_rate', COALESCE(AVG(m.engagement_rate), 0),
    'platform_breakdown', (
      SELECT json_agg(
        json_build_object(
          'platform', t.platform,
          'posts', COUNT(DISTINCT t.id),
          'impressions', COALESCE(SUM(m.impressions), 0),
          'engagements', COALESCE(SUM(m.likes + m.comments + m.shares), 0)
        )
      )
      FROM tasks t
      JOIN posts p ON p.id = t.post_id
      LEFT JOIN metrics m ON m.task_id = t.id
      WHERE p.org_id = $1
        AND t.executed_at BETWEEN start_date AND end_date
      GROUP BY t.platform
    )
  ) INTO analytics
  FROM tasks t
  JOIN posts p ON p.id = t.post_id
  LEFT JOIN metrics m ON m.task_id = t.id
  WHERE p.org_id = $1
    AND t.executed_at BETWEEN start_date AND end_date;
  
  RETURN analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule a post
CREATE OR REPLACE FUNCTION schedule_post(
  post_id UUID,
  schedule_time TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
  post_org_id UUID;
  post_platforms TEXT[];
  account_record RECORD;
BEGIN
  -- Get post details and verify access
  SELECT org_id, platforms INTO post_org_id, post_platforms
  FROM posts 
  WHERE id = post_id;
  
  IF post_org_id IS NULL THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  IF NOT is_org_member(post_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Access denied to schedule this post';
  END IF;
  
  -- Update post status and schedule time
  UPDATE posts 
  SET status = 'scheduled', scheduled_at = schedule_time, updated_at = NOW()
  WHERE id = post_id;
  
  -- Create tasks for each platform
  FOR account_record IN 
    SELECT a.id, a.platform
    FROM accounts a
    WHERE a.org_id = post_org_id 
      AND a.platform = ANY(post_platforms)
      AND a.is_active = true
  LOOP
    INSERT INTO tasks (post_id, platform, account_id, scheduled_at)
    VALUES (post_id, account_record.platform, account_record.id, schedule_time);
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  org_id UUID,
  key_name TEXT,
  key_permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  expires_in_days INTEGER DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  api_key TEXT;
  key_hash TEXT;
  expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check permissions
  IF get_user_org_role(org_id, auth.uid()) NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Insufficient permissions to generate API keys';
  END IF;
  
  -- Generate random API key
  api_key := 'ap_' || encode(gen_random_bytes(32), 'hex');
  
  -- Hash the key for storage
  key_hash := encode(digest(api_key, 'sha256'), 'hex');
  
  -- Calculate expiration if specified
  IF expires_in_days IS NOT NULL THEN
    expires_at := NOW() + (expires_in_days || ' days')::INTERVAL;
  END IF;
  
  -- Store the hashed key
  INSERT INTO api_keys (org_id, name, key_hash, permissions, expires_at, created_by)
  VALUES (org_id, key_name, key_hash, key_permissions, expires_at, auth.uid());
  
  -- Return the plain text key (only time it's visible)
  RETURN api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
