# BAUST Alumni Dashboard - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the BAUST Alumni Management Admin Dashboard to production or development environments.

## Pre-Deployment Checklist

- [ ] Node.js 18.0.0 or higher installed
- [ ] All dependencies installed (`npm install`)
- [ ] Backend server tested locally
- [ ] Admin login credentials verified
- [ ] All features tested per TESTING_CHECKLIST.md
- [ ] Database initialized with sample data
- [ ] Environment variables configured
- [ ] SSL certificate ready (for HTTPS production)

## Vercel Authentication Requirement

Vercel functions are stateless and their local filesystem is temporary. Configure a persistent MongoDB connection before deploying if users must register and log in across requests.

In Vercel Project Settings, add:

```text
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

The application uses the MongoDB `User` collection when `MONGODB_URI` is available. Without it, JSON storage is only a local-development fallback and newly registered Vercel users will not persist reliably between function invocations.

## Deployment Methods

### Method 1: Local Development (Fastest)

**Duration:** 2 minutes  
**Complexity:** Very Easy  
**Best For:** Development, testing, small groups

```bash
# 1. Navigate to project root
cd c:\alumni-management-system

# 2. Install dependencies (first time only)
npm install

# 3. Start the server
npm start

# 4. Access the application
# Open browser: http://localhost:5000/site/index3.html
# Login: admin / 1234
```

### Method 2: Windows Service (Recommended for Production)

**Duration:** 10 minutes  
**Complexity:** Moderate  
**Best For:** Production on Windows Server

```powershell
# 1. Install nssm (Node Service Service Manager)
# Download from: https://nssm.cc/download
# Add nssm.exe to system PATH

# 2. Create Windows service
nssm install AlumniDashboard "C:\nodejs\node.exe" "C:\alumni-management-system\backend\server.js"

# 3. Configure service
nssm set AlumniDashboard AppDirectory C:\alumni-management-system
nssm set AlumniDashboard AppStdout C:\alumni-management-system\logs\app.log
nssm set AlumniDashboard AppStderr C:\alumni-management-system\logs\error.log

# 4. Start the service
net start AlumniDashboard

# 5. Verify service is running
tasklist | findstr node

# 6. Access application
# Navigate to: http://localhost:5000/site/index3.html
```

### Method 3: Docker Container (Cloud Deployment)

**Duration:** 15 minutes  
**Complexity:** Moderate  
**Best For:** Docker, Kubernetes, cloud deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application
COPY . .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "backend/server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  alumni-dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    volumes:
      - ./BAUST/BAUST/data:/app/BAUST/BAUST/data
    restart: unless-stopped
```

#### 3. Deploy with Docker

```bash
# Build image
docker build -t baust-alumni-dashboard .

# Run container
docker run -d -p 5000:5000 --name alumni-dashboard baust-alumni-dashboard

# Or use docker-compose
docker-compose up -d
```

### Method 4: Linux/Ubuntu Server (Production)

**Duration:** 20 minutes  
**Complexity:** Moderate  
**Best For:** Linux VPS, dedicated server

```bash
# 1. Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone or upload project
cd /var/www
git clone <repository-url> alumni-dashboard
# OR upload files to /var/www/alumni-dashboard

# 3. Install dependencies
cd /var/www/alumni-dashboard
npm install --production

# 4. Create PM2 ecosystem file (pm2.config.js)
cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'alumni-dashboard',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# 5. Install and start PM2
sudo npm install -g pm2
pm2 start pm2.config.js
pm2 save
pm2 startup

# 6. Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/alumni-dashboard
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name alumni.baust.edu.bd;

    # Redirect HTTP to HTTPS (for production)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/alumni-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Method 5: Heroku Cloud Deployment

**Duration:** 10 minutes  
**Complexity:** Easy  
**Best For:** Quick cloud deployment

#### 1. Install Heroku CLI
Download from: https://devcenter.heroku.com/articles/heroku-cli

#### 2. Create Procfile
```
web: node backend/server.js
```

#### 3. Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create alumni-dashboard

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Post-Deployment Configuration

### 1. Update Configuration Files

Edit `.env` or configuration files:
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni
```

### 2. Initialize Database

If using fresh installation:
```bash
# Database will auto-initialize with sample data
# Check BAUST/BAUST/data/ directory for:
# - alumni.json
# - events.json
# - news.json
# - settings.json
```

### 3. Verify Installation

```bash
# Check server is running
curl http://localhost:5000/

# Test admin login
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"1234"}'

# Should return a token
```

