// ============================================
// PRODUCTION CONFIG
// ============================================
// Automatically detect if we're in production or development
// Replace these URLs with your actual production URLs after deployment
const IS_PRODUCTION = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Flask Backend URL (Claude AI)
const API_ENDPOINT = IS_PRODUCTION
  ? 'https://fowazz-flask-backend-production.up.railway.app/api/message'
  : 'http://127.0.0.1:5000/api/message';

// Fayez API URL (Deployment system)
const FAYEZ_API = IS_PRODUCTION
  ? 'https://fayez-api-production.up.railway.app/api'
  : 'http://localhost:4000/api';

console.log(`🌍 Running in ${IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
console.log(`🔌 Flask API: ${API_ENDPOINT}`);
console.log(`🚀 Fayez API: ${FAYEZ_API}`);

// ============================================
// HACKATHON MODE - TEMPORARY FREE ACCESS
// ============================================
// ⚠️ SET TO false TO RE-ENABLE SUBSCRIPTIONS & PAYMENTS
// When true: All features are FREE, no limits, no paywalls
// When false: Normal subscription system with website limits
const HACKATHON_MODE = true;

if (HACKATHON_MODE) {
  console.log('🎓 HACKATHON MODE ENABLED - All features are FREE!');
  console.log('⚠️ To re-enable subscriptions, set HACKATHON_MODE = false in app.js');
}

// ============================================
// PLAN CONFIGURATION
// ============================================
// Plan configuration - Single source of truth for all plan limits
const PLAN_LIMITS = {
  lite: { maxWebsites: 1, name: 'Lite', price: '$5/mo', priceNum: 5.00 },
  pro: { maxWebsites: 3, name: 'Pro', price: '$9.99/mo', priceNum: 9.99 },
  max: { maxWebsites: 8, name: 'Max', price: '$24.45/mo', priceNum: 24.45 }
};

// ============================================
// APP INITIALIZATION
// ============================================

const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const chatTitle = document.getElementById('chatTitle');
const attachButton = document.getElementById('attachButton');
const fileInput = document.getElementById('fileInput');
const filePreviewContainer = document.getElementById('filePreviewContainer');

let currentChatId = Date.now();
let chats = JSON.parse(localStorage.getItem('fowazz_chats') || '[]');
let conversationHistory = [
  { role: 'assistant', content: t('initialGreeting') }
];
let attachedFiles = [];
let selectedPlugins = [];
let pluginConfigs = {}; // Store actual configuration for each plugin

// Store projects globally
let globalProjects = {};

// Helper function to escape HTML for code display
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Current deployment state
let currentDeployment = {
  projectId: null,
  domain: null,
  uploadKey: null,
  status: null
};

// Current phase (1-4: Create, Domain, Deploy, Live)
let currentPhase = 1;

// ============= PHASE TRANSITION FUNCTIONS =============

window.transitionToPhase = function(phaseNumber) {
  if (phaseNumber === currentPhase) return;

  const currentScreen = document.getElementById(`phase${currentPhase}`);
  const nextScreen = document.getElementById(`phase${phaseNumber}`);
  const phaseItems = document.querySelectorAll('.phase-item');
  const phaseConnectors = document.querySelectorAll('.phase-connector');

  // Fade out current screen first
  if (currentScreen) {
    currentScreen.classList.add('exiting');

    setTimeout(() => {
      currentScreen.classList.remove('active', 'exiting');
      currentScreen.style.display = 'none';

      // Then fade in next screen
      if (nextScreen) {
        nextScreen.style.display = 'flex';
        // Force reflow
        nextScreen.offsetHeight;
        nextScreen.classList.add('active');
      }
    }, 400); // Wait for fade out to complete
  } else {
    // If no current screen, just show next screen
    if (nextScreen) {
      nextScreen.style.display = 'flex';
      nextScreen.offsetHeight;
      nextScreen.classList.add('active');
    }
  }

  // Update phase indicators
  phaseItems.forEach((item, index) => {
    const phase = index + 1;
    item.classList.remove('active', 'completed');

    if (phase < phaseNumber) {
      item.classList.add('completed');
    } else if (phase === phaseNumber) {
      item.classList.add('active');
    }
  });

  // Update connectors
  phaseConnectors.forEach((connector, index) => {
    if (index + 1 < phaseNumber) {
      connector.classList.add('completed');
    } else {
      connector.classList.remove('completed');
    }
  });

  currentPhase = phaseNumber;

  // Save chat with updated phase
  saveChat();
}

// Markdown parsing function
function parseMarkdown(text) {
  // Escape HTML first to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // Parse headers (must be at the start of a line)
  // H3 (###)
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.75rem 0; color: #e5e5e5;">$1</h3>');
  // H2 (##)
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.75rem 0; color: #e5e5e5;">$1</h2>');
  // H1 (#)
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 1rem 0; color: #e5e5e5;">$1</h1>');
  
  // Parse bold text (**text**) - must be done before italic to avoid conflicts
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: #ffffff;">$1</strong>');
  
  // Parse italic text (*text*)
  html = html.replace(/\*(.+?)\*/g, '<em style="font-style: italic; color: #e5e5e5;">$1</em>');
  
  // Convert line breaks to <br> tags
  html = html.replace(/\n/g, '<br>');

  return html;
}

// Convert filename to nice display name for tabs
function getPageDisplayName(filename) {
  // Remove .html extension
  const name = filename.replace('.html', '');

  // Special cases
  if (name === 'index') return 'Home';

  // Convert kebab-case or snake_case to Title Case
  // e.g., "about-us" → "About Us", "contact" → "Contact"
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function saveChat() {
  console.log('💾 saveChat() called for chat:', currentChatId);
  console.log('💾 conversationHistory length:', conversationHistory.length);
  console.log('💾 Current user logged in:', !!currentUser);

  const chatIndex = chats.findIndex(c => c.id === currentChatId);
  const chatData = {
    id: currentChatId,
    title: chatTitle.textContent,
    messages: conversationHistory,
    timestamp: Date.now(),
    phase: currentPhase, // Save current phase
    deployment: currentDeployment // Save deployment state
  };

  console.log('💾 Chat data to save:', {
    id: chatData.id,
    title: chatData.title,
    messageCount: chatData.messages.length,
    phase: chatData.phase
  });

  if (chatIndex >= 0) {
    chats[chatIndex] = chatData;
  } else {
    chats.unshift(chatData);
  }

  if (chats.length > 50) {
    chats = chats.slice(0, 50);
  }

  // Save to localStorage as backup
  localStorage.setItem('fowazz_chats', JSON.stringify(chats));

  // Save to Supabase database if user is logged in
  if (currentUser) {
    try {
      // Get project files using consistent ID format
      const projectId = 'project-' + currentChatId;
      const htmlFiles = globalProjects[projectId] || [];

      console.log('💾 Saving project to database:');
      console.log('  Chat ID:', currentChatId);
      console.log('  Project ID:', projectId);
      console.log('  HTML files found:', htmlFiles.length);

      const projectData = {
        id: currentChatId.toString(), // Use chat ID as project ID (stored as string in DB)
        title: chatTitle.textContent,
        domain: currentDeployment.domain || null,
        html_files: htmlFiles,
        conversation_history: conversationHistory,
        plugin_configs: {}, // PRIVACY: Don't save plugin configs (contains sensitive data)
        attached_files: attachedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
        phase: currentPhase,
        deployment_state: currentDeployment
        // NOTE: deployment_status and preview_url are NOT included here
        // They are ONLY set during deployment and never touched by saveChat()
      };

      // Check if project exists in database
      const existingProjects = await getUserProjects();
      const existingProject = existingProjects.find(p => p.id === currentChatId.toString());

      if (existingProject) {
        // Update existing project
        await updateProject(currentChatId.toString(), projectData);
      } else {
        // Create new project
        await saveProject(projectData);
      }
    } catch (error) {
      console.error('❌ Error saving chat to database:', error);
      // Continue anyway - localStorage save succeeded
    }
  }

  renderChatHistory();
}

async function loadChat(chatId) {
  // If user is logged in, fetch fresh data from database first
  if (currentUser) {
    try {
      const projects = await getUserProjects();
      const dbProject = projects.find(p => p.id === chatId.toString());

      if (dbProject) {
        console.log('📥 Loading fresh project data from database for chat:', chatId);

        // Update the chats array with fresh database data
        const chatIndex = chats.findIndex(c => c.id === chatId);
        const freshChatData = {
          id: chatId,
          title: dbProject.title || 'Untitled Project',
          messages: dbProject.conversation_history || [],
          timestamp: new Date(dbProject.updated_at || dbProject.created_at).getTime(),
          phase: dbProject.phase || 1,
          deployment: dbProject.deployment_state || {
            projectId: null,
            domain: dbProject.domain || null,
            uploadKey: null,
            status: null
          },
          deploymentStatus: dbProject.deployment_status || null,
          previewUrl: dbProject.preview_url || null
        };

        if (chatIndex >= 0) {
          chats[chatIndex] = freshChatData;
        } else {
          chats.push(freshChatData);
        }

        // Update localStorage with fresh data
        localStorage.setItem('fowazz_chats', JSON.stringify(chats));
      }
    } catch (error) {
      console.error('⚠️ Error loading fresh project data:', error);
      // Continue with local data if database fetch fails
    }
  }

  const chat = chats.find(c => c.id === chatId);
  if (!chat) return;

  currentChatId = chatId;
  conversationHistory = Array.isArray(chat.messages) ? chat.messages.slice() : [];
  chatTitle.textContent = chat.title || t('newChat');

  // Restore deployment state if it exists
  if (chat.deployment) {
    currentDeployment = { ...chat.deployment };
  } else {
    currentDeployment = {
      projectId: null,
      domain: null,
      uploadKey: null,
      status: null
    };
  }

  messagesContainer.innerHTML = '<div class="w-full max-w-3xl space-y-8"></div>';

  console.log('📖 Loading chat:', chatId);
  console.log('📖 Messages in conversationHistory:', conversationHistory.length);
  console.log('📖 First few messages:', conversationHistory.slice(0, 3));

  // Track if we need to auto-restore preview
  let foundProjectHtml = false;

  conversationHistory.forEach((msg, index) => {
    const contentPreview = typeof msg.content === 'string' ? msg.content.substring(0, 50) : '[Attachment/Array]';
    console.log(`📝 Rendering message ${index}:`, msg.role, contentPreview);

    if (index === 0) return;

    // Add message WITHOUT saving to avoid loops
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message flex items-start';

    // Parse content to check for project artifacts
    if (msg.role === 'assistant' && msg.content) {
      // Temporarily add to DOM to check for project preview
      // Handle both string and array content
      const contentToAdd = typeof msg.content === 'string' ? msg.content : '[Attachment]';
      addMessage(msg.role, contentToAdd, false);

      // Check if this message contains a project
      const previewBtnId = `show-preview-btn-project-`;
      const previewElement = messageDiv.querySelector('[id^="show-preview-btn"]');

      if (previewElement) {
        foundProjectHtml = true;
      }
    } else {
      addMessage(msg.role, msg.content, false);
    }
  });

  // Check if this is a deployed project - if so, enter EDIT MODE
  const isDeployedProject = chat.deploymentStatus === 'deployed' ||
                            (chat.deployment && chat.deployment.status === 'deployed');

  if (isDeployedProject) {
    // Enter EDIT MODE - fresh chat interface, no previous messages shown
    console.log('✏️ Entering EDIT MODE for deployed project:', chatId);

    // Add edit mode class to body for grid background effect
    document.body.classList.add('edit-mode-active');

    // Always go to phase 1 for editing
    if (currentPhase !== 1) {
      transitionToPhase(1);
    }

    // Clear the messages container - don't show previous chat
    messagesContainer.innerHTML = '<div class="w-full max-w-3xl space-y-8"></div>';

    // Get project info for display
    const projectTitle = chat.title || 'Your Site';
    const projectDomain = chat.deployment?.domain || chat.previewUrl || '';

    // Create edit mode header with site info
    const editModeHeader = document.createElement('div');
    editModeHeader.className = 'edit-mode-site-preview';
    editModeHeader.innerHTML = `
      <div class="edit-mode-site-preview-header">
        <div class="edit-mode-site-info">
          <span class="edit-mode-badge" data-translate="editMode">EDIT MODE</span>
          <span class="edit-mode-site-name">${projectTitle}</span>
          <span class="edit-mode-live-badge" data-translate="liveBadge">LIVE</span>
        </div>
        ${projectDomain ? `<a href="${projectDomain.startsWith('http') ? projectDomain : 'https://' + projectDomain}" target="_blank" style="color: var(--orange); font-size: 12px; text-decoration: none; opacity: 0.8;">${projectDomain} ↗</a>` : ''}
      </div>
      <div style="font-size: 13px; color: #888; line-height: 1.5;">
        <span data-translate="editModeDesc">Your site is live. Tell me what you'd like to change.</span>
      </div>
    `;

    // Add the header to messages container
    const messagesWrapper = messagesContainer.querySelector('.w-full.max-w-3xl') || messagesContainer;
    messagesWrapper.appendChild(editModeHeader);

    // Apply translations to the edit mode header
    if (typeof applyTranslations === 'function') {
      applyTranslations();
    }

    // Use translation function if available, fallback to hardcoded
    const editGreeting = typeof t === 'function'
      ? t('editGreeting')
      : 'cool, what do you wanna edit on your site?';

    // Add the edit greeting message to DOM (fresh, clean)
    addMessage('assistant', editGreeting, false);

    // Add to conversation history only if not already there
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const lastMessageContent = lastMessage?.content
      ? (typeof lastMessage.content === 'string'
          ? lastMessage.content
          : (Array.isArray(lastMessage.content)
              ? lastMessage.content.map(c => c.text || '').join(' ')
              : ''))
      : '';
    const isAlreadyInEditMode = lastMessage &&
      lastMessage.role === 'assistant' &&
      (lastMessageContent.includes('wanna edit') || lastMessageContent.includes('تبي تعدل'));

    if (!isAlreadyInEditMode) {
      conversationHistory.push({ role: 'assistant', content: editGreeting });
      saveChat();
    }

    // Restore the preview for the deployed site
    setTimeout(async () => {
      await restoreProjectFromDatabase(chatId);
    }, 600);

    renderChatHistory();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return; // Exit early - don't run the normal phase restoration
  } else {
    // Not in edit mode - remove the class if it was there
    document.body.classList.remove('edit-mode-active');
  }

  // Restore the phase if it was saved (only for non-deployed projects)
  const savedPhase = chat.phase || 1;
  if (savedPhase !== currentPhase) {
    transitionToPhase(savedPhase);
  }

  // If phase is 4 (Live), restore the Phase 4 UI
  if (savedPhase === 4 && chat.deployment && chat.deployment.domain && chat.previewUrl) {
    setTimeout(() => {
      const phase4Container = document.getElementById('phase4Container');
      if (phase4Container) {
        phase4Container.innerHTML = `
          <div class="w-full max-w-3xl mx-auto text-center" style="margin-top: 30px;">
            <div class="text-6xl mb-6">🎉</div>
            <h2 class="text-4xl font-bold text-white mb-4">Your Website is Live!</h2>
            <p class="text-gray-300 text-lg mb-8">Your website is successfully deployed and running.</p>

            <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
              <h3 class="text-lg font-semibold text-white mb-3">Your Domain:</h3>
              <a href="https://${chat.deployment.domain}" target="_blank" class="text-green-400 hover:underline text-xl break-all">
                ${chat.deployment.domain}
              </a>
            </div>

            <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 class="text-lg font-semibold text-white mb-3">Your Preview Link:</h3>
              <a href="${chat.previewUrl}" target="_blank" class="text-blue-400 hover:underline break-all">
                ${chat.previewUrl}
              </a>
            </div>

            <div class="mt-8">
              <button onclick="transitionToPhase(1)" class="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                Create Another Website
              </button>
            </div>
          </div>
        `;
      }
    }, 500);
  }

  // First, try to restore artifacts from conversation history (for localStorage projects)
  const restoredFromHistory = restoreArtifactsFromHistory(chatId);

  // Restore HTML files from database and show preview - ALWAYS do this
  // Important: Must happen AFTER messages are rendered
  setTimeout(async () => {
    // Try database restore first
    await restoreProjectFromDatabase(chatId);

    // If database restore didn't work and we have artifacts in history, show preview
    const projectId = 'project-' + chatId;
    if (!document.querySelector(`#project-preview-${projectId}`) && globalProjects[projectId]) {
      console.log('🔄 Manually showing preview from restored artifacts...');
      const showBtn = document.querySelector(`[onclick*="${projectId}"]`);
      if (showBtn) {
        showBtn.click();
      }
    }
  }, 600); // Longer delay to ensure everything is rendered

  renderChatHistory();
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Restore project HTML files from database and show preview
async function restoreProjectFromDatabase(chatId) {
  try {
    console.log('🔄 Attempting to restore project for chat:', chatId);

    // First check if we already have artifacts in globalProjects (restored from history)
    const projectId = 'project-' + chatId;
    if (globalProjects[projectId]) {
      console.log('✅ Found artifacts in globalProjects, skipping database load');
      return;
    }

    // Load project from database
    const projects = await getUserProjects();
    console.log('📦 Loaded', projects.length, 'projects from database');

    const project = projects.find(p => p.id === chatId.toString());

    if (!project) {
      console.log('⚠️ No project found in database for chat:', chatId);
      return;
    }

    console.log('✅ Found project:', project.title);
    console.log('📄 HTML files count:', Array.isArray(project.html_files) ? project.html_files.length : 0);

    if (!project.html_files || (Array.isArray(project.html_files) && project.html_files.length === 0)) {
      console.log('⚠️ Project has no HTML files');
      return;
    }

    console.log('🎯 Restoring HTML files to globalProjects...');

    // Restore to globalProjects using consistent ID format
    globalProjects[projectId] = project.html_files;

    console.log('💾 Restored to globalProjects:', projectId);
    console.log('💾 Files:', globalProjects[projectId].map(f => f.filename));

    // Try multiple methods to show preview
    let attempts = 0;
    const maxAttempts = 10;

    function tryShowPreview() {
      attempts++;
      console.log(`🔍 Attempt ${attempts}: Looking for preview button...`);

      // Method 1: Try to find and click the show button
      const showBtn = document.getElementById(`show-preview-btn-${projectId}`);
      if (showBtn) {
        console.log('🎉 Found show button! Clicking it...');
        showBtn.click();
        return true;
      }

      // Method 2: Try alternative button ID format (without 'project-' prefix)
      const showBtnAlt = document.getElementById(`show-preview-btn-${chatId}`);
      if (showBtnAlt) {
        console.log('🎉 Found alternative show button! Clicking it...');
        showBtnAlt.click();
        return true;
      }

      // Method 3: Try to find button by onclick attribute
      const altBtn = document.querySelector(`[onclick*="${projectId}"]`);
      if (altBtn) {
        console.log('🎉 Found button by onclick! Clicking it...');
        altBtn.click();
        return true;
      }

      // Method 4: Try to find by partial match
      const altBtn2 = document.querySelector(`[onclick*="${chatId}"]`);
      if (altBtn2) {
        console.log('🎉 Found button by chat ID! Clicking it...');
        altBtn2.click();
        return true;
      }

      // Retry if attempts remain
      if (attempts < maxAttempts) {
        console.log(`⏳ Retrying in 300ms... (${attempts}/${maxAttempts})`);
        setTimeout(tryShowPreview, 300);
        return false;
      } else {
        console.error('❌ Failed to show preview after', maxAttempts, 'attempts');
        console.log('💡 Available buttons:', document.querySelectorAll('[id*="show-preview"]').length);
        return false;
      }
    }

    // Start trying to show preview after a short delay to ensure DOM is ready
    console.log('🚀 Starting preview restoration process...');
    setTimeout(tryShowPreview, 100);

  } catch (error) {
    console.error('❌ Critical error restoring project:', error);
  }
}

window.loadChat = loadChat;

// Restore artifacts from conversation history to globalProjects
function restoreArtifactsFromHistory(chatId) {
  const chat = chats.find(c => c.id === chatId);
  if (!chat || !chat.messages) return;

  const chatProjectId = 'project-' + chatId;
  let foundArtifacts = [];

  chat.messages.forEach(msg => {
    if (msg.role === 'assistant' && msg.content) {
      const artifactRegex = /\[ARTIFACT:START:(.+?)\]([\s\S]*?)\[ARTIFACT:END\]/g;
      let match;
      while ((match = artifactRegex.exec(msg.content)) !== null) {
        const filename = match[1].trim();
        const htmlCode = match[2].trim();
        foundArtifacts.push({ filename, htmlCode });
      }
    }
  });

  if (foundArtifacts.length > 0) {
    globalProjects[chatProjectId] = foundArtifacts;
    console.log('💾 Restored', foundArtifacts.length, 'artifacts from conversation history');
    console.log('💾 Project ID:', chatProjectId);
    console.log('💾 Files:', foundArtifacts.map(a => a.filename));
    return true;
  }
  return false;
}

