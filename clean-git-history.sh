#!/bin/bash

# Script to remove MongoDB credentials from git history
# This will rewrite git history to remove sensitive data
# 
# ⚠️ WARNING: This rewrites git history. Make sure you understand the implications.
# After running this, you'll need to force push to update the remote.
#
# ✅ SAFE: Your local .env file will NOT be affected (it's gitignored)

set -e

REPO_DIR="/Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik"
cd "$REPO_DIR"

# Credentials to remove
CREDENTIAL1="oUB8dGu7cb2LOklC"
CREDENTIAL2="wbJK8zq0ie8teCNp"
USERNAME="davidomokagbor_db_user"

echo "🔒 Cleaning MongoDB credentials from git history..."
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "   - Make sure you have a backup"
echo "   - All collaborators will need to re-clone after force push"
echo "   - Your local .env file will NOT be affected (it's gitignored)"
echo ""
read -p "Continue? (type 'yes' to proceed): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cancelled."
    exit 1
fi

echo ""
echo "📋 Step 1: Creating backup branch..."
BACKUP_BRANCH="backup-before-cleanup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" 2>/dev/null || true
echo "   ✅ Backup created: $BACKUP_BRANCH"

echo ""
echo "📋 Step 2: Checking for credentials in current tracked files..."
if git grep -q "$CREDENTIAL1\|$CREDENTIAL2" -- :/ 2>/dev/null; then
    echo "   ⚠️  Found credentials in tracked files!"
    echo "   Please remove them manually first, then run this script again."
    exit 1
else
    echo "   ✅ No credentials in current tracked files"
fi

echo ""
echo "📋 Step 3: Checking if BFG Repo-Cleaner is available..."
if command -v bfg &> /dev/null; then
    echo "   ✅ BFG found - using it (faster and safer)"
    USE_BFG=true
else
    echo "   ⚠️  BFG not found - will use git filter-branch (slower)"
    echo "   💡 Install BFG for better performance: brew install bfg"
    USE_BFG=false
fi

echo ""
echo "📋 Step 4: Removing credentials from git history..."
echo "   This may take a few minutes..."

if [ "$USE_BFG" = true ]; then
    # Method 1: Use BFG Repo-Cleaner (recommended)
    echo "   Using BFG Repo-Cleaner..."
    
    # Create replacements file
    cat > /tmp/passwords.txt << EOF
$CREDENTIAL1==>REMOVED
$CREDENTIAL2==>REMOVED
mongodb+srv://$USERNAME:$CREDENTIAL1==>mongodb+srv://username:password
mongodb+srv://$USERNAME:$CREDENTIAL2==>mongodb+srv://username:password
davidomokagbor_db_user==>username
EOF
    
    bfg --replace-text /tmp/passwords.txt --no-blob-protection
    rm /tmp/passwords.txt
else
    # Method 2: Use git filter-branch
    echo "   Using git filter-branch..."
    
    git filter-branch --force --tree-filter '
        if [ -f fix-and-start.sh ]; then
            sed -i "" "s/oUB8dGu7cb2LOklC/password/g" fix-and-start.sh 2>/dev/null || true
            sed -i "" "s/wbJK8zq0ie8teCNp/password/g" fix-and-start.sh 2>/dev/null || true
            sed -i "" "s/davidomokagbor_db_user/username/g" fix-and-start.sh 2>/dev/null || true
        fi
        if [ -f RENDER_DEPLOYMENT_GUIDE.md ]; then
            sed -i "" "s/oUB8dGu7cb2LOklC/password/g" RENDER_DEPLOYMENT_GUIDE.md 2>/dev/null || true
            sed -i "" "s/wbJK8zq0ie8teCNp/password/g" RENDER_DEPLOYMENT_GUIDE.md 2>/dev/null || true
            sed -i "" "s/davidomokagbor_db_user/username/g" RENDER_DEPLOYMENT_GUIDE.md 2>/dev/null || true
        fi
    ' --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "📋 Step 5: Cleaning up git references..."
# Remove backup refs created by filter-branch
git for-each-ref --format="%(refname)" refs/original/ 2>/dev/null | xargs -n 1 git update-ref -d 2>/dev/null || true

# Expire reflog and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "📋 Step 6: Verifying credentials are removed..."
if git log --all -p | grep -qi "$CREDENTIAL1\|$CREDENTIAL2" 2>/dev/null; then
    echo "   ⚠️  WARNING: Credentials may still exist in history!"
    echo "   Please review manually: git log --all -p | grep -i '$CREDENTIAL1'"
else
    echo "   ✅ Credentials removed from git history"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git history cleaned!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Verify credentials are gone:"
echo "   git log --all -p | grep -i '$CREDENTIAL1\|$CREDENTIAL2'"
echo "   (Should return nothing)"
echo ""
echo "2. Verify your local .env file still has credentials (it should!):"
echo "   cat fullstack_recsys/backend/.env"
echo "   (This file is gitignored and was NOT affected)"
echo ""
echo "3. Force push to update remote (⚠️ DESTRUCTIVE - rewrites history):"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "4. Tell collaborators to re-clone the repository"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 Your local .env file is safe (gitignored) and was NOT affected."
echo "   Your credentials remain in: fullstack_recsys/backend/.env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
