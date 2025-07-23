const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'disability-pension-secret-key-2024';

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    },
  },
}));
app.use(compression());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create tables with enhanced schema (original + spouse + children)
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Applications table with spouse info added
  db.run(`
    CREATE TABLE applications (
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
      
      -- 配偶者情報の追加
      spouse_name TEXT,
      spouse_name_kana TEXT,
      spouse_birth_date DATE,
      spouse_mynumber TEXT,
      spouse_pension_number TEXT,
      
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Children table
  db.run(`
    CREATE TABLE children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      name_kana TEXT NOT NULL,
      birth_date DATE NOT NULL,
      mynumber TEXT,
      order_num INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
    )
  `);

  // Create default admin user
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`
    INSERT INTO users (email, password, name, role) 
    VALUES ('admin@disability-pension.jp', ?, '管理者', 'admin')
  `, [adminPassword]);

  // Create sample applications with spouse and children data
  db.run(`
    INSERT INTO applications (
      application_number, applicant_name, applicant_name_kana, 
      birth_date, gender, phone_number, email, disability_type, disability_grade,
      spouse_name, spouse_name_kana, spouse_birth_date, spouse_mynumber, spouse_pension_number,
      created_by
    ) VALUES 
    (
      'DP202401001', '田中太郎', 'タナカタロウ', '1980-05-15', 'male', 
      '090-1234-5678', 'tanaka@example.com', 'physical', 2,
      '田中花子', 'タナカハナコ', '1982-08-20', '123456789012', '1234-567890',
      1
    ),
    (
      'DP202401002', '佐藤花子', 'サトウハナコ', '1975-08-22', 'female',
      '080-9876-5432', 'sato@example.com', 'mental', 1,
      '佐藤次郎', 'サトウジロウ', '1973-03-10', '098765432109', '0987-654321',
      1
    ),
    (
      'DP202401003', '山田次郎', 'ヤマダジロウ', '1990-03-10', 'male',
      '070-1111-2222', 'yamada@example.com', 'intellectual', 3,
      NULL, NULL, NULL, NULL, NULL,
      1
    )
  `);

  // Insert sample children data
  db.run(`
    INSERT INTO children (application_id, name, name_kana, birth_date, mynumber, order_num)
    VALUES 
    (1, '田中一郎', 'タナカイチロウ', '2010-04-15', '111222333444', 1),
    (1, '田中二郎', 'タナカジロウ', '2012-07-20', '222333444555', 2),
    (2, '佐藤三郎', 'サトウサブロウ', '2008-12-05', '333444555666', 1)
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

// Health check for Cloud Run
app.get('/_ah/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
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

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
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

// Applications endpoints with enhanced data
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

    // Get children data
    db.all(`
      SELECT * FROM children 
      WHERE application_id = ? 
      ORDER BY order_num
    `, [id], (err, children) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ 
        application: {
          ...application,
          children
        }
      });
    });
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
    disability_grade,
    spouse_name,
    spouse_name_kana,
    spouse_birth_date,
    spouse_mynumber,
    spouse_pension_number,
    children
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
        disability_type, disability_grade,
        spouse_name, spouse_name_kana, spouse_birth_date, spouse_mynumber, spouse_pension_number,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      application_number, applicant_name, applicant_name_kana,
      birth_date, gender, phone_number, email,
      disability_type, disability_grade,
      spouse_name, spouse_name_kana, spouse_birth_date, spouse_mynumber, spouse_pension_number,
      req.user.id
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const applicationId = this.lastID;

      // Insert children data if provided
      if (children && Array.isArray(children) && children.length > 0) {
        const insertChildren = (index = 0) => {
          if (index >= children.length) {
            return res.status(201).json({
              message: 'Application created successfully',
              application_id: applicationId,
              application_number
            });
          }

          const child = children[index];
          db.run(`
            INSERT INTO children (application_id, name, name_kana, birth_date, mynumber, order_num)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            applicationId, child.name, child.name_kana, child.birth_date, child.mynumber, index + 1
          ], (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error inserting child data' });
            }
            insertChildren(index + 1);
          });
        };

        insertChildren();
      } else {
        res.status(201).json({
          message: 'Application created successfully',
          application_id: applicationId,
          application_number
        });
      }
    });
  });
});

// Update application
app.put('/api/applications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    applicant_name,
    applicant_name_kana,
    birth_date,
    gender,
    phone_number,
    email,
    disability_type,
    disability_grade,
    spouse_name,
    spouse_name_kana,
    spouse_birth_date,
    spouse_mynumber,
    spouse_pension_number,
    children,
    status
  } = req.body;

  db.run(`
    UPDATE applications SET
      applicant_name = ?, applicant_name_kana = ?, birth_date = ?, gender = ?,
      phone_number = ?, email = ?, disability_type = ?, disability_grade = ?,
      spouse_name = ?, spouse_name_kana = ?, spouse_birth_date = ?,
      spouse_mynumber = ?, spouse_pension_number = ?, status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    applicant_name, applicant_name_kana, birth_date, gender,
    phone_number, email, disability_type, disability_grade,
    spouse_name, spouse_name_kana, spouse_birth_date,
    spouse_mynumber, spouse_pension_number, status,
    id
  ], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Update children data
    if (children && Array.isArray(children)) {
      // Delete existing children
      db.run('DELETE FROM children WHERE application_id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error updating children data' });
        }

        // Insert updated children
        if (children.length > 0) {
          const insertChildren = (index = 0) => {
            if (index >= children.length) {
              return res.json({ message: 'Application updated successfully' });
            }

            const child = children[index];
            db.run(`
              INSERT INTO children (application_id, name, name_kana, birth_date, mynumber, order_num)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              id, child.name, child.name_kana, child.birth_date, child.mynumber, index + 1
            ], (err) => {
              if (err) {
                return res.status(500).json({ error: 'Error inserting child data' });
              }
              insertChildren(index + 1);
            });
          };

          insertChildren();
        } else {
          res.json({ message: 'Application updated successfully' });
        }
      });
    } else {
      res.json({ message: 'Application updated successfully' });
    }
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
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`障害年金管理システム running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown for Cloud Run
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});