# Firebase Realtime Database Rules Fix

## Problem
The email notification system was failing with `PERMISSION_DENIED` when trying to write to `notifications_queue` path because Firebase Realtime Database security rules were not configured.

## Solution Implemented

### 1. New File: `database.rules.json`
Created Firebase Realtime Database rules allowing:
- **issuances**: Read/Write for authenticated users
- **audit_logs**: Read/Write for tracking, read-restricted for admins only
- **user_logs**: Per-user audit trails
- **notifications_queue**: Write access for authenticated users
- **admin_users**: Admin verification without write access

### 2. Updated `firebase.json`
Added database rules reference:
```json
"database": {
  "rules": "database.rules.json"
}
```

## Deployment Steps

### Option 1: Firebase CLI (Recommended)
```bash
# Install if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Select your project
firebase use --add

# Deploy rules
firebase deploy --only database
```

### Option 2: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Realtime Database** → **Rules**
4. Copy the content from `database.rules.json` and paste it into the rules editor
5. Click **Publish**

## After Deployment

### Re-enable Email Notifications
Once rules are deployed, uncomment the auto-check in `js/email-notifications.js`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Uncomment this line once Firebase rules are deployed
    notificationScheduler.startAutomaticChecks(60);
});
```

Or run manually in console:
```javascript
notificationScheduler.startAutomaticChecks(60);
```

## Rule Breakdown

| Path | Read | Write | Purpose |
|------|------|-------|---------|
| `notifications_queue` | Admin only | Authenticated users | Queue for email notifications |
| `audit_logs` | Admin only | Authenticated users | Global audit trail |
| `user_logs/{userId}` | User or Admin | That user | Personal audit trail |
| `issuances` | All authenticated | Authenticated users | Book issuances |
| `admin_users` | Authenticated | No one | Admin whitelist (managed in Firebase Console) |

## Validation

After deployment, check console for confirmation:
```javascript
// Test write access
await db.ref('notifications_queue/test').set({
    timestamp: new Date().toISOString(),
    test: true
});
// Should succeed without PERMISSION_DENIED error
```

## Troubleshooting

If you still get PERMISSION_DENIED:
1. Ensure you're **authenticated** (logged in to the app)
2. Check Firebase Console → Realtime Database → Rules are published
3. Wait 1-2 minutes for rules to propagate
4. Hard refresh browser (Ctrl+Shift+R)
5. Check that `auth` is not null: `firebase.auth().currentUser`

## Admin User Setup

To set up admin users, use Firebase Console:
1. Go to **Realtime Database**
2. Create path: `admin_users/{userId}`
3. Set value to `true`
4. Example: If user UID is `abc123def`, create `admin_users/abc123def` with value `true`

## Security Notes

- ✅ Only authenticated users can write to `notifications_queue`
- ✅ Only admins can read `audit_logs`
- ✅ Users can only read/write their own `user_logs`
- ✅ Data validation enforced via `.validate` rules
- ✅ All reads/writes default to `false` for security

## Next Steps

1. Deploy rules using Firebase CLI or Console
2. Uncomment auto-checks in `email-notifications.js`
3. Test by viewing console: `notificationScheduler.checkOverdueBooks()`
4. Monitor `notifications_queue` in Firebase Console for queued notifications
5. Deploy Cloud Functions to process `notifications_queue` (optional, for email sending)
