#!/bin/bash
# Script to squash related commits using git rebase

# Find the base commit (first meaningful commit after initial)
BASE_COMMIT=$(git log --reverse --oneline origin/master | head -1 | awk '{print $1}')

echo "Base commit: $BASE_COMMIT"
echo "Starting interactive rebase to squash commits..."

# Count commits to rebase
COMMIT_COUNT=$(git log --oneline origin/master | wc -l | tr -d ' ')
echo "Total commits: $COMMIT_COUNT"

# We'll rebase from the second commit (keeping the first initial commit)
REBASE_START=$(git log --reverse --oneline origin/master | sed -n '2p' | awk '{print $1}')

echo "Will rebase from: $REBASE_START"
echo ""
echo "This will open an editor. Change 'pick' to 'squash' for commits you want to combine."
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Start interactive rebase
git rebase -i $REBASE_START~1
