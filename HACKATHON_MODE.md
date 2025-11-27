# 🎓 HACKATHON MODE - Temporary Free Access

Fowazz is currently running in **HACKATHON MODE** with all features FREE and no limits.

## Current Status
- ✅ All features unlocked
- ✅ Unlimited websites
- ✅ No paywalls or subscription checks
- ✅ No billing UI
- ✅ Completely free access

---

## 🔄 HOW TO REVERT TO COMMERCIAL VERSION

### Step 1: Re-enable Subscriptions in Frontend

**File: `app.js`** (Line 28)

Change:
```javascript
const HACKATHON_MODE = true;
```

To:
```javascript
const HACKATHON_MODE = false;
```

That's it! This one change will restore:
- Website limits (1/3/8 based on plan)
- Paywall checks for new websites
- Subscription verification
- Upgrade modals

---

### Step 2: Restore Billing UI in Settings

**File: `settings.html`**

#### Part A: Restore Billing Nav Button (Line ~166-177)

**Find this:**
```html
<!-- ============================================ -->
<!-- BILLING TAB - HIDDEN IN HACKATHON MODE -->
<!-- Uncomment below to restore billing section -->
<!-- ============================================ -->
<!--
<button onclick="showBilling()" class="settings-nav-btn ...">
    ...
    Billing & Plan
</button>
-->
```

**Change to:**
```html
<button onclick="showBilling()" class="settings-nav-btn ...">
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
    </svg>
    Billing & Plan
</button>
```

#### Part B: Restore Billing Section Content (Line ~378-396)

**Find this:**
```html
<!-- ============================================ -->
<!-- BILLING SECTION - HIDDEN IN HACKATHON MODE -->
<!-- Uncomment below to restore billing section -->
<!-- ============================================ -->
<!--
<div id="billingSection" class="settings-section hidden">
    ...
</div>
-->
```

**Change to:**
```html
<div id="billingSection" class="settings-section hidden">
    <div class="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
        <h2 class="text-2xl font-bold text-white mb-2">Billing & Plan</h2>
        <p class="text-gray-400 mb-8">Manage your subscription and billing information.</p>

        <div class="space-y-8" id="billingContent">
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p class="text-gray-400 mt-2">Loading your subscription...</p>
            </div>
        </div>
    </div>
</div>
```

---

### Step 3: Deploy Changes

**Frontend (IONOS):**
1. Upload updated `app.js` to IONOS
2. Upload updated `settings.html` to IONOS
3. Clear browser cache / hard refresh

**Backend (Railway):**
- No changes needed - backend still has all Stripe/subscription code intact

---

## ✅ Verification

After reverting:
1. Open browser console
2. Look for: `🌍 Running in PRODUCTION mode`
3. Should NOT see: `🎓 HACKATHON MODE ENABLED`
4. Settings page should show "Billing & Plan" tab
5. Creating websites should check subscription limits

---

## 📋 What Was Changed?

### Modified Files:
1. **app.js**
   - Added `HACKATHON_MODE` flag (line 28)
   - Wrapped subscription checks in `if (!HACKATHON_MODE)` blocks
   - Lines affected: ~1542-1579 (handleSurpriseMe), ~2099-2144 (sendMessage)

2. **settings.html**
   - Commented out "Billing & Plan" nav button (lines ~166-177)
   - Commented out billing section content (lines ~378-396)

### Unchanged (Ready to Use):
- ✅ All Stripe integration code
- ✅ Subscription database tables
- ✅ Payment webhooks
- ✅ Backend `/api/create-checkout-session` endpoint
- ✅ Backend `/api/cancel-subscription` endpoint
- ✅ User profile plan tracking
- ✅ Website limit enforcement logic

---

## 🚨 Important Notes

- **Backend is unchanged** - All payment/subscription code is still there
- **Database is unchanged** - All subscription tables are intact
- **This is frontend-only** - Just disables UI checks
- **Easy revert** - Change 1 line in app.js + uncomment in settings.html
- **No data loss** - All existing user subscriptions are preserved

---

## 🎯 Quick Summary

To go back to commercial:
1. Set `HACKATHON_MODE = false` in app.js (line 28)
2. Uncomment billing sections in settings.html
3. Deploy to IONOS
4. Done!

Everything will work exactly as before. All subscription features, limits, and payments will be restored automatically.
