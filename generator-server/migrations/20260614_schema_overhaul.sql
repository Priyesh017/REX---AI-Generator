-- migrations/20260614_schema_overhaul.sql
-- Overhauls database schema to support social features, notifications, moderation, and denormalized counters.

-- 1. Orders table modifications
ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Backfill profile_id in orders by joining on clerk_id
UPDATE orders o
SET profile_id = p.id
FROM profiles p
WHERE o.clerk_id = p.clerk_id AND o.profile_id IS NULL;

-- Create index on profile_id for orders
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON orders(profile_id);


-- 2. Reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved_removed', 'resolved_dismissed', 'resolved_warned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT report_target_check CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    -- Ensure one report per user per target
    CONSTRAINT unique_reporter_post UNIQUE (reporter_profile_id, post_id),
    CONSTRAINT unique_reporter_comment UNIQUE (reporter_profile_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment_id ON reports(comment_id);


-- 3. Audit Logs table (Append-only)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('remove_post', 'dismiss_report', 'warn_user', 'ban_user', 'approve_post', 'unban_user')),
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile')),
    target_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_moderator ON audit_logs(moderator_profile_id);


-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'system')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON notifications(recipient_profile_id, is_read, created_at DESC);


-- 5. DB Triggers for Counter Denormalization

-- 5.1 Maintain likes_count (like_count) on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
CREATE TRIGGER post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();


-- 5.2 Maintain comment_count on posts (for comments that are visible/active)
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_comments_count_trigger ON comments;
CREATE TRIGGER post_comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();


-- 5.3 Maintain followers_count and following_count on profiles
CREATE OR REPLACE FUNCTION update_profile_follows_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_profile_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_profile_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_profile_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_profile_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_follows_count_trigger ON follows;
CREATE TRIGGER profile_follows_count_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_profile_follows_count();


-- 5.4 Maintain posts_count on profiles
CREATE OR REPLACE FUNCTION update_profile_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET posts_count = posts_count + 1 WHERE id = NEW.author_profile_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.author_profile_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_posts_count_trigger ON posts;
CREATE TRIGGER profile_posts_count_trigger
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_posts_count();


-- 6. Auto-hide Threshold Logic
-- Automatically hides posts/comments that receive too many reports
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count INT;
BEGIN
  IF NEW.post_id IS NOT NULL THEN
    -- Check post reports
    SELECT COUNT(*) INTO report_count
    FROM reports
    WHERE post_id = NEW.post_id AND status = 'pending';

    IF report_count >= 3 THEN
      UPDATE posts SET visibility = 'hidden' WHERE id = NEW.post_id;
    END IF;
  ELSIF NEW.comment_id IS NOT NULL THEN
    -- Check comment reports
    SELECT COUNT(*) INTO report_count
    FROM reports
    WHERE comment_id = NEW.comment_id AND status = 'pending';

    IF report_count >= 2 THEN
      -- In our schema comment visibility is 'status' = 'hidden' (visible is status = 'visible')
      UPDATE comments SET status = 'hidden' WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS report_threshold_trigger ON reports;
CREATE TRIGGER report_threshold_trigger
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION check_report_threshold();
