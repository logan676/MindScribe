#!/bin/bash
# AWS Configuration
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT_NAME="mindscribe"

# Database Configuration
export DB_NAME="mindscribe"
export DB_USERNAME="mindscribe_admin"
export DB_PASSWORD="MindScribe2025SecureDB!Pass"  # Change this if needed
export DB_INSTANCE_CLASS="db.t3.micro"  # Free tier eligible
export DB_ALLOCATED_STORAGE="20"  # Max free tier

# Application Configuration
export ASSEMBLYAI_API_KEY="e332636e5f094c909dddcb53cf9ae264"
export DEEPSEEK_API_KEY="sk-ab56aefd2b1a465691d77eef528c2cb5"
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
echo "Project Name: $PROJECT_NAME"