async function deleteChat(chatId, event) {
  if (event) event.stopPropagation();

  // Show confirmation modal
  const modal = document.getElementById('deleteConfirmModal');
  const confirmBtn = document.getElementById('confirmDeleteBtn');

  if (!modal || !confirmBtn) {
    console.error('Delete confirmation modal not found');
    return;
  }

  // Show modal
  modal.classList.add('show');

  // Remove any old listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  // Add fresh click handler
  newConfirmBtn.addEventListener('click', async () => {
    // Find the element BEFORE closing modal
    const chatToDelete = document.querySelector(`[onclick="loadChat(${chatId})"]`);

    if (chatToDelete) {
      // Start animation IMMEDIATELY before closing modal
      chatToDelete.style.pointerEvents = 'none';
      chatToDelete.classList.add('deleting');
      console.log('🗑️ Starting delete animation for chat:', chatId);
    }

    // Close modal AFTER starting animation
    modal.classList.remove('show');

    if (chatToDelete) {
      // Wait for animation to complete (0.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 500));

      // NOW delete from data (after animation)
      chats = chats.filter(c => c.id !== chatId);
      localStorage.setItem('fowazz_chats', JSON.stringify(chats));

      // Delete from database
      if (currentUser) {
        try {
          await deleteProject(chatId.toString());
        } catch (error) {
          console.error('Error deleting from database:', error);
        }
      }

      // Remove element from DOM
      chatToDelete.remove();

      // Handle navigation if needed
      if (currentChatId === chatId) {
        newChat();
      }
    } else {
      console.warn('⚠️ Chat element not found for deletion:', chatId);
      // Fallback if element not found
      chats = chats.filter(c => c.id !== chatId);
      localStorage.setItem('fowazz_chats', JSON.stringify(chats));
      if (currentChatId === chatId) {
        newChat();
      }
    }
  });
}

