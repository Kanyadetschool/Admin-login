/**
 * Script to manually add approved users to Firestore
 * 
 * Instructions:
 * 1. Open Firebase Console: https://console.firebase.google.com/
 * 2. Go to your project: kanyadet-school-admin
 * 3. Navigate to Firestore Database
 * 4. Create a new collection called "approvedUsers"
 * 5. For each user, create a document with the user's email as the document ID
 * 
 * Example Document Structure:
 * 
 * Collection: approvedUsers
 * Document ID: geofreyonyango167@gmail.com
 * Fields:
 *   - email: "geofreyonyango167@gmail.com"
 *   - role: "admin"  (or "teacher", "staff", etc.)
 *   - name: "Geofrey Onyango"
 *   - createdAt: (timestamp)
 *   - status: "active"
 */

// This is a helper script showing the required structure
// You need to manually add users to the approvedUsers collection in Firebase Console

const userTemplate = {
  email: "geofreyonyango167@gmail.com",
  role: "admin",
  name: "Geofrey Onyango",
  createdAt: new Date(),
  status: "active"
};

console.log("Add this user structure to your 'approvedUsers' collection in Firebase Console:");
console.log(JSON.stringify(userTemplate, null, 2));

/**
 * ALTERNATIVE: Use this code in Firebase Console (Tools > Firestore Rules)
 * to programmatically add users during development:
 * 
 * db.collection("approvedUsers").doc("geofreyonyango167@gmail.com").set({
 *   email: "geofreyonyango167@gmail.com",
 *   role: "admin",
 *   name: "Geofrey Onyango",
 *   createdAt: firebase.firestore.FieldValue.serverTimestamp(),
 *   status: "active"
 * });
 */
