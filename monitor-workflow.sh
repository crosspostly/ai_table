#!/bin/bash
# Monitor GitHub Actions workflow runs

REPO="crosspostly/ai_table"
BRANCH="web-interface-with-design"
CHECK_INTERVAL=10  # seconds

echo "🔍 Monitoring GitHub Actions for $REPO ($BRANCH branch)"
echo "Press Ctrl+C to stop"
echo ""

LAST_RUN=""

while true; do
  RESULT=$(curl -s "https://api.github.com/repos/$REPO/actions/runs?branch=$BRANCH&per_page=1" | \
    jq -r '.workflow_runs[0] | "\(.run_number)|\(.status)|\(.conclusion)|\(.head_sha[0:7])"')
  
  if [ "$RESULT" != "$LAST_RUN" ]; then
    RUN_NUMBER=$(echo "$RESULT" | cut -d'|' -f1)
    STATUS=$(echo "$RESULT" | cut -d'|' -f2)
    CONCLUSION=$(echo "$RESULT" | cut -d'|' -f3)
    COMMIT=$(echo "$RESULT" | cut -d'|' -f4)
    
    TIMESTAMP=$(date '+%H:%M:%S')
    
    if [ "$STATUS" == "completed" ]; then
      if [ "$CONCLUSION" == "success" ]; then
        echo "[$TIMESTAMP] ✅ Run #$RUN_NUMBER SUCCESS (commit: $COMMIT)"
      else
        echo "[$TIMESTAMP] ❌ Run #$RUN_NUMBER FAILED: $CONCLUSION (commit: $COMMIT)"
      fi
    elif [ "$STATUS" == "in_progress" ]; then
      echo "[$TIMESTAMP] ⏳ Run #$RUN_NUMBER in progress... (commit: $COMMIT)"
    else
      echo "[$TIMESTAMP] 🔄 Run #$RUN_NUMBER status: $STATUS (commit: $COMMIT)"
    fi
    
    LAST_RUN="$RESULT"
  fi
  
  sleep $CHECK_INTERVAL
done
