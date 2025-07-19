-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.org_id = $1 
    AND organization_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in organization
CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM organization_members 
    WHERE organization_members.org_id = $1 
    AND organization_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view organizations they are members of" ON organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    is_org_member(id, auth.uid())
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can update their organizations" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Organization owners can delete their organizations" ON organizations
  FOR DELETE USING (owner_id = auth.uid());

-- Organization members policies
CREATE POLICY "Users can view organization members for orgs they belong to" ON organization_members
  FOR SELECT USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Organization owners and admins can invite members" ON organization_members
  FOR INSERT WITH CHECK (
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Organization owners and admins can update member roles" ON organization_members
  FOR UPDATE USING (
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Organization owners and admins can remove members" ON organization_members
  FOR DELETE USING (
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin') OR
    user_id = auth.uid() -- Users can remove themselves
  );

-- Accounts policies
CREATE POLICY "Users can view accounts for their organizations" ON accounts
  FOR SELECT USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Organization members can create accounts" ON accounts
  FOR INSERT WITH CHECK (
    is_org_member(org_id, auth.uid()) AND
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin', 'editor')
  );

CREATE POLICY "Organization members can update accounts" ON accounts
  FOR UPDATE USING (
    is_org_member(org_id, auth.uid()) AND
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin', 'editor')
  );

CREATE POLICY "Organization owners and admins can delete accounts" ON accounts
  FOR DELETE USING (
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
  );

-- Posts policies
CREATE POLICY "Users can view posts for their organizations" ON posts
  FOR SELECT USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Organization members can create posts" ON posts
  FOR INSERT WITH CHECK (
    is_org_member(org_id, auth.uid()) AND
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin', 'editor') AND
    created_by = auth.uid()
  );

CREATE POLICY "Post creators and admins can update posts" ON posts
  FOR UPDATE USING (
    is_org_member(org_id, auth.uid()) AND (
      created_by = auth.uid() OR
      get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Post creators and admins can delete posts" ON posts
  FOR DELETE USING (
    is_org_member(org_id, auth.uid()) AND (
      created_by = auth.uid() OR
      get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
    )
  );

-- Tasks policies
CREATE POLICY "Users can view tasks for posts in their organizations" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = tasks.post_id 
      AND is_org_member(posts.org_id, auth.uid())
    )
  );

CREATE POLICY "System can manage tasks" ON tasks
  FOR ALL USING (true); -- Tasks are managed by the system/API

-- Metrics policies
CREATE POLICY "Users can view metrics for tasks in their organizations" ON metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks 
      JOIN posts ON posts.id = tasks.post_id
      WHERE tasks.id = metrics.task_id 
      AND is_org_member(posts.org_id, auth.uid())
    )
  );

CREATE POLICY "System can manage metrics" ON metrics
  FOR ALL USING (true); -- Metrics are managed by the system/API

-- API keys policies
CREATE POLICY "Users can view API keys for their organizations" ON api_keys
  FOR SELECT USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Organization owners and admins can manage API keys" ON api_keys
  FOR ALL USING (
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
  );

-- Content templates policies
CREATE POLICY "Users can view templates for their organizations or public templates" ON content_templates
  FOR SELECT USING (
    is_public = true OR 
    is_org_member(org_id, auth.uid())
  );

CREATE POLICY "Organization members can create templates" ON content_templates
  FOR INSERT WITH CHECK (
    is_org_member(org_id, auth.uid()) AND
    get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin', 'editor') AND
    created_by = auth.uid()
  );

CREATE POLICY "Template creators and admins can update templates" ON content_templates
  FOR UPDATE USING (
    is_org_member(org_id, auth.uid()) AND (
      created_by = auth.uid() OR
      get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Template creators and admins can delete templates" ON content_templates
  FOR DELETE USING (
    is_org_member(org_id, auth.uid()) AND (
      created_by = auth.uid() OR
      get_user_org_role(org_id, auth.uid()) IN ('owner', 'admin')
    )
  );

-- Webhook events policies
CREATE POLICY "Users can view webhook events for their organizations" ON webhook_events
  FOR SELECT USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "System can manage webhook events" ON webhook_events
  FOR ALL USING (true); -- Webhook events are managed by the system
