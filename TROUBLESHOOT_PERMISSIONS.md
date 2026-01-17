# Fixing PERMISSION_DENIED & 404 Errors

## Issue 1: 404 Images (Non-Critical)
**Error**: `Failed to load resource: images/Grade 4/STUDENT_NAME.jpg (404)`

**Cause**: Some student image files don't exist in the images folder.

**Fix**: Already handled! The app has fallback logic:
```javascript
img.onerror = () => {
    img.src = defaultStudentImage;  // Shows default image
};
```

**Action**: 
- These are just console warnings, not actual errors
- The app displays a default image instead
- No action needed unless you want to add missing student photos

---

## Issue 2: PERMISSION_DENIED for notifications_queue

**Error**: `Error: PERMISSION_DENIED: Permission denied` when writing to `/notifications_queue`

**Cause**: Email notifications try to write before Firebase auth is ready.

### Solution Applied:
✅ Added auth state listener to wait for user login
✅ Added permission testing function
✅ Added better error messages

### Test If It's Working:

**Option 1: Quick Console Test**
```javascript
// Test permissions in browser console
EmailNotificationService.testPermissions();
```

**Expected output**:
```
✅ Auth Status: oduorgeofrey141@gmail.com
✅ Write permission OK - notifications_queue is accessible
```

If you see `❌ Permission test failed`, proceed to Option 2.

---

### Option 2: Verify Firebase Rules Are Deployed

**Check in Firebase Console:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Realtime Database** → **Rules** tab
4. Look for this section:
```json
"notifications_queue": {
  ".read": "auth != null",
  ".write": "auth != null",
  ...
}
```

If the rules DON'T show `notifications_queue`, re-deploy:
```bash
firebase deploy --only database
```

---

### Option 3: Manual Rule Fix (If Auto-Deploy Failed)

If `firebase deploy` didn't work:

1. Open [Firebase Console](https://console.firebase.google.com)
2. Click **Realtime Database**
3. Click the **Rules** tab
4. Click **Edit Rules**
5. Find the line with `notifications_queue` (Ctrl+F to search)
6. Verify it looks like this:
```json
"notifications_queue": {
  ".read": "auth != null",
  ".write": "auth != null",
  ".indexOn": ["timestamp", "studentId", "status"],
  "$notificationId": {
    ".validate": "newData.hasChildren(['studentId', 'message', 'type', 'timestamp'])"
  }
}
```
7. If missing, copy-paste it into the rules
8. Click **Publish**
9. Hard refresh browser (Ctrl+Shift+R)

---

## Why This Was Happening

Your code structure:
```javascript
// ❌ OLD: Runs before auth is ready
document.addEventListener('DOMContentLoaded', () => {
    notificationScheduler.startAutomaticChecks(60);
});
```

Firebase auth takes 100-500ms to initialize. If code ran before that:
```
Timeline:
[DOMContentLoaded fires] → [Code tries to write] → ❌ No auth yet
[Auth initializes] → ✅ Too late!
```

New approach:
```javascript
// ✅ NEW: Waits for auth first
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        notificationScheduler.startAutomaticChecks(60);  // Safe!
    }
});
```

---

## Verify It's Fixed

**Check browser console for these messages:**
```
✅ User authenticated: oduorgeofrey141@gmail.com
📧 Email notifications initialized. Checking for overdue books every hour.
```

If you see:
```
⚠️ User not authenticated. Email notifications waiting for login.
```

→ User is not logged in. Log in first, then refresh page.

---

## Quick Checklist

- ✅ Firebase rules deployed (`firebase deploy --only database`)
- ✅ `notifications_queue` path visible in Firebase Console
- ✅ User is logged in (check top-right of app)
- ✅ No more PERMISSION_DENIED errors in console
- ✅ Email notifications initialized message appears

---

## If Still Broken

Run this in browser console to diagnose:
```javascript
// 1. Check auth
console.log('User:', firebase.auth().currentUser?.email);

// 2. Test permissions
EmailNotificationService.testPermissions();

// 3. Check rules deployment
firebase.database().ref('.info/connected').on('value', (snap) => {
    console.log('Connected:', snap.val());
});
```

If all return ✅ but notifications still fail:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R)
- Log out and log back in
