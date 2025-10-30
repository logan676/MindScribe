# Production Deployment Strategy for MindScribe

## Executive Summary

This document provides production-ready deployment recommendations for MindScribe, a HIPAA-compliant mental health clinical notes assistant. Given the sensitive nature of PHI (Protected Health Information), security and compliance are paramount.

## Deployment Options Comparison

| Option | Monthly Cost | Setup Time | HIPAA Ready | Scalability | Recommended For |
|--------|-------------|------------|-------------|-------------|-----------------|
| Railway | $20-50 | 30 min | ⚠️ Limited | Low | MVP/Testing |
| DigitalOcean App Platform | $40-60 | 2 hours | ⚠️ Partial | Medium | Small Practice |
| DigitalOcean VPS + Docker | $35-75 | 4 hours | ✅ Yes* | Medium | Cost-conscious |
| AWS ECS + RDS | $145-250 | 1 day | ✅ Yes | High | Enterprise |
| Google Cloud Run + SQL | $120-200 | 1 day | ✅ Yes | High | Enterprise |

*With proper configuration and BAA

---

## Option 1: AWS Deployment (RECOMMENDED FOR PRODUCTION)

### Why AWS?
- ✅ **HIPAA Compliant** - AWS will sign BAA (Business Associate Agreement)
- ✅ **Enterprise-grade security** - VPC isolation, encryption, audit logs
- ✅ **Scalability** - Auto-scaling, load balancing
- ✅ **Reliability** - 99.99% SLA, multi-AZ deployment
- ✅ **Monitoring** - CloudWatch, X-Ray, CloudTrail
- ✅ **Backup & DR** - Automated RDS backups, S3 versioning

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53 (DNS)                        │
│              app.mindscribe.com, api.mindscribe.com         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                 │
│                  SSL/TLS Termination                         │
│              (ACM Certificate - FREE)                        │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Target Group 1     │      │   Target Group 2     │
│   Frontend (Nginx)   │      │   Backend (Node.js)  │
└──────────┬───────────┘      └──────────┬───────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   ECS Fargate        │      │   ECS Fargate        │
│   Frontend Service   │      │   Backend Service    │
│   (2 tasks min)      │      │   (2 tasks min)      │
│   Auto-scaling       │      │   Auto-scaling       │
└──────────────────────┘      └──────────┬───────────┘
                                         │
                              ┌──────────┴────────────┐
                              │                       │
                              ▼                       ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  RDS PostgreSQL │    │   S3 Bucket     │
                    │   Multi-AZ      │    │  Audio Uploads  │
                    │   Encrypted     │    │   Encrypted     │
                    │  Auto Backups   │    │   Versioning    │
                    └─────────────────┘    └─────────────────┘
```

### AWS Deployment Steps

#### 1. Prerequisites Setup
```bash
# Install AWS CLI
brew install awscli  # macOS
aws configure

# Install ECS CLI (optional)
brew install amazon-ecs-cli
```

#### 2. Create RDS PostgreSQL Database
```bash
# Via AWS Console or CLI:
aws rds create-db-instance \
  --db-instance-identifier mindscribe-prod-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 14.9 \
  --master-username mindscribe_admin \
  --master-user-password 'YOUR_SECURE_PASSWORD' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 30 \
  --multi-az \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name mindscribe-db-subnet \
  --publicly-accessible false \
  --enable-cloudwatch-logs-exports '["postgresql"]'
```

**Configuration:**
- Instance: `db.t3.small` (2 vCPU, 2GB RAM) - ~$50/month
- Multi-AZ for high availability
- Automated daily backups (30-day retention)
- Encryption at rest enabled
- CloudWatch logs enabled

#### 3. Create ECR Repositories
```bash
# Create repositories for Docker images
aws ecr create-repository --repository-name mindscribe/backend
aws ecr create-repository --repository-name mindscribe/frontend

# Get login command
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

