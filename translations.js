// Fowazz Translations - English & Arabic (Saudi dialect)

const TRANSLATIONS = {
  en: {
    // Language picker
    selectLanguage: "Select Your Language",
    continue: "Continue",

    // Main UI
    newChat: "New Project",
    settings: "Settings",
    logout: "Logout",
    signOut: "Sign out",
    login: "Login / Sign Up",
    guestUser: "Guest User",
    notSignedIn: "Not signed in",
    howItWorks: "How it Works",
    online: "Online",

    // Chat
    initialGreeting: "hey, so what're we building?",
    justTalkNormal: "Just talk normal.",
    tellMeWhatYouNeed: "Tell me what you need — business type, vibe, colors, whatever.",
    typeMessage: "Describe your business or website idea...",
    pressEnterToSend: "Press Enter to send",
    surpriseMe: "Surprise Me",
    attachFiles: "Attach Files",
    features: "Features",
    selectedFeatures: "selected",
    recentProjects: "Recent Projects",
    tipsFeaturesBefore: "🔌 Use the",
    tipsFeaturesIcon: "puzzle icon",
    tipsFeaturesAfter: "below to add payments, orders, forms, webhooks",
    tipsDragDrop: "📎 Drag & drop images, PDFs, menus — I'll use them",
    pleaseSignIn: "Please sign in to chat with Fowazz!",
    justNow: "Just now",

    // Phases
    phase1: "Create",
    phase2: "Domain",
    phase3: "Deploy",
    phase4: "Live",
    backToChat: "Back to Chat",
    backToDomain: "Back to Domain",
    youreAllSet: "You're All Set!",
    readyToDeploy: "Your website is ready to deploy. Click below to launch it live!",
    deployNow: "Deploy Now",

    // Phase 2 - Domain
    chooseYourDomain: "Choose Your Domain",
    findPerfectAddress: "Let's find the perfect address for your website",
    domainPlaceholder: "e.g., mybusiness",
    checkAvailability: "Check Availability",

    // Paywall - Plans
    chooseYourPlan: "Choose Your Plan",
    selectPerfectPlan: "Select the perfect plan for your needs",
    testBadge: "TEST",
    bestValue: "BEST VALUE",
    testPlan: "Test Plan",
    proPlan: "Pro Plan",
    maxPlan: "Max Plan",
    perMonth: "/month",
    testPlanDesc: "For testing payments (TEST MODE)",
    proPlanDesc: "Perfect for small projects",
    maxPlanDesc: "For growing businesses",
    oneWebsite: "1 Website",
    threeWebsites: "3 Websites",
    eightWebsites: "8 Websites",
    unlimitedEdits: "Unlimited Edits",
    customDomains: "Custom Domains",
    premiumHosting: "Premium Hosting",
    prioritySupport: "Priority Support",
    subscribeTest: "Subscribe to Test",
    subscribePro: "Subscribe to Pro",
    subscribeMax: "Subscribe to Max",
    securePayment: "Secure payment powered by Stripe • Cancel anytime • No hidden fees",

    // Payment Modal
    completeSubscription: "Complete Your Subscription",
    loadingCheckout: "Loading secure checkout...",
    congratulations: "Congratulations!",
    successfullyUpgraded: "You've successfully upgraded to",
    continueToDeployment: "Continue to Deployment",

    // Deployment Steps
    deployStep1: "[1/4] Downloading files from Supabase",
    deployStep2: "[2/4] Extracting files",
    deployStep3: "[3/4] Deploying to Cloudflare Pages",
    deployStep4: "[4/4] Deployment Complete",
    waiting: "Waiting...",

    // Edit Mode
    editGreeting: "cool, what do you wanna edit on your site?",
    editMode: "EDIT MODE",
    editModeDesc: "Your site is live. Tell me what you'd like to change.",
    liveBadge: "LIVE",

    // Site capacity
    siteFull: "🚦 **Fowazz is at capacity!**\n\nToo many people are building websites right now. Please try again in a few minutes.",

    // Upgrade Modal
    websiteLimitReached: "Website Limit Reached",
    subscribeToDeployWebsite: "Subscribe to deploy your website and unlock premium features!",
    maybeLater: "Maybe Later",
    oneWebsite: "1 Website",
    customDomainsAndHosting: "Custom Domains & Premium Hosting",

    // Build progress messages
    buildGettingStarted: "Getting started...",
    buildPlanning: "Planning the site structure...",
    buildHomepage: "Writing homepage content...",
    buildLayout: "Designing the layout...",
    buildNavigation: "Building navigation...",
    buildStyling: "Adding styling and colors...",
    buildPages: "Creating additional pages...",
    buildForms: "Setting up forms and buttons...",
    buildPolishing: "Polishing the design...",
    buildAlmostDone: "Almost done...",
    buildFinalizing: "Finalizing everything...",

    // Streaming messages (AI response loop)
    streamingStillWorking: "Still working...",
    streamingLookingGood: "This is looking good...",
    streamingMomentMore: "Just a moment more...",

    // Features modal
    featuresTitle: "Add Features to Your Website",
    featuresSubtitle: "Select features and configure them",
    applyFeatures: "Apply",
    featuresSelected: "features selected",

    // Feature categories
    categoryPayments: "💰 Payments & Orders",
    categoryForms: "📬 Forms & Contact",
    categoryNotifications: "🔔 Notifications",
    categoryAnalytics: "📊 Analytics & Tracking",
    categoryContent: "🎨 Content & Social",
    categoryOther: "🌍 Other Features",

    // Feature descriptions
    featureStripeDesc: "Accept credit cards, online payments",
    featureCartDesc: "Add to cart, checkout system",
    featureOrdersDesc: "Online ordering with notifications",
    featureContactDesc: "Get emails when people contact you",
    featureNewsletterDesc: "Collect email subscribers",
    featureBookingDesc: "Let people schedule appointments",
    featureWebhooksDesc: "Get instant notifications for any action",
    featureWhatsappDesc: "Click to chat button",
    featureAnalyticsDesc: "Track visitors and behavior",
    featureCookiesDesc: "GDPR-compliant cookie banner",
    featureSocialsDesc: "Link to your social profiles",
    featureReviewsDesc: "Display customer reviews",
    featureBlogDesc: "Add a blog section",
    featureFaqDesc: "Frequently asked questions",
    featureMapDesc: "Show your location",
    featureSearchDesc: "Let visitors search your site",
    featureLivechatDesc: "Real-time chat widget (Tawk.to)",

    // Settings
    settingsTitle: "Settings & Billing",
    accountSettings: "Account Settings",
    subscription: "Subscription",
    yourPlan: "Your Plan",
    currentPlan: "Current Plan",
    websitesUsed: "websites",
    manageSubscription: "Manage Subscription",
    cancelSubscription: "Cancel Subscription",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updatePassword: "Update Password",
    deleteAccount: "Delete Account",
    deleteAccountWarning: "This will permanently delete your account and all projects",
    loading: "Loading...",
    fetchingSubscription: "Fetching subscription details...",
    upgradeToPlan: "Upgrade to Max Plan",
    accountInfo: "Account Information",
    email: "Email:",
    accountId: "Account ID:",
    verifyingPayment: "Verifying Your Payment...",
    pleaseWait: "Please wait while we activate your subscription.<br>This usually takes just a few seconds.",

    // Settings page dynamic content
    notSignedIn: "Not signed in",
    pleaseSignInToView: "Please sign in to view your plan",
    na: "N/A",
    freePlan: "Free Plan",
    noActiveSubscription: "No active subscription",
    upgradeToCreate: "Upgrade to create and deploy websites",
    testPlan: "Test Plan",
    litePlan: "Lite Plan",
    maxPlan: "Max Plan",
    prioritySupport: "Priority Support Included",
    websitesUsedLabel: "Websites used:",
    statusLabel: "Status:",
    active: "active",
    perMonthShort: "/month",
    website: "website",
    websites: "websites",
    errorText: "Error",
    couldNotLoadSubscription: "Could not load subscription data",

    // Pricing
    chooseYourPlan: "Choose Your Plan",
    perMonth: "/month",
    proPlan: "Pro Plan",
    subscribeToPro: "Subscribe to Pro",

    // Auth
    welcomeBack: "Welcome Back",
    startBuilding: "Start Building",
    createYourAccount: "Create your account",
    signInToContinue: "Sign in to continue building",
    accountCreatedSuccess: "Account Created Successfully!",
    welcomeToFowazzMsg: "Welcome to Fowazz. Let's build something amazing.",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signUp: "Sign up",
    createAccount: "Create Account",
    getStarted: "Get started with Fowazz",
    fullName: "Full Name",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    freeTrial: "📝 Note for GVH judges: I've attached a PDF with 3 account logins in the Devpost additional info",
    or: "or",
    orContinueWith: "or continue with",

    // Welcome modal
    welcomeToFowazz: "Welcome to FOWAZZ",
    buildWebsite: "Build your website in 3 simple phases",
    createPhaseTitle: "Create Phase",
    createPhaseDesc: "Chat with Fowazz and explain your idea. He'll ask questions, understand your vision, and build your website with real features like payments, forms, and more.",
    domainPhaseTitle: "Domain Phase",
    domainPhaseDesc: "Pick your perfect domain name. We'll check if it's available and get it ready for your site.",
    deployPhaseTitle: "Deploy Phase",
    deployPhaseDesc: "We'll deploy your site to a preview link instantly. Your real domain will be set up within a couple hours, and you'll get an email when it's ready.",
    letsBuild: "Let's Build 🔥",

    // Errors
    error: "Error",
    success: "Success",
    loading: "Loading...",
  },

  ar: {
    // Language picker
    selectLanguage: "اختر لغتك",
    continue: "متابعة",

    // Main UI
    newChat: "مشروع جديد",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    signOut: "تسجيل الخروج",
    login: "تسجيل الدخول / إنشاء حساب",
    guestUser: "زائر",
    notSignedIn: "غير مسجل",
    howItWorks: "كيف تعمل",
    online: "متصل",

    // Chat
    initialGreeting: "نورت, وش ناوي نبني اليوم؟",
    justTalkNormal: "تكلم عادي.",
    tellMeWhatYouNeed: "قول لي وش تريد — نوع البزنس، الستايل، الألوان، أي شي.",
    typeMessage: "وش فكرة موقعك...",
    pressEnterToSend: "اضغط Enter للإرسال",
    surpriseMe: "فاجئني",
    attachFiles: "إرفاق ملفات",
    features: "المميزات",
    selectedFeatures: "مختار",
    recentProjects: "المشاريع الأخيرة",
    tipsFeaturesBefore: "🔌 استخدم",
    tipsFeaturesIcon: "أيقونة القطعة",
    tipsFeaturesAfter: "تحت عشان تضيف مدفوعات، طلبات، نماذج، ويب هوكس",
    tipsDragDrop: "📎 اسحب وأفلت الصور، ملفات PDF، القوائم — راح أستخدمهم",
    pleaseSignIn: "لازم تسجل دخول عشان تتكلم مع فواز!",
    justNow: "الحين",

    // Phases
    phase1: "الإنشاء",
    phase2: "النطاق",
    phase3: "النشر",
    phase4: "مباشر",
    backToChat: "رجوع للمحادثة",
    backToDomain: "رجوع للنطاق",
    youreAllSet: "جاهز للنشر!",
    readyToDeploy: "موقعك جاهز للنشر. اضغط تحت عشان ينطلق مباشر!",
    deployNow: "انشر الحين",

    // Phase 2 - Domain
    chooseYourDomain: "اختر نطاقك",
    findPerfectAddress: "خلنا نلاقي العنوان المثالي لموقعك",
    domainPlaceholder: "مثال: mybusiness",
    checkAvailability: "تحقق من التوفر",

    // Paywall - Plans
    chooseYourPlan: "اختر خطتك",
    selectPerfectPlan: "اختر الخطة المناسبة لاحتياجاتك",
    testBadge: "تجريبي",
    bestValue: "أفضل قيمة",
    testPlan: "خطة تجريبية",
    proPlan: "خطة برو",
    maxPlan: "خطة ماكس",
    perMonth: "/شهرياً",
    testPlanDesc: "لتجربة الدفع (وضع تجريبي)",
    proPlanDesc: "مثالية للمشاريع الصغيرة",
    maxPlanDesc: "للأعمال النامية",
    oneWebsite: "موقع واحد",
    threeWebsites: "٣ مواقع",
    eightWebsites: "٨ مواقع",
    unlimitedEdits: "تعديلات غير محدودة",
    customDomains: "نطاقات مخصصة",
    premiumHosting: "استضافة مميزة",
    prioritySupport: "دعم أولوية",
    subscribeTest: "اشترك في التجريبية",
    subscribePro: "اشترك في برو",
    subscribeMax: "اشترك في ماكس",
    securePayment: "دفع آمن عبر Stripe • إلغاء في أي وقت • بدون رسوم مخفية",

    // Payment Modal
    completeSubscription: "أكمل اشتراكك",
    loadingCheckout: "جاري تحميل صفحة الدفع...",
    congratulations: "مبروك!",
    successfullyUpgraded: "تم ترقيتك بنجاح إلى",
    continueToDeployment: "استمر للنشر",

    // Deployment Steps
    deployStep1: "[1/4] تحميل الملفات من Supabase",
    deployStep2: "[2/4] استخراج الملفات",
    deployStep3: "[3/4] النشر على Cloudflare Pages",
    deployStep4: "[4/4] اكتمل النشر",
    waiting: "جاري الانتظار...",

    // Edit Mode
    editGreeting: "تمام، وش تريد تعدل في موقعك؟",
    editMode: "وضع التعديل",
    editModeDesc: "موقعك شغال. قلي وش تريد تغير؟",
    liveBadge: "شغال",

    // Site capacity
    siteFull: "🚦 **فواز مشغول!**\n\nناس كثير يبنون مواقع الحين. جرب مرة ثانية بعد كم دقيقة.",

    // Upgrade Modal
    websiteLimitReached: "وصلت للحد الأقصى",
    subscribeToDeployWebsite: "اشترك عشان تنشر موقعك وتفتح المميزات المدفوعة!",
    maybeLater: "بعدين",
    oneWebsite: "موقع واحد",
    customDomainsAndHosting: "نطاقات مخصصة واستضافة مميزة",

    // Build progress messages
    buildGettingStarted: "يلا نبدأ...",
    buildPlanning: "أخطط للموقع...",
    buildHomepage: "أكتب محتوى الصفحة الرئيسية...",
    buildLayout: "أصمم التصميم...",
    buildNavigation: "أسوي القائمة...",
    buildStyling: "أضيف الألوان والستايل...",
    buildPages: "أسوي صفحات إضافية...",
    buildForms: "أسوي النماذج والأزرار...",
    buildPolishing: "ألمع التصميم...",
    buildAlmostDone: "خلصنا تقريباً...",
    buildFinalizing: "آخر لمسات...",

    // Streaming messages (AI response loop)
    streamingStillWorking: "لا زلت أشتغل...",
    streamingLookingGood: "شكله زين...",
    streamingMomentMore: "بعد شوي...",

    // Features modal
    featuresTitle: "أضف مميزات لموقعك",
    featuresSubtitle: "اختر المميزات وقم بضبطها",
    applyFeatures: "تطبيق",
    featuresSelected: "مميزات مختارة",

    // Feature categories
    categoryPayments: "💰 المدفوعات والطلبات",
    categoryForms: "📬 النماذج والتواصل",
    categoryNotifications: "🔔 الإشعارات",
    categoryAnalytics: "📊 التحليلات والمتابعة",
    categoryContent: "🎨 المحتوى والسوشل ميديا",
    categoryOther: "🌍 مميزات أخرى",

    // Feature descriptions
    featureStripeDesc: "قبول البطاقات الائتمانية، الدفع الإلكتروني",
    featureCartDesc: "أضف للسلة، نظام الدفع",
    featureOrdersDesc: "الطلب الإلكتروني مع الإشعارات",
    featureContactDesc: "استقبل رسائل عند التواصل معك",
    featureNewsletterDesc: "جمع المشتركين بالبريد الإلكتروني",
    featureBookingDesc: "السماح بحجز المواعيد",
    featureWebhooksDesc: "استقبل إشعارات فورية لأي إجراء",
    featureWhatsappDesc: "زر للدردشة المباشرة",
    featureAnalyticsDesc: "تتبع الزوار وسلوكهم",
    featureCookiesDesc: "إشعار الكوكيز المتوافق مع GDPR",
    featureSocialsDesc: "رابط لحساباتك الاجتماعية",
    featureReviewsDesc: "عرض تقييمات العملاء",
    featureBlogDesc: "إضافة قسم المدونة",
    featureFaqDesc: "الأسئلة الشائعة",
    featureMapDesc: "عرض موقعك",
    featureSearchDesc: "السماح للزوار بالبحث في موقعك",
    featureLivechatDesc: "أداة الدردشة المباشرة (Tawk.to)",

    // Settings
    settingsTitle: "الإعدادات والفواتير",
    accountSettings: "إعدادات الحساب",
    subscription: "الاشتراك",
    yourPlan: "خطتك",
    currentPlan: "الخطة الحالية",
    websitesUsed: "مواقع",
    manageSubscription: "إدارة الاشتراك",
    cancelSubscription: "إلغاء الاشتراك",
    changePassword: "تغيير كلمة المرور",
    currentPassword: "كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    updatePassword: "تحديث كلمة المرور",
    deleteAccount: "حذف الحساب",
    deleteAccountWarning: "سيؤدي هذا إلى حذف حسابك وجميع مشاريعك بشكل دائم",
    loading: "جاري التحميل...",
    fetchingSubscription: "جاري جلب تفاصيل الاشتراك...",
    upgradeToPlan: "الترقية إلى الخطة القصوى",
    accountInfo: "معلومات الحساب",
    email: "البريد الإلكتروني:",
    accountId: "معرف الحساب:",
    verifyingPayment: "جاري التحقق من الدفع...",
    pleaseWait: "يرجى الانتظار بينما نقوم بتفعيل اشتراكك.<br>عادة ما يستغرق هذا بضع ثوانٍ فقط.",

    // Settings page dynamic content
    notSignedIn: "غير مسجل",
    pleaseSignInToView: "يرجى تسجيل الدخول لعرض خطتك",
    na: "غير متوفر",
    freePlan: "خطة مجانية",
    noActiveSubscription: "لا يوجد اشتراك نشط",
    upgradeToCreate: "قم بالترقية لإنشاء ونشر المواقع",
    testPlan: "خطة التجربة",
    litePlan: "الخطة الخفيفة",
    maxPlan: "الخطة القصوى",
    prioritySupport: "دعم الأولوية متضمن",
    websitesUsedLabel: "المواقع المستخدمة:",
    statusLabel: "الحالة:",
    active: "نشط",
    perMonthShort: "/شهرياً",
    website: "موقع",
    websites: "مواقع",
    errorText: "خطأ",
    couldNotLoadSubscription: "تعذر تحميل بيانات الاشتراك",

    // Pricing
    chooseYourPlan: "اختر خطتك",
    perMonth: "/شهرياً",
    proPlan: "الخطة الاحترافية",
    subscribeToPro: "اشترك في الخطة الاحترافية",

    // Auth
    welcomeBack: "مرحباً بعودتك",
    startBuilding: "ابدأ البناء",
    createYourAccount: "أنشئ حسابك",
    signInToContinue: "سجل دخولك لمواصلة البناء",
    accountCreatedSuccess: "تم إنشاء الحساب بنجاح!",
    welcomeToFowazzMsg: "مرحباً بك في فواز. خلنا نبني شي خرافي.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    createAccount: "إنشاء حساب",
    getStarted: "ابدأ مع فواز",
    fullName: "الاسم الكامل",
    dontHaveAccount: "ليس لديك حساب؟",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    freeTrial: "📝 ملاحظة لحكام GVH: أرفقت ملف PDF يحتوي على 3 حسابات تجريبية في معلومات Devpost الإضافية",
    or: "أو",
    orContinueWith: "أو تابع مع",

    // Welcome modal
    welcomeToFowazz: "مرحباً بك في فواز",
    buildWebsite: "ابني موقعك في 3 مراحل بسيطة",
    createPhaseTitle: "مرحلة الإنشاء",
    createPhaseDesc: "تكلم مع فواز واشرح فكرتك. راح يسألك أسئلة، يفهم رؤيتك، ويبني لك موقعك بمميزات حقيقية مثل المدفوعات والنماذج وأكثر.",
    domainPhaseTitle: "مرحلة النطاق",
    domainPhaseDesc: "اختر اسم النطاق المثالي. راح نتحقق إذا كان متاح ونجهزه لموقعك.",
    deployPhaseTitle: "مرحلة النشر",
    deployPhaseDesc: "راح ننشر موقعك على رابط معاينة فوراً. نطاقك الحقيقي راح يتجهز خلال ساعتين، وراح توصلك رسالة لما يكون جاهز.",
    letsBuild: "يلا نبني 🔥",

    // Errors
    error: "خطأ",
    success: "نجح",
    loading: "جاري التحميل...",
  }
};

// Get translation
function t(key) {
  const lang = localStorage.getItem('fowazz_language') || 'en';
  return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
}

// Set language
function setLanguage(lang) {
  localStorage.setItem('fowazz_language', lang);

  // Set RTL for Arabic
  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
  }

  // Reload page to apply translations
  location.reload();
}

// Get current language
function getCurrentLanguage() {
  return localStorage.getItem('fowazz_language') || 'en';
}

// Translate all elements on the page
function translatePage() {
  const lang = getCurrentLanguage();

  // Translate elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    const translation = t(key);

    // Clear the element first to remove any old text/nodes
    el.textContent = '';
    el.textContent = translation;
  });

  // Translate placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    el.placeholder = t(key);
  });

  // Set language direction
  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
  }
}

// Auto-translate on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', translatePage);
  } else {
    translatePage();
  }
}
