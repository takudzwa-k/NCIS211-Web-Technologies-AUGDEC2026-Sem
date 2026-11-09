const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db'); 
const mailer = require('./mail'); 

const app = express();

// 1. Serve static files (HTML, CSS, JS, Images) from the root directory
app.use(express.static(path.join(__dirname, '..')));

// 2. Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session Setup (Security requirements from README)
app.use(session({
    secret: 'super-secret-university-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true, 
        sameSite: 'strict',
        maxAge: 12 * 60 * 60 * 1000 // 12 hours
    }
}));

// --- AUTHENTICATION MIDDLEWARE ---
// DEV BYPASS: If no session exists, we automatically log in as Student ID 1.
// In production, this would reject the request.
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        req.session.userId = 1; 
        req.session.role = 'student';
    }
    next();
}

// ==========================================
// 1. PREMIUM TIER BUSINESS LOGIC (The Mock Payment)
// ==========================================
app.post('/api/upgrade-premium', requireAuth, (req, res) => {
    // Ensure only students can upgrade
    if (req.session.role !== 'student') {
        return res.status(403).json({ error: 'Only students can upgrade to Premium.' });
    }

    const studentId = req.session.userId;
    const oneYearFromNow = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);

    // Update the database to set their tier to 'premium'
    db.run(
        `UPDATE users SET tier = 'premium', tier_expires_at = ? WHERE id = ?`,
        [oneYearFromNow, studentId],
        function(err) {
            if (err) {
                console.error("Upgrade Error:", err);
                return res.status(500).json({ error: 'Failed to process upgrade.' });
            }
            
            // Log this action to the immutable audit log
            db.run(`INSERT INTO audit_log (actor_id, action, details) VALUES (?, ?, ?)`, 
                [studentId, 'UPGRADE_PREMIUM', 'Student upgraded to Premium Tier']);

            res.json({ success: true, message: 'Account upgraded to Premium Career Services!' });
        }
    );
});

// ==========================================
// 2. LETTER REQUEST LOGIC (Checks the Tier)
// ==========================================
app.post('/api/request-letter', requireAuth, (req, res) => {
    if (req.session.role !== 'student') {
        return res.status(403).json({ error: 'Only students can request letters.' });
    }

    const studentId = req.session.userId;
    const { lecturerId, targetIndustry } = req.body; 
    // targetIndustry is only sent if they want a tailored letter

    // First, check if the student is premium
    db.get(`SELECT tier FROM users WHERE id = ?`, [studentId], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: 'Database error finding user.' });
        }

        // THE BUSINESS LOGIC:
        // If they are premium, we automatically flag it as expedited (jumps queue) 
        // and tailored (if they provided an industry).
        const isPremium = (user.tier === 'premium');
        const isExpedited = isPremium ? 1 : 0;
        const isTailored = (isPremium && targetIndustry) ? 1 : 0;
        const finalIndustry = isTailored ? targetIndustry : null;

        // Insert the request into the database
        db.run(
            `INSERT INTO letter_requests (student_id, lecturer_id, is_expedited, is_tailored, target_industry) 
             VALUES (?, ?, ?, ?, ?)`,
            [studentId, lecturerId, isExpedited, isTailored, finalIndustry],
            function(err) {
                if (err) {
                    console.error("Letter Request Error:", err);
                    return res.status(500).json({ error: 'Failed to submit letter request.' });
                }

                // Log to audit trail
                db.run(`INSERT INTO audit_log (actor_id, action, details) VALUES (?, ?, ?)`, 
                    [studentId, 'REQUEST_LETTER', `Requested letter. Expedited: ${isExpedited}, Tailored: ${isTailored}`]);

                res.json({ 
                    success: true, 
                    message: "Letter requested successfully.",
                    isExpedited: isExpedited,
                    isTailored: isTailored
                });
            }
        );
    });
});

// ==========================================
// 3. MOCK LOGIN ENDPOINT (For the frontend)
// ==========================================
app.post('/api/login', (req, res) => {
    const { email } = req.body;

    // For this demo, we just check if the email exists. 
    // If not, we create a dummy account so the login always succeeds.
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        if (!user) {
            db.run(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`, 
                ['Test Student', email || 'student@test.com', 'dummy_hash', 'student'], 
                function(err) {
                    if (err) return res.status(500).json({ error: 'Failed to create user' });
                    req.session.userId = this.lastID;
                    req.session.role = 'student';
                    res.json({ success: true });
                }
            );
        } else {
            req.session.userId = user.id;
            req.session.role = user.role;
            res.json({ success: true });
        }
    });
});

// ==========================================
// START THE SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'pages', 'profile.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database connection established.`);
});
