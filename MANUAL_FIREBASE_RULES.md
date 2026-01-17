# Manual Firebase Rules Configuration

The PERMISSION_DENIED error means Firebase Realtime Database rules need to be updated **manually in Firebase Console**.

## Step-by-Step Guide

### Step 1: Open Firebase Console
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click on your project (Kanyade School)
3. Click **Realtime Database** in the left sidebar

### Step 2: Go to Rules Tab
1. Look for the **Rules** tab at the top (next to **Data** tab)
2. Click **Rules**
3. You should see the current rules in a code editor

### Step 3: Find & Replace notifications_queue Rules

**Look for this section** (search with Ctrl+F):
```json
"notifications_queue": {
```

If you see:
```json
"notifications_queue": {
  "some_old_rules": ...
}
```

**Replace the ENTIRE section** with:
```json
"notifications_queue": {
  ".read": "auth != null",
  ".write": "auth != null",
  ".indexOn": ["timestamp", "studentId", "status"]
},
```

### Step 4: Verify The Structure

Your rules file should now look like this around notifications_queue:

```json
  "notifications_queue": {
    ".read": "auth != null",
    ".write": "auth != null",
    ".indexOn": ["timestamp", "studentId", "status"]
  },
  "admin_users": {
```

### Step 5: Click Publish

1. Look for a **Publish** button (usually in the bottom right)
2. Click it
3. You should see a confirmation message

### Step 6: Wait for Rules to Deploy

Firebase takes 10-30 seconds to apply rules. Wait for the message:
```
✅ Rules published successfully
```

---

## If notifications_queue Doesn't Exist

If you don't see `"notifications_queue"` in your rules at all:

1. Find this section:
```json
  "user_logs": {
    ...
  },
```

2. After the closing `}` of `user_logs`, add a comma and the new section:
```json
  "user_logs": {
    ".read": "auth != null",
    ".write": "auth != null",
    ".indexOn": ["timestamp", "action", "userId"],
    "$userId": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["timestamp", "action"]
    }
  },
  "notifications_queue": {
    ".read": "auth != null",
    ".write": "auth != null",
    ".indexOn": ["timestamp", "studentId", "status"]
  },
```

3. Click **Publish**

---

## Step 7: Test If It Works

1. Close the Firebase Console
2. Hard refresh your app (Ctrl+Shift+R)
3. Open browser Console (F12)
4. You should see:
```
✅ User authenticated: your@email.com
⏸️ Email notifications ready. Configure Firebase rules and run: notificationScheduler.startAutomaticChecks(60)
```

5. Run this in console:
```javascript
EmailNotificationService.testPermissions()
```

6. You should see:
```
✅ Auth Status: your@email.com
✅ Write permission OK - notifications_queue is accessible
```

---

## Step 8: Enable Auto-Checks

Once test passes with ✅, open `Library system/js/email-notifications.js`:

**Find this section** (around line 373):
```javascript
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ User authenticated:', user.email);
        // Auto-checks DISABLED - Manual Firebase rule configuration needed
        // After you manually set rules in Firebase Console, uncomment line below:
        // notificationScheduler.startAutomaticChecks(60);
```

**Change to**:
```javascript
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ User authenticated:', user.email);
        // Start automatic checks once user is logged in
        notificationScheduler.startAutomaticChecks(60);
        console.log('📧 Email notifications initialized. Checking for overdue books every hour.');
```

Save the file and hard refresh.

---

## Troubleshooting

### Q: I get "Syntax error in rules"
**A**: Make sure:
- Each section has a comma after the closing `}`  (except the last one)
- Quotes are straight quotes `"` not curved quotes
- No trailing commas on the last item

### Q: Still getting PERMISSION_DENIED after publishing?
**A**: 
1. Wait 30 seconds for rules to propagate
2. Hard refresh (Ctrl+Shift+R) - not just F5
3. Log out and log back in
4. Run: `firebase.database().goOffline()` then `firebase.database().goOnline()` in console

### Q: Which rules do I need?
**A**: Minimum required for notifications to work:
```json
"notifications_queue": {
  ".read": "auth != null",
  ".write": "auth != null"
},
```

The `.indexOn` is optional (for performance on queries).

---

## Complete notifications_queue Rule Set

If you want the full recommended setup:

```json
"notifications_queue": {
  ".read": "auth != null",
  ".write": "auth != null",
  ".indexOn": ["timestamp", "studentId", "status"],
  "$notificationId": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
},
```

---

## Need More Help?

1. **Check Firebase Rules Syntax**: Click the "⚠️ Syntax Validation" button in Firebase Console
2. **View Firebase Logs**: Go to **Realtime Database** → **Rules** → Look for error messages
3. **Test Rules**: Use the **Simulator** button in Firebase Console to test if a read/write would be allowed

Click on **Simulator** and test:
- **Path**: `/notifications_queue/test123`
- **Operation**: `write`
- Should show: ✅ **Allowed**