#### 4. Build and Push Docker Images
```bash
cd /Users/HONGBGU/Documents/NovoPsych

# Backend
cd server
docker build -t mindscribe/backend:latest .
docker tag mindscribe/backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mindscribe/backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mindscribe/backend:latest

# Frontend
cd ../client
docker build --build-arg VITE_API_URL=https://api.yourdomain.com/api -t mindscribe/frontend:latest .
docker tag mindscribe/frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mindscribe/frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mindscribe/frontend:latest
```

#### 5. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name mindscribe-prod
```

#### 6. Create Task Definitions

**Backend Task Definition** (`backend-task-def.json`):
```json
{
  "family": "mindscribe-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/mindscribeTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mindscribe/backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {"name": "PGHOST", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:mindscribe/db/host"},
        {"name": "PGPASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:mindscribe/db/password"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:mindscribe/jwt"},
        {"name": "ASSEMBLYAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:mindscribe/assemblyai"},
        {"name": "DEEPSEEK_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT:secret:mindscribe/deepseek"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mindscribe-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

#### 7. Create Application Load Balancer
```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name mindscribe-alb \
  --subnets subnet-xxxxxx subnet-yyyyyy \
  --security-groups sg-xxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target groups
aws elbv2 create-target-group \
  --name mindscribe-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxxxxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30

aws elbv2 create-target-group \
  --name mindscribe-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxxxxxxx \
  --target-type ip \
  --health-check-path /

# Request SSL certificate from ACM (FREE)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com api.yourdomain.com \
  --validation-method DNS

# Create HTTPS listener (after certificate validation)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 8. Create ECS Services
```bash
# Backend service
aws ecs create-service \
  --cluster mindscribe-prod \
  --service-name backend \
  --task-definition mindscribe-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001" \
  --health-check-grace-period-seconds 60

# Frontend service
aws ecs create-service \
  --cluster mindscribe-prod \
  --service-name frontend \
  --task-definition mindscribe-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=80"
```

#### 9. Configure Auto Scaling
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/mindscribe-prod/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# CPU-based scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/mindscribe-prod/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

#### 10. Set Up CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name mindscribe-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=backend Name=ClusterName,Value=mindscribe-prod

# Database connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name mindscribe-db-connections \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### Cost Breakdown (AWS)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| RDS PostgreSQL | db.t3.small, Multi-AZ, 100GB | $50 |
| ECS Fargate | 4 tasks (0.5 vCPU, 1GB each) | $60 |
| Application Load Balancer | Standard | $20 |
| S3 (uploads + backups) | 100GB storage + requests | $10 |
| CloudWatch Logs | 10GB/month | $5 |
| Data Transfer | 100GB outbound | $9 |
| Secrets Manager | 10 secrets | $4 |
| **Total** | | **~$158/month** |

**Scaling costs:**
- Add $30 per additional ECS task
- Add $25 per RDS instance size upgrade

---

## Option 2: DigitalOcean Droplet with Docker (COST-EFFECTIVE)

### Why DigitalOcean VPS?
- ✅ **Cost-effective** - Full control for $35-75/month
- ✅ **Simple** - Use existing Docker Compose setup
- ✅ **HIPAA possible** - With BAA and proper configuration
- ✅ **Full control** - Root access, custom configurations

### Recommended Specifications

**Production Droplet:**
- **4GB RAM, 2 vCPU, 80GB SSD** - $24/month
- **Managed PostgreSQL** - $15/month (1GB RAM)
- **Block Storage** - $10/month (100GB for backups)
- **Total: ~$49/month**

### Deployment Steps

#### 1. Create Droplet
```bash
# Via DigitalOcean Console:
# - Ubuntu 22.04 LTS
# - 4GB RAM / 2 vCPU
# - San Francisco datacenter (or closest to users)
# - Enable monitoring
# - Add SSH key
```

#### 2. Initial Server Setup
```bash
# SSH into server
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker compose version

# Install fail2ban (SSH protection)
apt install fail2ban -y
systemctl enable fail2ban

# Set up firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Create non-root user
adduser mindscribe
usermod -aG docker mindscribe
usermod -aG sudo mindscribe
```

#### 3. Deploy Application
```bash
# Switch to app user
su - mindscribe

# Clone repository
git clone https://github.com/yourusername/mindscribe.git
cd mindscribe

# Create production .env file
cat > .env << 'EOF'
# Database (use managed PostgreSQL connection string)
POSTGRES_PASSWORD=your_secure_password
PGHOST=managed-db-postgresql-sfo3-xxxx.ondigitalocean.com
PGPORT=25060
PGDATABASE=mindscribe
PGUSER=doadmin
PGPASSWORD=your_db_password

# API Keys
ASSEMBLYAI_API_KEY=your_key
DEEPSEEK_API_KEY=your_key

# Security
JWT_SECRET=$(openssl rand -hex 32)

# Application
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com/api
CORS_ORIGIN=https://yourdomain.com
EOF

# Start services
docker compose up -d

# Verify services
docker compose ps
docker compose logs -f
```

#### 4. Set Up Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/mindscribe
```

```nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    # Rate limiting for API
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

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

        # Upload size limit
        client_max_body_size 500M;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mindscribe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Set Up SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### 6. Set Up Automated Backups
```bash
# Create backup script
cat > /home/mindscribe/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/mindscribe/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup (adjust connection details)
PGPASSWORD=$PGPASSWORD pg_dump -h $PGHOST -U $PGUSER -p $PGPORT $PGDATABASE | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Upload files backup
docker run --rm -v mindscribe_uploads:/uploads -v $BACKUP_DIR:/backup ubuntu tar czf /backup/uploads_$TIMESTAMP.tar.gz -C /uploads .

# Upload to DigitalOcean Spaces (optional - S3-compatible)
# s3cmd put $BACKUP_DIR/*.gz s3://your-backup-bucket/mindscribe/

# Keep last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
EOF

chmod +x /home/mindscribe/backup.sh

# Schedule daily backups (2 AM)
crontab -e
# Add: 0 2 * * * /home/mindscribe/backup.sh >> /home/mindscribe/backup.log 2>&1
```

#### 7. Set Up Monitoring
```bash
# Create health check script
cat > /home/mindscribe/monitor.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3001/health/detailed"
LOG_FILE="/home/mindscribe/monitor.log"

response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ $response -ne 200 ]; then
    echo "[$timestamp] ALERT: Health check failed with status $response" >> $LOG_FILE
    # Restart services
    cd /home/mindscribe/mindscribe
    docker compose restart
    # Send alert (configure email)
    # echo "MindScribe health check failed" | mail -s "MindScribe Alert" admin@yourdomain.com
else
    echo "[$timestamp] OK: Health check passed" >> $LOG_FILE
fi
EOF

chmod +x /home/mindscribe/monitor.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /home/mindscribe/monitor.sh
```

### DigitalOcean Cost Breakdown

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| Droplet | 4GB RAM, 2 vCPU, 80GB SSD | $24 |
| Managed PostgreSQL | 1GB RAM, 10GB storage | $15 |
| Block Storage | 100GB (backups) | $10 |
| Spaces (optional) | 250GB storage | $5 |
| **Total** | | **$49-54/month** |

---

## Option 3: Railway (QUICK MVP)

### Quick Deploy
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd server
railway init
railway up

# Deploy frontend
cd ../client
railway init
railway up

# Add PostgreSQL
railway add

# Set environment variables in Railway dashboard
```

**Pros:**
- ⚡ Fastest deployment (30 minutes)
- 🚀 Auto-deployments from GitHub
- 💰 Generous free tier ($5 credit)

**Cons:**
- ⚠️ Limited HIPAA compliance
- 💸 Can get expensive at scale
- 🔒 Less control over infrastructure

---

## Critical Production Checklist

### Security (HIPAA Compliance)

- [ ] **Get BAA from cloud provider** (AWS, DigitalOcean, GCP)
- [ ] **Enable encryption at rest** (database, file storage)
- [ ] **Enable encryption in transit** (SSL/TLS, HTTPS)
- [ ] **Implement audit logging** (already in Winston logs)
- [ ] **Set up access controls** (IAM roles, least privilege)
- [ ] **Enable MFA** for all administrative access
- [ ] **Configure firewall rules** (whitelist only necessary ports)
- [ ] **Implement rate limiting** (prevent abuse)
- [ ] **Regular security updates** (automated patching)
- [ ] **Data retention policy** (document and implement)
- [ ] **Incident response plan** (document procedures)
- [ ] **Regular security audits** (quarterly reviews)

### Environment Variables (Production)

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Required production variables:
NODE_ENV=production
PORT=3001
PGHOST=your-db-host
PGPORT=5432
PGDATABASE=mindscribe
PGUSER=mindscribe_app
PGPASSWORD=your_secure_password
JWT_SECRET=your_generated_secret
ASSEMBLYAI_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=500000000
LOG_LEVEL=info
```

### Monitoring & Alerting

**Must-have monitoring:**
1. **Uptime monitoring** - UptimeRobot (free), Pingdom
2. **Error tracking** - Sentry, Rollbar
3. **Performance monitoring** - New Relic, Datadog
4. **Log aggregation** - AWS CloudWatch, Papertrail, Loggly

**Key metrics to monitor:**
- API response times (p95, p99)
- Error rates (4xx, 5xx)
- Database connection pool usage
- CPU and memory utilization
- Disk space usage
- Failed transcription jobs
- Failed AI note generation attempts

### Backup Strategy

**Database backups:**
- Daily automated backups (retention: 30 days)
- Weekly full backups (retention: 90 days)
- Transaction log backups (continuous)
- Test restore quarterly

**File backups (audio uploads):**
- Daily incremental backups
- Weekly full backups
- Off-site backup location
- Encryption for backups

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 1 hour

**DR Plan:**
1. Maintain multi-region database replicas (AWS RDS Read Replicas)
2. Store backups in different geographic region
3. Document and test recovery procedures quarterly
4. Maintain infrastructure-as-code (Terraform/CloudFormation)

---

## Recommended Deployment Path

### Phase 1: Launch (Week 1)
1. Deploy to **DigitalOcean Droplet** (cost-effective, full control)
2. Use managed PostgreSQL database
3. Set up SSL with Let's Encrypt
4. Configure automated backups
5. Set up basic monitoring (UptimeRobot + health checks)

### Phase 2: Secure (Week 2-3)
1. Sign BAA with DigitalOcean
2. Implement comprehensive audit logging
3. Set up WAF (Web Application Firewall)
4. Enable database encryption
5. Configure MFA for all admin access
6. Security audit and penetration testing

### Phase 3: Scale (Month 2-3)
1. Migrate to AWS ECS + RDS (if growth requires)
2. Implement auto-scaling
3. Add Redis for caching and job queues
4. Set up CDN (CloudFront/Cloudflare)
5. Implement advanced monitoring (Datadog/New Relic)
6. Add load testing and performance optimization

---

## Next Steps

**Immediate actions:**
1. Choose deployment platform based on your budget and requirements
2. Set up domain and DNS
3. Obtain API keys (AssemblyAI, DeepSeek)
4. Configure environment variables
5. Deploy using provided instructions
6. Test all critical user flows
7. Set up monitoring and alerts
8. Schedule first backup test

**Within 30 days:**
1. Sign BAA with cloud provider
2. Complete security audit
3. Document incident response procedures
4. Set up DR testing schedule
5. Implement comprehensive monitoring

**Support:**
For deployment assistance, consult:
- DEPLOYMENT.md (existing detailed guide)
- Platform-specific documentation (AWS, DO, Railway)
- HIPAA compliance checklists
- Security best practices guides
