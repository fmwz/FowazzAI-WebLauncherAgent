-- User Settings Table
-- This table stores all user preferences and settings

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_project_phase INTEGER DEFAULT 1,
    auto_save_interval INTEGER DEFAULT 60,
    compact_mode BOOLEAN DEFAULT false,
    show_build_progress BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT true,
    reduced_motion BOOLEAN DEFAULT false,
    auto_preview BOOLEAN DEFAULT true,
    syntax_highlighting BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create settings for new users
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (id, default_project_phase, auto_save_interval)
    VALUES (NEW.id, 1, 60);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE create_user_settings();