// Close delete confirmation modal
window.closeDeleteConfirmModal = function() {
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

window.deleteChat = deleteChat;

function newChat() {
  currentChatId = Date.now();
  console.log('🆕 Starting new chat:', currentChatId);

  // Remove edit mode if it was active
  document.body.classList.remove('edit-mode-active');

  // Get current language and set initial greeting
  const currentLang = localStorage.getItem('fowazz_language') || 'en';
  const initialGreeting = currentLang === 'ar' ? 'نورت, وش ناوي نبني اليوم؟' : 'hey, so what\'re we building?';

  conversationHistory = [{ role: 'assistant', content: initialGreeting }];
  chatTitle.textContent = t('newChat');

  // Immediately add to chats array so it appears in sidebar RIGHT AWAY
  const newChatData = {
    id: currentChatId,
    title: t('newChat'),
    messages: conversationHistory,
    timestamp: Date.now(),
    phase: 1,
    deployment: {
      projectId: null,
      domain: null,
      uploadKey: null,
      status: null
    },
    surpriseMeUsed: false
  };

  // Add to beginning of chats array
  chats.unshift(newChatData);

  console.log('📋 Added new chat to sidebar:', newChatData);

  // Update sidebar immediately with animation
  renderChatHistory(true); // Animate new chat

  // Reset to Phase 1
  transitionToPhase(1);

  // Clear deployment state
  currentDeployment = {
    projectId: null,
    domain: null,
    uploadKey: null,
    status: null
  };

  // Reset domain input and results
  const domainInput = document.getElementById('domainInputMain');
  const domainResult = document.getElementById('domainResultMain');
  const proceedBtn = document.getElementById('proceedBtnMain');

  if (domainInput) domainInput.value = '';
  if (domainResult) {
    domainResult.className = 'domain-result';
    domainResult.innerHTML = '';
  }
  if (proceedBtn) proceedBtn.remove();

  // Reset deployment steps
  const deploymentSteps = document.querySelectorAll('#deploymentStepsMain .deploy-step-card');
  deploymentSteps.forEach(step => {
    step.classList.remove('in-progress', 'completed', 'error');
    const statusEl = step.querySelector('.deploy-step-status');
    if (statusEl) statusEl.textContent = 'Waiting...';
  });

  // Reset deployment result
  const deploymentResult = document.getElementById('deploymentResultMain');
  if (deploymentResult) {
    deploymentResult.className = 'deployment-result-main';
    deploymentResult.innerHTML = '';
  }

  window.renderInitialGreeting();
  renderChatHistory();
  userInput.focus();
}

// Render initial greeting with tips (used by newChat and language switching)
window.renderInitialGreeting = function() {
  messagesContainer.innerHTML = `
    <div class="w-full max-w-3xl space-y-8">
      <div class="message flex gap-4 items-start">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-1.5">
            <span class="text-sm font-semibold text-orange-400">Fowazz</span>
            <span class="text-xs text-gray-600">${t('justNow')}</span>
          </div>
          <div class="message-assistant rounded-xl rounded-tl-sm px-5 py-4">
            <p class="text-gray-200 text-base leading-relaxed">${t('initialGreeting')}</p>
          </div>
          <div class="mt-4 px-4 py-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
            <p class="text-sm text-gray-400 leading-relaxed mb-2">
              <span class="font-semibold text-gray-300">${t('justTalkNormal')}</span> ${t('tellMeWhatYouNeed')}
            </p>
            <p class="text-xs text-gray-500 mb-2">
              ${t('tipsFeaturesBefore')} <span class="font-semibold text-orange-400">${t('tipsFeaturesIcon')}</span> ${t('tipsFeaturesAfter')}
            </p>
            <p class="text-xs text-gray-500">
              ${t('tipsDragDrop')}
            </p>
          </div>
        </div>
      </div>
    </div>`;
};

function renderChatHistory(shouldAnimate = false) {
  chatHistory.innerHTML = chats.map((chat, index) => {
    const isActive = chat.id === currentChatId;
    const date = new Date(chat.timestamp);
    const timeAgo = getTimeAgo(date);
    const isDeployed = chat.deploymentStatus === 'deployed';

    // Only add animation style if shouldAnimate is true
    const animationStyle = shouldAnimate
      ? `animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.03}s both;`
      : '';

    // Add green background for deployed projects
    const deployedStyle = isDeployed
      ? 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border-color: rgba(16, 185, 129, 0.3);'
      : '';

    return `
      <div class="sidebar-item ${isActive ? 'active' : ''}" onclick="loadChat(${chat.id})" style="${animationStyle} ${deployedStyle}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <div class="text-sm font-medium text-gray-300 truncate">${chat.title}</div>
              ${isDeployed ? `
                <div style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 2px 8px;
                  background: rgba(16, 185, 129, 0.2);
                  border: 1px solid rgba(16, 185, 129, 0.4);
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 600;
                  color: #10b981;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  white-space: nowrap;
                ">
                  <span style="width: 6px; height: 6px; background: #10b981; border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></span>
                  Running
                </div>
              ` : ''}
            </div>
            <div class="text-xs ${isDeployed ? 'text-emerald-400' : 'text-gray-600'} mt-0.5">${timeAgo}</div>
          </div>
          <button class="delete-btn text-gray-600 hover:text-red-400 transition-colors p-1" onclick="deleteChat(${chat.id}, event)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const lang = localStorage.getItem('fowazz_language') || 'en';

  if (seconds < 60) return t('justNow');
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return lang === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return lang === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return lang === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
  }
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US');
}

function updateChatTitle(titleText) {
  // Only update if we're still on "New Project" and have a proper title
  if (chatTitle.textContent === t('newChat') && titleText && titleText.trim() !== '') {
    const title = titleText.length > 40 ? titleText.substring(0, 40) + '...' : titleText;
    chatTitle.textContent = title;
    saveChat();
  }
}

userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 140) + 'px';
});

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', newChat);

// File upload handlers
attachButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return;
    }
    attachedFiles.push(file);
  });
  renderFilePreview();
  fileInput.value = ''; // Reset input
});

function renderFilePreview() {
  if (attachedFiles.length === 0) {
    filePreviewContainer.style.display = 'none';
    filePreviewContainer.innerHTML = '';
    return;
  }

  filePreviewContainer.style.display = 'block';
  filePreviewContainer.innerHTML = attachedFiles.map((file, index) => {
    const isImage = file.type.startsWith('image/');
    const icon = isImage ? '' : getFileIcon(file.type);

    return `
      <div class="file-preview-item">
        ${isImage ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}" />` : icon}
        <span style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
        <button class="file-remove-btn" onclick="removeFile(${index})">✕</button>
      </div>
    `;
  }).join('');
}

function getFileIcon(mimeType) {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('text')) return '📃';
  return '📎';
}

window.removeFile = function(index) {
  attachedFiles.splice(index, 1);
  renderFilePreview();
};

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Drag and Drop functionality
const dropZoneOverlay = document.getElementById('dropZoneOverlay');
let dragCounter = 0;

// Prevent default drag behaviors on the entire document
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Show overlay when dragging files over the window
document.body.addEventListener('dragenter', (e) => {
  dragCounter++;
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    dropZoneOverlay.classList.add('active');
  }
});

document.body.addEventListener('dragleave', (e) => {
  dragCounter--;
  if (dragCounter === 0) {
    dropZoneOverlay.classList.remove('active');
  }
});

// Handle drop
document.body.addEventListener('drop', (e) => {
  dragCounter = 0;
  dropZoneOverlay.classList.remove('active');

  const files = Array.from(e.dataTransfer.files);

  files.forEach(file => {
    // Check file type
    const validTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats-officedocument'];
    const isValid = validTypes.some(type => file.type.includes(type));

    if (!isValid) {
      alert(`File type not supported: ${file.name}`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return;
    }

    attachedFiles.push(file);
  });

  renderFilePreview();

  // Focus the input after dropping files
  userInput.focus();
});

// Helper function to extract text from message arrays (for messages with attachments)
function extractTextFromMessage(messageContent) {
  if (!Array.isArray(messageContent)) {
    return typeof messageContent === 'string' ? messageContent : String(messageContent);
  }

  // Extract text from array of message parts
  const textParts = [];
  messageContent.forEach(part => {
    if (part.type === 'text' && part.text) {
      textParts.push(part.text);
    }
  });

  return textParts.join('\n');
}

function addMessage(role, content, shouldSave = true) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message flex items-start';
  
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Parse artifacts from content
  const artifactRegex = /\[ARTIFACT:START:(.+?)\]([\s\S]*?)\[ARTIFACT:END\]/g;
  let processedContent = content;
  let artifacts = [];
  let match;

  // Store original content for debugging
  // Handle both string content and array content (for messages with attachments)
  const originalContent = typeof content === 'string' ? content : JSON.stringify(content);

  while ((match = artifactRegex.exec(originalContent)) !== null) {
    const filename = match[1].trim();
    const htmlCode = match[2].trim();
    artifacts.push({ filename, htmlCode });
  }

  // Check if site is incomplete (more pages coming)
  const isIncomplete = typeof content === 'string' && content.includes('[INCOMPLETE]');

  // Remove all artifacts from the content
  // Only process if content is a string
  if (typeof content === 'string') {
    processedContent = originalContent.replace(artifactRegex, '').trim();
    // Also remove [INCOMPLETE] marker
    processedContent = processedContent.replace(/\[INCOMPLETE\]/g, '').trim();
    // Remove [LANGUAGE: xx] tags from displayed content
    processedContent = processedContent.replace(/\[LANGUAGE:\s*\w+\]\s*/g, '').trim();
    // Remove [Selected Features Configuration]: section from displayed content
    processedContent = processedContent.replace(/\[Selected Features Configuration\]:[\s\S]*?(?=\n\n|$)/g, '').trim();
  } else {
    // For non-string content (arrays), extract text content
    processedContent = extractTextFromMessage(content);
  }

  console.log(`Found ${artifacts.length} complete artifacts:`, artifacts.map(a => a.filename));
  if (isIncomplete) {
    console.log('⚠️ Site marked as INCOMPLETE - showing code only');
  }

  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="flex-1 flex flex-col items-end">
        <div class="flex items-center gap-3 mb-1.5">
          <span class="text-xs text-gray-600">${time}</span>
          <span class="text-sm font-semibold text-gray-400">You</span>
        </div>
        <div class="message-user rounded-xl rounded-tr-sm px-5 py-4">
          <div class="text-white text-base leading-relaxed">${parseMarkdown(processedContent)}</div>
        </div>
      </div>
    `;
  } else {
    // Create project if we have artifacts
    let projectHtml = '';
    if (artifacts.length > 0) {
      // Use currentChatId to maintain consistency across save/load
      const projectId = 'project-' + currentChatId;
      globalProjects[projectId] = artifacts;

      console.log('🔨 Created project with ID:', projectId);
      console.log('📄 Files:', artifacts.map(a => a.filename));

      // If site is incomplete, show code blocks instead of preview
      if (isIncomplete) {
        projectHtml = `
          <div style="margin-top: 12px; padding: 16px; background: rgba(255, 107, 53, 0.05); border: 1px solid rgba(255, 107, 53, 0.2); border-radius: 8px;">
            <div style="color: #ff6b35; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span>⏳</span>
              <span>Building in progress... (${artifacts.length} page${artifacts.length !== 1 ? 's' : ''} ready)</span>
            </div>
            ${artifacts.map(artifact => `
              <details style="margin-bottom: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 4px; padding: 8px;">
                <summary style="cursor: pointer; color: #ff6b35; font-weight: 500;">${artifact.filename}</summary>
                <pre style="margin-top: 8px; padding: 12px; background: rgba(0, 0, 0, 0.4); border-radius: 4px; overflow-x: auto; font-size: 11px; color: #ccc;"><code>${escapeHtml(artifact.htmlCode)}</code></pre>
              </details>
            `).join('')}
          </div>
        `;
      } else {
        // Complete site - show normal preview
        projectHtml = `
          <!-- Project Preview (Auto-shown with multiple pages) -->
          <div id="project-preview-${projectId}" class="artifact-preview" style="margin-top: 12px;">
            <div class="artifact-header">
              <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="tabs-${projectId}">
                  ${artifacts.map((artifact, index) => {
                    // Get nice display name from filename
                    const displayName = getPageDisplayName(artifact.filename);
                    return `
                    <button
                      class="artifact-btn"
                      style="padding: 8px 16px; font-size: 13px; ${index === 0 ? 'background: rgba(255, 107, 53, 0.2); color: #ff6b35;' : 'background: rgba(255, 107, 53, 0.05); color: #999;'}"
                      onclick="window.switchProjectFile('${projectId}', ${index})"
                      data-project-id="${projectId}"
                      data-file-index="${index}"
                      ${index === 0 ? 'class="active"' : ''}
                      title="${artifact.filename}"
                    >
                      ${displayName}
                    </button>
                  `;
                  }).join('')}
                </div>
              </div>
              <div class="artifact-actions">
                <button class="artifact-btn" onclick="window.openProjectFileInNewTab('${projectId}', window.getCurrentFileIndex('${projectId}'))">
                  🔗 Open
                </button>
              </div>
            </div>
            <iframe id="iframe-${projectId}" class="artifact-iframe" sandbox="allow-scripts allow-same-origin"></iframe>
          </div>
        `;
      }
    }

    // "Surprise Me!" button logic:
    // - Only show BEFORE any website has been built
    // - Only show when Fowazz is asking clarification questions
    // - Only show once per chat (after clicking or building, it's gone forever)
    const currentChat = chats.find(c => c.id === currentChatId);
    const surpriseMeUsed = currentChat?.surpriseMeUsed || false;

    // Check if ANY website has ever been built in this chat
    // Check both conversation history AND current message
    const hasEverBuiltSite = conversationHistory.some(msg => {
      if (msg.role === 'assistant' && msg.content) {
        return msg.content.includes('<artifact') || msg.content.includes('```html');
      }
      return false;
    }) || artifacts.length > 0; // Also check if current message has artifacts

    const isAskingQuestions = !hasEverBuiltSite &&              // NO site built yet (current OR previous)
                              processedContent.includes('?') && // Fowazz is asking questions
                              conversationHistory.length >= 1 && // At least one user message exists
                              !surpriseMeUsed;                  // Button hasn't been clicked yet

    // "Surprise Me!" button HTML (only show when asking clarification questions and not used yet)
    const surpriseMeButton = isAskingQuestions ? `
      <div style="margin-top: 12px;">
        <button
          onclick="window.handleSurpriseMe()"
          style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.1));
                 border: 2px solid rgba(255, 107, 53, 0.4);
                 color: #ff6b35;
                 padding: 10px 20px;
                 border-radius: 8px;
                 font-weight: 600;
                 font-size: 14px;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 display: inline-flex;
                 align-items: center;
                 gap: 8px;"
          onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.25), rgba(255, 107, 53, 0.15))'; this.style.borderColor='rgba(255, 107, 53, 0.6)';"
          onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.1))'; this.style.borderColor='rgba(255, 107, 53, 0.4)';"
        >
          ✨ Surprise Me!
        </button>
        <span style="color: #999; font-size: 12px; margin-left: 12px;">Let Fowazz decide and start building</span>
      </div>
    ` : '';

    // Deploy button HTML (only show when there's a website preview)
    const deployButton = artifacts.length > 0 ? `
      <div style="margin-top: 12px;">
        <button
          onclick="window.startDeployment('project-${currentChatId}')"
          style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(255, 107, 53, 0.2));
                 border: 2px solid rgba(255, 107, 53, 0.6);
                 color: #ff6b35;
                 padding: 12px 24px;
                 border-radius: 8px;
                 font-weight: 700;
                 font-size: 15px;
                 cursor: pointer;
                 transition: all 0.2s ease;
                 display: inline-flex;
                 align-items: center;
                 gap: 8px;"
          onmouseover="this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.4), rgba(255, 107, 53, 0.3))'; this.style.borderColor='rgba(255, 107, 53, 0.8)'; this.style.transform='translateY(-1px)';"
          onmouseout="this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(255, 107, 53, 0.2))'; this.style.borderColor='rgba(255, 107, 53, 0.6)'; this.style.transform='translateY(0)';"
        >
          🚀 Deploy This Site
        </button>
      </div>
    ` : '';

    messageDiv.innerHTML = `
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-1.5">
          <span class="text-sm font-semibold text-orange-400">Fowazz</span>
          <span class="text-xs text-gray-600">${time}</span>
        </div>
        <div class="message-assistant rounded-xl rounded-tl-sm px-5 py-4">
          <div class="text-gray-200 text-base leading-relaxed">${parseMarkdown(processedContent)}</div>
        </div>
        ${surpriseMeButton}
        ${projectHtml}
        ${deployButton}
      </div>
    `;

    // If we have artifacts, auto-load the first file immediately
    if (artifacts.length > 0) {
      const projectId = 'project-' + currentChatId;
      setTimeout(() => {
        loadProjectFileIntoIframe(projectId, 0);
        console.log(`🚀 Auto-loaded ${artifacts[0].filename} with ${artifacts.length} total pages`);
      }, 100);
    }
  }
  
  const container = messagesContainer.querySelector('.space-y-8') || messagesContainer;
  container.appendChild(messageDiv);

  // Add 40px spacer ONLY after Fowazz's messages for breathing room
  const existingSpacer = container.querySelector('.message-spacer');
  if (existingSpacer) {
    existingSpacer.remove();
  }

  // Only add spacer if this is a Fowazz message (assistant role)
  if (role === 'assistant') {
    const spacer = document.createElement('div');
    spacer.className = 'message-spacer';
    spacer.style.height = '40px';
    spacer.style.background = 'transparent';
    spacer.style.pointerEvents = 'none';
    container.appendChild(spacer);
  }

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  if (shouldSave) {
    saveChat();
  }
}

// Load a specific file from a project into the iframe
function loadProjectFileIntoIframe(projectId, fileIndex) {
  const project = globalProjects[projectId];
  if (!project) {
    console.error(`Project not found: ${projectId}`);
    return;
  }

  if (!project[fileIndex]) {
    console.error(`File not found: ${projectId}, file ${fileIndex}`);
    console.log('Available files:', project.map(f => f.filename));
    return;
  }

  const iframe = document.getElementById(`iframe-${projectId}`);
  if (!iframe) {
    console.error(`Iframe not found for project: ${projectId}`);
    console.log('Tried ID:', `iframe-${projectId}`);
    return;
  }

  const file = project[fileIndex];
  console.log(`✅ Loading file: ${file.filename} into project ${projectId}`);

  try {
    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();

    // Add base tag to prevent navigation issues
    let htmlCode = file.htmlCode;
    if (!htmlCode.includes('<base')) {
      // Insert <base> tag after <head> to prevent relative URL navigation
      htmlCode = htmlCode.replace(
        /<head>/i,
        '<head>\n<base href="about:blank" target="_self">'
      );
    }

    iframeDoc.write(htmlCode);
    iframeDoc.close();

    // Set up link interception after a short delay
    setTimeout(() => setupLinkInterception(projectId, iframe), 500);
  } catch (error) {
    console.error('Error writing to iframe:', error);
  }
}

// Set up link interception within iframe
function setupLinkInterception(projectId, iframe) {
  const project = globalProjects[projectId];
  if (!project) return;

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // Remove previous listener if exists
    if (iframe._clickListener) {
      iframeDoc.removeEventListener('click', iframe._clickListener, true);
    }

    // Create new click listener
    const clickListener = (e) => {
      let target = e.target;
      while (target && target !== iframeDoc) {
        if (target.tagName === 'A') {
          const href = target.getAttribute('href');

          // Prevent ALL link navigation that isn't external
          if (!href || href === '#' || href.startsWith('#') || href === 'javascript:void(0)' || href === '') {
            // Empty or hash links - prevent navigation
            e.preventDefault();
            e.stopPropagation();
            console.log('Blocked navigation for empty/hash link');
            return false;
          }

          // Check if it's a local HTML file link (switch tabs)
          const isLocalHtmlLink = href.endsWith('.html') && !href.startsWith('http') && !href.startsWith('//');

          if (isLocalHtmlLink) {
            e.preventDefault();
            e.stopPropagation();

            // Extract filename (handle both "./file.html" and "file.html")
            const filename = href.replace('./', '').replace(/^\//, '');

            console.log('Intercepted click to:', filename);

            // Find the matching file in the project
            const fileIndex = project.findIndex(file => file.filename === filename);

            if (fileIndex !== -1) {
              console.log('Switching to tab:', fileIndex);
              switchProjectFile(projectId, fileIndex);
            } else {
              console.warn(`File not found: ${filename}`, 'Available files:', project.map(f => f.filename));
            }

            return false;
          }

          // External links - open in new tab
          if (href.startsWith('http') || href.startsWith('//')) {
            e.preventDefault();
            e.stopPropagation();
            window.open(href, '_blank', 'noopener,noreferrer');
            console.log('Opened external link in new tab:', href);
            return false;
          }

          break;
        }
        target = target.parentElement;
      }
    };

    // Store listener reference and attach it
    iframe._clickListener = clickListener;
    iframeDoc.addEventListener('click', clickListener, true);

    console.log('✅ Link interception set up for project:', projectId);
  } catch (error) {
    console.error('Could not set up link interception:', error);
  }
}

// Switch between files in a project
window.switchProjectFile = function(projectId, fileIndex) {
  const project = globalProjects[projectId];
  if (!project || !project[fileIndex]) return;

  // Load the file into iframe
  loadProjectFileIntoIframe(projectId, fileIndex);

  // Update tab styles
  const tabs = document.querySelectorAll(`[data-project-id="${projectId}"]`);
  tabs.forEach((tab, index) => {
    if (index === fileIndex) {
      tab.style.background = 'rgba(255, 107, 53, 0.2)';
      tab.style.color = '#ff6b35';
      tab.classList.add('active');
    } else {
      tab.style.background = 'rgba(255, 107, 53, 0.05)';
      tab.style.color = '#999';
      tab.classList.remove('active');
    }
  });
};

window.getCurrentFileIndex = function(projectId) {
  const activTab = document.querySelector(`[data-project-id="${projectId}"].active`);
  return activTab ? parseInt(activTab.getAttribute('data-file-index')) : 0;
};

window.openProjectFileInNewTab = function(projectId, fileIndex) {
  const project = globalProjects[projectId];
  if (project && project[fileIndex]) {
    const newWindow = window.open();
    newWindow.document.write(project[fileIndex].htmlCode);
    newWindow.document.close();
  }
};

window.copyProjectFileCode = function(projectId, fileIndex) {
  const project = globalProjects[projectId];
  if (project && project[fileIndex]) {
    navigator.clipboard.writeText(project[fileIndex].htmlCode).then(() => {
      alert(`✓ ${project[fileIndex].filename} copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy code to clipboard');
    });
  }
};

// Handle "Surprise Me!" button click
window.handleSurpriseMe = async function() {
  // Check if user is logged in first
  if (!currentUser) {
    alert('Please sign in to use Fowazz!');
    return;
  }

  // Mark surprise me as used for this chat
  const currentChat = chats.find(c => c.id === currentChatId);
  if (currentChat) {
    currentChat.surpriseMeUsed = true;
    localStorage.setItem('fowazz_chats', JSON.stringify(chats));
    console.log('✨ Surprise Me used for chat:', currentChatId);
  }

  // ============================================
  // SUBSCRIPTION CHECK - DISABLED IN HACKATHON MODE
  // ============================================
  if (!HACKATHON_MODE) {
    // ⚡ Check if editing an already-deployed website (UNLIMITED EDITS!)
    const isEditingExisting = await isEditingDeployedWebsite();

    if (isEditingExisting) {
      console.log('✨ [handleSurpriseMe] Editing deployed website - UNLIMITED EDITS! Skipping paywall check.');
    } else {
      // ⚡ Check website limit (for NEW websites only)
      try {
        const [planInfo, deployedCount] = await Promise.all([
          getUserPlanInfo(),
          getDeployedWebsitesCount()
        ]);

        // If no subscription, show full price plans (NEW USERS)
        if (!planInfo.hasSubscription) {
          console.log('🚫 No active subscription - showing full price plans');
          showFullPricePlanModal();
          return;
        }

        // Check if user has reached their limit (EXISTING SUBSCRIBERS)
        if (deployedCount >= planInfo.limit) {
          console.log(`🚫 Limit reached: ${deployedCount}/${planInfo.limit} websites deployed`);
          showUpgradeModal(planInfo.plan, deployedCount, planInfo.limit);
          return;
        }

        console.log('✅ User has capacity, proceeding with Surprise Me');
      } catch (error) {
        console.error('Error checking paywall:', error);
        // If paywall check fails, let them through (fail open)
        console.log('⚠️ Paywall check failed, proceeding anyway');
      }
    }
  } else {
    console.log('🎓 HACKATHON MODE - Skipping subscription check');
  }

  // User has capacity → proceed
  // The instruction message (sent to Fowazz but NOT shown to user in UI)
  const surpriseMessage = "surprise me! just use your best judgment and start building (DONT ASK ANY QUESTIONS. START BUILDING)";

  // Add to conversation history (so Fowazz sees it) but DON'T show in UI
  conversationHistory.push({ role: 'user', content: surpriseMessage });

  // Show typing indicator immediately
  showTypingIndicator(false);

  sendButton.disabled = true;
  sendButton.style.opacity = '0.5';

  let hasUpgradedToBuildProgress = false;
  let accumulatedContent = '';
  let streamComplete = false;
  let introShown = false;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
      // Try to get error message from response
      try {
        const errorData = await response.json();
        // Special handling for site at capacity
        if (errorData.error === 'SITE_FULL') {
          removeTypingIndicator();
          const siteFullMsg = typeof t === 'function' ? t('siteFull') :
            '🚦 **Fowazz is at capacity!**\n\nToo many people are building websites right now. Please try again in a few minutes.\n\n*Current users: ' + errorData.current_users + '/' + errorData.max_users + '*';
          addMessage('assistant', siteFullMsg);
          return;
        }
        if (errorData.error) {
          removeTypingIndicator();
          addMessage('assistant', `❌ ${errorData.message || errorData.error}`);
          return;
        }
      } catch (e) {
        // If JSON parsing fails, use generic error
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.slice(6));

            if (jsonData.chunk) {
              accumulatedContent += jsonData.chunk;

              // Check for building indicators
              if (!hasUpgradedToBuildProgress) {
                const hasPlanningKeyword = /\*\*Planned subpages?:\*\*|^#+\s*(planned subpages|site structure|pages)/im.test(accumulatedContent);
                const hasArtifactStart = /\[ARTIFACT:START:/i.test(accumulatedContent);
                const hasBuildingPhrase = /(?:let's build|i'll build|building|creating|generating).{0,30}(?:website|site|page)/i.test(accumulatedContent);

                if (hasPlanningKeyword || hasArtifactStart || hasBuildingPhrase) {
                  removeTypingIndicator();
                  showTypingIndicator(true);
                  hasUpgradedToBuildProgress = true;
                }
              }

              // Phase 1: Show intro message when we detect first artifact starting
              if (!introShown && /\[ARTIFACT:START:/i.test(accumulatedContent)) {
                const firstArtifactPos = accumulatedContent.indexOf('[ARTIFACT:START:');
                const introText = accumulatedContent.substring(0, firstArtifactPos).trim();

                if (introText) {
                  // Extract and handle title first
                  let cleanIntro = introText;
                  const titleMatch = introText.match(/\[TITLE:(.+?)\]/);
                  if (titleMatch) {
                    updateChatTitle(titleMatch[1].trim());
                    cleanIntro = introText.replace(/\[TITLE:.+?\]/, '').trim();
                  }

                  removeTypingIndicator();
                  addMessage('assistant', cleanIntro, false);
                  conversationHistory.push({ role: 'assistant', content: cleanIntro });
                  showTypingIndicator(true); // Continue showing progress
                  introShown = true;
                }
              }

            }

            if (jsonData.done) {
              const finalContent = jsonData.content || accumulatedContent;
              removeTypingIndicator();

              if (jsonData.error) {
                addMessage('assistant', '⚠️ Error: ' + jsonData.error);
                streamComplete = true;
                break;
              }

              // ALWAYS parse artifacts from final content
              // First check for complete artifacts
              const artifactRegex = /\[ARTIFACT:START:.+?\]([\s\S]*?)\[ARTIFACT:END\]/g;
              const artifacts = [];
              let match;
              let lastMatchEnd = 0;

              while ((match = artifactRegex.exec(finalContent)) !== null) {
                artifacts.push(match[0]);
                lastMatchEnd = artifactRegex.lastIndex;
              }

              // Check for INCOMPLETE artifacts (START without END) - likely hit token limit
              const incompleteMatch = finalContent.match(/\[ARTIFACT:START:([^\]]+)\]([\s\S]*?)$/);
              if (incompleteMatch && !finalContent.includes('[ARTIFACT:END]', incompleteMatch.index)) {
                console.warn('⚠️ Incomplete artifact detected - likely hit token limit');
                // Auto-close the incomplete artifact
                const artifactName = incompleteMatch[1];
                const artifactContent = incompleteMatch[2];
                artifacts.push(`[ARTIFACT:START:${artifactName}]${artifactContent}\n[ARTIFACT:END]`);
                lastMatchEnd = finalContent.length;
              }

              // If we have artifacts, show them
              if (artifacts.length > 0) {
                // Combine all artifacts
                const artifactsSection = artifacts.join('\n\n');

                // Phase 3: Extract closing message (everything after last artifact)
                const closingText = finalContent.substring(lastMatchEnd).trim();

                // Combine intro (if exists), artifacts, and closing into ONE message for saving
                // This ensures the preview shows correctly when chat is reloaded
                let completeMessage = artifactsSection;

                // Prepend intro if it was shown (and wasn't already saved)
                if (introShown) {
                  // Find the last assistant message (should be the intro)
                  const lastMsg = conversationHistory[conversationHistory.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content.includes('[ARTIFACT:')) {
                    // Remove the intro message from history - we'll combine it
                    const introContent = conversationHistory.pop().content;
                    completeMessage = introContent + '\n\n' + artifactsSection;
                  }
                }

                // Append closing text if it exists
                if (closingText) {
                  completeMessage = completeMessage + '\n\n' + closingText;
                }

                // Show artifacts in UI
                addMessage('assistant', artifactsSection, false);

                // Show closing text in UI after delay
                if (closingText) {
                  setTimeout(() => {
                    showTypingIndicator(false);
                    setTimeout(() => {
                      removeTypingIndicator();
                      addMessage('assistant', closingText, false);

                      // Save the complete combined message to history
                      conversationHistory.push({ role: 'assistant', content: completeMessage });
                      saveChat();
                    }, 800);
                  }, 300);
                } else {
                  // Save the complete combined message to history
                  conversationHistory.push({ role: 'assistant', content: completeMessage });
                  saveChat();
                }
              } else {
                // No artifacts found, just show as normal message
                // Extract and handle title first
                let content = finalContent;
                const titleMatch = content.match(/\[TITLE:(.+?)\]/);
                if (titleMatch) {
                  updateChatTitle(titleMatch[1].trim());
                  content = content.replace(/\[TITLE:.+?\]/, '').trim();
                }

                addMessage('assistant', content);
                conversationHistory.push({ role: 'assistant', content: content });
                saveChat();
              }

              streamComplete = true;
              break;
            }
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }

      if (streamComplete) break;
    }

    // If stream ended without done signal
    if (!streamComplete && accumulatedContent.trim()) {
      console.log('Stream ended without done signal');
      removeTypingIndicator();

      if (!introShown) {
        addMessage('assistant', accumulatedContent);
        conversationHistory.push({ role: 'assistant', content: accumulatedContent });
      } else {
        // Show artifacts and closing
        const artifactRegex = /\[ARTIFACT:START:.+?\]([\s\S]*?)\[ARTIFACT:END\]/g;
        const artifacts = [];
        let match;
        let lastMatchEnd = 0;

        while ((match = artifactRegex.exec(accumulatedContent)) !== null) {
          artifacts.push(match[0]);
          lastMatchEnd = artifactRegex.lastIndex;
        }

        if (artifacts.length > 0) {
          const artifactsSection = artifacts.join('\n\n');
          addMessage('assistant', artifactsSection, false);
          conversationHistory.push({ role: 'assistant', content: artifactsSection });

          const closingText = accumulatedContent.substring(lastMatchEnd).trim();
          if (closingText) {
            setTimeout(() => {
              showTypingIndicator(false);
              setTimeout(() => {
                removeTypingIndicator();
                addMessage('assistant', closingText, false);
                conversationHistory.push({ role: 'assistant', content: closingText });
                saveChat();
              }, 800);
            }, 300);
          } else {
            saveChat();
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator();

    // Check if we got any partial content before the error
    if (accumulatedContent && accumulatedContent.trim()) {
      console.log('⚠️ Stream interrupted with partial content. Showing what we got so far...');
      // Save what we received before the interruption
      addMessage('assistant', accumulatedContent + '\n\n_[Connection interrupted - response may be incomplete]_');
      conversationHistory.push({ role: 'assistant', content: accumulatedContent });
      saveChat();
    } else {
      // No content received at all
      if (error.name === 'AbortError') {
        addMessage('assistant', '⏱️ Request timed out. The server took too long to respond. Try again.');
      } else if (error.message && error.message.includes('peer closed')) {
        addMessage('assistant', '⚠️ Connection interrupted. The server may have restarted or had a network issue. Please try again.');
      } else {
        addMessage('assistant', '⚠️ Something went wrong. Please try again.');
      }
    }
  } finally {
    sendButton.disabled = false;
    sendButton.style.opacity = '1';
  }
};

function showTypingIndicator(isBuilding = false) {
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.className = 'message flex gap-4 items-start';
  
  // Simple typing indicator for normal conversation
  if (!isBuilding) {
    typingDiv.innerHTML = `
      <div class="flex-1">
        <div style="background: rgba(255, 107, 53, 0.08); border: 1px solid rgba(255, 107, 53, 0.15); border-radius: 12px; padding: 12px 16px;">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
  } else {
    // Build progress indicator for when creating websites
    typingDiv.innerHTML = `
      <div class="flex-1">
        <div style="background: rgba(255, 107, 53, 0.08); border: 1px solid rgba(255, 107, 53, 0.15); border-radius: 12px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div class="typing-indicator" style="margin: 0;">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div id="build-timer" style="font-size: 15px; color: #ff6b35; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px;">00:00</div>
          </div>
          <p id="build-status" style="font-size: 13px; color: #ff6b35; font-weight: 500; margin: 0;">Getting started...</p>
        </div>
      </div>
    `;
  }
  
  const container = messagesContainer.querySelector('.space-y-8') || messagesContainer;
  container.appendChild(typingDiv);

  // Add 40px spacer after typing indicator for breathing room
  const existingSpacer = container.querySelector('.message-spacer');
  if (existingSpacer) {
    existingSpacer.remove();
  }

  const spacer = document.createElement('div');
  spacer.className = 'message-spacer';
  spacer.style.height = '40px';
  spacer.style.background = 'transparent';
  spacer.style.pointerEvents = 'none';
  container.appendChild(spacer);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Only start the build progress animation if we're building
  if (isBuilding) {
    startBuildProgress();
  }
}

function startBuildProgress() {
  const statusMessages = [
    t('buildGettingStarted'),
    t('buildPlanning'),
    t('buildHomepage'),
    t('buildLayout'),
    t('buildNavigation'),
    t('buildStyling'),
    t('buildPages'),
    t('buildForms'),
    t('buildPolishing'),
    t('buildAlmostDone'),
    t('buildFinalizing')
  ];

  let currentIndex = 0;

  // Start the timer
  window.buildStartTime = Date.now();
  window.buildTimerInterval = setInterval(() => {
    const timerEl = document.getElementById('build-timer');
    if (timerEl) {
      const elapsed = Math.floor((Date.now() - window.buildStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }, 1000); // Update every second

  // Status message updater
  window.buildProgressInterval = setInterval(() => {
    const statusEl = document.getElementById('build-status');
    if (statusEl && currentIndex < statusMessages.length) {
      statusEl.textContent = statusMessages[currentIndex];
      currentIndex++;
    } else {
      // Loop back to a few messages
      if (statusEl) {
        const loopMessages = [t('streamingStillWorking'), t('streamingLookingGood'), t('streamingMomentMore')];
        statusEl.textContent = loopMessages[Math.floor(Math.random() * loopMessages.length)];
      }
    }
  }, 2000); // Update every 2 seconds
}

function removeTypingIndicator() {
  // Stop build timer if it's running
  if (window.buildTimerInterval) {
    clearInterval(window.buildTimerInterval);
    window.buildTimerInterval = null;
  }

  // Clear the progress interval
  if (window.buildProgressInterval) {
    clearInterval(window.buildProgressInterval);
    window.buildProgressInterval = null;
  }

  // Reset build start time
  if (window.buildStartTime) {
    window.buildStartTime = null;
  }

  // Remove the typing indicator immediately (no animation)
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message && attachedFiles.length === 0) return;

  // Check if user is logged in first
  if (!currentUser) {
    alert(t('pleaseSignIn'));
    return;
  }

  // Get current chat for tracking flags
  const currentChat = chats.find(c => c.id === currentChatId);

  // ⚡ BUILD MESSAGE CONTENT
  let userMessageContent = message;
  let userMessageWithFiles = { role: 'user', content: [] };

  // Add text if present
  if (message) {
    // Add language prefix to every message
    const language = localStorage.getItem('fowazz_language') || 'en';
    let textContent = `[LANGUAGE: ${language}]\n\n${message}`;

    // Add selected plugins with their full configuration
    if (selectedPlugins.length > 0) {
      textContent += `\n\n[Selected Features Configuration]:\n`;
      selectedPlugins.forEach(pluginId => {
        const config = pluginConfigs[pluginId] || {};
        textContent += `\n• ${pluginId}`;

        // Add config details if available
        const configKeys = Object.keys(config);
        if (configKeys.length > 0) {
          textContent += `:`;
          configKeys.forEach(key => {
            const value = config[key];
            if (Array.isArray(value)) {
              if (value.length > 0 && value.some(v => v && v.trim())) {
                textContent += `\n  - ${key}: ${value.filter(v => v && v.trim()).join(', ')}`;
              }
            } else if (value && value.trim()) {
              textContent += `\n  - ${key}: ${value}`;
            }
          });
        }
      });
    }

    userMessageWithFiles.content.push({
      type: 'text',
      text: textContent
    });
  }

  // Process attached files
  if (attachedFiles.length > 0) {
    for (const file of attachedFiles) {
      if (file.type.startsWith('image/')) {
        // Convert image to base64
        const base64 = await fileToBase64(file);
        userMessageWithFiles.content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: base64.split(',')[1] // Remove data:image/...;base64, prefix
          }
        });
        userMessageContent += `\n[Image attached: ${file.name}]`;
      } else if (file.type === 'application/pdf') {
        // For PDFs, Claude can read them directly with the PDF capability
        const base64 = await fileToBase64(file);
        userMessageWithFiles.content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64.split(',')[1]
          }
        });
        userMessageContent += `\n[PDF attached: ${file.name}]`;
      } else {
        // For other documents, read as text
        const text = await file.text();
        userMessageContent += `\n\n--- Content from ${file.name} ---\n${text}\n--- End of ${file.name} ---`;
      }
    }
  }

  // ⚡ INSTANT UI - Show message IMMEDIATELY (feels fast!)
  addMessage('user', userMessageContent);

  // Clear input immediately
  userInput.value = '';
  userInput.style.height = 'auto';
  attachedFiles = [];
  renderFilePreview();

  // Show typing indicator immediately
  showTypingIndicator(false);

  sendButton.disabled = true;
  sendButton.style.opacity = '0.5';

  // ============================================
  // SUBSCRIPTION CHECK - DISABLED IN HACKATHON MODE
  // ============================================
  if (!HACKATHON_MODE) {
    // ⚡ NOW CHECK PAYWALL (in background while UI feels instant)
    console.log('🚀 [sendMessage] Starting paywall check...');
    const isEditingExisting = await isEditingDeployedWebsite();
    console.log('🚀 [sendMessage] isEditingExisting =', isEditingExisting);

    if (!isEditingExisting) {
      console.log('🚀 [sendMessage] Not editing existing - checking limits...');
      // Check website limit for NEW websites
      try {
        const [planInfo, deployedCount] = await Promise.all([
          getUserPlanInfo(),
          getDeployedWebsitesCount()
        ]);

        console.log('🔍 [sendMessage] Paywall Check - Plan:', planInfo.plan, 'Limit:', planInfo.limit);
        console.log('🔍 [sendMessage] Paywall Check - Deployed count:', deployedCount);

        // For EXISTING subscribers who hit their limit, show upgrade modal and ABORT
        // For NEW users (no subscription), let them type and build - paywall shows on DEPLOY
        if (planInfo.hasSubscription && deployedCount >= planInfo.limit) {
          console.log(`🚫 [sendMessage] Limit reached: ${deployedCount}/${planInfo.limit} websites deployed`);
          removeTypingIndicator();
          // Remove the message we just showed
          const messagesContainer = document.getElementById('messagesContainer');
          if (messagesContainer) {
            const lastMessage = messagesContainer.lastElementChild;
            if (lastMessage) lastMessage.remove();
          }
          showUpgradeModal(planInfo.plan, deployedCount, planInfo.limit);
          sendButton.disabled = false;
          sendButton.style.opacity = '1';
          return;
        }

        console.log('✅ [sendMessage] User can proceed with message (paywall check on DEPLOY for new users)');
      } catch (error) {
        console.error('Error checking paywall:', error);
        console.log('⚠️ Paywall check failed, proceeding anyway');
      }
    } else {
      console.log('✨ [sendMessage] Editing deployed website - UNLIMITED EDITS! Skipping paywall check.');
    }
  } else {
    console.log('🎓 HACKATHON MODE - Skipping subscription check');
  }

  // ⚡ PAYWALL PASSED - Add to conversation history now
  if (userMessageWithFiles.content.length > 0) {
    conversationHistory.push(userMessageWithFiles);
  } else {
    conversationHistory.push({ role: 'user', content: message });
  }

  let hasUpgradedToBuildProgress = false;
  let accumulatedContent = '';
  let streamComplete = false;
  let introShown = false;

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    if (!response.ok) {
      // Try to get error message from response
      try {
        const errorData = await response.json();
        // Special handling for site at capacity
        if (errorData.error === 'SITE_FULL') {
          removeTypingIndicator();
          const siteFullMsg = typeof t === 'function' ? t('siteFull') :
            '🚦 **Fowazz is at capacity!**\n\nToo many people are building websites right now. Please try again in a few minutes.\n\n*Current users: ' + errorData.current_users + '/' + errorData.max_users + '*';
          addMessage('assistant', siteFullMsg);
          return;
        }
        if (errorData.error) {
          removeTypingIndicator();
          addMessage('assistant', `❌ ${errorData.message || errorData.error}`);
          return;
        }
      } catch (e) {
        // If JSON parsing fails, use generic error
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonData = JSON.parse(line.slice(6));

            if (jsonData.chunk) {
              accumulatedContent += jsonData.chunk;

              // Check for building indicators
              if (!hasUpgradedToBuildProgress) {
                const hasPlanningKeyword = /\*\*Planned subpages?:\*\*|^#+\s*(planned subpages|site structure|pages)/im.test(accumulatedContent);
                const hasArtifactStart = /\[ARTIFACT:START:/i.test(accumulatedContent);
                const hasBuildingPhrase = /(?:let's build|i'll build|building|creating|generating).{0,30}(?:website|site|page)/i.test(accumulatedContent);

                if (hasPlanningKeyword || hasArtifactStart || hasBuildingPhrase) {
                  removeTypingIndicator();
                  showTypingIndicator(true);
                  hasUpgradedToBuildProgress = true;
                }
              }

              // Phase 1: Show intro message when we detect first artifact starting
              if (!introShown && /\[ARTIFACT:START:/i.test(accumulatedContent)) {
                const firstArtifactPos = accumulatedContent.indexOf('[ARTIFACT:START:');
                const introText = accumulatedContent.substring(0, firstArtifactPos).trim();

                if (introText) {
                  // Extract and handle title first
                  let cleanIntro = introText;
                  const titleMatch = introText.match(/\[TITLE:(.+?)\]/);
                  if (titleMatch) {
                    updateChatTitle(titleMatch[1].trim());
                    cleanIntro = introText.replace(/\[TITLE:.+?\]/, '').trim();
                  }

                  removeTypingIndicator();
                  addMessage('assistant', cleanIntro, false);
                  conversationHistory.push({ role: 'assistant', content: cleanIntro });
                  showTypingIndicator(true); // Continue showing progress
                  introShown = true;
                }
              }
            }

            if (jsonData.done) {
              const finalContent = jsonData.content || accumulatedContent;
              removeTypingIndicator();

              if (jsonData.error) {
                addMessage('assistant', '⚠️ Error: ' + jsonData.error);
                streamComplete = true;
                break;
              }

              // ALWAYS parse artifacts from final content
              // First check for complete artifacts
              const artifactRegex = /\[ARTIFACT:START:.+?\]([\s\S]*?)\[ARTIFACT:END\]/g;
              const artifacts = [];
              let match;
              let lastMatchEnd = 0;

              while ((match = artifactRegex.exec(finalContent)) !== null) {
                artifacts.push(match[0]);
                lastMatchEnd = artifactRegex.lastIndex;
              }

              // Check for INCOMPLETE artifacts (START without END) - likely hit token limit
              const incompleteMatch = finalContent.match(/\[ARTIFACT:START:([^\]]+)\]([\s\S]*?)$/);
              if (incompleteMatch && !finalContent.includes('[ARTIFACT:END]', incompleteMatch.index)) {
                console.warn('⚠️ Incomplete artifact detected - likely hit token limit');
                // Auto-close the incomplete artifact
                const artifactName = incompleteMatch[1];
                const artifactContent = incompleteMatch[2];
                artifacts.push(`[ARTIFACT:START:${artifactName}]${artifactContent}\n[ARTIFACT:END]`);
                lastMatchEnd = finalContent.length;
              }

              // If we have artifacts, show them
              if (artifacts.length > 0) {
                // Combine all artifacts
                const artifactsSection = artifacts.join('\n\n');

                // Phase 3: Extract closing message (everything after last artifact)
                const closingText = finalContent.substring(lastMatchEnd).trim();

                // Combine intro (if exists), artifacts, and closing into ONE message for saving
                // This ensures the preview shows correctly when chat is reloaded
                let completeMessage = artifactsSection;

                // Prepend intro if it was shown (and wasn't already saved)
                if (introShown) {
                  // Find the last assistant message (should be the intro)
                  const lastMsg = conversationHistory[conversationHistory.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content.includes('[ARTIFACT:')) {
                    // Remove the intro message from history - we'll combine it
                    const introContent = conversationHistory.pop().content;
                    completeMessage = introContent + '\n\n' + artifactsSection;
                  }
                }

                // Append closing text if it exists
                if (closingText) {
                  completeMessage = completeMessage + '\n\n' + closingText;
                }

                // Show artifacts in UI
                addMessage('assistant', artifactsSection, false);

                // Show closing text in UI after delay
                if (closingText) {
                  setTimeout(() => {
                    showTypingIndicator(false);
                    setTimeout(() => {
                      removeTypingIndicator();
                      addMessage('assistant', closingText, false);

                      // Save the complete combined message to history
                      conversationHistory.push({ role: 'assistant', content: completeMessage });
                      saveChat();
                    }, 800);
                  }, 300);
                } else {
                  // Save the complete combined message to history
                  conversationHistory.push({ role: 'assistant', content: completeMessage });
                  saveChat();
                }
              } else {
                // No artifacts found, just show as normal message
                // Extract and handle title first
                let content = finalContent;
                const titleMatch = content.match(/\[TITLE:(.+?)\]/);
                if (titleMatch) {
                  updateChatTitle(titleMatch[1].trim());
                  content = content.replace(/\[TITLE:.+?\]/, '').trim();
                }

                addMessage('assistant', content);
                conversationHistory.push({ role: 'assistant', content: content });
                saveChat();
              }

              streamComplete = true;
              break;
            }
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }

      if (streamComplete) break;
    }

    // If stream ended without done signal
    if (!streamComplete && accumulatedContent.trim()) {
      console.log('Stream ended without done signal');
      removeTypingIndicator();

      if (!introShown) {
        addMessage('assistant', accumulatedContent);
        conversationHistory.push({ role: 'assistant', content: accumulatedContent });
      } else {
        // Show artifacts and closing
        const artifactRegex = /\[ARTIFACT:START:.+?\]([\s\S]*?)\[ARTIFACT:END\]/g;
        const artifacts = [];
        let match;
        let lastMatchEnd = 0;

        while ((match = artifactRegex.exec(accumulatedContent)) !== null) {
          artifacts.push(match[0]);
          lastMatchEnd = artifactRegex.lastIndex;
        }

        if (artifacts.length > 0) {
          const artifactsSection = artifacts.join('\n\n');
          addMessage('assistant', artifactsSection, false);
          conversationHistory.push({ role: 'assistant', content: artifactsSection });

          const closingText = accumulatedContent.substring(lastMatchEnd).trim();
          if (closingText) {
            setTimeout(() => {
              showTypingIndicator(false);
              setTimeout(() => {
                removeTypingIndicator();
                addMessage('assistant', closingText, false);
                conversationHistory.push({ role: 'assistant', content: closingText });
                saveChat();
              }, 800);
            }, 300);
          } else {
            saveChat();
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator();

    // Check if we got any partial content before the error
    if (accumulatedContent && accumulatedContent.trim()) {
      console.log('⚠️ Stream interrupted with partial content. Showing what we got so far...');
      // Save what we received before the interruption
      addMessage('assistant', accumulatedContent + '\n\n_[Connection interrupted - response may be incomplete]_');
      conversationHistory.push({ role: 'assistant', content: accumulatedContent });
      saveChat();
    } else {
      // No content received at all
      if (error.name === 'AbortError') {
        addMessage('assistant', '⏱️ Request timed out. The server took too long to respond. Try a shorter message.');
      } else if (error.message && error.message.includes('peer closed')) {
        addMessage('assistant', '⚠️ Connection interrupted. The server may have restarted or had a network issue. Please try again.');
      } else {
        addMessage('assistant', '⚠️ Something went wrong. Please try again.');
      }
    }
  } finally {
    sendButton.disabled = false;
    sendButton.style.opacity = '1';
    userInput.focus();
  }
}

// ============= DEPLOYMENT SYSTEM =============

// Upgrade pricing (discounted prices when upgrading)
// TEST MODE - Discounted upgrade prices
const UPGRADE_PRICING = {
  lite: {
    pro: { price: 7.99, priceId: 'price_1STLCbRwqmVW0cG8FNdijbXX' }, // Pro upgrade: $7.99/mo (discounted from $9.99)
    max: { price: 20.00, priceId: 'price_1STLD1RwqmVW0cG8lIpX7UeU' } // Max upgrade: $20.00/mo (discounted from $24.45)
  },
  pro: {
    max: { price: 20.00, priceId: 'price_1STLD1RwqmVW0cG8lIpX7UeU' } // Max upgrade: $20.00/mo (discounted from $24.45)
  }
};

// Check if current chat is editing an already-deployed website
async function isEditingDeployedWebsite() {
  if (!currentUser || !currentChatId) return false;

  try {
    const projects = await getUserProjects();
    const currentProject = projects.find(p => p.id === currentChatId.toString());

    if (!currentProject) return false;

    // Check if this project has been deployed (has contributed to website counter)
    const isDeployed =
      currentProject.deployment_status === 'deployed' ||
      currentProject.deployment_status === 'live' ||
      currentProject.preview_url || // Has preview URL
      currentProject.domain; // Has custom domain

    console.log('🔍 [isEditingDeployedWebsite]', {
      chatId: currentChatId,
      isDeployed,
      status: currentProject.deployment_status,
      hasPreviewUrl: !!currentProject.preview_url,
      hasDomain: !!currentProject.domain
    });

    return isDeployed;
  } catch (error) {
    console.error('Error checking if editing deployed website:', error);
    return false;
  }
}

// Count deployed websites for the current user
async function getDeployedWebsitesCount() {
  if (!currentUser) return 0;

  try {
    // ⚡ USE ACTUAL COUNTER FROM SUBSCRIPTIONS TABLE (not manual count!)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('websites_used')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !data) {
      console.log('⚠️ No subscription found, counting manually as fallback');
      // Fallback: manually count projects
      const projects = await getUserProjects();
      const deployedProjects = projects.filter(p =>
        p.deployment_status === 'deployed' ||
        p.deployment_status === 'live' ||
        p.preview_url
      );
      return deployedProjects.length;
    }

    const count = data.websites_used || 0;
    console.log(`📊 [getDeployedWebsitesCount] websites_used from DB: ${count}`);
    return count;
  } catch (error) {
    console.error('Error counting deployed websites:', error);
    return 0;
  }
}

// Check if user has an active subscription
async function hasActiveSubscription() {
  if (!currentUser) return false;

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .maybeSingle();

    return !error && data !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Get user's current plan and limit
async function getUserPlanInfo() {
  if (!currentUser) {
    return { plan: 'lite', limit: 1, hasSubscription: false };
  }

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan_name, max_websites')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .maybeSingle();

    console.log('🔍 [getUserPlanInfo] DB response:', { data, error });

    if (error || !data) {
      // No active subscription
      console.log('⚠️ [getUserPlanInfo] No subscription found, returning defaults');
      return { plan: 'lite', limit: 1, hasSubscription: false };
    }

    // Normalize plan name to lowercase and detect from max_websites if needed
    let planName = (data.plan_name || '').toLowerCase().trim();

    // If plan_name is invalid, detect from max_websites
    if (!['lite', 'pro', 'max'].includes(planName)) {
      const maxWebsites = data.max_websites || 1;
      if (maxWebsites === 1) planName = 'lite';
      else if (maxWebsites === 3) planName = 'pro';
      else if (maxWebsites === 8) planName = 'max';
      else planName = 'pro'; // Default fallback

      console.log(`⚠️ [getUserPlanInfo] Invalid plan_name "${data.plan_name}", detected as "${planName}" from max_websites=${data.max_websites}`);
    }

    const planInfo = {
      plan: planName,
      limit: data.max_websites || 1,
      hasSubscription: true
    };
    console.log('✅ [getUserPlanInfo] Returning:', planInfo);
    return planInfo;
  } catch (error) {
    console.error('Error getting user plan:', error);
    return { plan: 'lite', limit: 1, hasSubscription: false };
  }
}

// Show full price plan modal for NEW USERS (no active subscription)
function showFullPricePlanModal() {
  const modal = document.getElementById('upgradeModal');
  const optionsContainer = document.getElementById('upgradeOptionsContainer');
  const limitText = document.getElementById('upgradeLimitText');

  // Message for new users
  limitText.textContent = `Subscribe to deploy your website and unlock premium features!`;

  // Clear previous options
  optionsContainer.innerHTML = '';

  // Full price plans with their actual Stripe price IDs
  const fullPricePlans = {
    lite: {
      name: 'Lite',
      price: 5.00,
      maxWebsites: 1,
      priceId: 'price_1SSHEiRwqmVW0cG8U3nBQcVQ' // Lite Plan: prod_TP5PgQPgrDInl2
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      maxWebsites: 3,
      priceId: 'price_1SSO5TRwqmVW0cG8xKPuCb8N' // Pro Plan: prod_TPCUkSF8SjQXGn
    },
    max: {
      name: 'Max',
      price: 24.45,
      maxWebsites: 8,
      priceId: 'price_1SSO5uRwqmVW0cG8nFq5mLfM' // Max Plan: prod_TPCUKk9dsjFWvS
    }
  };

  Object.keys(fullPricePlans).forEach(planKey => {
    const plan = fullPricePlans[planKey];

    const optionHTML = `
      <div style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)); border: 2px solid rgba(255, 107, 53, 0.3); border-radius: 12px; padding: 20px; text-align: left; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='rgba(255, 107, 53, 0.6)'; this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.08))'" onmouseout="this.style.borderColor='rgba(255, 107, 53, 0.3)'; this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05))'" onclick="subscribeToPlan('${planKey}', '${plan.priceId}', ${plan.maxWebsites})">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">${plan.name} Plan</h4>
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <span style="color: #ff6b35; font-size: 24px; font-weight: 700;">$${plan.price}</span>
            <span style="color: #999; font-size: 14px;">/mo</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <svg style="width: 18px; height: 18px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span style="color: white; font-size: 14px; font-weight: 600;">${plan.maxWebsites} Website${plan.maxWebsites > 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 18px; height: 18px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span style="color: #999; font-size: 13px;">Custom Domains & Premium Hosting</span>
        </div>
      </div>
    `;

    optionsContainer.innerHTML += optionHTML;
  });

  // Show modal
  modal.classList.add('show');
}

// Show upgrade modal with appropriate plans (DISCOUNTED for existing subscribers)
function showUpgradeModal(currentPlan, deployedCount, limit) {
  console.log('🔔 [showUpgradeModal] Called with:', { currentPlan, deployedCount, limit });

  const modal = document.getElementById('upgradeModal');
  const optionsContainer = document.getElementById('upgradeOptionsContainer');
  const limitText = document.getElementById('upgradeLimitText');

  // Check if user is on Max plan (no upgrades available)
  if (currentPlan === 'max') {
    // Show "maximum reached" message
    limitText.textContent = `Sorry, you have reached your maximum amount of possible websites to create.`;

    optionsContainer.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05)); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <svg style="width: 48px; height: 48px; color: #ef4444; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h4 style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 8px;">Maximum Limit Reached</h4>
        <p style="color: #999; font-size: 14px; margin-bottom: 12px;">You're on the <span style="color: #ff6b35; font-weight: 600;">Max Plan</span> with ${limit} websites deployed.</p>
        <p style="color: #999; font-size: 13px;">This is the highest tier available. To deploy more websites, you'll need to delete an existing one first.</p>
      </div>
    `;

    modal.classList.add('show');
    return;
  }

  // Update the message for upgradeable plans
  limitText.textContent = `You've deployed ${deployedCount} of ${limit} websites. Upgrade to deploy more!`;

  // Clear previous options
  optionsContainer.innerHTML = '';

  // Generate upgrade options based on current plan
  const upgrades = UPGRADE_PRICING[currentPlan] || {};
  console.log('📊 [showUpgradeModal] UPGRADE_PRICING for', currentPlan, ':', upgrades);
  console.log('📊 [showUpgradeModal] Upgrade options count:', Object.keys(upgrades).length);

  if (Object.keys(upgrades).length === 0) {
    console.warn('⚠️ [showUpgradeModal] No upgrades available for plan:', currentPlan);
    optionsContainer.innerHTML = `
      <div style="background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: #ef4444; font-size: 14px;">No upgrade options available. Please contact support.</p>
        <p style="color: #999; font-size: 12px; margin-top: 8px;">Current plan: ${currentPlan}</p>
      </div>
    `;
  }

  Object.keys(upgrades).forEach(targetPlan => {
    console.log('🔧 [showUpgradeModal] Creating option for:', targetPlan);
    const upgrade = upgrades[targetPlan];
    const planInfo = PLAN_LIMITS[targetPlan];
    const currentPlanInfo = PLAN_LIMITS[currentPlan];
    const extraWebsites = planInfo.maxWebsites - currentPlanInfo.maxWebsites;
    console.log('🔧 [showUpgradeModal] Plan info:', planInfo);
    console.log('🔧 [showUpgradeModal] Upgrade pricing:', upgrade);
    console.log('🔧 [showUpgradeModal] Extra websites:', extraWebsites);

    const optionHTML = `
      <div style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05)); border: 2px solid rgba(255, 107, 53, 0.3); border-radius: 12px; padding: 20px; text-align: left; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.borderColor='rgba(255, 107, 53, 0.6)'; this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.08))'" onmouseout="this.style.borderColor='rgba(255, 107, 53, 0.3)'; this.style.background='linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 107, 53, 0.05))'" onclick="upgradeToPlan('${targetPlan}', '${upgrade.priceId}', ${planInfo.maxWebsites})">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">${planInfo.name} Plan</h4>
          <div style="display: flex; align-items: baseline; gap: 6px;">
            <span style="color: #999; font-size: 14px; text-decoration: line-through;">$${planInfo.priceNum}</span>
            <span style="color: #ff6b35; font-size: 24px; font-weight: 700;">$${upgrade.price}</span>
            <span style="color: #999; font-size: 14px;">/mo</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <svg style="width: 18px; height: 18px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span style="color: white; font-size: 14px; font-weight: 600;">+${extraWebsites} extra website${extraWebsites !== 1 ? 's' : ''} (${planInfo.maxWebsites} total)</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 18px; height: 18px; color: #10b981;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span style="color: #999; font-size: 13px;">Custom Domains & Premium Hosting</span>
        </div>
        <div style="margin-top: 12px; padding: 8px 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
          <span style="color: #10b981; font-size: 12px; font-weight: 600;">💰 Save $${(planInfo.priceNum - upgrade.price).toFixed(2)}/mo with upgrade discount!</span>
        </div>
      </div>
    `;

    optionsContainer.innerHTML += optionHTML;
  });

  // Show modal
  modal.classList.add('show');
}

// Close upgrade modal
window.closeUpgradeModal = function() {
  const modal = document.getElementById('upgradeModal');
  modal.classList.remove('show');
};

// Show upgrade success modal
function showUpgradeSuccessModal(planName, maxWebsites) {
  const modal = document.getElementById('upgradeSuccessModal');
  const title = document.getElementById('upgradeSuccessTitle');
  const message = document.getElementById('upgradeSuccessMessage');

  // Capitalize plan name
  const planDisplayName = planName.charAt(0).toUpperCase() + planName.slice(1);

  title.textContent = `Welcome to the ${planDisplayName} Plan!`;
  message.innerHTML = `You can now deploy up to <span style="color: #10b981; font-weight: 600;">${maxWebsites} websites</span>`;

  modal.classList.add('show');
}

// Close upgrade success modal
window.closeUpgradeSuccessModal = function() {
  const modal = document.getElementById('upgradeSuccessModal');
  modal.classList.remove('show');
  // Reload immediately when user clicks "Get Started"
  window.location.reload();
};

// Handle Stripe checkout callback (after successful payment)
async function handleStripeCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const subscriptionSuccess = urlParams.get('subscription') === 'success';
  const upgradeSuccess = urlParams.get('upgrade') === 'success';

  if (!subscriptionSuccess && !upgradeSuccess) return;

  if (!currentUser) {
    console.log('⏳ Waiting for auth to load before processing payment callback...');
    return;
  }

  console.log('🎉 Stripe checkout success detected!');
  console.log('👤 Current user:', currentUser.email);

  // Get pending subscription details from localStorage
  const pendingData = localStorage.getItem('pending_subscription');
  if (!pendingData) {
    console.error('❌ No pending subscription data found in localStorage');
    alert('Payment completed but subscription data was lost. Please contact support with your payment confirmation.');
    return;
  }

  const { plan_name, max_websites } = JSON.parse(pendingData);
  console.log('📝 Processing upgrade to:', { plan_name, max_websites, user_id: currentUser.id });

  try {
    // First, check if user has an existing subscription
    const { data: existingSub, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing subscription:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    let updateResult;

    if (existingSub) {
      // Update existing subscription
      console.log('📝 Updating existing subscription...');
      updateResult = await supabase
        .from('subscriptions')
        .update({
          plan_name: plan_name,
          max_websites: max_websites,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .eq('status', 'active')
        .select();

      if (updateResult.error) {
        throw new Error(`Update failed: ${updateResult.error.message}`);
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        throw new Error('Update succeeded but no rows were modified');
      }

      console.log('✅ Subscription updated:', updateResult.data[0]);
    } else {
      // Create new subscription (for new users)
      console.log('📝 Creating new subscription...');
      updateResult = await supabase
        .from('subscriptions')
        .insert([{
          user_id: currentUser.id,
          plan_name: plan_name,
          max_websites: max_websites,
          websites_used: 0,
          status: 'active',
          stripe_customer_id: null, // Will be set by webhook
          stripe_subscription_id: null, // Will be set by webhook
          current_period_end: null
        }])
        .select();

      if (updateResult.error) {
        throw new Error(`Insert failed: ${updateResult.error.message}`);
      }

      console.log('✅ Subscription created:', updateResult.data[0]);
    }

    // Also update user_profiles with plan information
    console.log('📝 Updating user profile with plan info...');
    const profileUpdate = await supabase
      .from('user_profiles')
      .update({
        plan_name: plan_name,
        max_websites: max_websites,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select();

    if (profileUpdate.error) {
      console.error('⚠️ Warning: Failed to update user profile:', profileUpdate.error);
      // Don't throw - subscription was updated successfully
    } else {
      console.log('✅ User profile updated with plan info');
    }

    // Success! Clear pending data and reload
    console.log('✅ Subscription processing complete!');
    localStorage.removeItem('pending_subscription');

    // Remove URL params
    window.history.replaceState({}, document.title, window.location.pathname);

    // Show success modal
    showUpgradeSuccessModal(plan_name, max_websites);

    // Reload to refresh UI after user closes modal or after 5 seconds
    setTimeout(() => {
      window.location.reload();
    }, 5000);

  } catch (err) {
    console.error('❌ Error processing subscription:', err);
    alert(`Error: ${err.message}\n\nYour payment was processed but we couldn't update your subscription. Please contact support.`);

    // Don't clear localStorage so support can see what happened
    console.log('💾 Keeping pending subscription data for support:', pendingData);
  }
}

// ONE-TIME: Sync existing subscription data to user_profiles
async function syncSubscriptionToProfile() {
  if (!currentUser) {
    console.log('⚠️ No user logged in');
    return;
  }

  console.log('🔄 Syncing subscription data to user profile...');

  try {
    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('❌ Error fetching subscription:', subError);
      return;
    }

    if (!subscription) {
      console.log('⚠️ No active subscription found');
      return;
    }

    // Update user_profiles with subscription data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        plan_name: subscription.plan_name || 'max', // Default to max if not set
        max_websites: subscription.max_websites || 8,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id)
      .select();

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      return;
    }

    console.log('✅ Profile synced successfully!', profile[0]);
    alert('✅ Your profile has been synced! Please refresh the page.');
  } catch (err) {
    console.error('❌ Sync error:', err);
  }
}

// Make it available globally for one-time use
window.syncSubscriptionToProfile = syncSubscriptionToProfile;

// Handle NEW subscription (full price for users with no active subscription)
window.subscribeToPlan = async function(planName, priceId, websiteLimit) {
  // Close modal
  closeUpgradeModal();

  console.log('🚀 Starting NEW subscription to plan:', planName);
  console.log('💳 Using price ID:', priceId);

  // Store plan details in localStorage to set after successful checkout
  localStorage.setItem('pending_subscription', JSON.stringify({
    plan_name: planName,
    max_websites: websiteLimit,
    priceId: priceId
  }));

  try {
    // Call backend to create Stripe checkout session
    const response = await fetch(`${API_ENDPOINT.replace('/api/message', '')}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: priceId,
        successUrl: window.location.origin + '?subscription=success&plan=' + planName,
        cancelUrl: window.location.origin + '?subscription=cancelled',
        customerEmail: currentUser?.email || undefined,
        clientReferenceId: currentUser?.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [subscribeToPlan] Backend error:', data.error);
      alert('Error: ' + (data.error || 'Could not create checkout session.'));
      return;
    }

    // Redirect to Stripe Checkout
    const stripe = getStripe();
    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (error) {
      console.error('❌ [subscribeToPlan] Stripe redirect error:', error);
      alert('Error: ' + (error.message || 'Could not redirect to checkout.'));
    }
  } catch (err) {
    console.error('❌ [subscribeToPlan] Exception:', err);
    alert('Error: ' + (err.message || 'Could not start checkout.'));
  }
};

// Handle upgrade to a specific plan (DISCOUNTED price for existing subscribers)
window.upgradeToPlan = async function(planName, priceId, websiteLimit) {
  // Close modal
  closeUpgradeModal();

  console.log('🚀 Starting upgrade to plan:', planName);
  console.log('💳 Using price ID:', priceId);

  // Store plan details in localStorage to set after successful checkout
  localStorage.setItem('pending_subscription', JSON.stringify({
    plan_name: planName,
    max_websites: websiteLimit,
    priceId: priceId
  }));

  try {
    // Call backend to create Stripe checkout session
    const response = await fetch(`${API_ENDPOINT.replace('/api/message', '')}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: priceId,
        successUrl: window.location.origin + '?upgrade=success&plan=' + planName,
        cancelUrl: window.location.origin + '?upgrade=cancelled',
        customerEmail: currentUser?.email || undefined,
        clientReferenceId: currentUser?.id
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [upgradeToPlan] Backend error:', data.error);
      alert('Error: ' + (data.error || 'Could not create checkout session.'));
      return;
    }

    // Redirect to Stripe Checkout
    const stripe = getStripe();
    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (error) {
      console.error('❌ [upgradeToPlan] Stripe redirect error:', error);
      alert('Error: ' + (error.message || 'Could not redirect to checkout.'));
    }
  } catch (err) {
    console.error('❌ [upgradeToPlan] Exception:', err);
    alert('Error: ' + (err.message || 'Could not start checkout.'));
  }
};

// Start the deployment process (with limit check)
window.startDeployment = async function(projectId) {
  const project = globalProjects[projectId];
  if (!project || project.length === 0) {
    alert('No website files found to deploy!');
    return;
  }

  // Check if user is logged in
  if (!currentUser) {
    alert('Please sign in to deploy your website!');
    return;
  }

  currentDeployment.projectId = projectId;

  // ⚡ Check if this is a RE-DEPLOY of an already-deployed website
  const isRedeploying = await isEditingDeployedWebsite();

  if (isRedeploying) {
    console.log('🔄 [startDeployment] RE-DEPLOYING existing website - skipping domain selection!');

    // Get existing domain from database
    try {
      const projects = await getUserProjects();
      const currentProject = projects.find(p => p.id === currentChatId.toString());

      if (currentProject && currentProject.domain) {
        currentDeployment.domain = currentProject.domain;
        console.log('📌 Using existing domain:', currentProject.domain);

        // Go straight to Phase 3: Re-upload
        transitionToPhase(3);

        // Auto-click the "Deploy Now" button after a brief delay
        setTimeout(() => {
          const deployNowBtn = document.getElementById('deployNowBtn');
          if (deployNowBtn) {
            deployNowBtn.click();
          }
        }, 1000);
        return;
      } else {
        // Edge case: Deployed website but domain missing from database
        console.warn('⚠️ Re-deploy detected but domain not found in database. Falling back to domain selection.');
      }
    } catch (error) {
      console.error('❌ Error getting existing domain:', error);
      // Fall through to domain selection as backup
    }
  }

  // NEW website deployment - proceed with full flow
  console.log('🆕 [startDeployment] NEW website deployment - proceeding with domain selection');

  // Transition to Phase 2: Domain Selection
  transitionToPhase(2);

  // Focus on domain input
  setTimeout(() => {
    const domainInput = document.getElementById('domainInputMain');
    if (domainInput) domainInput.focus();
  }, 800);
};

// ============= PHASE 2: DOMAIN SELECTION =============

// Check domain availability (Phase 2)
async function checkDomainInPhase2() {
  const domainInput = document.getElementById('domainInputMain');
  const extensionSelect = document.getElementById('domainExtension');

  let domainName = domainInput.value.trim().toLowerCase();
  const extension = extensionSelect.value; // e.g., ".com"

  if (!domainName) {
    return;
  }

  // Strip any existing extension from input (in case user typed it manually)
  const extensions = ['.com', '.info', '.store', '.org', '.online'];
  extensions.forEach(ext => {
    if (domainName.endsWith(ext)) {
      domainName = domainName.slice(0, -ext.length);
    }
  });

  // Combine domain name + selected extension
  const fullDomain = domainName + extension;

  console.log('Domain input:', domainInput.value);
  console.log('Cleaned domain name:', domainName);
  console.log('Selected extension:', extension);
  console.log('Full domain to check:', fullDomain);

  const resultDiv = document.getElementById('domainResultMain');
  const checkBtn = document.getElementById('checkDomainMainBtn');

  // Validate that we have a proper domain name
  if (!domainName || domainName.length < 2) {
    resultDiv.className = 'domain-result unavailable show';
    resultDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">Domain Too Short</div>
      <div style="font-size: 14px; opacity: 0.8;">Please enter at least 2 characters</div>
    `;
    return;
  }

  // Remove any existing proceed button
  const existingProceedBtn = document.getElementById('proceedBtnMain');
  if (existingProceedBtn) {
    existingProceedBtn.remove();
  }

  checkBtn.disabled = true;
  checkBtn.textContent = 'Checking...';

  resultDiv.className = 'domain-result checking show';
  resultDiv.innerHTML = `🔍 Checking ${fullDomain}...`;

  try {
    const apiUrl = `${FAYEZ_API}/domain/check?domain=${encodeURIComponent(fullDomain)}`;
    console.log('Checking domain at URL:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
        console.error('API error response:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Domain check response:', data); // Debug log

    if (data.available) {
      resultDiv.className = 'domain-result available show';
      resultDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
        <div style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">${fullDomain} is available!</div>
        <div style="font-size: 16px; opacity: 0.8;">Ready to deploy your site</div>
      `;

      currentDeployment.domain = fullDomain;

      // Add proceed button
      const proceedBtn = document.createElement('button');
      proceedBtn.id = 'proceedBtnMain';
      proceedBtn.className = 'proceed-btn';
      proceedBtn.textContent = '🚀 Deploy This Site';
      proceedBtn.onclick = proceedToPhase3;
      resultDiv.parentNode.appendChild(proceedBtn);

      setTimeout(() => {
        proceedBtn.classList.add('show');
      }, 100);
    } else {
      resultDiv.className = 'domain-result unavailable show';
      resultDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
        <div style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">${fullDomain} is not available</div>
        <div style="font-size: 14px; opacity: 0.8;">Try a different domain name or extension</div>
      `;
    }

    checkBtn.disabled = false;
    checkBtn.textContent = 'Check Another';
  } catch (error) {
    console.error('Domain check error:', error);
    console.error('Domain being checked:', fullDomain);
    console.error('Domain name part:', domainName);
    console.error('Extension part:', extension);

    resultDiv.className = 'domain-result unavailable show';
    resultDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
      <div style="font-size: 18px; font-weight: 800; margin-bottom: 8px;">Error Checking Domain</div>
      <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Tried to check: <strong>${fullDomain}</strong></div>
      <div style="font-size: 13px; opacity: 0.7; margin-top: 8px;">Error: ${error.message}</div>
      <div style="font-size: 12px; opacity: 0.6; margin-top: 8px;">Make sure Fayez API is running on port 4000</div>
    `;

    checkBtn.disabled = false;
    checkBtn.textContent = 'Try Again';
  }
}

// Proceed to Phase 3
// proceedToPhase3 function moved to after auth section (line ~2579) to support subscription checking

// ============= PHASE 3: DEPLOYMENT =============

// Update deployment step status in Phase 3
function updateDeploymentStepInPhase3(stepNumber, status, message) {
  const step = document.querySelector(`#deploymentStepsMain .deploy-step-card[data-step="${stepNumber}"]`);
  if (!step) return;

  const stepStatus = step.querySelector('.deploy-step-status');

  step.classList.remove('in-progress', 'completed', 'error');

  if (status === 'in_progress') {
    step.classList.add('in-progress');
    stepStatus.textContent = message || 'In progress...';
  } else if (status === 'completed') {
    step.classList.add('completed');
    stepStatus.textContent = message || 'Completed ✓';
  } else if (status === 'error') {
    step.classList.add('error');
    stepStatus.textContent = message || 'Failed';
  }
}

// Execute deployment in Phase 3
async function executeDeploymentInPhase3() {
  const project = globalProjects[currentDeployment.projectId];
  const domain = currentDeployment.domain;

  try {
    // Step 1: Download from Supabase (actually we upload first, but matching terminal output)
    updateDeploymentStepInPhase3(1, 'in_progress', 'Uploading to Supabase...');
    const zipBlob = await createZipFromProject(project);

    const formData = new FormData();
    formData.append('file', zipBlob, 'website.zip');

    const uploadResponse = await fetch(`${FAYEZ_API}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    const uploadData = await uploadResponse.json();
    currentDeployment.uploadKey = uploadData.key;
    updateDeploymentStepInPhase3(1, 'completed', '✅ Downloaded from Supabase');

    // Step 2: Extract files
    updateDeploymentStepInPhase3(2, 'in_progress', '📂 Extracting ZIP...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateDeploymentStepInPhase3(2, 'completed', '✅ Extracted files');

    // Step 3: Deploy to Cloudflare Pages
    updateDeploymentStepInPhase3(3, 'in_progress', '🚀 Deploying with Wrangler...');

    // Get user info for notification
    const userName = currentUser?.user_metadata?.full_name || userProfile?.full_name || 'Unknown User';
    const userEmail = currentUser?.email || 'no-email@example.com';

    const checkoutResponse = await fetch(`${FAYEZ_API}/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        uploadKey: uploadData.key,
        customerEmail: userEmail,
        customerName: userName
      })
    });

    if (!checkoutResponse.ok) {
      throw new Error('Deployment failed');
    }

    const checkoutData = await checkoutResponse.json();
    const jobId = checkoutData.jobId;

    console.log('Deployment job started:', jobId);

    // Poll job status until deployment is complete
    let deploymentComplete = false;
    let pagesUrl = domain.replace(/\./g, '-') + '.pages.dev';

    while (!deploymentComplete) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds

      try {
        const statusResponse = await fetch(`${FAYEZ_API}/checkout/job-status/${jobId}`);

        if (!statusResponse.ok) {
          console.error('Failed to check job status');
          continue;
        }

        const statusData = await statusResponse.json();
        console.log('Job status:', statusData);

        // Update progress messages based on job progress
        if (statusData.progress >= 25 && statusData.progress < 40) {
          updateDeploymentStepInPhase3(3, 'in_progress', '📥 Files downloaded...');
        } else if (statusData.progress >= 40 && statusData.progress < 80) {
          updateDeploymentStepInPhase3(3, 'in_progress', '📂 Files extracted...');
        } else if (statusData.progress >= 80 && statusData.progress < 100) {
          updateDeploymentStepInPhase3(3, 'in_progress', '🚀 Deploying to Cloudflare...');
        }

        // Check if deployment is complete
        if (statusData.status === 'completed' && statusData.result) {
          deploymentComplete = true;

          // Extract the actual deployed URL if available
          if (statusData.result.liveUrl) {
            pagesUrl = statusData.result.liveUrl.replace('https://', '');
          }

          updateDeploymentStepInPhase3(3, 'completed', '✅ Site is live!');

          // Step 4: Complete
          updateDeploymentStepInPhase3(4, 'in_progress', 'Verifying deployment...');
          await new Promise(resolve => setTimeout(resolve, 500));
          updateDeploymentStepInPhase3(4, 'completed', '✅ Deployment complete!');
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.failedReason || 'Deployment failed');
        }
      } catch (pollError) {
        console.error('Error polling job status:', pollError);
        // Continue polling even if one check fails
      }
    }

    // Show success message with correct URL
    showDeploymentSuccessInPhase3(domain, pagesUrl);

    // ⚡ Save deployment data to database (for re-deploy detection)
    try {
      const projectData = {
        id: currentChatId.toString(),
        domain: domain,
        preview_url: `https://${pagesUrl}`,
        deployment_status: 'deployed'
      };
      await updateProject(currentChatId.toString(), projectData);
      console.log('✅ Deployment data saved to database:', projectData);

      // Update current chat in memory with deployed status
      const currentChat = chats.find(c => c.id === currentChatId);
      if (currentChat) {
        currentChat.deploymentStatus = 'deployed';
        currentChat.previewUrl = `https://${pagesUrl}`;

        // SAVE to localStorage so it persists!
        localStorage.setItem('fowazz_chats', JSON.stringify(chats));
        console.log('💾 Chat deployment status saved to localStorage');
      }

      // Refresh sidebar to show "Running" badge with green background
      renderChatHistory();
      console.log('🎨 Sidebar updated with "Running" badge!');

      // NOW increment websites used (only after successful deployment!)
      const testMode = localStorage.getItem('fowazz_test_mode') === 'true';
      if (!testMode) {
        console.log('📈 Incrementing websites used count after successful deployment...');
        const incrementSuccess = await incrementWebsitesUsed();

        if (incrementSuccess) {
          console.log('✅ Websites used count incremented!');

          // Longer delay to ensure database has updated
          await new Promise(resolve => setTimeout(resolve, 500));

          // Update counter with animation
          console.log('🔄 Updating counter display with animation...');
          await updateWebsiteCounter();
          console.log('✅ Counter update complete!');
        } else {
          console.error('⚠️ Failed to increment websites used count');
        }
      } else {
        console.log('🧪 Test mode enabled - skipping counter increment');
      }
    } catch (saveError) {
      console.error('⚠️ Failed to save deployment data:', saveError);
      // Don't fail deployment if save fails
    }

  } catch (error) {
    console.error('Deployment error:', error);
    updateDeploymentStepInPhase3(1, 'error', 'Deployment failed');
    showDeploymentErrorInPhase3(error.message);
  }
}

