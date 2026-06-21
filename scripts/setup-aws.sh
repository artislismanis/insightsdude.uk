#!/bin/bash

#
# AWS Setup Script for S3 + Amplify Hosting Deployment
#
# This script creates all AWS resources needed to deploy a static site:
# - S3 bucket (private, for storing site files)
# - Amplify app (for hosting via CloudFront CDN)
# - IAM policy and user (limited permissions for deployment)
#
# Prerequisites:
# - AWS CLI installed and configured with admin credentials
# - jq installed (for JSON parsing)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     AWS S3 + Amplify Hosting Setup Script                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"
  
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install it from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
  fi
  
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed${NC}"
    echo "Install it with: brew install jq (macOS) or apt install jq (Linux)"
    exit 1
  fi
  
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not configured or credentials are invalid${NC}"
    echo "Run: aws configure"
    exit 1
  fi
  
  echo -e "${GREEN}✓ All prerequisites met${NC}"
  echo ""
}

# Gather inputs
gather_inputs() {
  echo -e "${YELLOW}Please provide the following information:${NC}"
  echo ""
  
  # App/Site name
  read -p "Site/App name (e.g., my-blog): " APP_NAME
  if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}Error: App name is required${NC}"
    exit 1
  fi
  
  # S3 bucket name (suggest default)
  DEFAULT_BUCKET="${APP_NAME}-deploy"
  read -p "S3 bucket name [${DEFAULT_BUCKET}]: " BUCKET_NAME
  BUCKET_NAME=${BUCKET_NAME:-$DEFAULT_BUCKET}
  
  # AWS Region
  read -p "AWS Region [eu-west-2]: " REGION
  REGION=${REGION:-eu-west-2}
  
  # Amplify branch name
  read -p "Amplify branch name [main]: " BRANCH_NAME
  BRANCH_NAME=${BRANCH_NAME:-main}
  
  # Get account ID automatically
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  echo ""
  echo -e "${BLUE}Configuration summary:${NC}"
  echo "  App name:      $APP_NAME"
  echo "  Bucket name:   $BUCKET_NAME"
  echo "  Region:        $REGION"
  echo "  Branch:        $BRANCH_NAME"
  echo "  Account ID:    $ACCOUNT_ID"
  echo ""
  
  read -p "Proceed with these settings? (y/n): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Setup cancelled."
    exit 0
  fi
  echo ""
}

# Step 1: Create S3 bucket
create_s3_bucket() {
  echo -e "${YELLOW}[1/7] Creating S3 bucket...${NC}"
  
  # Check if bucket already exists
  if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}  Bucket '$BUCKET_NAME' already exists, skipping creation${NC}"
  else
    if [[ "$REGION" == "us-east-1" ]]; then
      aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" > /dev/null
    else
      aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION" > /dev/null
    fi
    echo -e "${GREEN}  ✓ Created bucket: $BUCKET_NAME${NC}"
  fi
}

