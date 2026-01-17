# 30-Day Retention - Quick Reference Card

## 🎯 What It Does
Automatically keeps records for maximum 30 days:
- **Live Modified Students** - Real-time student modifications
- **Activity Feed** - Complete audit trail

Entries older than 30 days are automatically deleted.

---

## ⚡ Quick Facts

| Item | Value |
|------|-------|
| **Retention Period** | 30 days (configurable) |
| **Automatic Cleanup** | Every 1 hour + on new entry |
| **Data Storage** | Memory + localStorage |
| **User Visible** | "📅 X days retained" badge |
| **Configuration** | Line 25 in `js/loadDashboardData.js` |

---

## 📋 Key Functions

### `cleanupOldEntries()`
```javascript
// Removes entries > 30 days old
cleanupOldEntries();
// Console: 🧹 Data Retention Cleanup: Removed X, Y entries
```

### `getRetentionDaysRemaining(timestamp)`
```javascript
// How many days until deletion?
getRetentionDaysRemaining('12/15/2024, 03:45:30 PM')
// Returns: 27 (example)
```

### `loadPersistedActivityFeed()`
```javascript
// Load activity feed from localStorage (called on page load)
loadPersistedActivityFeed();
// Restores data and cleans expired entries
```

### `getFormattedTimestamp()`
```javascript
// Get current timestamp
getFormattedTimestamp()
// Returns: "12/15/2024, 03:45:30 PM"
```

---

## 🔄 Data Lifecycle

```
Day 1  → 📅 30 days retained
Day 10 → 📅 21 days retained
Day 20 → 📅 11 days retained
Day 29 → 📅 2 days retained
Day 30 → 📅 1 day retained
Day 31 → 🗑️ DELETED (auto-removed)
```

---

## 📱 Browser Console

### Check Status
```javascript
activityFeed.length              // Total entries
modifiedStudents.size           // Modified students count
localStorage.getItem('activityFeed').length  // Storage size
```

### Run Cleanup
```javascript
cleanupOldEntries()             // Force cleanup
```

### Check Logs
```
✅ User authenticated
📂 Loaded persisted activity feed
⏰ Periodic cleanup scheduler started
🧹 Periodic cleanup executed (every hour)
```

---

## ⚙️ Configuration

### Change Retention Days
**File:** `js/loadDashboardData.js`
**Line:** 25

```javascript
const RETENTION_DAYS = 30;  // ← Change this
```

### Change Cleanup Frequency
**File:** `js/loadDashboardData.js`
**Line:** 793

```javascript
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;  // ← 1 hour
```

---

## 📊 Automatic Cleanup Events

| Event | When | Result |
|-------|------|--------|
| **Page Load** | Every refresh | Restore + cleanup |
| **New Entry** | Every change | Add + cleanup |
| **Hourly** | Every hour | Background cleanup |

---

## ✅ What's Cleaned

- ✅ Entries from `modifiedStudents` Map
- ✅ Entries from `activityFeed` Array
- ✅ Persisted data in localStorage
- ✅ DOM elements older than 30 days

---

## 🧪 Quick Tests

### Test 1: Check Persisted Data
```javascript
localStorage.getItem('activityFeed')
// Should show JSON array
```

### Test 2: Calculate Remaining Days
```javascript
getRetentionDaysRemaining('12/15/2024, 03:45:30 PM')
// Should return 0-30
```

### Test 3: Run Cleanup
```javascript
cleanupOldEntries()
// Check console for cleanup log
```

### Test 4: Check Entry Count
```javascript
activityFeed.length
// Should show current count
```

---

## 📌 Important Points

⚠️ **Remember:**
- Cleanup runs every hour automatically
- Old entries (>30 days) are permanently deleted
- Data persists across page reloads
- localStorage saves activity feed
- modifiedStudents Map is reset on page reload

---

## 🔍 Troubleshooting

### No cleanup logs appearing
- Check console is open (F12)
- Wait 1 hour for periodic cleanup
- Try manual: `cleanupOldEntries()`

### Data not persisting
- Check localStorage is enabled
- Clear browser cache if needed
- Verify no localStorage errors

### Badge showing wrong days
- Check timestamp format: `MM/DD/YYYY, HH:MM:SS AM/PM`
- Run: `getRetentionDaysRemaining(timestamp)`

---

## 📞 Support References

For detailed info, see:
- **`RETENTION_POLICY_30DAYS.md`** - Full implementation
- **`RETENTION_TESTING_GUIDE.md`** - Testing procedures
- **`README_30DAY_RETENTION.md`** - Overview

---

## 🎯 Summary

✅ **30-day retention implemented**
✅ **Automatic cleanup running**
✅ **Data persisting to localStorage**
✅ **User-visible retention status**
✅ **Fully documented and tested**

🚀 **Status: PRODUCTION READY**