// Create ZIP file from project
async function createZipFromProject(project) {
  const zip = new JSZip();

  // Add each HTML file to the ZIP
  project.forEach(file => {
    zip.file(file.filename, file.htmlCode);
  });

  // Generate the ZIP file as a Blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

// Show deployment success in Phase 3
function showDeploymentSuccessInPhase3(domain, pagesUrl) {
  const resultDiv = document.getElementById('deploymentResultMain');

  resultDiv.className = 'deployment-result-main success show';
  resultDiv.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 24px;">🎉</div>
    <h3 style="color: var(--neon-green); font-size: 32px; font-weight: 900; margin: 0 0 16px 0;">Deployment Complete!</h3>
    <p style="color: #999; font-size: 16px; margin: 0 0 32px 0;">Your website is deployed and ready to visit via the preview link!</p>

    <div style="
      background: rgba(57, 255, 20, 0.1);
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 2px solid rgba(57, 255, 20, 0.3);
    ">
      <div style="color: var(--neon-green); font-size: 13px; font-weight: 700; margin-bottom: 12px;">✅ Preview Link Ready Now!</div>
      <a href="https://${pagesUrl}" target="_blank" style="
        color: var(--neon-green);
        font-size: 18px;
        font-weight: 700;
        text-decoration: none;
      ">https://${pagesUrl}</a>
      <div style="color: #ccc; font-size: 12px; margin-top: 8px;">Your website is live! Share this link with anyone.</div>
    </div>

    <div style="
      background: rgba(255, 165, 0, 0.1);
      padding: 16px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 165, 0, 0.3);
    ">
      <div style="color: #ffa500; font-size: 13px; font-weight: 600; margin-bottom: 8px;">⚠️ Important Note</div>
      <div style="color: #bbb; font-size: 13px; line-height: 1.6;">
        This preview link is <strong>temporary</strong>. Your custom domain <strong>${domain}</strong> will be configured and live in <strong>a couple of hours</strong>. Click below to set it up now.
      </div>
    </div>

    <button
      class="visit-site-btn"
      onclick="window.open('https://${pagesUrl}', '_blank')"
      style="margin-bottom: 16px;"
    >🌐 Visit Preview Link</button>

    <button
      class="visit-site-btn"
      onclick="startDomainVerification('${domain}', 'https://${pagesUrl}')"
      style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"
    >➡️ Continue to Domain Setup</button>
  `;

  // Scroll to bottom to show the success message
  setTimeout(() => {
    const container = document.getElementById('phase3Container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100);
}

// Show deployment error in Phase 3
function showDeploymentErrorInPhase3(errorMessage) {
  const resultDiv = document.getElementById('deploymentResultMain');

  resultDiv.className = 'deployment-result-main error show';
  resultDiv.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
    <h3 style="color: #ff4444; font-size: 32px; font-weight: 900; margin: 0 0 16px 0;">Deployment Failed</h3>
    <p style="color: #999; font-size: 16px; margin: 0 0 12px 0;">${errorMessage}</p>
    <p style="color: #666; font-size: 14px; margin: 0;">Make sure Fayez API is running on port 4000</p>
  `;

  // Scroll to bottom to show the error message
  setTimeout(() => {
    const container = document.getElementById('phase3Container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100);
};

// ============= END DEPLOYMENT SYSTEM =============

window.addEventListener('load', async () => {
  // Initialize authentication first
  await checkAuthOnLoad();

  // Check for payment success redirect from Stripe
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');

  if (paymentStatus === 'success' && sessionId) {
    console.log('✅ Payment redirect detected! Session ID:', sessionId);

    // Clean URL without refresh
    window.history.replaceState({}, document.title, window.location.pathname);

    // Show payment loading overlay immediately
    const loadingOverlay = document.getElementById('paymentLoadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('active');
    }
    console.log('⏳ Verifying subscription...');

    // Poll for subscription activation (webhook should have created it)
    let pollAttempts = 0;
    const maxPollAttempts = 20;

    const pollInterval = setInterval(async () => {
      pollAttempts++;

      const hasSubscription = await hasActiveSubscription();

      if (hasSubscription) {
        clearInterval(pollInterval);
        console.log('✅ Subscription verified!');

        // Update counter and proceed
        await updateWebsiteCounter();

        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.remove('active');
        }

        await handlePaymentSuccess();
      } else if (pollAttempts >= maxPollAttempts) {
        clearInterval(pollInterval);
        console.log('⚠️ Subscription verification timeout - proceeding anyway');

        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.remove('active');
        }

        // Try to proceed even if verification timed out
        await updateWebsiteCounter();
        setTimeout(() => {
          transitionToPhase(3);
        }, 500);
      }
    }, 1500); // Check every 1.5 seconds

    return; // Skip the rest of the normal initialization
  }

  renderChatHistory(true); // Animate on first load
  userInput.focus();
  initPluginsModal();
  initSidebarToggle();

  // Add event listener for Phase 2 domain check button
  const checkDomainBtn = document.getElementById('checkDomainMainBtn');
  if (checkDomainBtn) {
    checkDomainBtn.addEventListener('click', checkDomainInPhase2);
  }

  // Add enter key listener for Phase 2 domain input
  const domainInputMain = document.getElementById('domainInputMain');
  if (domainInputMain) {
    domainInputMain.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkDomainInPhase2();
      }
    });
  }

  // Welcome modal will be shown after language selection
  // Don't show it automatically here to avoid conflict with language picker
});

