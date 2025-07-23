#!/bin/bash

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git, Node.js and other tools
apt-get install -y git htop nginx nodejs npm

# Start services
systemctl start docker
systemctl enable docker
systemctl start nginx
systemctl enable nginx

# Create application user
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Create application directory
mkdir -p /opt/disability-pension
chown deploy:deploy /opt/disability-pension

# Get external IP
EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")

# Create a simple Node.js application
su - deploy << 'EOF'
cd /opt/disability-pension

# Create a simple Express.js application
cat > package.json << 'PACKAGE_EOF'
{
  "name": "disability-pension-system",
  "version": "1.0.0",
  "description": "Disability Pension Management System",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "sqlite3": "^5.1.6",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
PACKAGE_EOF

# Create the main application file
cat > index.js << 'APP_EOF'
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'disability-pension-secret-key-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./disability_pension.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_number TEXT UNIQUE NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_name_kana TEXT NOT NULL,
      birth_date DATE NOT NULL,
      gender TEXT NOT NULL,
      phone_number TEXT,
      email TEXT,
      disability_type TEXT NOT NULL,
      disability_grade INTEGER,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT OR IGNORE INTO users (email, password, name, role) 
    VALUES ('admin@disability-pension.jp', ?, '管理者', 'admin')
  `, [adminPassword]);

  // Create sample applications
  db.run(`
    INSERT OR IGNORE INTO applications (
      application_number, applicant_name, applicant_name_kana, 
      birth_date, gender, disability_type, disability_grade, created_by
    ) VALUES 
    ('DP202401001', '田中太郎', 'タナカタロウ', '1980-05-15', 'male', 'physical', 2, 1),
    ('DP202401002', '佐藤花子', 'サトウハナコ', '1975-08-22', 'female', 'mental', 1, 1),
    ('DP202401003', '山田次郎', 'ヤマダジロウ', '1990-03-10', 'male', 'intellectual', 3, 1)
  `);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '障害年金管理システム API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      applications: '/api/applications'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  });
});

// Applications endpoints
app.get('/api/applications', authenticateToken, (req, res) => {
  db.all(`
    SELECT a.*, u.name as created_by_name 
    FROM applications a 
    LEFT JOIN users u ON a.created_by = u.id 
    ORDER BY a.created_at DESC
  `, (err, applications) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ applications });
  });
});

app.get('/api/applications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT a.*, u.name as created_by_name 
    FROM applications a 
    LEFT JOIN users u ON a.created_by = u.id 
    WHERE a.id = ?
  `, [id], (err, application) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ application });
  });
});

