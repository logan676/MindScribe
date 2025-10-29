# Production Deployment Checklist

Use this checklist before deploying MindScribe to production.

## Pre-Deployment

### Environment Configuration

- [ ] All environment variables configured in `.env`
- [ ] `NODE_ENV=production` set
- [ ] Strong JWT secret generated (min 32 characters)
- [ ] PostgreSQL password changed from default
- [ ] AssemblyAI API key configured
- [ ] DeepSeek API key configured
- [ ] CORS_ORIGIN set to production domain
- [ ] VITE_API_URL set to production API URL
- [ ] Upload directory path configured
- [ ] Log directory configured

### Security

- [ ] All default passwords changed
- [ ] Firewall configured (ports 80, 443, 22 only)
- [ ] SSH key-based authentication enabled
- [ ] fail2ban installed and configured
- [ ] SSL certificates obtained
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Rate limiting configured
- [ ] Database connections encrypted
- [ ] No sensitive data in logs

### Database

- [ ] PostgreSQL 14+ installed
- [ ] Database created (`mindscribe`)
- [ ] Database user created with appropriate permissions
- [ ] Database tables initialized (`npm run db:init`)
- [ ] Database backups configured
- [ ] Connection pooling configured (optional: PgBouncer)
- [ ] PostgreSQL performance tuning applied
- [ ] Test database connection from application

### Application Build

- [ ] Backend TypeScript compiled (`npm run build`)
- [ ] Frontend production build created (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console.log statements in production code
- [ ] Dependencies installed (production only)
- [ ] Docker images built and tested (if using Docker)

## Deployment

### Infrastructure

- [ ] Server provisioned (minimum 2 CPU, 2GB RAM)
- [ ] Docker and Docker Compose installed (if using containers)
- [ ] Node.js 18+ installed
- [ ] Nginx installed (if not using Docker nginx)
- [ ] Domain DNS configured
- [ ] SSL certificates configured
- [ ] Reverse proxy configured

### Application Deployment

- [ ] Code deployed to server
- [ ] Environment file copied and configured
- [ ] Dependencies installed
- [ ] Application started (Docker Compose or PM2)
- [ ] Services health check passing
- [ ] Frontend accessible via domain
- [ ] Backend API accessible
- [ ] Database migrations run

### Verification

- [ ] Health endpoint responding: `curl https://api.yourdomain.com/health`
- [ ] Detailed health check: `curl https://api.yourdomain.com/health/detailed`
- [ ] Frontend loads correctly
- [ ] User can register/login
- [ ] Session recording works
- [ ] Audio upload works
- [ ] Transcription processing works
- [ ] Clinical notes generation works
- [ ] Patient management works
- [ ] No console errors in browser
- [ ] No error logs on server

## Post-Deployment

### Monitoring

- [ ] Health check monitoring configured
- [ ] Error logging configured
- [ ] Log rotation configured
- [ ] Uptime monitoring set up (Uptime Robot, Pingdom, etc.)
- [ ] Error tracking configured (Sentry, optional)
- [ ] Performance monitoring configured (optional)
- [ ] Alerts configured (email, Slack, etc.)

### Backups

- [ ] Database backup script created
- [ ] Automated daily backups scheduled
- [ ] Backup verification tested
- [ ] Upload files backup configured
- [ ] Backup retention policy set (30 days recommended)
- [ ] Off-site backup storage configured (S3, etc.)
- [ ] Disaster recovery plan documented

### Maintenance

- [ ] System update schedule planned
- [ ] Maintenance window communicated
- [ ] Rollback plan documented
- [ ] Admin access documented
- [ ] Emergency contact list created

### Documentation

- [ ] Deployment configuration documented
- [ ] Custom environment variables documented
- [ ] Backup and restore procedures documented
- [ ] Troubleshooting guide created
- [ ] Runbook created for common operations

## Testing Checklist

### Functional Testing

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works (when implemented)
- [ ] Patient creation works
- [ ] Patient list displays correctly
- [ ] Session recording starts successfully
- [ ] Audio recording captures correctly
- [ ] Recording upload succeeds
- [ ] Transcription completes successfully
- [ ] Clinical notes generate correctly
- [ ] Notes can be edited
- [ ] Notes can be signed
- [ ] Search functionality works
- [ ] Dashboard displays data correctly

### Performance Testing

- [ ] Page load times acceptable (< 3 seconds)
- [ ] API response times acceptable (< 500ms)
- [ ] Large file uploads work (up to MAX_FILE_SIZE)
- [ ] Concurrent users supported (test with at least 10)
- [ ] Database queries optimized
- [ ] No memory leaks under load

### Security Testing

- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] CSRF protection enabled
- [ ] Authentication required for protected routes
- [ ] Authorization checks working
- [ ] File upload restrictions enforced
- [ ] Rate limiting working
- [ ] HTTPS enforced

## Launch Day

### Pre-Launch (1 hour before)

- [ ] All team members notified
- [ ] Final backup created
- [ ] All services healthy
- [ ] Monitoring dashboards open
- [ ] Support channels ready

### Launch

- [ ] DNS switched to production servers (if applicable)
- [ ] SSL certificates verified
- [ ] Health checks passing
- [ ] Critical user flows tested
- [ ] Team monitoring for issues

### Post-Launch (first 24 hours)

- [ ] Monitor error logs continuously
- [ ] Check health endpoints every 5 minutes
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Monitor database performance
- [ ] Check for any user-reported issues
- [ ] Verify backups running
- [ ] Document any issues encountered

## Emergency Contacts

```
Role                    | Name          | Contact
------------------------|---------------|------------------
Technical Lead          | [Name]        | [Email/Phone]
DevOps Engineer         | [Name]        | [Email/Phone]
Database Admin          | [Name]        | [Email/Phone]
Product Owner           | [Name]        | [Email/Phone]
Hosting Provider        | [Provider]    | [Support URL/Phone]
AssemblyAI Support      | AssemblyAI    | support@assemblyai.com
DeepSeek Support        | DeepSeek      | [Support contact]
```

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**:
   - [ ] Stop incoming traffic (maintenance mode)
   - [ ] Assess the issue severity
   - [ ] Notify all stakeholders

2. **Rollback Steps**:
   - [ ] Revert to previous Docker images: `docker-compose down && docker-compose up -d --build`
   - [ ] Restore database from backup if needed
   - [ ] Verify previous version is working
   - [ ] Update DNS if needed

3. **Post-Rollback**:
   - [ ] Document the issue
   - [ ] Plan fix and re-deployment
   - [ ] Communicate timeline to users

## Sign-Off

- [ ] Technical Lead approval: __________________ Date: __________
- [ ] Security review completed: ________________ Date: __________
- [ ] Product Owner approval: __________________ Date: __________
- [ ] Go-live authorized: ______________________ Date: __________

---

**Important Notes**:
- Keep this checklist updated as your deployment process evolves
- Review and test the rollback plan regularly
- Schedule a post-deployment retrospective to improve the process
- Document any deviations from this checklist and why they occurred
