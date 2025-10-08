// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_41WpdMjHJOU5s3gQ9aieIayZRvUoRLE",
    authDomain: "kanyadet-school-admin.firebaseapp.com",
    databaseURL: "https://kanyadet-school-admin-default-rtdb.firebaseio.com/",
    projectId: "kanyadet-school-admin",
    storageBucket: "kanyadet-school-admin.appspot.com",
    messagingSenderId: "409708360032",
    appId: "1:409708360032:web:a21d63e8cb5fa1ecabee05",
    measurementId: "G-Y4C0ZRRL52"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Database References
const teachersRef = database.ref('teachers');
const schedulesRef = database.ref('schedules');
const attendanceRef = database.ref('attendance');
const performanceRef = database.ref('performance');

// Application Configuration
const APP_CONFIG = {
    departments: [
        'Mathematics',
        'English',
        'Science',
        'Social Studies',
        'Physical Education',
        'Arts',
        'Computer Science',
        'Languages'
    ],
    positions: [
        'Head of Department',
        'Senior Teacher',
        'Teacher',
        'Junior Teacher',
        'Substitute Teacher'
    ],
    employmentTypes: [
        'Full-time',
        'Part-time',
        'Contract'
    ],
    statuses: [
        'Active',
        'Inactive',
        'On Leave'
    ],
    attendanceStatuses: [
        'Present',
        'Absent',
        'Leave'
    ]
};