app.post('/api/applications', authenticateToken, (req, res) => {
  const {
    applicant_name,
    applicant_name_kana,
    birth_date,
    gender,
    phone_number,
    email,
    disability_type,
    disability_grade
  } = req.body;

  // Generate application number
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  db.get('SELECT COUNT(*) as count FROM applications WHERE strftime("%Y", created_at) = ?', [year.toString()], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const count = result.count + 1;
    const application_number = `DP${year}${month}${String(count).padStart(5, '0')}`;

    db.run(`
      INSERT INTO applications (
        application_number, applicant_name, applicant_name_kana,
        birth_date, gender, phone_number, email,
        disability_type, disability_grade, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      application_number, applicant_name, applicant_name_kana,
      birth_date, gender, phone_number, email,
      disability_type, disability_grade, req.user.id
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.status(201).json({
        message: 'Application created successfully',
        application_id: this.lastID,
        application_number
      });
    });
  });
});

// Statistics endpoint
app.get('/api/applications/statistics/overview', authenticateToken, (req, res) => {
  db.all(`
    SELECT 
      status,
      COUNT(*) as count
    FROM applications 
    GROUP BY status
  `, (err, statusStats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    db.all(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM applications 
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `, (err, monthlyStats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        statusStats,
        monthlyStats
      });
    });
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
APP_EOF

# Install dependencies
npm install

# Create public directory and simple HTML
mkdir -p public

cat > public/index.html << 'HTML_EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>障害年金管理システム</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; }
    </style>
</head>
<body class="bg-gray-100">
    <div id="app">
        <nav class="bg-blue-600 text-white p-4">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-xl font-bold">障害年金管理システム</h1>
                <div id="user-info" class="hidden">
                    <span id="username"></span>
                    <button onclick="logout()" class="ml-4 bg-red-500 hover:bg-red-600 px-3 py-1 rounded">ログアウト</button>
                </div>
            </div>
        </nav>

        <!-- Login Form -->
        <div id="login-form" class="container mx-auto mt-8 max-w-md">
            <div class="bg-white p-8 rounded-lg shadow-md">
                <h2 class="text-2xl font-bold mb-6 text-center">ログイン</h2>
                <form onsubmit="login(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-bold mb-2">メールアドレス</label>
                        <input type="email" id="email" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-bold mb-2">パスワード</label>
                        <input type="password" id="password" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                        ログイン
                    </button>
                </form>
                <div class="mt-4 p-4 bg-gray-50 rounded">
                    <h3 class="font-bold text-sm">テストアカウント:</h3>
                    <p class="text-sm">メール: admin@disability-pension.jp</p>
                    <p class="text-sm">パスワード: admin123</p>
                </div>
            </div>
        </div>

        <!-- Dashboard -->
        <div id="dashboard" class="hidden container mx-auto mt-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-bold text-gray-700">総申請数</h3>
                    <p id="total-applications" class="text-3xl font-bold text-blue-600">-</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-bold text-gray-700">審査中</h3>
                    <p id="under-review" class="text-3xl font-bold text-yellow-600">-</p>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <h3 class="text-lg font-bold text-gray-700">承認済み</h3>
                    <p id="approved" class="text-3xl font-bold text-green-600">-</p>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-md">
                <div class="p-6 border-b">
                    <h2 class="text-xl font-bold">申請一覧</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請番号</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請者名</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">障害種別</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">等級</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                            </tr>
                        </thead>
                        <tbody id="applications-table" class="bg-white divide-y divide-gray-200">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentUser = null;
        let authToken = null;

        // Check if user is already logged in
        window.onload = function() {
            const token = localStorage.getItem('authToken');
            if (token) {
                authToken = token;
                showDashboard();
                loadApplications();
                loadStatistics();
            }
        };

        async function login(event) {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    currentUser = data.user;
                    authToken = data.token;
                    localStorage.setItem('authToken', authToken);
                    showDashboard();
                    loadApplications();
                    loadStatistics();
                } else {
                    alert('ログインに失敗しました: ' + data.error);
                }
            } catch (error) {
                alert('エラーが発生しました: ' + error.message);
            }
        }

        function logout() {
            currentUser = null;
            authToken = null;
            localStorage.removeItem('authToken');
            showLogin();
        }

        function showLogin() {
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('user-info').classList.add('hidden');
        }

        function showDashboard() {
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('user-info').classList.remove('hidden');
            if (currentUser) {
                document.getElementById('username').textContent = currentUser.name;
            }
        }

        async function loadApplications() {
            try {
                const response = await fetch('/api/applications', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    const tbody = document.getElementById('applications-table');
                    tbody.innerHTML = '';

                    data.applications.forEach(app => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${app.application_number}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${app.applicant_name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${getDisabilityTypeText(app.disability_type)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${app.disability_grade || '-'}級</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(app.status)}">
                                    ${getStatusText(app.status)}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(app.created_at)}</td>
                        `;
                        tbody.appendChild(row);
                    });

                    document.getElementById('total-applications').textContent = data.applications.length;
                }
            } catch (error) {
                console.error('Error loading applications:', error);
            }
        }

        async function loadStatistics() {
            try {
                const response = await fetch('/api/applications/statistics/overview', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    const underReview = data.statusStats.find(s => s.status === 'under_review');
                    const approved = data.statusStats.find(s => s.status === 'approved');

                    document.getElementById('under-review').textContent = underReview ? underReview.count : 0;
                    document.getElementById('approved').textContent = approved ? approved.count : 0;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        }

        function getDisabilityTypeText(type) {
            const types = {
                'physical': '身体障害',
                'mental': '精神障害',
                'intellectual': '知的障害',
                'multiple': '重複障害'
            };
            return types[type] || type;
        }

        function getStatusText(status) {
            const statuses = {
                'draft': '下書き',
                'submitted': '提出済み',
                'under_review': '審査中',
                'approved': '承認済み',
                'rejected': '却下',
                'withdrawn': '取り下げ'
            };
            return statuses[status] || status;
        }

        function getStatusColor(status) {
            const colors = {
                'draft': 'bg-gray-100 text-gray-800',
                'submitted': 'bg-blue-100 text-blue-800',
                'under_review': 'bg-yellow-100 text-yellow-800',
                'approved': 'bg-green-100 text-green-800',
                'rejected': 'bg-red-100 text-red-800',
                'withdrawn': 'bg-gray-100 text-gray-800'
            };
            return colors[status] || 'bg-gray-100 text-gray-800';
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('ja-JP');
        }
    </script>
</body>
</html>
HTML_EOF

# Start the application
nohup npm start > app.log 2>&1 &

EOF

# Configure Nginx reverse proxy
cat > /etc/nginx/sites-available/disability-pension << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Health check endpoint
    location /nginx-health {
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/disability-pension /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Install and configure Cloud Logging agent
curl -sSO https://dl.google.com/cloudagents/add-logging-agent-repo.sh
bash add-logging-agent-repo.sh --also-install

# Final setup completion log
echo "Startup script completed successfully at $(date)" >> /var/log/startup.log
echo "Application should be available at http://$EXTERNAL_IP" >> /var/log/startup.log