#!/bin/bash
# Diagnostic test script to isolate Apps Script file push issues

echo "=== APPS SCRIPT FILE PUSH DIAGNOSTIC ==="
echo ""

# Count files that would be pushed
echo "📊 FILE COUNT ANALYSIS:"
echo "Existing client files: $(find table/client -name "*.gs" | wc -l)"
echo "Shared files to copy: $(find table/shared -name "*.gs" | wc -l)"  
echo "Web files to copy: $(find table/web -name "*.gs" | wc -l)"
echo "Total .gs files after copy: $(($(find table/client -name "*.gs" | wc -l) + $(find table/shared -name "*.gs" | wc -l) + $(find table/web -name "*.gs" | wc -l)))"
echo ""

echo "📋 PROBLEMATIC FILES:"
echo "CollectConfigUI.gs exists in table/web: $(ls table/web/CollectConfig* 2>/dev/null || echo 'NOT FOUND')"
echo "AIConstructorUI.gs exists in table/client: $(ls table/client/AIConstructor* 2>/dev/null || echo 'NOT FOUND')"
echo ""

echo "🔍 FUNCTION NAME CONFLICTS CHECK:"
echo "Checking for function name duplicates between CollectConfigUI and existing files..."

# Check if openCollectConfigUI conflicts with existing functions
echo "Functions in existing client files that might conflict:"
grep -r "function.*UI" table/client/*.gs | head -5
echo ""

echo "🎯 RECOMMENDED SOLUTION:"
echo "1. Create a separate minimal test project with only CollectConfigUI files"
echo "2. Or reduce the number of files in the client project"  
echo "3. Or merge related functionality into fewer files"
echo ""

echo "=== DIAGNOSTIC COMPLETE ==="