// ============= WELCOME MODAL =============

function showWelcomeModal() {
  // Check if user has seen the welcome modal before
  const hasSeenWelcome = localStorage.getItem('fowazz_seen_welcome');

  if (!hasSeenWelcome) {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
      // Small delay for smooth appearance
      setTimeout(() => {
        welcomeModal.classList.add('active');
      }, 500);
    }
  }
}

// Open welcome modal (can be called by "How it Works" button)
window.openWelcomeModal = function() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.classList.add('active');
  }
};

window.closeWelcomeModal = function() {
  const welcomeModal = document.getElementById('welcomeModal');
  if (welcomeModal) {
    welcomeModal.classList.remove('active');
    // Remember that user has seen the welcome modal
    localStorage.setItem('fowazz_seen_welcome', 'true');
  }
};

// ============= PLUGINS MODAL =============

function initPluginsModal() {
  const pluginWrappers = document.querySelectorAll(".plugin-wrapper");

  pluginWrappers.forEach(wrapper => {
    const pluginItem = wrapper.querySelector(".plugin-item");
    const configPanel = wrapper.querySelector(".plugin-config-panel");
    const pluginId = pluginItem.getAttribute("data-plugin");

    pluginItem.addEventListener("click", () => {
      if (wrapper.classList.contains("active")) {
        // Deactivate
        wrapper.classList.remove("active");
        selectedPlugins = selectedPlugins.filter(p => p !== pluginId);
        delete pluginConfigs[pluginId];
      } else {
        // Activate
        wrapper.classList.add("active");
        selectedPlugins.push(pluginId);
        renderPluginConfig(pluginId, configPanel);
      }

      updatePluginsCount();
    });
  });
}

