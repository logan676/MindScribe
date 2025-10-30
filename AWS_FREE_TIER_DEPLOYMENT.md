# AWS Free-Tier Deployment Guide for MindScribe

## 🎯 Overview

This guide will help you deploy MindScribe to AWS using **100% FREE TIER** services for personal use. All commands use AWS CLI for automation.

### What You'll Get (FREE for 12 Months)
- ✅ **RDS PostgreSQL**: db.t3.micro (db.t2.micro in some regions), 20GB storage
- ✅ **ECS Fargate**: 20GB storage, limited compute hours
- ✅ **ECR**: 500MB storage
- ✅ **Application Load Balancer**: 750 hours/month (but costs $0.0225/hour after, ~$16/month)
- ✅ **Certificate Manager (ACM)**: FREE SSL certificates
- ✅ **CloudWatch Logs**: 5GB ingestion, 5GB archive
- ✅ **Data Transfer**: 15GB outbound/month

### ⚠️ Cost Warnings
Even with free tier, watch out for:
- **Application Load Balancer**: ~$16/month (NOT free tier eligible)
- **Data transfer**: Exceeding 15GB/month
- **RDS backups**: Exceeding 20GB backup storage
- **NAT Gateway**: $0.045/hour (~$32/month) if you use private subnets

### 💡 Cost-Optimized Architecture (Skip ALB)
**For truly $0 deployment**, we'll use:
- Public ECS tasks with direct access (no ALB)
- RDS in public subnet with security groups
- Total cost: **$0/month** (within free tier limits)

---

## 📋 Prerequisites

### 1. Install AWS CLI

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Verify installation:**
```bash
aws --version
# Output: aws-cli/2.x.x ...
```

### 2. Configure AWS CLI

```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: Get from IAM Console
- **AWS Secret Access Key**: Get from IAM Console
- **Default region**: `us-east-1` (best for free tier)
- **Default output format**: `json`

### 3. Install Additional Tools

```bash
# Install jq for JSON parsing
brew install jq  # macOS
sudo apt install jq  # Linux

# Install Docker (for building images)
brew install docker  # macOS (or Docker Desktop)
```

---

## 🚀 Deployment Steps

### Step 1: Set Environment Variables

Create a file `aws-deploy-config.sh`:

```bash
#!/bin/bash
# AWS Configuration
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT_NAME="mindscribe"

# Database Configuration
export DB_NAME="mindscribe"
export DB_USERNAME="mindscribe_admin"
export DB_PASSWORD="YOUR_SECURE_PASSWORD_HERE"  # Change this!
export DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible
export DB_ALLOCATED_STORAGE="20"  # Max free tier

# Application Configuration
export ASSEMBLYAI_API_KEY="your-assemblyai-key"
export DEEPSEEK_API_KEY="your-deepseek-key"
export JWT_SECRET=$(openssl rand -hex 32)

# ECS Configuration
export CLUSTER_NAME="${PROJECT_NAME}-cluster"
export SERVICE_BACKEND="${PROJECT_NAME}-backend"
export SERVICE_FRONTEND="${PROJECT_NAME}-frontend"

# ECR Repositories
export ECR_BACKEND="${PROJECT_NAME}/backend"
export ECR_FRONTEND="${PROJECT_NAME}/frontend"

echo "✅ Environment variables set"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
```

**Load the configuration:**
```bash
source aws-deploy-config.sh
```

---

### Step 2: Create VPC and Networking (Free Tier)

**Create VPC:**
```bash
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc}]" \
  --query 'Vpc.VpcId' \
  --output text)

echo "VPC ID: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id $VPC_ID \
  --enable-dns-hostnames
```

**Create Internet Gateway:**
```bash
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
  --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw}]" \
  --query 'InternetGateway.InternetGatewayId' \
  --output text)

aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID

echo "Internet Gateway ID: $IGW_ID"
```

**Create Public Subnets (2 AZs for high availability):**
```bash
echo "Creating Public Subnets..."

# Subnet 1 (us-east-1a)
SUBNET_1=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone ${AWS_REGION}a \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-1a}]" \
  --query 'Subnet.SubnetId' \
  --output text)

# Subnet 2 (us-east-1b)
SUBNET_2=$(aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone ${AWS_REGION}b \
  --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-1b}]" \
  --query 'Subnet.SubnetId' \
  --output text)

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute \
  --subnet-id $SUBNET_1 \
  --map-public-ip-on-launch

aws ec2 modify-subnet-attribute \
  --subnet-id $SUBNET_2 \
  --map-public-ip-on-launch

