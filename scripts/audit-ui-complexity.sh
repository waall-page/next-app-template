#!/bin/bash
# UIコンポーネントの ?. および ?? の出現頻度（複雑度）をカウントするスクリプト

echo "========================================================"
echo " 📊 UIコンポーネントのフォールバック・オプショナル密度ランキング"
echo "========================================================"
printf "%-8s | %-6s | %-6s | %s\n" "TOTAL" "?." "??" "FILE PATH"
echo "--------------------------------------------------------"

for file in $(find app components -type f \( -name "*Client.tsx" -o -name "*.tsx" \) ! -name "page.tsx" ! -name "layout.tsx" | sort); do
  # ?. のカウント
  c_opt=$(grep -o '\?\.' "$file" 2>/dev/null | wc -l | tr -d ' ')
  # ?? のカウント
  c_nullish=$(grep -o '\?\?' "$file" 2>/dev/null | wc -l | tr -d ' ')
  total=$((c_opt + c_nullish))

  if [ "$total" -gt 0 ]; then
    printf "%-8d | %-6d | %-6d | %s\n" "$total" "$c_opt" "$c_nullish" "$file"
  fi
done | sort -rn -k1,1

echo "========================================================"