function renderPluginConfig(pluginId, configPanel) {
  const config = PLUGIN_CONFIGS[pluginId];
  if (!config) return;

  // Initialize config storage
  pluginConfigs[pluginId] = {};

  let html = '';

  // Render fields
  if (config.fields && config.fields.length > 0) {
    config.fields.forEach(field => {
      html += `<div class="config-field" data-field-id="${field.id}">`;
      html += `<label class="config-label">${field.label}</label>`;

      if (field.type === 'socials-array') {
        // Special socials array with platform and link
        html += `<div class="config-socials-container" data-field="${field.id}">`;
        html += `<button class="config-add-btn" onclick="addSocialField('${pluginId}', '${field.id}')" style="margin-bottom: 10px;">+ Add Social Media</button>`;
        html += `</div>`;
        pluginConfigs[pluginId][field.id] = [];
      } else if (field.type === 'reviews-array') {
        // Special reviews array with name, rating, review text
        html += `<div class="config-reviews-container" data-field="${field.id}">`;
        html += `<button class="config-add-btn" onclick="addReviewField('${pluginId}', '${field.id}')" style="margin-bottom: 10px;">+ Add Review</button>`;
        html += `</div>`;
        pluginConfigs[pluginId][field.id] = [];
      } else if (field.type === 'array') {
        // Array field with + button
        html += `<div class="config-array-container" data-field="${field.id}">`;
        html += `<div class="config-array-item">`;
        html += `<input type="text" class="config-input" placeholder="${field.placeholder}" data-array-field="${field.id}" data-index="0">`;
        html += `</div>`;
        html += `<button class="config-add-btn" onclick="addArrayField('${pluginId}', '${field.id}', '${field.placeholder}')">+ ${field.addMoreText || 'Add Another'}</button>`;
        html += `</div>`;
        pluginConfigs[pluginId][field.id] = [];
      } else if (field.type === 'textarea') {
        html += `<textarea class="config-input config-textarea" placeholder="${field.placeholder}" data-field="${field.id}"></textarea>`;
      } else {
        html += `<input type="text" class="config-input" placeholder="${field.placeholder}" data-field="${field.id}">`;
      }

      if (field.help) {
        html += `<div class="config-help">${field.help}</div>`;
      }
      html += `</div>`;
    });
  }

  // Render instructions
  if (config.instructions) {
    html += `<div class="config-instructions">`;
    html += `<div class="config-instructions-title">📝 Setup Instructions</div>`;
    html += `<div class="config-instructions-text">${config.instructions}</div>`;
    html += `</div>`;
  }

  configPanel.innerHTML = html;

  // Add event listeners to inputs
  configPanel.querySelectorAll('.config-input[data-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const fieldId = e.target.getAttribute('data-field');
      pluginConfigs[pluginId][fieldId] = e.target.value;
    });
  });

  // Add event listeners to array inputs
  configPanel.querySelectorAll('.config-input[data-array-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const fieldId = e.target.getAttribute('data-array-field');
      const index = parseInt(e.target.getAttribute('data-index'));
      if (!pluginConfigs[pluginId][fieldId]) {
        pluginConfigs[pluginId][fieldId] = [];
      }
      pluginConfigs[pluginId][fieldId][index] = e.target.value;
    });
  });
}

window.addArrayField = function(pluginId, fieldId, placeholder) {
  const container = document.querySelector(`.plugin-config-panel[data-plugin="${pluginId}"] .config-array-container[data-field="${fieldId}"]`);
  const addButton = container.querySelector('.config-add-btn');
  const currentItems = container.querySelectorAll('.config-array-item').length;

  const newItem = document.createElement('div');
  newItem.className = 'config-array-item';
  newItem.innerHTML = `
    <input type="text" class="config-input" placeholder="${placeholder}" data-array-field="${fieldId}" data-index="${currentItems}">
    <button class="config-remove-btn" onclick="removeArrayField(this, '${pluginId}', '${fieldId}', ${currentItems})">×</button>
  `;

  container.insertBefore(newItem, addButton);

  // Add event listener to new input
  const newInput = newItem.querySelector('input');
  newInput.addEventListener('input', (e) => {
    const index = parseInt(e.target.getAttribute('data-index'));
    if (!pluginConfigs[pluginId][fieldId]) {
      pluginConfigs[pluginId][fieldId] = [];
    }
    pluginConfigs[pluginId][fieldId][index] = e.target.value;
  });
};

window.removeArrayField = function(button, pluginId, fieldId, index) {
  const item = button.parentElement;
  item.remove();

  // Remove from config
  if (pluginConfigs[pluginId] && pluginConfigs[pluginId][fieldId]) {
    pluginConfigs[pluginId][fieldId].splice(index, 1);
  }
};

window.addReviewField = function(pluginId, fieldId) {
  const container = document.querySelector(`.plugin-config-panel[data-plugin="${pluginId}"] .config-reviews-container[data-field="${fieldId}"]`);
  const addButton = container.querySelector('.config-add-btn');
  const currentItems = container.querySelectorAll('.config-review-item').length;

  const newItem = document.createElement('div');
  newItem.className = 'config-review-item';
  newItem.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 10px;';
  newItem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <div style="font-weight: 600; color: #fff;">Review #${currentItems + 1}</div>
      <button class="config-remove-btn" onclick="removeReviewField(this, '${pluginId}', '${fieldId}', ${currentItems})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 16px;">×</button>
    </div>
    <input type="text" class="config-input" placeholder="Name" data-review-field="${fieldId}" data-review-index="${currentItems}" data-review-part="name" style="margin-bottom: 8px;">
    <div style="margin-bottom: 8px;">
      <select class="config-input" data-review-field="${fieldId}" data-review-index="${currentItems}" data-review-part="rating" style="width: 100%; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
        <option value="">No rating (optional)</option>
        <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
        <option value="4">⭐⭐⭐⭐ (4 stars)</option>
        <option value="3">⭐⭐⭐ (3 stars)</option>
        <option value="2">⭐⭐ (2 stars)</option>
        <option value="1">⭐ (1 star)</option>
      </select>
    </div>
    <textarea class="config-input config-textarea" placeholder="Review text" data-review-field="${fieldId}" data-review-index="${currentItems}" data-review-part="text" style="resize: vertical; min-height: 80px;"></textarea>
  `;

  container.appendChild(newItem);

  // Add event listeners to all inputs
  newItem.querySelectorAll('[data-review-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.getAttribute('data-review-index'));
      const part = e.target.getAttribute('data-review-part');

      if (!pluginConfigs[pluginId][fieldId]) {
        pluginConfigs[pluginId][fieldId] = [];
      }
      if (!pluginConfigs[pluginId][fieldId][index]) {
        pluginConfigs[pluginId][fieldId][index] = {};
      }

      pluginConfigs[pluginId][fieldId][index][part] = e.target.value;
    });
  });
};

window.removeReviewField = function(button, pluginId, fieldId, index) {
  const item = button.closest('.config-review-item');
  item.remove();

  // Remove from config
  if (pluginConfigs[pluginId] && pluginConfigs[pluginId][fieldId]) {
    pluginConfigs[pluginId][fieldId].splice(index, 1);
  }
};

window.addSocialField = function(pluginId, fieldId) {
  const container = document.querySelector(`.plugin-config-panel[data-plugin="${pluginId}"] .config-socials-container[data-field="${fieldId}"]`);
  const addButton = container.querySelector('.config-add-btn');
  const currentItems = container.querySelectorAll('.config-social-item').length;

  const newItem = document.createElement('div');
  newItem.className = 'config-social-item';
  newItem.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; gap: 10px; align-items: flex-start;';
  newItem.innerHTML = `
    <select class="config-input" data-social-field="${fieldId}" data-social-index="${currentItems}" data-social-part="platform" style="flex: 0 0 140px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px; border-radius: 6px;">
      <option value="">Platform</option>
      <option value="instagram">📷 Instagram</option>
      <option value="tiktok">🎵 TikTok</option>
      <option value="youtube">▶️ YouTube</option>
      <option value="twitter">🐦 Twitter/X</option>
      <option value="facebook">👍 Facebook</option>
      <option value="snapchat">👻 Snapchat</option>
      <option value="linkedin">💼 LinkedIn</option>
      <option value="pinterest">📌 Pinterest</option>
      <option value="threads">🧵 Threads</option>
      <option value="reddit">🤖 Reddit</option>
      <option value="discord">💬 Discord</option>
      <option value="twitch">🎮 Twitch</option>
      <option value="github">⚡ GitHub</option>
    </select>
    <input type="text" class="config-input" placeholder="Username or full URL" data-social-field="${fieldId}" data-social-index="${currentItems}" data-social-part="link" style="flex: 1;">
    <button class="config-remove-btn" onclick="removeSocialField(this, '${pluginId}', '${fieldId}', ${currentItems})" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; padding: 10px 14px; border-radius: 6px; cursor: pointer; font-size: 16px; flex-shrink: 0;">×</button>
  `;

  container.appendChild(newItem);

  // Add event listeners
  newItem.querySelectorAll('[data-social-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const index = parseInt(e.target.getAttribute('data-social-index'));
      const part = e.target.getAttribute('data-social-part');

      if (!pluginConfigs[pluginId][fieldId]) {
        pluginConfigs[pluginId][fieldId] = [];
      }
      if (!pluginConfigs[pluginId][fieldId][index]) {
        pluginConfigs[pluginId][fieldId][index] = {};
      }

      pluginConfigs[pluginId][fieldId][index][part] = e.target.value;
    });
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.getAttribute('data-social-index'));
      const part = e.target.getAttribute('data-social-part');

      if (!pluginConfigs[pluginId][fieldId]) {
        pluginConfigs[pluginId][fieldId] = [];
      }
      if (!pluginConfigs[pluginId][fieldId][index]) {
        pluginConfigs[pluginId][fieldId][index] = {};
      }

      pluginConfigs[pluginId][fieldId][index][part] = e.target.value;
    });
  });
};

window.removeSocialField = function(button, pluginId, fieldId, index) {
  const item = button.closest('.config-social-item');
  item.remove();

  // Remove from config
  if (pluginConfigs[pluginId] && pluginConfigs[pluginId][fieldId]) {
    pluginConfigs[pluginId][fieldId].splice(index, 1);
  }
};

function updatePluginsCount() {
  document.getElementById("selectedCount").textContent = selectedPlugins.length;
}

window.openPluginsModal = function() {
  const modal = document.getElementById("pluginsModal");
  modal.classList.remove("closing");
  modal.classList.add("active");

  // Small delay to trigger CSS transition after display change
  setTimeout(() => {
    modal.classList.add("show-animation");
  }, 10);

  // Hide the feature tooltip once user opens the modal
  hideFeatureTooltip();
};

window.closePluginsModal = function() {
  const modal = document.getElementById("pluginsModal");
  modal.classList.remove("show-animation");
  modal.classList.add("closing");
  // Remove active class after animation finishes
  setTimeout(() => {
    modal.classList.remove("active");
    modal.classList.remove("closing");
  }, 300);
};

// Feature tooltip management
window.hideFeatureTooltip = function() {
  const tooltip = document.getElementById("featureTooltip");
  if (tooltip) {
    tooltip.classList.add("hide");
    tooltip.classList.remove("show");
    // Hide completely after animation finishes
    setTimeout(() => {
      tooltip.style.display = "none";
      tooltip.classList.remove("hide");
    }, 300);
  }
}

// Initialize feature tooltip behavior - ALWAYS SHOWS
function initFeatureTooltip() {
  setTimeout(() => {
    const tooltip = document.getElementById("featureTooltip");
    if (!tooltip) {
      console.log("❌ Tooltip element not found");
      return;
    }

    console.log("✅ Tooltip found - showing it NOW");

    // Show with animation
    tooltip.style.display = "block";
    setTimeout(() => {
      tooltip.classList.add("show");
    }, 10);
    console.log("✅ Tooltip is now visible!");

    // Auto-hide after 20 seconds
    setTimeout(() => {
      console.log("⏱️ Auto-hiding tooltip after 20 seconds");
      hideFeatureTooltip();
    }, 20000);
  }, 1000);
}

// Initialize tooltip when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFeatureTooltip);
} else {
  initFeatureTooltip();
}

// ============= AUTHENTICATION =============

// Show login modal
window.showLoginModal = function() {
  document.getElementById("loginModal").classList.add("active");
  document.getElementById("signupModal").classList.remove("active");
  // Re-translate modal content in case language was changed
  if (typeof translatePage === 'function') {
    translatePage();
  }
};

// Show signup modal
window.showSignupModal = function() {
  document.getElementById("signupModal").classList.add("active");
  document.getElementById("loginModal").classList.remove("active");
  // Re-translate modal content in case language was changed
  if (typeof translatePage === 'function') {
    translatePage();
  }
};

// Close auth modals
window.closeAuthModal = function() {
  document.getElementById("loginModal").classList.remove("active");
  document.getElementById("signupModal").classList.remove("active");
};

// Switch between login and signup
window.switchToSignup = function() {
  showSignupModal();
};

window.switchToLogin = function() {
  showLoginModal();
};

// Handle login
window.handleLogin = async function(event) {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const submitBtn = document.getElementById("loginSubmitBtn");
  const errorDiv = document.getElementById("loginError");

  // Clear previous errors
  errorDiv.classList.remove("show");
  errorDiv.textContent = "";

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in...";

  try {
    await signIn(email, password);
    closeAuthModal();
    // User profile card will be updated by the auth state change callback
  } catch (error) {
    console.error("Login error:", error);
    errorDiv.textContent = error.message || "Failed to sign in. Please check your credentials.";
    errorDiv.classList.add("show");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign In";
  }
};

// Show signup success popup
function showSignupSuccessPopup() {
  // Create popup element
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border: 2px solid #ff6b35;
    border-radius: 20px;
    padding: 40px;
    z-index: 10001;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    text-align: center;
    min-width: 300px;
    opacity: 0;
    transition: all 0.3s ease-out;
  `;

  popup.innerHTML = `
    <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
    <h2 style="color: #fff; font-size: 24px; font-weight: 700; margin-bottom: 10px;">${t('accountCreatedSuccess')}</h2>
    <p style="color: #999; font-size: 14px;">${t('welcomeToFowazzMsg')}</p>
  `;

  document.body.appendChild(popup);

  // Animate in
  setTimeout(() => {
    popup.style.opacity = '1';
    popup.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 10);

  // Remove after 2 seconds
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translate(-50%, -50%) scale(0.9)';
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 1800);
}