echo "Subnet 1: $SUBNET_1"
echo "Subnet 2: $SUBNET_2"
```

**Create Route Table:**
```bash
echo "Creating Route Table..."
ROUTE_TABLE=$(aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt}]" \
  --query 'RouteTable.RouteTableId' \
  --output text)

# Add route to Internet Gateway
aws ec2 create-route \
  --route-table-id $ROUTE_TABLE \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id $IGW_ID

# Associate with subnets
aws ec2 associate-route-table \
  --route-table-id $ROUTE_TABLE \
  --subnet-id $SUBNET_1

aws ec2 associate-route-table \
  --route-table-id $ROUTE_TABLE \
  --subnet-id $SUBNET_2

echo "Route Table: $ROUTE_TABLE"
```

**Save VPC configuration:**
```bash
cat > vpc-config.sh <<EOF
export VPC_ID="$VPC_ID"
export IGW_ID="$IGW_ID"
export SUBNET_1="$SUBNET_1"
export SUBNET_2="$SUBNET_2"
export ROUTE_TABLE="$ROUTE_TABLE"
EOF

echo "✅ VPC Configuration saved to vpc-config.sh"
```

---

### Step 3: Create Security Groups

**Database Security Group:**
```bash
echo "Creating Database Security Group..."
DB_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-db-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow PostgreSQL from ECS tasks (we'll update this later)
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/16

echo "Database SG: $DB_SG"
```

**ECS Tasks Security Group:**
```bash
echo "Creating ECS Security Group..."
ECS_SG=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP from anywhere (backend API)
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0

# Allow HTTP from anywhere (frontend)
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

echo "ECS SG: $ECS_SG"
```

**Save security group IDs:**
```bash
cat >> vpc-config.sh <<EOF
export DB_SG="$DB_SG"
export ECS_SG="$ECS_SG"
EOF
```

---

### Step 4: Create RDS PostgreSQL Database (Free Tier)

**Create DB Subnet Group:**
```bash
echo "Creating DB Subnet Group..."
aws rds create-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet \
  --db-subnet-group-description "Subnet group for MindScribe RDS" \
  --subnet-ids $SUBNET_1 $SUBNET_2 \
  --tags Key=Name,Value=${PROJECT_NAME}-db-subnet
```

**Create RDS Instance (Free Tier - db.t3.micro, 20GB):**
```bash
echo "Creating RDS PostgreSQL instance (this takes ~10 minutes)..."
aws rds create-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.9 \
  --master-username $DB_USERNAME \
  --master-user-password $DB_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids $DB_SG \
  --db-subnet-group-name ${PROJECT_NAME}-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --storage-encrypted \
  --copy-tags-to-snapshot \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --publicly-accessible \
  --tags Key=Name,Value=${PROJECT_NAME}-db Key=Environment,Value=production
```

**Wait for DB to be available:**
```bash
echo "Waiting for RDS instance to be available (this takes ~10 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier ${PROJECT_NAME}-db

echo "✅ RDS instance is now available!"
```

**Get RDS Endpoint:**
```bash
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Database Endpoint: $DB_ENDPOINT"

# Save to config
cat >> vpc-config.sh <<EOF
export DB_ENDPOINT="$DB_ENDPOINT"
EOF
```

**Test database connection:**
```bash
# Install PostgreSQL client if not already installed
# brew install postgresql  # macOS
# sudo apt install postgresql-client  # Linux

psql "postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME" -c "SELECT version();"
```

---

### Step 5: Create ECR Repositories

```bash
echo "Creating ECR repositories..."

# Backend repository
aws ecr create-repository \
  --repository-name $ECR_BACKEND \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Name,Value=${PROJECT_NAME}-backend

# Frontend repository
aws ecr create-repository \
  --repository-name $ECR_FRONTEND \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Name,Value=${PROJECT_NAME}-frontend

echo "✅ ECR repositories created"

# Get ECR URIs
ECR_BACKEND_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND}"
ECR_FRONTEND_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND}"

echo "Backend ECR: $ECR_BACKEND_URI"
echo "Frontend ECR: $ECR_FRONTEND_URI"
```

---

### Step 6: Build and Push Docker Images

**Login to ECR:**
```bash
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
```

**Build and Push Backend:**
```bash
echo "Building backend Docker image..."
cd /Users/HONGBGU/Documents/NovoPsych/server

docker build -t $ECR_BACKEND:latest .
docker tag $ECR_BACKEND:latest $ECR_BACKEND_URI:latest
docker tag $ECR_BACKEND:latest $ECR_BACKEND_URI:$(git rev-parse --short HEAD)

