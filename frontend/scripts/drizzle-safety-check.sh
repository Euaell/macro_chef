#!/bin/bash

# SAFETY CHECK: Prevent accidental Drizzle migrations on backend-managed tables
# This script checks if any business tables would be dropped by Drizzle migrations

echo "🔍 Checking for unsafe Drizzle migrations..."

# Check if drizzle-kit is installed
if ! command -v drizzle-kit &> /dev/null; then
    echo "⚠️  drizzle-kit not found. Skipping safety check."
    exit 0
fi

# Generate a temporary migration to check what would change
cd "$(dirname "$0")/.."

# Check if there are pending changes
drizzle-kit generate --name "temp_safety_check" --dry-run 2>&1 | tee /tmp/drizzle_check.log

# Check for dangerous operations (DROP TABLE)
if grep -i "drop table" /tmp/drizzle_check.log > /dev/null; then
    echo ""
    echo "❌ DANGER: Migration would DROP tables!"
    echo "The following tables would be dropped:"
    grep -i "drop table" /tmp/drizzle_check.log
    echo ""
    echo "🛑 This is likely because business tables were removed from schema.ts"
    echo "These tables are managed by EF Core backend, not Drizzle!"
    echo ""
    echo "To proceed anyway, manually edit schema.ts to restore the tables."
    rm -f /tmp/drizzle_check.log
    exit 1
fi

# Clean up
rm -f /tmp/drizzle_check.log

echo "✅ No unsafe DROP operations detected."
exit 0
