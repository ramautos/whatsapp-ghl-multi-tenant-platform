// 🚨 EMERGENCY ADMIN ACCESS
// Endpoint temporal para garantizar acceso admin

const express = require('express');
const router = express.Router();

// ================================
// EMERGENCY LOGIN - ALWAYS WORKS
// ================================
router.post('/emergency-login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🚨 EMERGENCY LOGIN ATTEMPT:', { username, password });
        
        // Lista de credenciales válidas (hardcoded)
        const validLogins = [
            { user: 'admin', pass: 'admin2024' },
            { user: 'admin', pass: 'CloudeWA2024!' },
            { user: 'emergency', pass: 'emergency2024' },
            { user: 'root', pass: 'root2024' }
        ];
        
        const isValid = validLogins.some(login => 
            username === login.user && password === login.pass
        );
        
        if (isValid) {
            const token = Buffer.from(`${username}:${Date.now()}:emergency`).toString('base64');
            
            console.log('✅ EMERGENCY LOGIN SUCCESS:', username);
            
            res.json({
                success: true,
                message: 'Emergency login successful',
                token: token,
                user: { username: username, role: 'admin' },
                emergency: true
            });
        } else {
            console.log('❌ EMERGENCY LOGIN FAILED:', { username, password });
            res.status(401).json({
                success: false,
                error: 'Emergency login failed',
                attempted: { username, password }
            });
        }
        
    } catch (error) {
        console.error('💥 EMERGENCY LOGIN ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'Emergency login system error',
            details: error.message
        });
    }
});

// ================================
// EMERGENCY ADMIN PANEL ACCESS
// ================================
router.get('/emergency-panel', (req, res) => {
    const emergencyPanelHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>🚨 Emergency Admin Panel</title>
    <style>
        body { font-family: Arial; padding: 20px; background: #f0f0f0; }
        .panel { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="panel">
        <h1>🚨 Emergency Admin Access</h1>
        <div class="success">
            ✅ Emergency access granted!<br>
            🕒 ${new Date().toLocaleString()}<br>
            🔐 Admin privileges active
        </div>
        
        <h3>📊 Quick Actions:</h3>
        <button class="btn" onclick="window.open('/admin-super', '_blank')">🔧 Open Admin Super</button>
        <button class="btn" onclick="window.open('/dashboard', '_blank')">📱 Open Dashboard</button>
        <button class="btn" onclick="window.open('/api/health', '_blank')">💚 Check Health</button>
        
        <h3>🔍 System Status:</h3>
        <p><strong>Platform:</strong> WhatsApp-GHL Multi-tenant</p>
        <p><strong>Environment:</strong> Production</p>
        <p><strong>Access Level:</strong> Full Admin</p>
        
        <h3>🚀 Important URLs:</h3>
        <ul>
            <li><a href="/admin-super" target="_blank">Admin Super Panel</a></li>
            <li><a href="/dashboard/TEST_USER" target="_blank">Test Dashboard</a></li>
            <li><a href="/api/admin/stats" target="_blank">Admin Stats API</a></li>
        </ul>
        
        <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px;">
            <strong>⚠️ Security Note:</strong> Este es un acceso de emergencia temporal. 
            Las credenciales regulares deberían funcionar una vez que el deploy se complete.
        </div>
    </div>
</body>
</html>
    `;
    
    res.send(emergencyPanelHTML);
});

module.exports = router;