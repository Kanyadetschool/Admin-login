// ===== MODAL MANAGEMENT =====
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

// Modal content templates
const modalContents = {
    login: {
        title: '🔐 Sign In',
        content: `
            <h3>Create Your Account</h3>
            <p>Join StudentHub today and access all academic features.</p>
            <form style="margin-top: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email Address</label>
                    <input type="email" placeholder="your@email.com" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Password</label>
                    <input type="password" placeholder="••••••••" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <button type="button" onclick="alert('Login functionality would be integrated here')" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Sign In</button>
            </form>
            <p style="margin-top: 1rem; text-align: center;">Don't have an account? <a href="javascript:void(0)" onclick="openModal('register')" style="color: #3b82f6; font-weight: 600;">Register here</a></p>
        `
    },
    register: {
        title: '📝 Create Account',
        content: `
            <h3>Join StudentHub</h3>
            <p>Start your academic journey with us.</p>
            <form style="margin-top: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Full Name</label>
                    <input type="text" placeholder="Your Full Name" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email Address</label>
                    <input type="email" placeholder="your@email.com" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">University/School</label>
                    <input type="text" placeholder="Your Institution" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Password</label>
                    <input type="password" placeholder="••••••••" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <button type="button" onclick="alert('Registration would be processed here')" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Create Account</button>
            </form>
        `
    },
    learn: {
        title: '📚 Learn More About StudentHub',
        content: `
            <h3>What is StudentHub?</h3>
            <p>StudentHub is a comprehensive academic management platform designed to streamline the educational experience for students worldwide.</p>
            <h3 style="margin-top: 1.5rem;">Key Features:</h3>
            <ul>
                <li><strong>Real-time Grade Tracking:</strong> Monitor your academic progress instantly</li>
                <li><strong>Assignment Management:</strong> Submit work and receive immediate feedback</li>
                <li><strong>Peer Collaboration:</strong> Connect with classmates and study groups</li>
                <li><strong>Resource Library:</strong> Access thousands of study materials</li>
                <li><strong>Professional Tutoring:</strong> One-on-one sessions with experts</li>
                <li><strong>Smart Calendar:</strong> Never miss an important deadline</li>
            </ul>
            <h3 style="margin-top: 1.5rem;">Why Choose Us?</h3>
            <p>We're committed to empowering students with tools that make learning more efficient, effective, and enjoyable. Join thousands of students already using StudentHub to excel in their studies.</p>
        `
    },
    grades: {
        title: '📊 Grade Tracking System',
        content: `
            <h3>Monitor Your Academic Performance</h3>
            <p>Our advanced grade tracking system provides real-time insights into your academic progress.</p>
            <h3 style="margin-top: 1.5rem;">Features:</h3>
            <ul>
                <li>View grades for all courses and assignments</li>
                <li>Track GPA and academic standing</li>
                <li>Receive grade alerts and notifications</li>
                <li>Compare performance trends over time</li>
                <li>Get personalized improvement recommendations</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;"><strong>💡 Tip:</strong> Check your grades regularly to stay on top of your academic journey!</p>
            <button onclick="openModal('login')" style="width: 100%; margin-top: 1rem; background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Sign In to View Grades</button>
        `
    },
    assignments: {
        title: '📝 Assignment Hub',
        content: `
            <h3>Manage Your Assignments Efficiently</h3>
            <p>Submit assignments, track deadlines, and receive instant feedback from instructors.</p>
            <h3 style="margin-top: 1.5rem;">What You Can Do:</h3>
            <ul>
                <li>View all upcoming assignments</li>
                <li>Upload and submit work before deadlines</li>
                <li>Receive detailed feedback from teachers</li>
                <li>Resubmit revised work if needed</li>
                <li>Check submission history</li>
                <li>Get reminders for upcoming deadlines</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;"><strong>✅ Note:</strong> All submitted assignments are automatically saved and time-stamped.</p>
        `
    },
    network: {
        title: '👥 Peer Network',
        content: `
            <h3>Connect with Fellow Students</h3>
            <p>Build meaningful connections and collaborate with peers to enhance your learning experience.</p>
            <h3 style="margin-top: 1.5rem;">Network Benefits:</h3>
            <ul>
                <li>Find study partners in your courses</li>
                <li>Join subject-specific discussion groups</li>
                <li>Share notes and study resources</li>
                <li>Participate in study sessions</li>
                <li>Get help from peer tutors</li>
                <li>Make friends with shared interests</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>Community Guidelines:</strong> Be respectful, supportive, and inclusive in all interactions.</p>
        `
    },
    materials: {
        title: '📚 Learning Materials',
        content: `
            <h3>Access Quality Study Resources</h3>
            <p>Explore our extensive library of learning materials curated by educators.</p>
            <h3 style="margin-top: 1.5rem;">Available Resources:</h3>
            <ul>
                <li>Complete course notes and summaries</li>
                <li>Textbook references and excerpts</li>
                <li>Practice problems with solutions</li>
                <li>Research papers and articles</li>
                <li>Revision guides for exams</li>
                <li>Formula sheets and checklists</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 8px;"><strong>🎯 Tip:</strong> Bookmark your favorite materials for quick access during study sessions.</p>
        `
    },
    tutoring: {
        title: '🎓 Professional Tutoring Services',
        content: `
            <h3>Get Expert Help When You Need It</h3>
            <p>Connect with experienced tutors for personalized one-on-one learning sessions.</p>
            <h3 style="margin-top: 1.5rem;">Tutoring Options:</h3>
            <ul>
                <li>Live video tutoring sessions</li>
                <li>Subject-specific expertise</li>
                <li>Flexible scheduling options</li>
                <li>Homework help and concept explanations</li>
                <li>Exam preparation coaching</li>
                <li>Essay writing and revision help</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #fdf2f8; border-left: 4px solid #ec4899; border-radius: 8px;"><strong>📞 Ready to book?</strong> Schedule your first session today!</p>
            <button onclick="alert('Tutoring booking system would open here')" style="width: 100%; margin-top: 1rem; background: #ec4899; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Book a Session</button>
        `
    },
    calendar: {
        title: '📅 Academic Calendar & Schedule',
        content: `
            <h3>Organize Your Academic Life</h3>
            <p>Never miss important dates with our integrated calendar system.</p>
            <h3 style="margin-top: 1.5rem;">Calendar Features:</h3>
            <ul>
                <li>View all assignment due dates</li>
                <li>Track exam schedules</li>
                <li>Manage class schedules</li>
                <li>Set personal reminders</li>
                <li>Color-code by subject or type</li>
                <li>Export to your preferred calendar app</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>Syncing:</strong> Your StudentHub calendar automatically syncs across all your devices.</p>
        `
    },
    portal: {
        title: '🔗 Student Portal',
        content: `
            <h3>Central Hub for All Academic Information</h3>
            <p>Access your complete academic profile in one secure location.</p>
            <h3 style="margin-top: 1.5rem;">Portal Contents:</h3>
            <ul>
                <li>Personal academic information</li>
                <li>Course enrollment details</li>
                <li>Current grades and transcripts</li>
                <li>Account settings and preferences</li>
                <li>Communication with instructors</li>
                <li>Financial aid information</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;"><strong>🔒 Security:</strong> Your data is encrypted and protected with industry-standard security.</p>
        `
    },
    library: {
        title: '📖 Digital Library',
        content: `
            <h3>Unlimited Access to Digital Resources</h3>
            <p>Browse millions of academic resources from your favorite publishers.</p>
            <h3 style="margin-top: 1.5rem;">What's Available:</h3>
            <ul>
                <li>E-books and textbooks</li>
                <li>Journal articles and research papers</li>
                <li>Video lectures and tutorials</li>
                <li>Databases and reference materials</li>
                <li>Open Educational Resources (OER)</li>
                <li>Search millions of academic sources</li>
            </ul>
            <button onclick="alert('Digital Library would open in a new window')" style="width: 100%; margin-top: 1rem; background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Visit Library</button>
        `
    },
    support: {
        title: '💬 Support Chat',
        content: `
            <h3>Get Instant Help from Our Support Team</h3>
            <p>Connect with our friendly support specialists anytime you need assistance.</p>
            <h3 style="margin-top: 1.5rem;">Support Available For:</h3>
            <ul>
                <li>Account and login issues</li>
                <li>Technical problems</li>
                <li>Feature tutorials</li>
                <li>General inquiries</li>
                <li>Billing questions</li>
                <li>Account customization</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>Availability:</strong> 24/7 chat support via our platform</p>
            <button onclick="alert('Support chat would open here')" style="width: 100%; margin-top: 1rem; background: #10b981; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Start Chat</button>
        `
    },
    forum: {
        title: '💭 Community Forum',
        content: `
            <h3>Join Active Academic Discussions</h3>
            <p>Participate in our vibrant community of students and educators.</p>
            <h3 style="margin-top: 1.5rem;">Forum Topics:</h3>
            <ul>
                <li>Subject-specific discussions</li>
                <li>Study tips and strategies</li>
                <li>Course recommendations</li>
                <li>Career and internship advice</li>
                <li>General campus life discussions</li>
                <li>Q&A sections for each subject</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #f3f4f6; border-left: 4px solid #6b7280; border-radius: 8px;"><strong>📌 Rules:</strong> Keep discussions respectful, on-topic, and free from spam.</p>
        `
    },
    study: {
        title: '📖 Study Guides',
        content: `
            <h3>Comprehensive Study Materials</h3>
            <p>Access expert-created study guides for all subjects and levels.</p>
            <p style="margin-top: 1rem;">Our study guides include:</p>
            <ul>
                <li>Chapter summaries and key concepts</li>
                <li>Practice questions with answers</li>
                <li>Mind maps and visual aids</li>
                <li>Exam tips and strategies</li>
                <li>Common mistakes to avoid</li>
                <li>Formula sheets and quick references</li>
            </ul>
            <button onclick="alert('Study guides would open here')" style="width: 100%; margin-top: 1rem; background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Browse Guides</button>
        `
    },
    videos: {
        title: '🎬 Video Lectures',
        content: `
            <h3>Learn from Expert Video Tutorials</h3>
            <p>Watch high-quality video lectures from experienced educators.</p>
            <h3 style="margin-top: 1.5rem;">Video Content:</h3>
            <ul>
                <li>Complete course lectures</li>
                <li>Topic-specific tutorials</li>
                <li>Problem-solving walkthroughs</li>
                <li>Exam preparation sessions</li>
                <li>Speed-adjustable playback</li>
                <li>Searchable transcripts</li>
            </ul>
            <button onclick="alert('Video library would open here')" style="width: 100%; margin-top: 1rem; background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Watch Videos</button>
        `
    },
    coding: {
        title: '💻 Coding Resources',
        content: `
            <h3>Master Programming Skills</h3>
            <p>Learn coding with our comprehensive programming tutorials and resources.</p>
            <h3 style="margin-top: 1.5rem;">Programming Topics:</h3>
            <ul>
                <li>Python, JavaScript, Java, C++</li>
                <li>Web development (HTML, CSS, React)</li>
                <li>Data structures and algorithms</li>
                <li>Database design and SQL</li>
                <li>Version control with Git</li>
                <li>Code challenges and projects</li>
            </ul>
            <button onclick="alert('Coding platform would open here')" style="width: 100%; margin-top: 1rem; background: #3b82f6; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Start Learning</button>
        `
    },
    app: {
        title: '📱 Mobile App',
        content: `
            <h3>StudentHub On the Go</h3>
            <p>Download our mobile app to access StudentHub anywhere, anytime.</p>
            <h3 style="margin-top: 1.5rem;">App Features:</h3>
            <ul>
                <li>View and submit assignments</li>
                <li>Check grades in real-time</li>
                <li>Receive push notifications</li>
                <li>Offline access to materials</li>
                <li>Video lectures streaming</li>
                <li>Mobile-optimized interface</li>
            </ul>
            <h3 style="margin-top: 1.5rem;">Download Now:</h3>
            <p>
                <button onclick="alert('Redirecting to App Store...')" style="margin-right: 0.5rem; background: #000; color: white; padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">📱 App Store</button>
                <button onclick="alert('Redirecting to Google Play...')" style="background: #3b82f6; color: white; padding: 0.6rem 1rem; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🔵 Google Play</button>
            </p>
        `
    },
    contact: {
        title: '📧 Contact Us',
        content: `
            <h3>Get in Touch</h3>
            <p>We'd love to hear from you. Reach out with questions, feedback, or suggestions.</p>
            <form style="margin-top: 1.5rem;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Your Name</label>
                    <input type="text" placeholder="Your Name" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email Address</label>
                    <input type="email" placeholder="your@email.com" style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Message</label>
                    <textarea placeholder="Your message..." style="width: 100%; padding: 0.8rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; min-height: 120px; resize: vertical;"></textarea>
                </div>
                <button type="button" onclick="alert('Message sent! We\'ll get back to you soon.')" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Send Message</button>
            </form>
            <p style="margin-top: 1.5rem;"><strong>Other Ways to Reach Us:</strong></p>
            <ul style="list-style: none;">
                <li>📧 Email: support@studenthub.com</li>
                <li>📞 Phone: +1 (800) 123-4567</li>
                <li>💬 Live Chat: Available 24/7</li>
            </ul>
        `
    },
    about: {
        title: '🏫 About StudentHub',
        content: `
            <h3>Our Mission</h3>
            <p>To empower students worldwide by providing innovative digital tools that enhance learning, foster collaboration, and drive academic success.</p>
            <h3 style="margin-top: 1.5rem;">Our Story</h3>
            <p>Founded in 2020, StudentHub began with a simple vision: make education more accessible and efficient for students everywhere. Today, we serve students across 50+ countries.</p>
            <h3 style="margin-top: 1.5rem;">Why We're Different</h3>
            <ul>
                <li>Student-centered design philosophy</li>
                <li>Continuous innovation and improvement</li>
                <li>Dedicated customer support team</li>
                <li>Affordable pricing plans</li>
                <li>Privacy-first approach</li>
            </ul>
        `
    },
    privacy: {
        title: '🔐 Privacy Policy',
        content: `
            <h3>Your Privacy Matters</h3>
            <p>StudentHub is committed to protecting your personal information and ensuring transparency in how we collect and use data.</p>
            <h3 style="margin-top: 1.5rem;">Key Points:</h3>
            <ul>
                <li>We collect only necessary information</li>
                <li>Your data is encrypted and secure</li>
                <li>We never sell your data</li>
                <li>You control your privacy settings</li>
                <li>Compliance with GDPR and CCPA</li>
            </ul>
            <p style="margin-top: 1rem; padding: 1rem; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;"><strong>📄 Full Policy:</strong> <a href="javascript:void(0)" style="color: #3b82f6; font-weight: 600;">Read our complete privacy policy</a></p>
        `
    },
    terms: {
        title: '📋 Terms of Service',
        content: `
            <h3>Terms & Conditions</h3>
            <p>By using StudentHub, you agree to abide by our terms and conditions.</p>
            <h3 style="margin-top: 1.5rem;">Key Terms:</h3>
            <ul>
                <li>Accounts are for personal academic use</li>
                <li>No unauthorized content sharing</li>
                <li>Respectful community conduct required</li>
                <li>Proper use of platform features</li>
                <li>We reserve modification rights</li>
            </ul>
            <p style="margin-top: 1rem;"><strong>Questions?</strong> <a href="javascript:void(0)" onclick="openModal('contact')" style="color: #3b82f6; font-weight: 600;">Contact our support team</a></p>
        `
    },
    faq: {
        title: '❓ Frequently Asked Questions',
        content: `
            <h3>Common Questions Answered</h3>
            <div style="margin-top: 1rem;">
                <div style="margin-bottom: 1.5rem;">
                    <strong>Is StudentHub free?</strong>
                    <p style="margin-top: 0.5rem;">We offer a free tier with core features. Premium plans unlock additional benefits.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <strong>How do I reset my password?</strong>
                    <p style="margin-top: 0.5rem;">Use the "Forgot Password" link on the login page to reset your password instantly.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <strong>Can I collaborate with others?</strong>
                    <p style="margin-top: 0.5rem;">Yes! Create study groups and share materials with fellow students.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <strong>What devices are supported?</strong>
                    <p style="margin-top: 0.5rem;">StudentHub works on all devices: computers, tablets, and smartphones.</p>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <strong>Is my data safe?</strong>
                    <p style="margin-top: 0.5rem;">Yes, we use military-grade encryption to protect all your information.</p>
                </div>
            </div>
        `
    },
    help: {
        title: '🆘 Help Center',
        content: `
            <h3>We're Here to Help</h3>
            <p>Find answers, tutorials, and support resources.</p>
            <h3 style="margin-top: 1.5rem;">Getting Started:</h3>
            <ul>
                <li><a href="javascript:void(0)" onclick="openModal('login')" style="color: #3b82f6; font-weight: 600;">How to Sign In</a></li>
                <li><a href="javascript:void(0)" onclick="openModal('register')" style="color: #3b82f6; font-weight: 600;">Creating Your Account</a></li>
                <li><a href="javascript:void(0)" style="color: #3b82f6; font-weight: 600;">Setting Up Your Profile</a></li>
            </ul>
            <h3 style="margin-top: 1.5rem;">Features:</h3>
            <ul>
                <li><a href="javascript:void(0)" onclick="openModal('grades')" style="color: #3b82f6; font-weight: 600;">Viewing Your Grades</a></li>
                <li><a href="javascript:void(0)" onclick="openModal('assignments')" style="color: #3b82f6; font-weight: 600;">Submitting Assignments</a></li>
                <li><a href="javascript:void(0)" onclick="openModal('calendar')" style="color: #3b82f6; font-weight: 600;">Using the Calendar</a></li>
            </ul>
        `
    },
    twitter: {
        title: '🐦 Follow on Twitter',
        content: `
            <h3>Stay Updated on Twitter</h3>
            <p>Follow @StudentHubOfficial for the latest news, tips, and announcements.</p>
            <button onclick="alert('Redirecting to Twitter...')" style="width: 100%; margin-top: 1rem; background: #1DA1F2; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Follow Us on Twitter</button>
            <p style="margin-top: 1rem;"><strong>Recent Posts:</strong> Check out our latest tweets for study tips, features updates, and success stories!</p>
        `
    },
    instagram: {
        title: '📸 Follow on Instagram',
        content: `
            <h3>Connect on Instagram</h3>
            <p>Follow @studenthub.official for inspiring study content and community highlights.</p>
            <button onclick="alert('Redirecting to Instagram...')" style="width: 100%; margin-top: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Follow Us on Instagram</button>
            <p style="margin-top: 1rem;"><strong>Content:</strong> Daily motivation, study hacks, student spotlights, and more!</p>
        `
    },
    facebook: {
        title: '👍 Like on Facebook',
        content: `
            <h3>Join Our Facebook Community</h3>
            <p>Connect with thousands of students on our official Facebook page.</p>
            <button onclick="alert('Redirecting to Facebook...')" style="width: 100%; margin-top: 1rem; background: #1877F2; color: white; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Like Our Facebook Page</button>
            <p style="margin-top: 1rem;"><strong>Community:</strong> Events, discussions, group resources, and peer support!</p>
        `
    }
};

// Open modal function
function openModal(modalType) {
    const modal = modalContents[modalType];
    if (!modal) return;
    
    modalTitle.textContent = modal.title;
    modalBody.innerHTML = modal.content;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal function
function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ===== SMOOTH SCROLL FOR NAV LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});