// Handle signup
window.handleSignup = async function(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const submitBtn = document.getElementById("signupSubmitBtn");
  const errorDiv = document.getElementById("signupError");
  const successDiv = document.getElementById("signupSuccess");

  // Clear previous messages
  errorDiv.classList.remove("show");
  successDiv.classList.remove("show");
  errorDiv.textContent = "";
  successDiv.textContent = "";

  // Verify hCaptcha
  const captchaResponse = hcaptcha.getResponse();
  if (!captchaResponse) {
    errorDiv.textContent = "Please complete the captcha verification";
    errorDiv.classList.add("show");
    return;
  }

  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = "Creating account...";

  try {
    await signUp(email, password, name);

    // Close auth modal
    closeAuthModal();

    // Show success popup
    showSignupSuccessPopup();

    // Reset form and captcha
    document.getElementById("signupForm").reset();
    hcaptcha.reset();

    // Chain How It Works modal after 2 seconds
    setTimeout(() => {
      openWelcomeModal();
    }, 2000);

    // Update user profile card
    updateUserProfileCard();
  } catch (error) {
    console.error("Signup error:", error);
    errorDiv.textContent = error.message || "Failed to create account. Please try again.";
    errorDiv.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
    hcaptcha.reset();
  }
};

// Handle OAuth login
window.handleOAuthLogin = async function(provider) {
  console.log(`Initiating ${provider} OAuth login...`);

  try {
    await signInWithOAuth(provider);
    // Note: User will be redirected to OAuth provider
    // After successful auth, they'll be redirected back and auto-logged in
  } catch (error) {
    console.error(`${provider} OAuth error:`, error);

    // Show error in whichever modal is open
    const loginError = document.getElementById("loginError");
    const signupError = document.getElementById("signupError");

    const errorMessage = error.message || `Failed to sign in with ${provider}. Please try again.`;

    if (loginError) {
      loginError.textContent = errorMessage;
      loginError.classList.add("show");
    }
    if (signupError) {
      signupError.textContent = errorMessage;
      signupError.classList.add("show");
    }
  }
};

// Handle user logged in
window.handleUserLoggedIn = async function() {
  console.log("User logged in:", currentUser?.email);

  // Load user's projects from database
  await loadUserProjectsFromDatabase();

  // Update UI to show logged-in state
  updateUserProfileCard();

  // Update website counter
  await updateWebsiteCounter();

  // Handle Stripe payment callback (if returning from checkout)
  await handleStripeCallback();
};

// Handle user logged out
window.handleUserLoggedOut = function() {
  console.log("User logged out");

  // Clear local data
  conversationHistory = [{ role: "assistant", content: t('initialGreeting') }];
  attachedFiles = [];
  selectedPlugins = [];
  pluginConfigs = {};
  globalProjects = {};

  // Update UI to show logged-out state
  updateUserProfileCard();

  // Only show signup modal if language has been selected
  // If language not selected, the language picker will show instead
  const language = localStorage.getItem('fowazz_language');
  if (language) {
    // Show signup modal (consistent with initial page load)
    showSignupModal();
  }
};

// Load projects from database
async function loadUserProjectsFromDatabase() {
  try {
    const projects = await getUserProjects();
    console.log("🔄 Loaded projects from database:", projects.length);
    console.log("🔄 Projects:", projects.map(p => ({ id: p.id, title: p.title, messageCount: p.conversation_history?.length || 0 })));

    // Clear existing chats array
    chats = [];

    // Convert database projects to both chats array and globalProjects
    projects.forEach(project => {
      // Convert string ID to number for consistency
      const chatId = parseInt(project.id);

      // Convert to chat format for sidebar
      const chatData = {
        id: chatId,
        title: project.title || 'Untitled Project',
        messages: project.conversation_history || [],
        timestamp: new Date(project.created_at).getTime(),
        phase: project.phase || 1,
        deployment: project.deployment_state || {
          projectId: null,
          domain: project.domain || null,
          uploadKey: null,
          status: null
        },
        deploymentStatus: project.deployment_status || null, // Track if deployed
        previewUrl: project.preview_url || null
      };
      chats.push(chatData);

      // Store HTML files in globalProjects if they exist
      if (project.html_files && Array.isArray(project.html_files) && project.html_files.length > 0) {
        const projectKey = 'project-' + chatId;
        globalProjects[projectKey] = project.html_files;
        console.log('✅ Restored HTML files for project:', projectKey);
        console.log('   Files:', project.html_files.map(f => f.filename));
      }
    });

    // Sort by timestamp (newest first)
    chats.sort((a, b) => b.timestamp - a.timestamp);

    // Also sync to localStorage
    localStorage.setItem('fowazz_chats', JSON.stringify(chats));

    // Update sidebar with animation on first load
    renderChatHistory(true);

    console.log("✅ Successfully loaded", chats.length, "projects");
    console.log("📦 globalProjects keys:", Object.keys(globalProjects));
  } catch (error) {
    console.error("❌ Error loading projects:", error);
    // Fallback to localStorage if database fails
    const localChats = localStorage.getItem('fowazz_chats');
    if (localChats) {
      chats = JSON.parse(localChats);
      renderChatHistory(true); // Animate on first load
      console.log("🔄 Loaded from localStorage fallback");
    }
  }
}

// Check if user is logged in on page load
window.checkAuthOnLoad = async function() {
  console.log('🔐 Checking auth on load...');
  await initAuth();

  // Initialize user profile card
  updateUserProfileCard();

  if (!currentUser) {
    console.log('❌ No user found');
    // Only show signup modal if language has been selected
    // If no language selected, the language picker will show instead
    const language = localStorage.getItem('fowazz_language');
    if (language) {
      console.log('✅ Language already selected, showing signup modal');
      // Not logged in - show signup modal after a brief delay to ensure DOM is ready
      setTimeout(() => {
        console.log('📝 Attempting to show signup modal...');
        const signupModal = document.getElementById('signupModal');
        if (signupModal) {
          console.log('✅ Signup modal found, displaying now');
          showSignupModal();
        } else {
          console.error('❌ Signup modal element not found!');
        }

        // Hide loading screen - all initialization complete
        if (window.hideLoadingScreen) {
          hideLoadingScreen();
        }
      }, 500);
    } else {
      console.log('⏳ No language selected yet - language picker will show');
      // Hide loading screen since language picker is showing
      if (window.hideLoadingScreen) {
        hideLoadingScreen();
      }
    }
  } else {
    console.log('✅ User logged in:', currentUser.email);
    // Logged in - load their projects
    await loadUserProjectsFromDatabase();

    // Hide loading screen - all initialization complete
    if (window.hideLoadingScreen) {
      hideLoadingScreen();
    }
  }
};

// ============= MOBILE SIDEBAR TOGGLE =============

const sidebar = document.getElementById('sidebar');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Toggle sidebar on mobile
function toggleSidebar() {
  sidebar.classList.toggle('active');
  sidebarOverlay.classList.toggle('active');

  // Prevent body scroll when sidebar is open on mobile
  if (sidebar.classList.contains('active')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// Close sidebar when clicking overlay
function closeSidebar() {
  sidebar.classList.remove('active');
  sidebarOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Add touch improvements for mobile
document.addEventListener('DOMContentLoaded', function() {
  // Close sidebar by default on mobile
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Prevent pull-to-refresh on mobile
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });

  // Disable zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Improve touch scrolling performance
  const scrollContainers = document.querySelectorAll('#messagesContainer, .sidebar');
  scrollContainers.forEach(container => {
    container.style.webkitOverflowScrolling = 'touch';
  });

  // Add ripple effect to buttons on touch
  const buttons = document.querySelectorAll('button, .sidebar-item, .artifact-btn');
  buttons.forEach(button => {
    button.addEventListener('touchstart', function(e) {
      this.style.transform = 'scale(0.98)';
    }, { passive: true });

    button.addEventListener('touchend', function(e) {
      this.style.transform = '';
    }, { passive: true });
  });
});

// Event listeners
if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', toggleSidebar);
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener('click', closeSidebar);
}

// Close sidebar when selecting a chat on mobile
const originalLoadChat = loadChat;
window.loadChat = function(chatId) {
  originalLoadChat(chatId);

  // Close sidebar on mobile after selecting a chat
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
};

// Close sidebar when starting new chat on mobile
const originalNewChatClick = newChatBtn.onclick;
newChatBtn.addEventListener('click', () => {
  if (window.innerWidth <= 768) {
    closeSidebar();
  }
});

// ============= USER PROFILE CARD =============

// Update user profile card with user info
function updateUserProfileCard() {
  const userAvatar = document.getElementById('userProfileAvatar');
  const userName = document.getElementById('userProfileName');
  const userEmail = document.getElementById('userProfileEmail');

  if (!userAvatar || !userName || !userEmail) return;

  if (currentUser) {
    // Get user's name from metadata or profile
    const fullName = currentUser.user_metadata?.full_name ||
                     userProfile?.full_name ||
                     currentUser.email?.split('@')[0] ||
                     'User';

    // Get user's email
    const email = currentUser.email || 'No email';

    // Update name and email
    userName.textContent = fullName;
    userEmail.textContent = email;

    // Get first letter of name
    const firstLetter = fullName.charAt(0).toUpperCase();

    // Generate random dark professional color
    const darkColors = [
      ['#4a5568', '#2d3748'], // Gray
      ['#5a67d8', '#4c51bf'], // Indigo
      ['#ed8936', '#dd6b20'], // Orange
      ['#48bb78', '#38a169'], // Green
      ['#4299e1', '#3182ce'], // Blue
      ['#9f7aea', '#805ad5'], // Purple
      ['#f56565', '#e53e3e'], // Red
      ['#38b2ac', '#319795'], // Teal
      ['#667eea', '#5a67d8'], // Blue-purple
      ['#764ba2', '#553c9a'], // Purple-dark
      ['#d53f8c', '#b83280'], // Pink
      ['#2c5282', '#2a4365'], // Dark blue
      ['#744210', '#5c3b12'], // Dark orange
      ['#276749', '#22543d'], // Dark green
      ['#2f855a', '#276749'], // Green-dark
    ];

    // Generate consistent color based on user email
    let colorIndex = 0;
    if (currentUser.email) {
      // Simple hash function to get consistent color for user
      let hash = 0;
      for (let i = 0; i < currentUser.email.length; i++) {
        hash = currentUser.email.charCodeAt(i) + ((hash << 5) - hash);
      }
      colorIndex = Math.abs(hash) % darkColors.length;
    }

    const [color1, color2] = darkColors[colorIndex];

    // Update avatar with first letter and color
    userAvatar.textContent = firstLetter;
    userAvatar.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
  } else {
    // Not logged in - show default state
    userName.textContent = 'Guest User';
    userEmail.textContent = 'Not signed in';
    userAvatar.textContent = 'U';
    userAvatar.style.background = 'linear-gradient(135deg, #4a5568, #2d3748)';
  }
}

// Toggle user menu dropdown
window.toggleUserMenu = function() {
  const dropdown = document.getElementById('userMenuDropdown');
  if (!dropdown) return;

  dropdown.classList.toggle('hidden');

  // Update dropdown with current user info
  const dropdownUserName = document.getElementById('dropdownUserName');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');

  if (currentUser && dropdownUserName && dropdownUserEmail) {
    const fullName = currentUser.user_metadata?.full_name ||
                     userProfile?.full_name ||
                     currentUser.email?.split('@')[0] ||
                     'User';
    dropdownUserName.textContent = fullName;
    dropdownUserEmail.textContent = currentUser.email || 'No email';
  }
};

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
  const userCard = document.getElementById('userProfileCard');
  const dropdown = document.getElementById('userMenuDropdown');

  if (!userCard || !dropdown) return;

  // Check if click is outside user card and dropdown
  if (!userCard.contains(event.target) && !dropdown.contains(event.target)) {
    dropdown.classList.add('hidden');
  }
});

// Handle sign out
window.handleSignOut = async function() {
  try {
    await signOut();
    // The auth state change will handle the rest
  } catch (error) {
    console.error('Sign out error:', error);
    alert('Failed to sign out. Please try again.');
  }
};

// Show user menu (legacy - replaced by toggleUserMenu)
window.showUserMenu = function() {
  toggleUserMenu();
};

// ============= SIDEBAR TOGGLE FUNCTIONALITY =============

let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

// Initialize sidebar state (called from window.load event)
function initSidebarToggle() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const expandBtn = document.getElementById('sidebarExpandBtn');
  const userProfileFixed = document.getElementById('userProfileFixed');

  if (!sidebar || !mainContent || !toggleBtn) {
    console.error('❌ Sidebar elements not found!', {sidebar, mainContent, toggleBtn});
    return;
  }

  console.log('✅ Initializing sidebar toggle...');

  // Apply saved state
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    if (userProfileFixed) {
      userProfileFixed.classList.add('hidden');
    }
  }

  // Add click handler for toggle button
  toggleBtn.addEventListener('click', function() {
    console.log('🔘 Sidebar toggle button clicked');
    toggleSidebar();
  });

  // Add click handler for expand button
  if (expandBtn) {
    expandBtn.addEventListener('click', function() {
      console.log('🔘 Sidebar expand button clicked');
      toggleSidebar();
    });
  }

  console.log('✅ Sidebar toggle initialized successfully');
}

// Toggle sidebar function with smooth animations
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtn = document.getElementById('sidebarToggleBtn');
  const userProfileFixed = document.getElementById('userProfileFixed');

  if (!sidebar || !mainContent || !toggleBtn) {
    console.error('❌ Cannot toggle - elements not found');
    return;
  }

  sidebarCollapsed = !sidebarCollapsed;
  console.log('🔄 Toggling sidebar. Collapsed:', sidebarCollapsed);

  if (sidebarCollapsed) {
    // Collapsing - slide out smoothly
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    if (userProfileFixed) {
      userProfileFixed.classList.add('hidden');
    }
    localStorage.setItem('sidebarCollapsed', 'true');
  } else {
    // Expanding - slide in smoothly
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('expanded');
    if (userProfileFixed) {
      userProfileFixed.classList.remove('hidden');
    }
    localStorage.setItem('sidebarCollapsed', 'false');
  }
}

// Make toggleSidebar globally accessible
window.toggleSidebar = toggleSidebar;

// ============= PAYWALL & STRIPE INTEGRATION =============

// Stripe configuration
// TEST MODE - Switch back to pk_live_... for production
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SP19PRwqmVW0cG8JIeg1wq0poZL9dzmMJoXTc6Npwo5CKRvHQXTq88YPzzR16gIsz0tjvphsl2qOFUi4vP4oOYN00Txidl2om';

// Initialize Stripe only when needed (lazy loading)
let stripe = null;
function getStripe() {
  if (!stripe && typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripe;
}

// Get plan limits by plan name
function getPlanLimits(planName) {
  const plan = PLAN_LIMITS[planName] || PLAN_LIMITS.pro; // Default to pro if unknown
  return plan.maxWebsites;
}

// Initialize website counter
async function updateWebsiteCounter() {
  if (!currentUser) {
    document.getElementById('websiteCounter').style.display = 'none';
    return;
  }

  const hasSubscription = await hasActiveSubscription();
  if (!hasSubscription) {
    document.getElementById('websiteCounter').style.display = 'none';
    return;
  }

  // Fetch actual subscription data including plan_name
  const { data, error } = await supabase
    .from('subscriptions')
    .select('max_websites, websites_used, plan_name')
    .eq('user_id', currentUser.id)
    .single();

  if (error || !data) {
    console.error('Error fetching subscription for counter:', error);
    document.getElementById('websiteCounter').style.display = 'none';
    return;
  }

  const planName = data.plan_name || 'pro';
  const expectedMaxWebsites = getPlanLimits(planName);
  let maxWebsites = data.max_websites;
  const websitesUsed = data.websites_used || 0;

  // Validate and fix max_websites if it doesn't match the plan
  if (maxWebsites !== expectedMaxWebsites) {
    console.warn(`⚠️ Plan mismatch detected! Plan: ${planName}, Expected: ${expectedMaxWebsites}, Found: ${maxWebsites}`);
    console.log('🔧 Fixing subscription limits...');

    // Update the subscription with correct limits
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ max_websites: expectedMaxWebsites })
      .eq('user_id', currentUser.id);

    if (updateError) {
      console.error('Error fixing subscription limits:', updateError);
    } else {
      console.log('✅ Subscription limits fixed!');
      maxWebsites = expectedMaxWebsites;
    }
  }

  const counterText = document.getElementById('websiteCounterText');
  const oldText = counterText.textContent;
  const newText = `${websitesUsed}/${maxWebsites} website${maxWebsites === 1 ? '' : 's'}`;

  // Only animate if the count actually changed
  if (oldText !== newText) {
    console.log(`🔢 Counter updated: ${oldText} → ${newText}`);

    // Add NOTICEABLE pulse animation
    const counter = document.getElementById('websiteCounter');

    // First pulse (big)
    counter.style.transform = 'scale(1.2)';
    counter.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    setTimeout(() => {
      // Second pulse (medium)
      counter.style.transform = 'scale(1.1)';
    }, 200);

    setTimeout(() => {
      // Return to normal
      counter.style.transform = 'scale(1)';
      counter.style.transition = 'transform 0.3s ease';
    }, 400);

    console.log('✨ Counter animation triggered!');
  } else {
    console.log(`Counter unchanged: ${newText}`);
  }

  counterText.textContent = newText;
  document.getElementById('websiteCounter').style.display = 'flex';
}


// ============= TEST MODE (for development/testing) =============
// Enable test mode: Run in console: enableTestMode()
// Disable test mode: Run in console: disableTestMode()

window.enableTestMode = function() {
  localStorage.setItem('fowazz_test_mode', 'true');
  console.log('🧪 TEST MODE ENABLED - Subscription checks bypassed');
  console.log('💡 You can now deploy without paying');
  console.log('⚠️  To disable: run disableTestMode()');
};

window.disableTestMode = function() {
  localStorage.removeItem('fowazz_test_mode');
  console.log('✅ TEST MODE DISABLED - Normal subscription checks restored');
};

// Check if test mode is active on load
if (localStorage.getItem('fowazz_test_mode') === 'true') {
  console.log('🧪 TEST MODE ACTIVE - Run disableTestMode() to turn off');
}

// Debug function to check and fix subscription data
window.debugSubscription = async function() {
  if (!currentUser) {
    console.log('❌ No user logged in');
    return;
  }

  console.log('🔍 Checking subscription data...');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();

  if (error || !data) {
    console.log('❌ No subscription found');
    return;
  }

  console.log('📊 Current subscription data:', data);

  const planName = data.plan_name || 'pro';
  const expectedMaxWebsites = getPlanLimits(planName);
  const actualMaxWebsites = data.max_websites;

  console.log(`📋 Plan: ${planName}`);
  console.log(`✅ Expected max_websites: ${expectedMaxWebsites}`);
  console.log(`${actualMaxWebsites === expectedMaxWebsites ? '✅' : '❌'} Actual max_websites: ${actualMaxWebsites}`);
  console.log(`📈 Websites used: ${data.websites_used}/${actualMaxWebsites}`);
  console.log(`🔄 Status: ${data.status}`);

  if (actualMaxWebsites !== expectedMaxWebsites) {
    console.log('');
    console.log('⚠️ MISMATCH DETECTED! Fixing...');

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ max_websites: expectedMaxWebsites })
      .eq('user_id', currentUser.id);

    if (updateError) {
      console.log('❌ Error fixing subscription:', updateError);
    } else {
      console.log('✅ Subscription fixed! Refreshing counter...');
      await updateWebsiteCounter();
      console.log('✅ Done!');
    }
  } else {
    console.log('');
    console.log('✅ All good! No fixes needed.');
  }
};

console.log('💡 Debug commands available:');
console.log('  - debugSubscription() - Check and fix subscription data');
console.log('  - enableTestMode() - Bypass subscription checks');
console.log('  - disableTestMode() - Restore normal subscription checks');

// Proceed to Phase 3 (limits already checked in sendMessage)
async function proceedToPhase3() {
  // Check for test mode (for development/testing)
  const testMode = localStorage.getItem('fowazz_test_mode') === 'true';

  if (testMode) {
    console.log('🧪 TEST MODE: Bypassing subscription check');
  }

  // Limits are checked upfront in sendMessage(), so if user got here they have capacity
  transitionToPhase(3);
}

// Show paywall screen
function showPaywall() {
  // Transition to paywall "phase"
  const currentScreen = document.getElementById(`phase${currentPhase}`);
  const paywallScreen = document.getElementById('phasePaywall');

  if (currentScreen) {
    currentScreen.classList.remove('active');
    currentScreen.classList.add('exiting');
    setTimeout(() => {
      currentScreen.classList.remove('exiting');
    }, 300);
  }

  setTimeout(() => {
    paywallScreen.classList.add('active');
    // Don't auto-initialize checkout - user needs to select a plan first
    // initializeStripeCheckout();
  }, 300);
}