docker push $ECR_BACKEND_URI:latest
docker push $ECR_BACKEND_URI:$(git rev-parse --short HEAD)

echo "✅ Backend image pushed to ECR"
```

**Build and Push Frontend:**
```bash
echo "Building frontend Docker image..."
cd /Users/HONGBGU/Documents/NovoPsych/client

# Build with production API URL
docker build \
  --build-arg VITE_API_URL=http://<BACKEND_PUBLIC_IP>:3001/api \
  -t $ECR_FRONTEND:latest .

docker tag $ECR_FRONTEND:latest $ECR_FRONTEND_URI:latest
docker tag $ECR_FRONTEND:latest $ECR_FRONTEND_URI:$(git rev-parse --short HEAD)

docker push $ECR_FRONTEND_URI:latest
docker push $ECR_FRONTEND_URI:$(git rev-parse --short HEAD)

echo "✅ Frontend image pushed to ECR"
```

---

### Step 7: Create ECS Cluster (Free Tier)

```bash
echo "Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE_SPOT,weight=1 \
    capacityProvider=FARGATE,weight=1 \
  --tags key=Name,value=$CLUSTER_NAME key=Environment,value=production

echo "✅ ECS Cluster created: $CLUSTER_NAME"
```

---

### Step 8: Create IAM Roles for ECS

**ECS Task Execution Role:**
```bash
echo "Creating ECS Task Execution Role..."

# Create trust policy
cat > ecs-trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --assume-role-policy-document file://ecs-trust-policy.json

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Get role ARN
EXECUTION_ROLE_ARN=$(aws iam get-role \
  --role-name ${PROJECT_NAME}-ecs-execution-role \
  --query 'Role.Arn' \
  --output text)

echo "Execution Role ARN: $EXECUTION_ROLE_ARN"
```

**ECS Task Role (for application):**
```bash
echo "Creating ECS Task Role..."

aws iam create-role \
  --role-name ${PROJECT_NAME}-ecs-task-role \
  --assume-role-policy-document file://ecs-trust-policy.json

# Get role ARN
TASK_ROLE_ARN=$(aws iam get-role \
  --role-name ${PROJECT_NAME}-ecs-task-role \
  --query 'Role.Arn' \
  --output text)

echo "Task Role ARN: $TASK_ROLE_ARN"

# Save to config
cat >> vpc-config.sh <<EOF
export EXECUTION_ROLE_ARN="$EXECUTION_ROLE_ARN"
export TASK_ROLE_ARN="$TASK_ROLE_ARN"
EOF
```

---

### Step 9: Create ECS Task Definitions

**Backend Task Definition:**
```bash
cat > backend-task-def.json <<EOF
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$EXECUTION_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ECR_BACKEND_URI}:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"},
        {"name": "PGHOST", "value": "$DB_ENDPOINT"},
        {"name": "PGPORT", "value": "5432"},
        {"name": "PGDATABASE", "value": "$DB_NAME"},
        {"name": "PGUSER", "value": "$DB_USERNAME"},
        {"name": "PGPASSWORD", "value": "$DB_PASSWORD"},
        {"name": "ASSEMBLYAI_API_KEY", "value": "$ASSEMBLYAI_API_KEY"},
        {"name": "DEEPSEEK_API_KEY", "value": "$DEEPSEEK_API_KEY"},
        {"name": "JWT_SECRET", "value": "$JWT_SECRET"},
        {"name": "CORS_ORIGIN", "value": "*"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}-backend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "backend",
          "awslogs-create-group": "true"
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
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://backend-task-def.json

echo "✅ Backend task definition registered"
```

**Frontend Task Definition:**
```bash
cat > frontend-task-def.json <<EOF
{
  "family": "${PROJECT_NAME}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "$EXECUTION_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${ECR_FRONTEND_URI}:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}-frontend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "frontend",
          "awslogs-create-group": "true"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 10
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json

echo "✅ Frontend task definition registered"
```

---

### Step 10: Create ECS Services

**Backend Service:**
```bash
echo "Creating backend ECS service..."
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_BACKEND \
  --task-definition ${PROJECT_NAME}-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --health-check-grace-period-seconds 60

echo "✅ Backend service created"
```

**Frontend Service:**
```bash
echo "Creating frontend ECS service..."
aws ecs create-service \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_FRONTEND \
  --task-definition ${PROJECT_NAME}-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}"

echo "✅ Frontend service created"
```

**Wait for services to stabilize:**
```bash
echo "Waiting for services to become stable (this takes ~3-5 minutes)..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_BACKEND $SERVICE_FRONTEND

