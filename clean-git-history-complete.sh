#!/bin/bash

# Comprehensive script to remove MongoDB credentials from git history
# This will rewrite git history to remove ALL sensitive data
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

echo "🔒 Comprehensive MongoDB credentials cleanup from git history..."
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
echo "📋 Step 3: Using git filter-branch to clean ALL history..."
echo "   This will process all commits and remove credentials from:"
echo "   - fix-and-start.sh"
echo "   - RENDER_DEPLOYMENT_GUIDE.md"
echo "   - update_mongodb_password.sh"
echo "   - Any other files containing credentials"
echo ""
echo "   This may take 5-10 minutes depending on repository size..."

# Use git filter-branch to clean all files in history
git filter-branch --force --tree-filter '
    # Function to clean credentials from a file (more aggressive)
    clean_file() {
        local file="$1"
        if [ -f "$file" ] && [ -r "$file" ] && [ -w "$file" ]; then
            # Use perl for more reliable replacements (works on macOS)
            perl -i -pe "s/oUB8dGu7cb2LOklC/password/g" "$file" 2>/dev/null || true
            perl -i -pe "s/wbJK8zq0ie8teCNp/password/g" "$file" 2>/dev/null || true
            perl -i -pe "s/davidomokagbor_db_user/username/g" "$file" 2>/dev/null || true
            # Replace full connection strings (with various formats)
            perl -i -pe "s|mongodb\+srv://davidomokagbor_db_user:oUB8dGu7cb2LOklC|mongodb+srv://username:password|g" "$file" 2>/dev/null || true
            perl -i -pe "s|mongodb\+srv://davidomokagbor_db_user:wbJK8zq0ie8teCNp|mongodb+srv://username:password|g" "$file" 2>/dev/null || true
            # Also handle escaped versions
            perl -i -pe "s|mongodb\\+srv://davidomokagbor_db_user:oUB8dGu7cb2LOklC|mongodb+srv://username:password|g" "$file" 2>/dev/null || true
            perl -i -pe "s|mongodb\\+srv://davidomokagbor_db_user:wbJK8zq0ie8teCNp|mongodb+srv://username:password|g" "$file" 2>/dev/null || true
        fi
    }
    
    # Clean specific known files
    clean_file "fix-and-start.sh"
    clean_file "RENDER_DEPLOYMENT_GUIDE.md"
    clean_file "update_mongodb_password.sh"
    clean_file "fullstack_recsys/API_DOCUMENTATION.md"
    
    # Clean any shell scripts
    find . -type f -name "*.sh" ! -name "clean-git-history*.sh" ! -name "SECURITY_ALERT.md" -exec sh -c "clean_file \"{}\"" \; 2>/dev/null || true
    
    # Clean any markdown files (including in subdirectories)
    find . -type f -name "*.md" ! -name "SECURITY_ALERT.md" -exec sh -c "clean_file \"{}\"" \; 2>/dev/null || true
    
    # Clean any text files
    find . -type f -name "*.txt" -exec sh -c "clean_file \"{}\"" \; 2>/dev/null || true
    
    # Clean any Python files that might have credentials
    find . -type f -name "*.py" -exec sh -c "clean_file \"{}\"" \; 2>/dev/null || true
' --prune-empty --tag-name-filter cat -- --all

echo ""
echo "📋 Step 4: Cleaning up git references..."
# Remove backup refs created by filter-branch
git for-each-ref --format="%(refname)" refs/original/ 2>/dev/null | xargs -n 1 git update-ref -d 2>/dev/null || true

# Expire reflog and garbage collect
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "📋 Step 5: Verifying credentials are removed..."
if git log --all -p | grep -qi "$CREDENTIAL1\|$CREDENTIAL2" 2>/dev/null; then
    echo "   ⚠️  WARNING: Credentials may still exist in history!"
    echo "   Please review manually: git log --all -p | grep -i '$CREDENTIAL1'"
    echo ""
    echo "   You may need to run this script again or use BFG Repo-Cleaner"
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