// Initialize Stripe embedded checkout
async function initializeStripeCheckout(priceId, maxWebsites, planType) {
  const checkoutContainer = document.getElementById('stripeCheckoutContainer');
  const loadingDiv = document.getElementById('checkoutLoading');
  const errorDiv = document.getElementById('checkoutError');

  try {
    // Create checkout session on backend
    const response = await fetch('https://fayez-api-production.up.railway.app/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        userEmail: currentUser.email,
        priceId: priceId,
        maxWebsites: maxWebsites,
        planType: planType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { clientSecret } = await response.json();

    // Initialize Stripe embedded checkout
    const checkout = await getStripe().initEmbeddedCheckout({
      clientSecret: clientSecret
    });

    // Hide loading, show checkout
    loadingDiv.style.display = 'none';
    checkout.mount('#stripeCheckoutContainer');

    // Monitor for completion (for embedded checkout, check session status periodically)
    checkSessionStatus(clientSecret);

  } catch (error) {
    console.error('Stripe checkout error:', error);
    loadingDiv.style.display = 'none';
    errorDiv.classList.remove('hidden');
    errorDiv.querySelector('p').textContent = `Error: ${error.message}. Please refresh and try again.`;
  }
}

// Check session status periodically (for subscriptions)
async function checkSessionStatus(clientSecret) {
  const maxAttempts = 40; // Check for up to 2 minutes
  let attempts = 0;

  console.log('⏳ Monitoring payment completion...');

  const checkInterval = setInterval(async () => {
    attempts++;

    try {
      // Check if subscription was created in database (webhook updates this)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, created_at')
        .eq('user_id', currentUser.id)
        .single();

      if (!error && data && data.status === 'active') {
        // Check if subscription was just created (within last 5 minutes)
        const createdAt = new Date(data.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / 1000 / 60;

        if (diffMinutes < 5) {
          clearInterval(checkInterval);
          console.log('✅ Subscription activated!');
          await handlePaymentSuccess();
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.log('⏱️ Payment check timeout - if you completed payment, please refresh the page');
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }
  }, 3000); // Check every 3 seconds
}

// Handle successful payment
async function handlePaymentSuccess() {
  console.log('✅ Payment successful!');

  // Update website counter
  await updateWebsiteCounter();

  // Check if payment modal is open
  const paymentModal = document.getElementById('paymentModal');
  const isModalOpen = paymentModal && paymentModal.classList.contains('active');

  if (isModalOpen) {
    // Show success screen in modal (user is still in checkout flow)
    showSuccessScreen();
  } else {
    // User returned via redirect - go directly to Phase 3
    console.log('🎉 Subscription activated! Proceeding to deployment...');

    // Restore deployment state from localStorage
    const savedDeployment = localStorage.getItem('fowazz_pending_deployment');
    if (savedDeployment) {
      try {
        const deploymentData = JSON.parse(savedDeployment);
        if (deploymentData.projectId && deploymentData.domain) {
          currentDeployment.projectId = deploymentData.projectId;
          currentDeployment.domain = deploymentData.domain;
          console.log('✅ Restored deployment state:', currentDeployment);
          localStorage.removeItem('fowazz_pending_deployment');

          // Small delay to ensure DOM is ready
          setTimeout(() => {
            transitionToPhase(3);
          }, 500);
        } else {
          console.warn('⚠️ Saved deployment state is incomplete');
          // Go back to Phase 1 if deployment state is invalid
          alert('Your subscription is now active! Please create a website to get started.');
          setTimeout(() => {
            transitionToPhase(1);
          }, 500);
        }
      } catch (error) {
        console.error('❌ Error parsing saved deployment:', error);
        alert('Your subscription is now active! Please create a website to get started.');
        setTimeout(() => {
          transitionToPhase(1);
        }, 500);
      }
    } else {
      console.warn('⚠️ No saved deployment state found');
      // Check if currentDeployment already has valid data
      if (currentDeployment.projectId && currentDeployment.domain) {
        console.log('✅ Using existing currentDeployment state');
        setTimeout(() => {
          transitionToPhase(3);
        }, 500);
      } else {
        // No deployment state at all - go to Phase 1
        alert('Your subscription is now active! Please create a website to get started.');
        setTimeout(() => {
          transitionToPhase(1);
        }, 500);
      }
    }
  }
}

// Get websites remaining for current user
async function getWebsitesRemaining() {
  if (!currentUser) return 0;

  try {
    const { data, error } = await supabase.rpc('get_websites_remaining', {
      user_uuid: currentUser.id
    });

    if (error) {
      console.error('Error getting websites remaining:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('Error calling get_websites_remaining:', err);
    return 0;
  }
}

// New function for Deploy Now button in Phase 3
async function beginActualDeployment() {
  // First, check if we have a project to deploy
  const project = globalProjects[currentDeployment.projectId];
  if (!project || project.length === 0) {
    alert('No website files found to deploy! Please create a website first.');
    transitionToPhase(1);
    return;
  }

  // Check for test mode (for development/testing)
  const testMode = localStorage.getItem('fowazz_test_mode') === 'true';

  if (!testMode) {
    // Check if user has an active subscription
    const hasSubscription = await hasActiveSubscription();

    if (!hasSubscription) {
      // User has NO subscription → show full price plans
      showFullPricePlanModal();
      return;
    }

    // User HAS subscription → check if they've reached their limit
    const remaining = await getWebsitesRemaining();

    if (remaining <= 0) {
      // Get subscription info for upgrade modal
      const { data } = await supabase
        .from('subscriptions')
        .select('max_websites, plan_name, websites_used')
        .eq('user_id', currentUser.id)
        .single();

      const maxWebsites = data?.max_websites || 3;
      const planName = data?.plan_name || 'pro';
      const websitesUsed = data?.websites_used || maxWebsites;

      // Show upgrade modal with DISCOUNTED pricing (for existing subscribers)
      showUpgradeModal(planName, websitesUsed, maxWebsites);
      return;
    }

    // Don't increment yet - will increment AFTER successful deployment
    console.log('✅ User has space, proceeding with deployment...');
  } else {
    console.log('🧪 TEST MODE: Bypassing website limit check');
  }

  // Hide Deploy Now button, show deployment steps
  const deployBtn = document.getElementById('deployNowBtn');
  const deploymentSteps = document.getElementById('deploymentStepsMain');

  deployBtn.style.display = 'none';
  deploymentSteps.style.display = 'block';

  // Change header text
  const header = document.querySelector('#phase3 h2');
  header.textContent = 'Deploying Your Website';

  // Start deployment process
  setTimeout(() => {
    executeDeploymentInPhase3();
  }, 500);
}

// ============= MODAL PAYMENT SYSTEM =============

let selectedPlan = null;
let selectedPriceId = null;
let selectedMaxWebsites = null;

// Select plan and open modal
async function selectPlan(planType, priceId, maxWebsites) {
  selectedPlan = planType;
  selectedPriceId = priceId;
  selectedMaxWebsites = maxWebsites;

  // Save deployment state before payment (in case of redirect)
  localStorage.setItem('fowazz_pending_deployment', JSON.stringify({
    projectId: currentDeployment.projectId,
    domain: currentDeployment.domain
  }));

  // Open modal
  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');

  // Show checkout screen, hide success screen
  document.getElementById('checkoutScreen').style.display = 'block';
  document.getElementById('successScreen').classList.add('hidden');

  // Initialize Stripe checkout in modal
  await initializeStripeCheckout(priceId, maxWebsites, planType);
}

// Close payment modal
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('active');
}

// Show success screen
function showSuccessScreen() {
  document.getElementById('checkoutScreen').style.display = 'none';
  document.getElementById('successScreen').classList.remove('hidden');

  const badge = document.getElementById('successPlanBadge');
  if (selectedPlan === 'pro') {
    badge.textContent = 'PRO';
    badge.className = 'plan-badge';
  } else {
    badge.textContent = 'MAX';
    badge.className = 'plan-badge max';
  }
}

// Proceed after successful payment
function proceedAfterPayment() {
  closePaymentModal();

  // Restore deployment state from localStorage if it exists
  const savedDeployment = localStorage.getItem('fowazz_pending_deployment');
  if (savedDeployment) {
    try {
      const deploymentData = JSON.parse(savedDeployment);
      if (deploymentData.projectId && deploymentData.domain) {
        currentDeployment.projectId = deploymentData.projectId;
        currentDeployment.domain = deploymentData.domain;
        console.log('✅ Restored deployment state from modal flow:', currentDeployment);
        localStorage.removeItem('fowazz_pending_deployment');
      }
    } catch (error) {
      console.error('❌ Error restoring deployment state:', error);
    }
  }

  // Refresh website counter
  updateWebsiteCounter();
  // Go to Phase 3
  transitionToPhase(3);
}

// ===== SETTINGS & BILLING MODAL =====

async function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('active');

  // Close user dropdown
  const dropdown = document.getElementById('userMenuDropdown');
  if (dropdown) dropdown.classList.add('hidden');

  // Load subscription data
  await loadUserSubscription();
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('active');
}

async function loadUserSubscription() {
  if (!currentUser) {
    document.getElementById('currentPlanName').textContent = t('notSignedIn');
    document.getElementById('currentPlanDetails').textContent = t('pleaseSignInToView');
    document.getElementById('settingsEmail').textContent = t('na');
    document.getElementById('settingsUserId').textContent = t('na');
    return;
  }

  // Set user info (no translation needed for actual email/ID)
  document.getElementById('settingsEmail').textContent = currentUser.email;
  document.getElementById('settingsUserId').textContent = currentUser.id.substring(0, 12) + '...';

  try {
    // Fetch subscription from Supabase
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error || !data) {
      // No subscription - Free Plan
      document.getElementById('currentPlanName').textContent = t('freePlan');
      document.getElementById('currentPlanDetails').innerHTML = `
        <div>${t('noActiveSubscription')}</div>
        <div class="text-xs text-gray-500 mt-2">${t('upgradeToCreate')}</div>
      `;
      document.getElementById('upgradeSection').style.display = 'block';
      return;
    }

    // Has subscription
    const planName = data.plan_name || 'pro';
    const expectedMaxWebsites = getPlanLimits(planName);
    let maxWebsites = data.max_websites;
    const websitesUsed = data.websites_used || 0;
    const status = data.status || 'unknown';

    // Validate and fix max_websites if needed
    if (maxWebsites !== expectedMaxWebsites) {
      console.warn(`⚠️ Settings: Plan mismatch! Plan: ${planName}, Expected: ${expectedMaxWebsites}, Found: ${maxWebsites}`);
      maxWebsites = expectedMaxWebsites;

      // Also update in database
      await supabase
        .from('subscriptions')
        .update({ max_websites: expectedMaxWebsites })
        .eq('user_id', currentUser.id);

      console.log('✅ Subscription limits fixed in settings');
    }

    // Display plan info
    if (planName === 'test') {
      document.getElementById('currentPlanName').innerHTML = `<span class="plan-badge" style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);">TEST</span> ${t('testPlan')}`;
      document.getElementById('currentPlanDetails').innerHTML = `
        <div>£0.30${t('perMonthShort')} • ${maxWebsites} ${t('website')}</div>
        <div class="text-xs text-gray-400 mt-1">${t('websitesUsedLabel')} ${websitesUsed}/${maxWebsites}</div>
        <div class="text-xs ${status === 'active' ? 'text-green-400' : 'text-yellow-400'} mt-1">${t('statusLabel')} ${status === 'active' ? t('active') : status}</div>
        <div class="text-xs text-blue-400 mt-1">For testing purposes</div>
      `;
      document.getElementById('upgradeSection').style.display = 'block';
    } else if (planName === 'lite') {
      document.getElementById('currentPlanName').innerHTML = `<span class="plan-badge" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">LITE</span> ${t('litePlan')}`;
      document.getElementById('currentPlanDetails').innerHTML = `
        <div>$5.00${t('perMonthShort')} • ${maxWebsites} ${t('website')}</div>
        <div class="text-xs text-gray-400 mt-1">${t('websitesUsedLabel')} ${websitesUsed}/${maxWebsites}</div>
        <div class="text-xs ${status === 'active' ? 'text-green-400' : 'text-yellow-400'} mt-1">${t('statusLabel')} ${status === 'active' ? t('active') : status}</div>
      `;
      document.getElementById('upgradeSection').style.display = 'block'; // Can upgrade to Pro or Max
    } else if (planName === 'pro') {
      document.getElementById('currentPlanName').innerHTML = `<span class="plan-badge">PRO</span> ${t('proPlan')}`;
      document.getElementById('currentPlanDetails').innerHTML = `
        <div>$9.99${t('perMonthShort')} • ${maxWebsites} ${t('websites')}</div>
        <div class="text-xs text-gray-400 mt-1">${t('websitesUsedLabel')} ${websitesUsed}/${maxWebsites}</div>
        <div class="text-xs ${status === 'active' ? 'text-green-400' : 'text-yellow-400'} mt-1">${t('statusLabel')} ${status === 'active' ? t('active') : status}</div>
      `;
      document.getElementById('upgradeSection').style.display = 'block'; // Can upgrade to Max
    } else if (planName === 'max') {
      document.getElementById('currentPlanName').innerHTML = `<span class="plan-badge max">MAX</span> ${t('maxPlan')}`;
      document.getElementById('currentPlanDetails').innerHTML = `
        <div>$24.45${t('perMonthShort')} • ${maxWebsites} ${t('websites')}</div>
        <div class="text-xs text-gray-400 mt-1">${t('websitesUsedLabel')} ${websitesUsed}/${maxWebsites}</div>
        <div class="text-xs ${status === 'active' ? 'text-green-400' : 'text-yellow-400'} mt-1">${t('statusLabel')} ${status === 'active' ? t('active') : status}</div>
        <div class="text-xs text-amber-400 mt-1">${t('prioritySupport')}</div>
      `;
      document.getElementById('upgradeSection').style.display = 'none'; // Already on max plan
    }
  } catch (err) {
    console.error('Error loading subscription:', err);
    document.getElementById('currentPlanName').textContent = t('errorText');
    document.getElementById('currentPlanDetails').textContent = t('couldNotLoadSubscription');
  }
}

function openUpgradeOptions() {
  closeSettingsModal();
  // Open paywall with Max plan highlighted
  document.getElementById('paywallOverlay').style.display = 'flex';
}

// ===== WELCOME MODAL (How it Works) =====
// openWelcomeModal and closeWelcomeModal are defined earlier in the file

// ===== DOMAIN VERIFICATION CHECKER =====

let domainCheckInterval = null;
let domainCheckAttempts = 0;
const MAX_DOMAIN_CHECK_ATTEMPTS = 480; // 480 attempts * 30 seconds = 4 hours

async function startDomainVerification(customDomain, previewUrl) {
  console.log('Starting domain verification for:', customDomain);

  // Transition to Phase 4
  transitionToPhase(4);

  // Show Domain Configuration UI in Phase 4
  setTimeout(() => {
    showDomainConfigurationPhase(customDomain, previewUrl);
  }, 500);

  // Start checking every 30 seconds
  domainCheckAttempts = 0;
  domainCheckInterval = setInterval(() => {
    checkDomainStatus(customDomain, previewUrl);
  }, 30000); // 30 seconds

  // Do first check immediately after a short delay
  setTimeout(() => {
    checkDomainStatus(customDomain, previewUrl);
  }, 1000);
}

async function checkDomainStatus(customDomain, previewUrl) {
  domainCheckAttempts++;

  console.log(`Domain check attempt ${domainCheckAttempts}/${MAX_DOMAIN_CHECK_ATTEMPTS}`);

  // Update countdown
  updateDomainCheckCountdown();

  try {
    // Try to fetch the domain
    const response = await fetch(`https://${customDomain}`, {
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    });

    // If we get here, domain is likely working
    // Note: With no-cors, we can't check response status, so we assume success if no error
    onDomainReady(customDomain, previewUrl);
  } catch (error) {
    console.log('Domain not ready yet:', error.message);

    // Stop checking after max attempts (4 hours)
    if (domainCheckAttempts >= MAX_DOMAIN_CHECK_ATTEMPTS) {
      clearInterval(domainCheckInterval);
      onDomainCheckTimeout(customDomain, previewUrl);
    }
  }
}

function onDomainReady(customDomain, previewUrl) {
  console.log('✅ Domain is ready!', customDomain);

  // Stop checking
  if (domainCheckInterval) {
    clearInterval(domainCheckInterval);
    domainCheckInterval = null;
  }

  // Update Phase 4 UI to show success (we're already in Phase 4)
  const phase4Container = document.getElementById('phase4Container');
  if (phase4Container) {
    phase4Container.innerHTML = `
        <div class="text-center phase-fade-in">
          <div class="text-6xl mb-6">🎉</div>
          <h2 class="text-4xl font-bold text-white mb-4">Your Website is Live!</h2>
          <p class="text-gray-400 text-lg mb-8">Your custom domain <strong class="text-white">${customDomain}</strong> is now active and ready to use.</p>

          <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-center gap-3 mb-4">
              <div class="success-checkmark" style="width: 48px; height: 48px;">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <p class="text-sm text-gray-300 mb-4">Your website is successfully deployed and accessible worldwide!</p>
            <a href="https://${customDomain}" target="_blank" class="inline-block bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-green-700 hover:to-green-600 transition-all">
              Visit ${customDomain} →
            </a>
          </div>

          <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-white mb-3">Your Preview Link:</h3>
            <p class="text-sm text-gray-300 mb-3">Your site is also available at the preview URL:</p>
            <a href="${previewUrl}" target="_blank" class="text-blue-400 hover:underline break-all">
              ${previewUrl}
            </a>
          </div>

          <div class="mt-8">
            <button onclick="transitionToPhase(1)" class="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
              Create Another Website
            </button>
          </div>
        </div>
      `;
  }
}

function onDomainCheckTimeout(customDomain, previewUrl) {
  console.log('⏰ Domain check timeout reached');

  const statusDiv = document.getElementById('domainConfigStatus');
  if (statusDiv) {
    statusDiv.innerHTML = `
      <div class="text-center">
        <div class="text-6xl mb-4">⏰</div>
        <h3 class="text-xl font-bold text-white mb-2">Domain Configuration Taking Longer</h3>
        <p class="text-gray-400 mb-4">Your domain is still being configured. This can sometimes take longer than expected.</p>
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
          <p class="text-sm text-gray-300">
            <strong>Your preview link still works:</strong><br>
            <a href="${previewUrl}" target="_blank" class="text-blue-400 hover:underline">${previewUrl}</a>
          </p>
        </div>
        <button onclick="manualDomainCheck('${customDomain}', '${previewUrl}')" class="bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg">
          Check Again
        </button>
      </div>
    `;
  }
}

function manualDomainCheck(customDomain, previewUrl) {
  domainCheckAttempts = 0; // Reset attempts
  checkDomainStatus(customDomain, previewUrl);
}

function updateDomainCheckCountdown() {
  const countdownDiv = document.getElementById('domainCheckCountdown');
  if (countdownDiv) {
    const nextCheck = 30; // seconds
    countdownDiv.textContent = `Checking again in ${nextCheck} seconds...`;
  }
}

function showDomainConfigurationPhase(customDomain, previewUrl) {
  // This function creates the Phase 4 UI
  const phase4Container = document.getElementById('phase4Container');
  if (!phase4Container) return;

  phase4Container.innerHTML = `
    <div class="w-full max-w-3xl mx-auto" style="margin-top: 30px;">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">🔄</div>
        <h2 class="text-3xl font-bold text-white mb-2">Configuring Your Domain</h2>
        <p class="text-gray-400 mb-6">This usually takes 2-4 hours. We're automatically checking if it's ready.</p>
      </div>

      <div class="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
        <h3 class="text-lg font-semibold text-white mb-3">✅ Preview Link Ready Now!</h3>
        <p class="text-gray-300 text-sm mb-3">Your website is already live and accessible at:</p>
        <a href="${previewUrl}" target="_blank" class="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 transition-all">
          ${previewUrl}
        </a>
        <p class="text-xs text-gray-400 mt-3">Share this link with anyone - it works immediately!</p>
      </div>

      <div id="domainConfigStatus" class="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
        <div class="flex items-center gap-4">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <div class="flex-1">
            <h4 class="text-white font-semibold mb-1">Configuring custom domain...</h4>
            <p class="text-sm text-gray-400">Domain: <span class="text-white">${customDomain}</span></p>
            <p class="text-xs text-gray-500 mt-2" id="domainCheckCountdown">Checking status...</p>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-xs text-gray-500">Fowazz is automatically checking your domain every 30 seconds.</p>
      </div>
    </div>
  `;
}

// Make functions globally accessible
window.selectPlan = selectPlan;
window.closePaymentModal = closePaymentModal;
window.proceedAfterPayment = proceedAfterPayment;
window.beginActualDeployment = beginActualDeployment;
window.proceedToPhase3 = proceedToPhase3;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.openUpgradeOptions = openUpgradeOptions;
// openWelcomeModal and closeWelcomeModal are already assigned earlier
window.startDomainVerification = startDomainVerification;
window.manualDomainCheck = manualDomainCheck;