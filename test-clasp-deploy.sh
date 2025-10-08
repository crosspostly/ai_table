#!/bin/bash
set -e

echo "=== CLASP DEPLOYMENT DIAGNOSTIC ==="
echo ""
echo "1. Check .clasp.json"
if [ -f .clasp.json ]; then
  echo "✅ .clasp.json exists"
  cat .clasp.json | jq .
else
  echo "❌ .clasp.json missing"
fi
echo ""

echo "2. Check ~/.clasprc.json"
if [ -f ~/.clasprc.json ]; then
  echo "✅ ~/.clasprc.json exists"
  cat ~/.clasprc.json | jq 'keys'
else
  echo "❌ ~/.clasprc.json missing"
fi
echo ""

echo "3. Check rootDir"
ROOTDIR=$(cat .clasp.json | jq -r '.rootDir')
echo "Root dir: $ROOTDIR"
ls -la "$ROOTDIR" | head -20
echo ""

echo "4. Find all appsscript.json in rootDir"
find "$ROOTDIR" -name "appsscript.json"
echo ""

echo "5. Check appsscript.json validity"
for f in $(find "$ROOTDIR" -name "appsscript.json"); do
  echo "Checking $f:"
  jq empty "$f" && echo "  ✅ Valid" || echo "  ❌ Invalid"
  cat "$f"
  echo ""
done

echo "6. Simulate clasp push (dry run)"
echo "Would push from: $ROOTDIR"
echo "Script ID: $(cat .clasp.json | jq -r '.scriptId')"
