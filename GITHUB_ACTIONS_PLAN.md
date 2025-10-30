# GitHub Actions CI/CD Plan for MindScribe

## Overview

This document outlines how GitHub Actions can automate testing, building, and deployment for the MindScribe project.

---

## 🎯 What GitHub Actions Can Do For Us

### 1. **Continuous Integration (CI)**
- ✅ **Automated Testing**: Run tests on every PR and commit
- ✅ **Code Quality**: Lint and type-check TypeScript code
- ✅ **Build Verification**: Ensure both frontend and backend build successfully
- ✅ **Dependency Auditing**: Check for security vulnerabilities
- ✅ **Branch Protection**: Prevent merging broken code

### 2. **Continuous Deployment (CD)**
- ✅ **Automated Deployment to AWS**: Deploy to ECS on merge to main
- ✅ **Docker Image Building**: Build and push images to Amazon ECR
- ✅ **Database Migrations**: Run migrations automatically on deployment
- ✅ **Environment Management**: Deploy to staging/production environments
- ✅ **Rollback Support**: Easy rollback if deployment fails

### 3. **Code Quality & Security**
- ✅ **ESLint & Prettier**: Auto-format and lint on PR
- ✅ **TypeScript Type Checking**: Catch type errors before merge
- ✅ **Dependency Security Scanning**: Detect vulnerable packages
- ✅ **Code Coverage Reports**: Track test coverage over time
- ✅ **HIPAA Compliance Checks**: Validate security best practices

### 4. **Automation & Developer Experience**
- ✅ **Auto-Label PRs**: Label PRs based on changed files
- ✅ **Comment Deployment URLs**: Post deployment URL in PR comments
- ✅ **Deployment Status Badges**: Show build/deployment status
- ✅ **Notify on Failures**: Slack/Discord notifications
- ✅ **Scheduled Jobs**: Daily security scans, backups

---

## 📋 Proposed GitHub Actions Workflows

### **Workflow 1: CI - Code Quality & Testing**
**Trigger**: On every push and pull request
**File**: `.github/workflows/ci.yml`

#### Steps:
1. **Checkout code**
2. **Setup Node.js 20**
3. **Install dependencies** (frontend + backend)
4. **Run ESLint** on both projects
5. **Run TypeScript type checking**
6. **Build frontend** (`npm run build`)
7. **Build backend** (`npm run build`)
8. **Run tests** (when implemented)
9. **Upload coverage reports**

#### Benefits:
- Catches bugs before code review
- Ensures code meets quality standards
- Prevents broken builds from being merged
- Fast feedback loop (runs in ~3-5 minutes)

---

### **Workflow 2: Docker Build & Push to ECR**
**Trigger**: On push to main branch
**File**: `.github/workflows/docker-build.yml`

#### Steps:
1. **Checkout code**
2. **Configure AWS credentials** (using GitHub Secrets)
3. **Login to Amazon ECR**
4. **Build Docker images** (frontend + backend)
5. **Tag images** with git SHA and `latest`
6. **Push images to ECR**
7. **Comment on PR/commit** with image tags

#### Benefits:
- Automated Docker image creation
- Immutable image tags for rollback
- Faster deployments (images pre-built)
- Version tracking via git SHA

---

### **Workflow 3: Deploy to AWS ECS**
**Trigger**: On push to main branch (after Docker build)
**File**: `.github/workflows/deploy-ecs.yml`

#### Steps:
1. **Checkout code**
2. **Configure AWS credentials**
3. **Update ECS task definition** with new image
4. **Run database migrations** (via ECS task)
5. **Deploy to ECS** (rolling update)
6. **Wait for deployment** to stabilize
7. **Run smoke tests** on deployed service
8. **Comment deployment status** on commit
9. **Rollback if health checks fail**

#### Benefits:
- Zero-downtime deployments
- Automated rollback on failure
- Deployment visibility in GitHub
- Consistent deployment process

---

### **Workflow 4: Security & Dependency Scanning**
**Trigger**: Daily at 2 AM UTC, and on PR
**File**: `.github/workflows/security-scan.yml`

#### Steps:
1. **Checkout code**
2. **Run npm audit** for both projects
3. **Run OWASP Dependency Check**
4. **Scan for secrets** (API keys in code)
5. **Check for outdated dependencies**
6. **Create security issues** if vulnerabilities found

#### Benefits:
- Proactive security monitoring
- HIPAA compliance support
- Prevents secrets leakage
- Keeps dependencies updated

---

### **Workflow 5: Database Backup & Maintenance**
**Trigger**: Daily at 3 AM UTC
**File**: `.github/workflows/db-backup.yml`

#### Steps:
1. **Configure AWS credentials**
2. **Trigger RDS snapshot** via AWS CLI
3. **Verify snapshot created**
4. **Delete snapshots older than 30 days**
5. **Upload backup logs** to S3
6. **Send notification** on failure

#### Benefits:
- Automated daily backups
- Disaster recovery ready
- Compliance with HIPAA retention
- Cost control (auto-cleanup old backups)

---

### **Workflow 6: PR Preview Deployments** (Optional)
**Trigger**: On pull request
**File**: `.github/workflows/pr-preview.yml`