### 4. Setup SSL Certificate (HTTPS)

For production, use Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d alumni.baust.edu.bd

# Configure automatic renewal
sudo systemctl enable certbot.timer
```

## Production Best Practices

### 1. Security Hardening

```bash
# Update npm packages
npm update

# Audit dependencies
npm audit fix

# Run security scan
npm audit
```

### 2. Performance Optimization

- Enable gzip compression in Nginx
- Use CDN for static files
- Enable browser caching
- Use connection pooling
- Implement rate limiting

### 3. Monitoring & Logging

```bash
# Setup PM2 monitoring
pm2 monit

# Check logs
pm2 logs alumni-dashboard

# System monitoring
htop  # CPU, Memory, Process monitoring
```

### 4. Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/alumni-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp -r /var/www/alumni-dashboard/BAUST/BAUST/data $BACKUP_DIR/data_$DATE
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/data_$DATE

# Retain last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### 5. Maintenance

**Weekly:**
- Review error logs
- Check disk space
- Verify backups completed

**Monthly:**
- Update packages: `npm update`
- Review security patches
- Test disaster recovery
- Check performance metrics

**Quarterly:**
- Full security audit
- Performance optimization review
- Database optimization
- Documentation update

## Rollback Procedure

If deployment fails:

```bash
# Stop current service
pm2 stop alumni-dashboard

# Restore from backup
cp -r /backups/alumni-dashboard/data_[TIMESTAMP] \
      /var/www/alumni-dashboard/BAUST/BAUST/data

# Restart service
pm2 start alumni-dashboard

# Verify
curl http://localhost:5000/site/index3.html
```

## Troubleshooting Deployment

### Server Won't Start
```bash
# Check port is available
netstat -tuln | grep 5000

# Check for errors
npm start 2>&1 | head -50

# Try different port
PORT=8000 npm start
```

### Connection Refused
```bash
# Verify service is running
pm2 list
netstat -tuln | grep 5000

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp
```

### High Memory Usage
```bash
# Check memory
free -h
# or
pm2 monit

# Restart service to free memory
pm2 restart alumni-dashboard
```

### Database Connection Issues
```bash
# Check data files exist
ls -la BAUST/BAUST/data/

# Check permissions
chmod 755 BAUST/BAUST/data/
chmod 644 BAUST/BAUST/data/*.json
```

## Monitoring & Alerts

### Setup Health Checks

Create health check endpoint:

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});
```

Monitor with external service:
- Uptime Robot: https://uptimerobot.com
- Pingdom: https://www.pingdom.com
- StatusPage: https://www.statuspage.io

## Scaling for High Traffic

### Horizontal Scaling (Multiple Servers)

1. **Load Balancer (Nginx)**
```nginx
upstream alumni_backend {
    server 192.168.1.10:5000;
    server 192.168.1.11:5000;
    server 192.168.1.12:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://alumni_backend;
    }
}
```

2. **Shared Database**
- Use MongoDB Atlas (cloud)
- Or shared PostgreSQL instance
- Implement connection pooling

3. **Session Management**
- Use Redis for session storage
- Or database sessions
- Ensure tokens are consistent across servers

## Disaster Recovery Plan

### Recovery Point Objective (RPO): 1 day
### Recovery Time Objective (RTO): 4 hours

**Backup Retention:**
- Daily: 7 days
- Weekly: 4 weeks
- Monthly: 12 months

**Recovery Steps:**
1. Restore database from latest backup
2. Restart application services
3. Run health checks
4. Verify data integrity
5. Notify administrators

## Documentation

For more information:
- [Project README](./PROJECT_README.md) - Overview
- [Admin Panel Guide](./ADMIN_PANEL_README.md) - User manual
- [Implementation Report](./IMPLEMENTATION_REPORT.md) - Technical details
- [Testing Checklist](./TESTING_CHECKLIST.md) - Testing procedures

## Support & Contact

- **Email:** admin@baust.edu.bd
- **Phone:** +88-01234-567890
- **Website:** www.baust.edu.bd
- **GitHub:** https://github.com/baust/alumni-dashboard

## Deployment Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] SSL certificate installed
- [ ] Firewall rules configured
- [ ] Backup system active
- [ ] Monitoring configured
- [ ] Health checks enabled
- [ ] Documentation reviewed
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Performance meets targets
- [ ] Stakeholders notified
- [ ] Support team trained

---

**Version:** 1.0.0  
**Last Updated:** August 15, 2026  
**Status:** ✅ Ready for Deployment
