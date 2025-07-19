-- Insert sample data for development and testing

-- Note: This seed data assumes you have at least one user in auth.users
-- You can create a test user through the Supabase dashboard or auth signup

-- Insert sample organizations (you'll need to replace the owner_id with actual user IDs)
-- INSERT INTO organizations (id, name, slug, description, owner_id) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'Demo Company', 'demo-company', 'A demo organization for testing', 'user-id-here'),
-- ('550e8400-e29b-41d4-a716-446655440002', 'Marketing Agency', 'marketing-agency', 'Digital marketing agency', 'user-id-here');

-- Insert sample content templates
INSERT INTO content_templates (id, org_id, name, description, content, variables, platforms, category, is_public, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440010', NULL, 'Product Launch', 'Template for product launch announcements', 
 '🚀 Exciting news! We''re launching {{product_name}} - {{description}}. 
 
Key features:
{{#features}}
✅ {{.}}
{{/features}}

Get started today: {{link}}

#ProductLaunch #Innovation #{{product_name}}', 
 ARRAY['product_name', 'description', 'features', 'link'], 
 ARRAY['twitter', 'facebook', 'linkedin'], 
 'product', 
 true, 
 NULL),

('550e8400-e29b-41d4-a716-446655440011', NULL, 'Event Promotion', 'Template for promoting events', 
 '📅 Don''t miss {{event_name}}!

📍 {{location}}
🗓️ {{date}}
⏰ {{time}}

{{description}}

Register now: {{registration_link}}

#Event #{{event_name}} #Networking', 
 ARRAY['event_name', 'location', 'date', 'time', 'description', 'registration_link'], 
 ARRAY['twitter', 'facebook', 'linkedin', 'instagram'], 
 'event', 
 true, 
 NULL),

('550e8400-e29b-41d4-a716-446655440012', NULL, 'Blog Post Promotion', 'Template for promoting blog posts', 
 '📝 New blog post: {{title}}

{{summary}}

Read more: {{blog_link}}

What do you think? Share your thoughts in the comments!

#Blog #Content #{{category}}', 
 ARRAY['title', 'summary', 'blog_link', 'category'], 
 ARRAY['twitter', 'facebook', 'linkedin'], 
 'content', 
 true, 
 NULL),

('550e8400-e29b-41d4-a716-446655440013', NULL, 'Team Spotlight', 'Template for featuring team members', 
 '👨‍💼 Team Spotlight: Meet {{name}}!

{{name}} is our {{position}} and has been with us for {{duration}}.

"{{quote}}" - {{name}}

{{fun_fact}}

#TeamSpotlight #Team #Culture', 
 ARRAY['name', 'position', 'duration', 'quote', 'fun_fact'], 
 ARRAY['twitter', 'facebook', 'linkedin', 'instagram'], 
 'team', 
 true, 
 NULL),

('550e8400-e29b-41d4-a716-446655440014', NULL, 'Weekly Tips', 'Template for sharing weekly tips', 
 '💡 {{day}} Tip: {{tip_title}}

{{tip_content}}

{{call_to_action}}

#Tips #{{category}} #MondayMotivation', 
 ARRAY['day', 'tip_title', 'tip_content', 'call_to_action', 'category'], 
 ARRAY['twitter', 'facebook', 'linkedin'], 
 'tips', 
 true, 
 NULL);

-- Insert platform configuration data (this could be used by the application)
-- This is stored as a simple key-value configuration table
CREATE TABLE IF NOT EXISTS platform_configs (
  platform TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_configs (platform, config) VALUES
('twitter', '{
  "name": "Twitter/X",
  "displayName": "Twitter/X",
  "maxTextLength": 280,
  "supportedMediaTypes": ["image/jpeg", "image/png", "image/gif", "video/mp4"],
  "requirements": {
    "imageSize": {
      "max": {"width": 4096, "height": 4096},
      "recommended": {"width": 1200, "height": 675}
    },
    "videoSize": {
      "maxDuration": 140,
      "maxFileSize": 536870912,
      "supportedFormats": ["mp4", "mov"]
    }
  },
  "apiEndpoints": {
    "post": "https://api.twitter.com/2/tweets",
    "upload": "https://upload.twitter.com/1.1/media/upload.json"
  }
}'),

('facebook', '{
  "name": "Facebook",
  "displayName": "Facebook",
  "maxTextLength": 63206,
  "supportedMediaTypes": ["image/jpeg", "image/png", "video/mp4"],
  "requirements": {
    "imageSize": {
      "max": {"width": 2048, "height": 2048},
      "recommended": {"width": 1200, "height": 630}
    },
    "videoSize": {
      "maxDuration": 240,
      "maxFileSize": 4294967296,
      "supportedFormats": ["mp4", "mov", "avi"]
    }
  },
  "apiEndpoints": {
    "post": "https://graph.facebook.com/v18.0/me/feed",
    "upload": "https://graph.facebook.com/v18.0/me/photos"
  }
}'),

('instagram', '{
  "name": "Instagram",
  "displayName": "Instagram",
  "maxTextLength": 2200,
  "supportedMediaTypes": ["image/jpeg", "image/png", "video/mp4"],
  "requirements": {
    "imageSize": {
      "min": {"width": 320, "height": 320},
      "max": {"width": 1080, "height": 1080},
      "recommended": {"width": 1080, "height": 1080}
    },
    "videoSize": {
      "maxDuration": 60,
      "maxFileSize": 4294967296,
      "supportedFormats": ["mp4", "mov"]
    }
  },
  "apiEndpoints": {
    "post": "https://graph.facebook.com/v18.0/me/media",
    "publish": "https://graph.facebook.com/v18.0/me/media_publish"
  }
}'),

('linkedin', '{
  "name": "LinkedIn",
  "displayName": "LinkedIn",
  "maxTextLength": 3000,
  "supportedMediaTypes": ["image/jpeg", "image/png", "video/mp4"],
  "requirements": {
    "imageSize": {
      "max": {"width": 4096, "height": 4096},
      "recommended": {"width": 1200, "height": 627}
    },
    "videoSize": {
      "maxDuration": 600,
      "maxFileSize": 5368709120,
      "supportedFormats": ["mp4", "mov", "avi"]
    }
  },
  "apiEndpoints": {
    "post": "https://api.linkedin.com/v2/ugcPosts",
    "upload": "https://api.linkedin.com/v2/assets"
  }
}'),

('tiktok', '{
  "name": "TikTok",
  "displayName": "TikTok",
  "maxTextLength": 2200,
  "supportedMediaTypes": ["video/mp4"],
  "requirements": {
    "videoSize": {
      "minDuration": 3,
      "maxDuration": 180,
      "maxFileSize": 287762808,
      "supportedFormats": ["mp4", "mov"],
      "aspectRatio": "9:16"
    }
  },
  "apiEndpoints": {
    "post": "https://open-api.tiktok.com/share/video/upload/",
    "upload": "https://open-api.tiktok.com/share/video/upload/"
  }
}'),

('youtube', '{
  "name": "YouTube",
  "displayName": "YouTube",
  "maxTextLength": 5000,
  "supportedMediaTypes": ["video/mp4"],
  "requirements": {
    "videoSize": {
      "maxDuration": 43200,
      "maxFileSize": 137438953472,
      "supportedFormats": ["mp4", "mov", "avi", "wmv", "flv", "webm"]
    }
  },
  "apiEndpoints": {
    "post": "https://www.googleapis.com/upload/youtube/v3/videos",
    "upload": "https://www.googleapis.com/upload/youtube/v3/videos"
  }
}');

-- Create trigger to update platform_configs updated_at
CREATE TRIGGER update_platform_configs_updated_at 
  BEFORE UPDATE ON platform_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
