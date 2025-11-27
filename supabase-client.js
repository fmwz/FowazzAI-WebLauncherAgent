// Supabase client configuration for FOWAZZ

const SUPABASE_URL = 'https://ttcrhgaaryynyyppkqnb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Y3JoZ2Fhcnl5bnl5cHBrcW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NzcxMjYsImV4cCI6MjA3NzA1MzEyNn0.kXNtgWh3bbrWkwTkvmrtLjROq6t6wib_8pGwCo9x8R4';

// Initialize Supabase client (using CDN)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Current user session
let currentUser = null;
let userProfile = null;

// Initialize auth state
async function initAuth() {
  // Get current session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Auth error:', error);
    return;
  }

  if (session) {
    console.log('Session found in initAuth:', session.user.email);
    currentUser = session.user;
    await loadUserProfile();
    onUserLoggedIn();
  } else {
    console.log('No session found in initAuth');
    currentUser = null;
    userProfile = null;
    onUserLoggedOut();
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);

    if (session) {
      currentUser = session.user;
      await loadUserProfile();
      onUserLoggedIn();
    } else {
      currentUser = null;
      userProfile = null;
      onUserLoggedOut();
    }
  });
}

// Load user profile data
async function loadUserProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (data) {
    userProfile = data;
    return data;
  }

  return null;
}

// Check if user has active subscription (new paywall system)
async function hasActiveSubscription() {
  if (!currentUser) return false;

  const { data, error } = await supabase.rpc('has_active_subscription', {
    user_uuid: currentUser.id
  });

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  return data === true;
}

// Get websites remaining for user
async function getWebsitesRemaining() {
  if (!currentUser) return 0;

  const { data, error } = await supabase.rpc('get_websites_remaining', {
    user_uuid: currentUser.id
  });

  if (error) {
    console.error('Error getting websites remaining:', error);
    return 0;
  }

  return data || 0;
}

// Increment websites used (call when Deploy Now is clicked)
async function incrementWebsitesUsed() {
  if (!currentUser) return false;

  const { data, error } = await supabase.rpc('increment_websites_used', {
    user_uuid: currentUser.id
  });

  if (error) {
    console.error('Error incrementing websites used:', error);
    return false;
  }

  return data === true;
}

// Create subscription after Stripe payment succeeds
async function createSubscription(stripeCustomerId, stripeSubscriptionId) {
  if (!currentUser) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([{
      user_id: currentUser.id,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status: 'active',
      plan_name: 'pro',
      max_websites: 3,
      websites_used: 0,
      current_period_end: null // Will be updated by webhook
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// OLD FUNCTIONS - Kept for backward compatibility, but not used in new paywall system
async function checkUserAccess() {
  if (!currentUser) return false;

  const { data, error } = await supabase.rpc('user_has_access', {
    user_uuid: currentUser.id
  });

  return data === true;
}

// Get user's subscription status
async function getUserSubscription() {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();

  return data;
}

// DEPRECATED: Old trial system - replaced by subscription paywall
// Check trial status
function getTrialInfo() {
  // Trial system disabled - all users must subscribe
  return null;
}

// Sign up
async function signUp(email, password, fullName = '') {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: null, // No email verification required
      data: {
        full_name: fullName
      }
    }
  });

  if (error) throw error;

  // Ensure user profile is created (fallback if trigger fails)
  if (data.user) {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            id: data.user.id,
            email: email,
            full_name: fullName,
            trial_ends_at: null,
            has_had_trial: false
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw - user is created, profile can be created later
        }
      }
    } catch (profileCheckError) {
      console.error('Error checking/creating user profile:', profileCheckError);
      // Don't throw - user is created, profile can be created later
    }
  }

  return data;
}

// Sign in
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) throw error;
  return data;
}

// Sign out
async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Sign in with OAuth provider (Google, GitHub, etc.)
async function signInWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) throw error;
  return data;
}

// Save project to database
async function saveProject(projectData) {
  if (!currentUser) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert([{
      id: projectData.id, // Use the chat ID as project ID
      user_id: currentUser.id,
      title: projectData.title,
      domain: projectData.domain,
      html_files: projectData.html_files,
      conversation_history: projectData.conversation_history,
      plugin_configs: projectData.plugin_configs,
      attached_files: projectData.attached_files,
      phase: projectData.phase || 1,
      deployment_state: projectData.deployment_state || {},
      deployment_status: projectData.deployment_status || null,
      preview_url: projectData.preview_url || null
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update project
async function updateProject(projectId, updates) {
  if (!currentUser) throw new Error('Not authenticated');

  // Build update object - ONLY include deployment fields if explicitly provided
  const updateData = {
    title: updates.title,
    domain: updates.domain,
    html_files: updates.html_files,
    conversation_history: updates.conversation_history,
    plugin_configs: updates.plugin_configs,
    attached_files: updates.attached_files,
    phase: updates.phase || 1,
    deployment_state: updates.deployment_state || {},
    updated_at: new Date().toISOString()
  };

  // ONLY update deployment_status if explicitly provided (during deployment)
  // Otherwise, leave it unchanged in database
  if (updates.deployment_status !== undefined) {
    updateData.deployment_status = updates.deployment_status;
  }
  if (updates.preview_url !== undefined) {
    updateData.preview_url = updates.preview_url;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('user_id', currentUser.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user's projects
async function getUserProjects() {
  if (!currentUser) {
    console.log('⚠️ getUserProjects: No currentUser, returning empty array');
    return [];
  }

  console.log('📦 getUserProjects: Fetching for user:', currentUser.id);

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error loading projects:', error);
    return [];
  }

  console.log('📦 getUserProjects: Success! Returned', data?.length || 0, 'projects');
  return data || [];
}

// Delete project
async function deleteProject(projectId) {
  if (!currentUser) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', currentUser.id);

  if (error) throw error;
}

// Callbacks (to be defined in app.js)
function onUserLoggedIn() {
  if (window.handleUserLoggedIn) {
    window.handleUserLoggedIn();
  }
}

function onUserLoggedOut() {
  if (window.handleUserLoggedOut) {
    window.handleUserLoggedOut();
  }
}