echo "✅ Services are stable!"
```

---

### Step 11: Get Public IPs and Access Application

**Get Backend Public IP:**
```bash
BACKEND_TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_BACKEND \
  --query 'taskArns[0]' \
  --output text)

BACKEND_ENI=$(aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks $BACKEND_TASK_ARN \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

BACKEND_PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $BACKEND_ENI \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo "🚀 Backend URL: http://$BACKEND_PUBLIC_IP:3001"
echo "🚀 Health Check: http://$BACKEND_PUBLIC_IP:3001/health"
```

**Get Frontend Public IP:**
```bash
FRONTEND_TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER_NAME \
  --service-name $SERVICE_FRONTEND \
  --query 'taskArns[0]' \
  --output text)

FRONTEND_ENI=$(aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks $FRONTEND_TASK_ARN \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text)

FRONTEND_PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids $FRONTEND_ENI \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

echo "🚀 Frontend URL: http://$FRONTEND_PUBLIC_IP"
```

**Save URLs:**
```bash
cat >> vpc-config.sh <<EOF
export BACKEND_PUBLIC_IP="$BACKEND_PUBLIC_IP"
export FRONTEND_PUBLIC_IP="$FRONTEND_PUBLIC_IP"
EOF

echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Backend API: http://$BACKEND_PUBLIC_IP:3001"
echo "Frontend:    http://$FRONTEND_PUBLIC_IP"
echo ""
echo "Health Check: http://$BACKEND_PUBLIC_IP:3001/health"
echo "API Info:     http://$BACKEND_PUBLIC_IP:3001/api"
echo ""
echo "Configuration saved to: vpc-config.sh"
echo "=========================================="
```

---

## 📊 Free Tier Usage Monitoring

### Check Current Usage

```bash
# Check ECS Fargate usage
aws ecs list-tasks --cluster $CLUSTER_NAME

# Check RDS storage usage
aws rds describe-db-instances \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --query 'DBInstances[0].[AllocatedStorage,DBInstanceStatus]'

# Check ECR storage usage
aws ecr describe-repositories \
  --repository-names $ECR_BACKEND $ECR_FRONTEND
```

### Set Up Cost Alerts

```bash
# Create SNS topic for billing alerts
BILLING_TOPIC=$(aws sns create-topic \
  --name ${PROJECT_NAME}-billing-alerts \
  --query 'TopicArn' \
  --output text)

# Subscribe your email
aws sns subscribe \
  --topic-arn $BILLING_TOPIC \
  --protocol email \
  --notification-endpoint your-email@example.com

echo "✅ Billing alerts configured. Check your email to confirm subscription."
```

---

## 🔧 Management Commands

### View Logs

```bash
# Backend logs (last 100 lines)
aws logs tail /ecs/${PROJECT_NAME}-backend --follow

# Frontend logs
aws logs tail /ecs/${PROJECT_NAME}-frontend --follow

# Database logs
aws rds describe-db-log-files \
  --db-instance-identifier ${PROJECT_NAME}-db
```

### Update Application

```bash
# Rebuild and push new images
cd /Users/HONGBGU/Documents/NovoPsych/server
docker build -t $ECR_BACKEND_URI:latest .
docker push $ECR_BACKEND_URI:latest

# Force new deployment
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_BACKEND \
  --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_BACKEND
```

### Scale Services

```bash
# Scale up backend (still free if total < 1GB RAM)
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_BACKEND \
  --desired-count 2

# Scale down
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_BACKEND \
  --desired-count 1
```

---

## 🗑️ Cleanup (Delete Everything)

**Warning**: This will delete ALL resources and data!

```bash
#!/bin/bash
# cleanup-aws.sh

source vpc-config.sh
source aws-deploy-config.sh

echo "⚠️  This will DELETE all AWS resources!"
read -p "Are you sure? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cleanup cancelled."
  exit 0
fi

# Delete ECS Services
echo "Deleting ECS services..."
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_BACKEND --desired-count 0
aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_FRONTEND --desired-count 0
sleep 10
aws ecs delete-service --cluster $CLUSTER_NAME --service $SERVICE_BACKEND --force
aws ecs delete-service --cluster $CLUSTER_NAME --service $SERVICE_FRONTEND --force

# Delete ECS Cluster
echo "Deleting ECS cluster..."
aws ecs delete-cluster --cluster $CLUSTER_NAME

# Delete RDS Instance
echo "Deleting RDS instance..."
aws rds delete-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --skip-final-snapshot \
  --delete-automated-backups

