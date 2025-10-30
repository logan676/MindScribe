# GitHub Actions Workflows

This directory contains CI/CD workflows for the MindScribe project.

## Workflows

### 1. `ci.yml` - Continuous Integration
**Triggers:** On push and pull requests to `main` and `develop`

**Purpose:** Ensures code quality before merging
- Lints both frontend and backend code
- Runs TypeScript type checking
- Builds both applications
- Runs tests (when implemented)
- Uploads build artifacts

**Duration:** ~3-5 minutes

---

### 2. `docker-build.yml` - Docker Build & Push
**Triggers:** On push to `main` branch

**Purpose:** Builds and pushes Docker images to Amazon ECR
- Builds optimized Docker images
- Tags images with git SHA and timestamp
- Pushes to Amazon ECR
- Uses GitHub cache for faster builds
- Comments deployment info on commits

**Duration:** ~5-8 minutes

**Required Secrets:**
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REPOSITORY_BACKEND`
- `ECR_REPOSITORY_FRONTEND`
- `VITE_API_URL` (optional)

---

### 3. `deploy-ecs.yml` - Deploy to AWS ECS
**Triggers:** After successful Docker build, or manually

**Purpose:** Deploys new Docker images to ECS Fargate
- Updates ECS services with latest images
- Waits for deployment to stabilize
- Runs health checks
- Automatically rolls back on failure
- Comments deployment status

**Duration:** ~5-10 minutes

**Required Secrets:**
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECS_CLUSTER`
- `ECS_SERVICE_BACKEND`
- `ECS_SERVICE_FRONTEND`
- `ECR_REPOSITORY_BACKEND`
- `ECR_REPOSITORY_FRONTEND`

---

### 4. `security-scan.yml` - Security & Dependency Scanning
**Triggers:** Daily at 2 AM UTC, on PRs, or manually

**Purpose:** Monitors security vulnerabilities
- Audits npm dependencies (frontend + backend)
- Scans for secrets in code
- Reports vulnerabilities
- Generates security summary

**Duration:** ~2-3 minutes

---

## Setup Instructions

### 1. Enable GitHub Actions
Go to: Repository → Actions → Enable workflows

### 2. Add Required Secrets
Go to: Repository → Settings → Secrets and variables → Actions

Click "New repository secret" and add:

**AWS Credentials:**
```
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
```

**ECR Repositories:**
```
ECR_REPOSITORY_BACKEND = mindscribe/backend
ECR_REPOSITORY_FRONTEND = mindscribe/frontend
```

**ECS Configuration:**
```
ECS_CLUSTER = mindscribe-cluster
ECS_SERVICE_BACKEND = mindscribe-backend
ECS_SERVICE_FRONTEND = mindscribe-frontend
```

**Application Configuration:**
```
VITE_API_URL = http://YOUR_BACKEND_IP:3001/api
```

### 3. Create AWS Infrastructure
Follow the instructions in `AWS_FREE_TIER_DEPLOYMENT.md`

### 4. Test Workflows
Create a pull request to test the CI workflow, then merge to `main` to trigger the full deployment pipeline.

---

## Workflow Diagram

```
Push to Branch
      ↓
   CI Workflow
   (lint, build, test)
      ↓
   PR Merged to Main
      ↓
   Docker Build Workflow
   (build & push to ECR)
      ↓
   Deploy ECS Workflow
   (update services, health check)
      ↓
   Production Live ✅
```

---

## Cost Estimate

**GitHub Actions (Free Tier):**
- Public repos: Unlimited minutes
- Private repos: 2,000 minutes/month

**Estimated Monthly Usage:**
- CI: ~100 minutes
- Docker Build: ~80 minutes
- Deploy ECS: ~50 minutes
- Security Scan: ~90 minutes
- **Total: ~380 minutes/month** (well within free tier)

---

## Troubleshooting

### Workflow Fails: "AWS credentials not configured"
- Verify secrets are set correctly in repository settings
- Check IAM user has necessary permissions (ECS, ECR, EC2)

### Workflow Fails: "Unable to locate credentials"
- Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Verify the IAM user still exists and credentials are valid

### Docker Build Fails: "denied: Your authorization token has expired"
- ECR login tokens expire after 12 hours
- The workflow automatically refreshes tokens, but check if AWS credentials are valid

### ECS Deployment Hangs
- Check ECS service health in AWS Console
- Verify security groups allow necessary traffic
- Check CloudWatch logs for container errors

---

## Manual Deployment

To manually trigger a deployment:

1. Go to: Repository → Actions
2. Select "Docker Build & Push to ECR" workflow
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow" button

After Docker build completes, the ECS deployment will trigger automatically.

---

## Notifications (Optional)

To receive deployment notifications:

1. Add Slack webhook URL as secret: `SLACK_WEBHOOK_URL`
2. Add notification step to workflows (see GitHub Actions Marketplace)

---

## Best Practices

1. **Always test in PR first** - The CI workflow catches issues before merge
2. **Monitor deployments** - Check GitHub Actions tab after merging
3. **Review security scan results** - Act on critical vulnerabilities quickly
4. **Keep secrets updated** - Rotate AWS credentials periodically
5. **Use staging environment** - Test major changes in staging before production

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS GitHub Actions](https://github.com/aws-actions)
- [Docker Build and Push Action](https://github.com/docker/build-push-action)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