# Step 2: Create Amplify app
create_amplify_app() {
  echo -e "${YELLOW}[2/7] Creating Amplify app...${NC}"
  
  # Check if app already exists
  EXISTING_APP=$(aws amplify list-apps --region "$REGION" --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_APP" ]]; then
    APP_ID="$EXISTING_APP"
    echo -e "${YELLOW}  App '$APP_NAME' already exists (ID: $APP_ID), skipping creation${NC}"
  else
    APP_ID=$(aws amplify create-app \
      --name "$APP_NAME" \
      --region "$REGION" \
      --query 'app.appId' --output text)
    echo -e "${GREEN}  ✓ Created Amplify app: $APP_NAME (ID: $APP_ID)${NC}"
  fi
}

# Step 3: Create Amplify branch
create_amplify_branch() {
  echo -e "${YELLOW}[3/7] Creating Amplify branch...${NC}"
  
  # Check if branch already exists
  EXISTING_BRANCH=$(aws amplify get-branch --app-id "$APP_ID" --branch-name "$BRANCH_NAME" --region "$REGION" 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_BRANCH" ]]; then
    echo -e "${YELLOW}  Branch '$BRANCH_NAME' already exists, skipping creation${NC}"
  else
    aws amplify create-branch \
      --app-id "$APP_ID" \
      --branch-name "$BRANCH_NAME" \
      --region "$REGION" > /dev/null
    echo -e "${GREEN}  ✓ Created branch: $BRANCH_NAME${NC}"
  fi
}

# Step 4: Apply S3 bucket policy
apply_bucket_policy() {
  echo -e "${YELLOW}[4/7] Applying S3 bucket policy...${NC}"
  
  BUCKET_POLICY=$(cat << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAmplifyToListBucket",
      "Effect": "Allow",
      "Principal": {"Service": "amplify.amazonaws.com"},
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${ACCOUNT_ID}",
          "aws:SourceArn": "arn:aws:amplify:${REGION}:${ACCOUNT_ID}:apps/${APP_ID}/branches/${BRANCH_NAME}"
        }
      }
    },
    {
      "Sid": "AllowAmplifyToGetObjects",
      "Effect": "Allow",
      "Principal": {"Service": "amplify.amazonaws.com"},
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
      "Condition": {
        "StringEquals": {
          "aws:SourceAccount": "${ACCOUNT_ID}",
          "aws:SourceArn": "arn:aws:amplify:${REGION}:${ACCOUNT_ID}:apps/${APP_ID}/branches/${BRANCH_NAME}"
        }
      }
    },
    {
      "Sid": "DenyInsecureConnections",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::${BUCKET_NAME}", "arn:aws:s3:::${BUCKET_NAME}/*"],
      "Condition": {"Bool": {"aws:SecureTransport": "false"}}
    }
  ]
}
EOF
)
  
  echo "$BUCKET_POLICY" | aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///dev/stdin
  echo -e "${GREEN}  ✓ Applied bucket policy${NC}"
}

# Step 5: Create IAM policy
create_iam_policy() {
  echo -e "${YELLOW}[5/7] Creating IAM policy...${NC}"
  
  POLICY_NAME="${APP_NAME}-deploy-policy"
  POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
  
  # Check if policy already exists
  if aws iam get-policy --policy-arn "$POLICY_ARN" &>/dev/null; then
    echo -e "${YELLOW}  Policy '$POLICY_NAME' already exists, skipping creation${NC}"
  else
    DEPLOY_POLICY=$(cat << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3SyncAccess",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::${BUCKET_NAME}", "arn:aws:s3:::${BUCKET_NAME}/*"]
    },
    {
      "Sid": "AmplifyDeployAccess",
      "Effect": "Allow",
      "Action": "amplify:StartDeployment",
      "Resource": "arn:aws:amplify:${REGION}:${ACCOUNT_ID}:apps/${APP_ID}/branches/*"
    }
  ]
}
EOF
)
    
    echo "$DEPLOY_POLICY" | aws iam create-policy \
      --policy-name "$POLICY_NAME" \
      --policy-document file:///dev/stdin > /dev/null
    echo -e "${GREEN}  ✓ Created IAM policy: $POLICY_NAME${NC}"
  fi
}

# Step 6: Create IAM user
create_iam_user() {
  echo -e "${YELLOW}[6/7] Creating IAM user...${NC}"
  
  USER_NAME="${APP_NAME}-deployer"
  POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${APP_NAME}-deploy-policy"
  
  # Check if user already exists
  if aws iam get-user --user-name "$USER_NAME" &>/dev/null; then
    echo -e "${YELLOW}  User '$USER_NAME' already exists, skipping creation${NC}"
  else
    aws iam create-user --user-name "$USER_NAME" > /dev/null
    echo -e "${GREEN}  ✓ Created IAM user: $USER_NAME${NC}"
  fi
  
  # Attach policy (idempotent)
  aws iam attach-user-policy \
    --user-name "$USER_NAME" \
    --policy-arn "$POLICY_ARN" 2>/dev/null || true
  echo -e "${GREEN}  ✓ Attached policy to user${NC}"
}

# Step 7: Create access keys
create_access_keys() {
  echo -e "${YELLOW}[7/8] Creating access keys...${NC}"
  
  USER_NAME="${APP_NAME}-deployer"
  
  # Create new access key
  KEY_OUTPUT=$(aws iam create-access-key --user-name "$USER_NAME")
  
  ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
  SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')
  
  echo -e "${GREEN}  ✓ Created access keys${NC}"
}

# Step 8: Initial deployment to wire up S3 to Amplify
initial_deployment() {
  echo -e "${YELLOW}[8/8] Running initial deployment to wire up S3 → Amplify...${NC}"
  
  # The first start-deployment call establishes the S3 → Amplify connection
  aws amplify start-deployment \
    --app-id "$APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --source-url "s3://${BUCKET_NAME}" \
    --source-url-type BUCKET_PREFIX \
    --region "$REGION" > /dev/null 2>&1 || true
  
  echo -e "${GREEN}  ✓ Initial deployment triggered${NC}"
  echo -e "${YELLOW}    Note: First deployment may show as failed until you upload content${NC}"
}

# Optional: Setup custom domain
setup_custom_domain() {
  echo ""
  read -p "Would you like to set up a custom domain? (y/n): " SETUP_DOMAIN
  
  if [[ "$SETUP_DOMAIN" != "y" && "$SETUP_DOMAIN" != "Y" ]]; then
    return
  fi
  
  echo ""
  read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
  
  if [[ -z "$DOMAIN_NAME" ]]; then
    echo -e "${YELLOW}  Skipping custom domain setup${NC}"
    return
  fi
  
  # Ask about www subdomain
  read -p "Also set up www.$DOMAIN_NAME? (y/n): " SETUP_WWW
  
  echo -e "${YELLOW}Setting up custom domain: $DOMAIN_NAME${NC}"
  
  # Check if domain is in Route 53
  HOSTED_ZONE=$(aws route53 list-hosted-zones-by-name \
    --dns-name "$DOMAIN_NAME" \
    --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
    --output text 2>/dev/null | head -1)
  
  if [[ -n "$HOSTED_ZONE" ]]; then
    echo -e "${GREEN}  ✓ Found domain in Route 53 - DNS will be configured automatically${NC}"
    ROUTE53_MANAGED=true
  else
    echo -e "${YELLOW}  Domain not found in Route 53 - manual DNS configuration required${NC}"
    ROUTE53_MANAGED=false
  fi
  
  # Build sub-domain-settings
  if [[ "$SETUP_WWW" == "y" || "$SETUP_WWW" == "Y" ]]; then
    SUB_DOMAIN_SETTINGS="prefix=,branchName=${BRANCH_NAME} prefix=www,branchName=${BRANCH_NAME}"
  else
    SUB_DOMAIN_SETTINGS="prefix=,branchName=${BRANCH_NAME}"
  fi
  
  # Create domain association
  DOMAIN_OUTPUT=$(aws amplify create-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN_NAME" \
    --sub-domain-settings $SUB_DOMAIN_SETTINGS \
    --region "$REGION" 2>&1)
  
  if echo "$DOMAIN_OUTPUT" | grep -q "error\|Error"; then
    echo -e "${RED}  Failed to create domain association:${NC}"
    echo "$DOMAIN_OUTPUT" | grep -i "message"
    return
  fi
  
  echo -e "${GREEN}  ✓ Domain association created${NC}"
  
  # Fetch domain association details
  sleep 2  # Brief pause for AWS to process
  DOMAIN_INFO=$(aws amplify get-domain-association \
    --app-id "$APP_ID" \
    --domain-name "$DOMAIN_NAME" \
    --region "$REGION" 2>/dev/null)
  
  DOMAIN_STATUS=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.domainStatus')
  
  if [[ "$ROUTE53_MANAGED" == "true" ]]; then
    echo ""
    echo -e "${GREEN}Route 53 Integration:${NC}"
    echo -e "  Amplify will automatically create DNS records in your hosted zone."
    echo -e "  Status: $DOMAIN_STATUS"
    echo ""
    echo -e "${YELLOW}  Certificate validation typically takes 10-30 minutes.${NC}"
  else
    # Show manual DNS configuration for non-Route 53 users
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Manual DNS Configuration Required${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Add these DNS records to your domain registrar:${NC}"
    echo ""
    
    # Extract certificate verification record
    CERT_RECORD=$(echo "$DOMAIN_INFO" | jq -r '.domainAssociation.certificateVerificationDNSRecord // empty')
    
    if [[ -n "$CERT_RECORD" ]]; then
      echo "1. Certificate Verification (CNAME):"
      echo "   $CERT_RECORD"
      echo ""
    fi
    
    # Extract subdomain records  
    echo "2. Subdomain Records (CNAME):"
    echo "$DOMAIN_INFO" | jq -r '.domainAssociation.subDomains[] | "   \(.subDomainSetting.prefix | if . == "" then "@/root" else . end): \(.dnsRecord)"'
    echo ""
    echo -e "${YELLOW}After adding DNS records, certificate validation may take 10-30 minutes.${NC}"
  fi
  
  echo ""
  echo -e "Check status: ${BLUE}aws amplify get-domain-association --app-id $APP_ID --domain-name $DOMAIN_NAME --region $REGION${NC}"
  
  CUSTOM_DOMAIN_URL="https://$DOMAIN_NAME"
}

# Print results
print_results() {
  AMPLIFY_URL="https://${BRANCH_NAME}.${APP_ID}.amplifyapp.com"
  
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                    Setup Complete!                        ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${BLUE}Amplify URL:${NC} $AMPLIFY_URL"
  if [[ -n "$CUSTOM_DOMAIN_URL" ]]; then
    echo -e "${BLUE}Custom Domain:${NC} $CUSTOM_DOMAIN_URL (pending DNS verification)"
  fi
  echo ""
  echo -e "${YELLOW}Add the following to your .env file:${NC}"
  echo ""
  echo "─────────────────────────────────────────────────────────────"
  echo "AWS_ACCESS_KEY_ID=$ACCESS_KEY_ID"
  echo "AWS_SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY"
  echo "AWS_REGION=$REGION"
  echo "S3_BUCKET=$BUCKET_NAME"
  echo "AMPLIFY_APP_ID=$APP_ID"
  echo "AMPLIFY_BRANCH_NAME=$BRANCH_NAME"
  echo "─────────────────────────────────────────────────────────────"
  echo ""
  echo -e "${RED}⚠️  Save these credentials now! The secret key cannot be retrieved again.${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Copy the above values to your .env file"
  echo "  2. Make sure .env is in your .gitignore"
  echo "  3. Install dependencies: npm install s3-sync-client @aws-sdk/client-s3 @aws-sdk/client-amplify git-branch dotenv"
  echo "  4. Build your site: npm run build"
  echo "  5. Deploy: npm run deploy"
  if [[ -n "$CUSTOM_DOMAIN_URL" ]]; then
    echo "  6. Add DNS records as shown above"
    echo "  7. Wait for certificate validation (10-30 mins)"
  fi
  echo ""
}

# Main execution
main() {
  check_prerequisites
  gather_inputs
  create_s3_bucket
  create_amplify_app
  create_amplify_branch
  apply_bucket_policy
  create_iam_policy
  create_iam_user
  create_access_keys
  initial_deployment
  setup_custom_domain
  print_results
}

main
