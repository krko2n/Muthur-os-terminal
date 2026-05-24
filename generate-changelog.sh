#!/bin/bash

# MUTHUR OS Terminal - Changelog Generator
# Generates VERSION_HISTORY.md from git commits

set -e

OUTPUT="VERSION_HISTORY.md"

cat > $OUTPUT << 'EOF'
# Version History

Complete changelog generated from git commits.

---

EOF

# Get all commits grouped by date
git log --all --date=short --pretty=format:"%ad|%h|%s|%an" | \
while IFS='|' read -r date hash subject author; do
    echo "## $date - Commit $hash" >> $OUTPUT
    echo "" >> $OUTPUT
    echo "**$subject**" >> $OUTPUT
    echo "" >> $OUTPUT
    echo "- Author: $author" >> $OUTPUT
    echo "- Hash: \`$hash\`" >> $OUTPUT
    echo "" >> $OUTPUT

    # Get changed files
    files=$(git show --name-only --pretty=format: $hash | grep -v '^$' | head -5)
    if [ ! -z "$files" ]; then
        echo "**Changed files:**" >> $OUTPUT
        echo "\`\`\`" >> $OUTPUT
        echo "$files" >> $OUTPUT
        echo "\`\`\`" >> $OUTPUT
        echo "" >> $OUTPUT
    fi

    echo "---" >> $OUTPUT
    echo "" >> $OUTPUT
done

echo "Generated $OUTPUT"
echo ""
echo "Total commits: $(git rev-list --count HEAD)"
