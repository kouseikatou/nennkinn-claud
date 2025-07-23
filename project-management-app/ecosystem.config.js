// PM2 ecosystem configuration
module.exports = {
  apps: [
    {
      name: 'disability-pension-backend',
      script: './backend/src/index.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logging
      log_file: './backend/logs/combined.log',
      out_file: './backend/logs/out.log',
      error_file: './backend/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      max_memory_restart: '1G',
      
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/disability-pension-system.git',
      path: '/var/www/disability-pension-system',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};