#### Steps:
1. **Build Docker images** for PR
2. **Deploy to staging environment**
3. **Run E2E tests** on preview
4. **Comment preview URL** on PR
5. **Destroy environment** on PR close

#### Benefits:
- Test features before merging
- Review UI changes in real environment
- Catch integration issues early
- Better code review experience

---

## 🔐 Required GitHub Secrets

To enable these workflows, add these secrets to your GitHub repository:

### AWS Credentials
```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
ECR_REPOSITORY_BACKEND=mindscribe/backend
ECR_REPOSITORY_FRONTEND=mindscribe/frontend
ECS_CLUSTER=mindscribe-prod
ECS_SERVICE_BACKEND=backend
ECS_SERVICE_FRONTEND=frontend
```

### Application Secrets
```
ASSEMBLYAI_API_KEY=...
DEEPSEEK_API_KEY=...
JWT_SECRET=...
POSTGRES_PASSWORD=...
```

### Optional (Notifications)
```
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Developer Workflow                  │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────┐
         │  git push origin feature-branch  │
         └─────────────────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────┐
         │     GitHub Actions Triggered     │
         └─────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│  Workflow 1: CI      │      │ Workflow 4: Security │
│  - Lint              │      │ - npm audit          │
│  - Type check        │      │ - Secret scan        │
│  - Build             │      │ - OWASP check        │
│  - Test              │      └──────────────────────┘
└──────────────────────┘
          │
          ▼ (All checks pass)
┌──────────────────────┐
│  PR Approved & Merged│
└──────────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│        Push to Main Branch            │
└──────────────────────────────────────┘
          │
          ├────────────────┬─────────────────┐
          ▼                ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────┐
│ Workflow 2:     │ │ Workflow 3:  │ │ Workflow 5: │
│ Docker Build    │ │ Deploy ECS   │ │ DB Backup   │
│ - Build images  │ │ - Update task│ │ (Daily 3AM) │
│ - Push to ECR   │ │ - Migrate DB │ │ - Snapshot  │
└─────────────────┘ │ - Deploy     │ │ - Cleanup   │
                    │ - Health check│ └─────────────┘
                    └──────────────┘
                          │
                          ▼
               ┌──────────────────┐
               │  Production Live  │
               │  ✅ Deployed     │
               └──────────────────┘
```

---

## 🎯 Implementation Priority

### Phase 1: Essential CI/CD (Week 1)
1. ✅ **Workflow 1**: CI - Code Quality & Testing
2. ✅ **Workflow 2**: Docker Build & Push to ECR
3. ✅ **Workflow 3**: Deploy to AWS ECS

### Phase 2: Security & Reliability (Week 2)
4. ✅ **Workflow 4**: Security & Dependency Scanning
5. ✅ **Workflow 5**: Database Backup & Maintenance

### Phase 3: Enhanced Developer Experience (Week 3+)
6. ✅ **Workflow 6**: PR Preview Deployments (Optional)
7. ✅ Add deployment notifications (Slack/Discord)
8. ✅ Add automated release notes generation
9. ✅ Add performance monitoring alerts

---

## 💰 GitHub Actions Cost Estimate

### Free Tier (Public Repo)
- ✅ **Unlimited minutes** for public repositories
- ✅ **2,000 minutes/month** for private repositories
- ✅ **500MB artifact storage**

### Estimated Usage (Private Repo)
| Workflow | Frequency | Duration | Monthly Minutes |
|----------|-----------|----------|-----------------|
| CI | ~20 PRs | 5 min | 100 min |
| Docker Build | ~10 merges | 8 min | 80 min |
| Deploy ECS | ~10 merges | 5 min | 50 min |
| Security Scan | Daily | 3 min | 90 min |
| DB Backup | Daily | 2 min | 60 min |
| **Total** | | | **380 min/month** |

**Result**: Well within free tier limit (2,000 min/month)

---

## 🚀 Getting Started

### Step 1: Create `.github/workflows` directory
```bash
mkdir -p .github/workflows
```

### Step 2: Add workflow files
We'll create these files in the next step:
- `ci.yml`
- `docker-build.yml`
- `deploy-ecs.yml`
- `security-scan.yml`
- `db-backup.yml`

### Step 3: Configure GitHub Secrets
Go to: Repository → Settings → Secrets and variables → Actions

### Step 4: Enable Actions
Go to: Repository → Actions → Enable workflows

### Step 5: Create first PR to test CI
Make a small change and create a PR to verify the CI workflow runs

---

## 📈 Success Metrics

After implementing GitHub Actions:
- ✅ **Deployment time**: Reduced from ~30 min manual → ~10 min automated
- ✅ **Bug detection**: Catch 80%+ of bugs before production
- ✅ **Code quality**: Consistent formatting and linting
- ✅ **Security**: Zero-day vulnerability detection
- ✅ **Developer happiness**: Less time on deployments, more on features

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS GitHub Actions](https://github.com/aws-actions)
- [Docker Build and Push Action](https://github.com/docker/build-push-action)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## ✅ Next Steps

1. Review this plan and confirm which workflows to implement
2. Set up AWS infrastructure (ECS, ECR, RDS) using free tier
3. Configure GitHub Secrets with AWS credentials
4. Implement workflows one by one starting with CI
5. Test each workflow thoroughly
6. Document any project-specific adjustments

Ready to implement! 🚀
