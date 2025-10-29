# Deployment Guide

This guide covers deploying MindScribe to production environments, including cloud platforms, Docker, and traditional VPS setups.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Cloud Platform Deployment](#cloud-platform-deployment)
  - [Railway](#railway)
  - [DigitalOcean](#digitalocean)
  - [AWS](#aws)
  - [Google Cloud Platform](#google-cloud-platform)
- [Database Setup](#database-setup)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup Strategy](#backup-strategy)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **API Keys**:
   - AssemblyAI API key (https://www.assemblyai.com/)
   - DeepSeek API key (https://platform.deepseek.com/)

2. **Infrastructure**:
   - PostgreSQL 14+ database
   - Node.js 18+ runtime
   - Docker (optional, for containerized deployment)

3. **Domain** (for production):
   - DNS configured
   - SSL certificate (or use Let's Encrypt)

## Environment Configuration

### Required Environment Variables

Create a `.env` file based on `.env.docker`:

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=mindscribe
PGUSER=postgres

# API Keys
ASSEMBLYAI_API_KEY=your_assemblyai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key

# Security
JWT_SECRET=your_super_secure_random_jwt_secret_minimum_32_characters

# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
LOG_DIR=./logs

# Frontend API URL
VITE_API_URL=https://api.yourdomain.com/api

# CORS
CORS_ORIGIN=https://yourdomain.com

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=500000000
```

### Generating Secure Secrets

Generate a secure JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Docker Deployment

### Quick Start with Docker Compose

1. Clone the repository and navigate to the project directory
2. Copy and configure the environment file:

```bash
cp .env.docker .env
# Edit .env with your actual values
```

3. Build and start all services:

```bash
docker-compose up -d
```

4. Check service health:

```bash
docker-compose ps
docker-compose logs -f
```

5. Access the application:
   - Frontend: http://localhost
   - Backend: http://localhost:3001
   - Health check: http://localhost:3001/health/detailed

### Docker Compose Production Considerations

For production, modify `docker-compose.yml`:

1. **Use specific image tags** (not `latest`)
2. **Add resource limits**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

3. **Enable log rotation**:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

4. **Use secrets for sensitive data** (Docker Swarm/Kubernetes)

### Updating Docker Deployment

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
docker-compose logs -f
```

## Cloud Platform Deployment

### Railway

Railway offers one-click PostgreSQL and simple deployments.

1. **Install Railway CLI**:

```bash
npm install -g @railway/cli
railway login
```

2. **Initialize project**:

```bash
railway init
```

3. **Add PostgreSQL**:

```bash
railway add
# Select PostgreSQL
```

4. **Set environment variables**:

```bash
railway variables set ASSEMBLYAI_API_KEY=your_key
railway variables set DEEPSEEK_API_KEY=your_key
railway variables set JWT_SECRET=your_secret
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://your-app.up.railway.app
```

5. **Deploy**:

```bash
# Backend
cd server
railway up

# Frontend (separate service)
cd ../client
railway up
```

6. **Configure domains** in Railway dashboard

### DigitalOcean

Deploy using Docker on a DigitalOcean Droplet.

1. **Create Droplet**:
   - Choose Ubuntu 22.04 LTS
   - Minimum: 2 CPU, 2GB RAM
   - Enable monitoring

2. **SSH into droplet**:

```bash
ssh root@your_droplet_ip
```

3. **Install Docker**:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker compose version
```

4. **Clone repository**:

```bash
git clone https://github.com/yourusername/mindscribe.git
cd mindscribe
```

5. **Configure environment**:

```bash
cp .env.docker .env
nano .env  # Edit with your values
```

6. **Start services**:

```bash
docker compose up -d
```

7. **Set up Nginx reverse proxy** (see SSL section)

### AWS

Deploy using Amazon ECS (Elastic Container Service) with RDS PostgreSQL.

**High-level steps**:

1. Create RDS PostgreSQL instance
2. Create ECR repositories for backend and frontend
3. Build and push Docker images to ECR
4. Create ECS cluster and task definitions
5. Configure Application Load Balancer
6. Set up Auto Scaling
7. Configure CloudWatch for monitoring

**Detailed AWS guide**: See `docs/AWS_DEPLOYMENT.md` (to be created)

### Google Cloud Platform

Deploy using Cloud Run with Cloud SQL PostgreSQL.

**High-level steps**:

1. Create Cloud SQL PostgreSQL instance
2. Build and push to Container Registry
3. Deploy to Cloud Run
4. Configure Cloud Load Balancing
5. Set up Cloud Monitoring

**Detailed GCP guide**: See `docs/GCP_DEPLOYMENT.md` (to be created)

## Database Setup

### PostgreSQL Production Configuration

1. **Create dedicated database user**:

```sql
CREATE USER mindscribe_app WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mindscribe TO mindscribe_app;
```

2. **Enable connection pooling** (recommended: PgBouncer)

3. **Configure PostgreSQL for production** (`postgresql.conf`):

```ini
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

4. **Set up automated backups**:

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres mindscribe > $BACKUP_DIR/mindscribe_$TIMESTAMP.sql
gzip $BACKUP_DIR/mindscribe_$TIMESTAMP.sql
# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### Database Migrations

Run migrations after deployment:

```bash
# SSH into server
cd /path/to/mindscribe/server
npm run db:migrate
```

## SSL/HTTPS Configuration

### Using Let's Encrypt with Nginx

1. **Install Certbot**:

```bash
apt-get update
apt-get install certbot python3-certbot-nginx
```

2. **Create Nginx configuration** (`/etc/nginx/sites-available/mindscribe`):

```nginx
# Backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
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

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable configuration**:

```bash
ln -s /etc/nginx/sites-available/mindscribe /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

4. **Obtain SSL certificates**:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

5. **Auto-renewal** (Certbot sets this up automatically):

```bash
certbot renew --dry-run
```

## Monitoring and Logging

### Application Monitoring

1. **Health Check Endpoints**:
   - `/health` - Basic health check
   - `/health/detailed` - Comprehensive system metrics
   - `/health/ready` - Readiness probe
   - `/health/live` - Liveness probe

2. **Log Monitoring**:

Logs are stored in `server/logs/` with automatic rotation:
- `application-YYYY-MM-DD.log` - All logs (14 day retention)
- `error-YYYY-MM-DD.log` - Error logs only (30 day retention)

3. **Monitoring Tools** (recommendations):

**Option A: Self-hosted Stack**
- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Loki** - Log aggregation

**Option B: Cloud Services**
- **Datadog** - Full observability
- **New Relic** - APM and monitoring
- **Sentry** - Error tracking

### Setting Up Basic Monitoring Script

```bash
#!/bin/bash
# /usr/local/bin/monitor-mindscribe.sh

HEALTH_URL="http://localhost:3001/health/detailed"
ALERT_EMAIL="admin@yourdomain.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $response -ne 200 ]; then
    echo "MindScribe health check failed with status $response" | \
    mail -s "MindScribe Alert: Service Down" $ALERT_EMAIL
fi
```

Add to crontab:

```bash
*/5 * * * * /usr/local/bin/monitor-mindscribe.sh
```

## Backup Strategy

### Automated Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-mindscribe.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U postgres mindscribe | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Upload files backup
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /path/to/uploads

# Optional: Upload to S3
# aws s3 sync $BACKUP_DIR s3://your-backup-bucket/mindscribe/

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Schedule daily backups:

```bash
0 2 * * * /usr/local/bin/backup-mindscribe.sh
```

## Troubleshooting

### Common Issues

**Issue: Database connection fails**

```bash
# Check database is running
docker-compose ps postgres
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d mindscribe -c "SELECT 1"
```

**Issue: Frontend can't reach backend**

Check CORS and API URL configuration:
- Verify `CORS_ORIGIN` in backend `.env`
- Verify `VITE_API_URL` in frontend build

**Issue: High memory usage**

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart backend

# Check logs for memory leaks
docker-compose logs backend | grep "memory"
```

**Issue: Upload failures**

```bash
# Check upload directory permissions
ls -la /path/to/uploads

# Check disk space
df -h

# Check MAX_FILE_SIZE setting
```

### Log Analysis

```bash
# View recent errors
docker-compose logs --tail=100 backend | grep -i error

# Monitor logs in real-time
docker-compose logs -f backend

# Check health status
curl http://localhost:3001/health/detailed | jq
```

### Performance Issues

1. **Enable database query logging**:

```bash
# In database.ts, add query logging for development
pool.on('error', (err) => logger.error('Database error', { error: err }))
```

2. **Check API response times**:

```bash
# Test backend response time
time curl http://localhost:3001/health
```

3. **Monitor resource usage**:

```bash
# System resources
top
htop

# Docker resources
docker stats
```

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable database connection encryption
- [ ] Implement rate limiting
- [ ] Set up CORS properly
- [ ] Enable security headers (already configured in nginx.conf)
- [ ] Regular security updates
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Review and limit IAM permissions (cloud deployments)

## Post-Deployment

After successful deployment:

1. **Verify all endpoints**:

```bash
curl https://api.yourdomain.com/health/detailed
```

2. **Test critical user flows**:
   - User authentication
   - Session recording
   - Transcript generation
   - Note creation

3. **Set up monitoring alerts**

4. **Document your specific deployment configuration**

5. **Schedule regular maintenance windows**

## Support

For deployment issues:
- Check logs: `docker-compose logs -f`
- Review health checks: `/health/detailed`
- Consult troubleshooting section above
- Open an issue on GitHub

---

**Note**: This is a general deployment guide. Specific cloud platforms may have additional requirements or optimizations. Always review platform-specific documentation.