# Delete DB Subnet Group (wait for RDS deletion first)
echo "Waiting for RDS deletion..."
aws rds wait db-instance-deleted --db-instance-identifier ${PROJECT_NAME}-db
aws rds delete-db-subnet-group --db-subnet-group-name ${PROJECT_NAME}-db-subnet

# Delete ECR Repositories
echo "Deleting ECR repositories..."
aws ecr delete-repository --repository-name $ECR_BACKEND --force
aws ecr delete-repository --repository-name $ECR_FRONTEND --force

# Delete Security Groups
echo "Deleting security groups..."
aws ec2 delete-security-group --group-id $ECS_SG
aws ec2 delete-security-group --group-id $DB_SG

# Delete Route Table Associations
echo "Deleting route table associations..."
aws ec2 disassociate-route-table --association-id $(aws ec2 describe-route-tables --route-table-ids $ROUTE_TABLE --query 'RouteTables[0].Associations[0].RouteTableAssociationId' --output text)
aws ec2 disassociate-route-table --association-id $(aws ec2 describe-route-tables --route-table-ids $ROUTE_TABLE --query 'RouteTables[0].Associations[1].RouteTableAssociationId' --output text)
aws ec2 delete-route-table --route-table-id $ROUTE_TABLE

# Delete Subnets
echo "Deleting subnets..."
aws ec2 delete-subnet --subnet-id $SUBNET_1
aws ec2 delete-subnet --subnet-id $SUBNET_2

# Detach and Delete Internet Gateway
echo "Deleting internet gateway..."
aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID

# Delete VPC
echo "Deleting VPC..."
aws ec2 delete-vpc --vpc-id $VPC_ID

# Delete IAM Roles
echo "Deleting IAM roles..."
aws iam detach-role-policy --role-name ${PROJECT_NAME}-ecs-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam delete-role --role-name ${PROJECT_NAME}-ecs-execution-role
aws iam delete-role --role-name ${PROJECT_NAME}-ecs-task-role

echo "✅ All AWS resources deleted!"
```

---

## 💰 Cost Summary

### Free Tier (First 12 Months)
- **RDS db.t3.micro**: FREE (750 hours/month)
- **RDS Storage**: FREE (20GB)
- **ECS Fargate**: FREE (limited compute)
- **ECR**: FREE (500MB)
- **CloudWatch Logs**: FREE (5GB)
- **Data Transfer**: FREE (15GB out/month)

### After Free Tier Expires
- RDS db.t3.micro: ~$15/month
- RDS storage (20GB): ~$2.30/month
- ECS Fargate: ~$10-20/month (depends on usage)
- **Total: ~$30-40/month**

### To Keep Costs at $0
- Stay within free tier limits
- Monitor usage regularly
- Delete resources when not in use
- Use FARGATE_SPOT for 70% savings

---

## 🔐 Security Best Practices

1. **Never commit secrets to git**
2. **Use AWS Secrets Manager** for sensitive data (costs $0.40/secret/month)
3. **Enable MFA** on your AWS account
4. **Rotate database password** regularly
5. **Review security groups** - only open necessary ports
6. **Enable CloudTrail** for audit logging (free tier: first copy of management events)
7. **Use HTTPS** in production (get free SSL via Route 53 + ACM)

---

## 📚 Next Steps

1. ✅ Deploy application using this guide
2. ⏭️ Set up domain name (Route 53: $0.50/month per hosted zone)
3. ⏭️ Configure SSL/TLS (ACM: FREE)
4. ⏭️ Set up CI/CD with GitHub Actions
5. ⏭️ Implement automated backups
6. ⏭️ Add monitoring and alerting
7. ⏭️ Test disaster recovery procedures

---

## 🆘 Troubleshooting

### Issue: Task fails to start
```bash
# Check task logs
aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks $(aws ecs list-tasks --cluster $CLUSTER_NAME --service-name $SERVICE_BACKEND --query 'taskArns[0]' --output text)
```

### Issue: Can't connect to RDS
```bash
# Verify security group allows connections
aws ec2 describe-security-groups --group-ids $DB_SG

# Test from ECS task
aws ecs execute-command \
  --cluster $CLUSTER_NAME \
  --task $BACKEND_TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/sh"
```

### Issue: Out of free tier
```bash
# Check billing dashboard
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-30 \
  --granularity MONTHLY \
  --metrics UnblendedCost
```

---

## 📞 Support

- AWS Free Tier FAQs: https://aws.amazon.com/free/
- AWS CLI Documentation: https://docs.aws.amazon.com/cli/
- ECS Documentation: https://docs.aws.amazon.com/ecs/
- RDS Documentation: https://docs.aws.amazon.com/rds/

**Ready to deploy!** 🚀
