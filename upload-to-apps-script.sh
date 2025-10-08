#!/bin/bash
# Direct upload to Google Apps Script API without clasp

set -e

SCRIPT_ID=$1
ACCESS_TOKEN=$2
ROOT_DIR=$3

if [ -z "$SCRIPT_ID" ] || [ -z "$ACCESS_TOKEN" ] || [ -z "$ROOT_DIR" ]; then
  echo "Usage: $0 <script_id> <access_token> <root_dir>"
  exit 1
fi

echo "=== Uploading files directly via Apps Script API ==="
echo "Script ID: $SCRIPT_ID"
echo "Root dir: $ROOT_DIR"

# Build JSON payload with all files
FILES_JSON='{"files": ['

FIRST=true
for file in $(find "$ROOT_DIR" -type f \( -name "*.gs" -o -name "*.html" -o -name "appsscript.json" \)); do
  if [ "$FIRST" = false ]; then
    FILES_JSON+=','
  fi
  FIRST=false
  
  # Get relative path
  REL_PATH=${file#$ROOT_DIR/}
  
  # Get file type
  if [[ "$file" == *.gs ]]; then
    FILE_TYPE="SERVER_JS"
  elif [[ "$file" == *.html ]]; then
    FILE_TYPE="HTML"
  elif [[ "$file" == appsscript.json ]]; then
    FILE_TYPE="JSON"
    REL_PATH="appsscript"
  fi
  
  # Read content and escape
  CONTENT=$(cat "$file" | jq -Rs .)
  
  FILES_JSON+="{\"name\": \"$REL_PATH\", \"type\": \"$FILE_TYPE\", \"source\": $CONTENT}"
  
  echo "Added: $REL_PATH ($FILE_TYPE)"
done

FILES_JSON+=']}'

echo ""
echo "Total files prepared: $(echo "$FILES_JSON" | jq '.files | length')"

# Upload via API
echo ""
echo "Uploading to Apps Script API..."
RESPONSE=$(curl -s -X PUT \
  "https://script.googleapis.com/v1/projects/$SCRIPT_ID/content" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$FILES_JSON")

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ Upload failed:"
  echo "$RESPONSE" | jq .
  exit 1
else
  echo "✅ Upload successful!"
  echo "$RESPONSE" | jq .
fi
