# 1. Write the new .gitignore file
cat <<EOT > .gitignore
# --- Dependencies ---
node_modules/
.pnp
.pnp.js

# --- Build Output ---
dist/
build/
out/

# --- Secrets ---
.env
.env.*
!.env.example
*.pem

# --- System ---
.DS_Store
._*
Thumbs.db
.AppleDouble
.LSOverride

# --- Logs ---
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
*.log

# --- IDE & Editors ---
.vscode/
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# --- IoT/Data Dumps (Future proofing for your device data) ---
# Assuming you might eventually dump CSVs or JSON logs locally
*.csv
*.dat
temp_data/

# --- Misc ---
.eslintcache
*.tsbuildinfo

# --- Testing ---
coverage/
EOT

# 2. Clear the git cache (removes .DS_Store from index)
echo "🧹 Clearing Git cache..."
git rm -r --cached .

# 3. Re-add files (respecting the new .gitignore)
echo "📝 Re-staging files..."
git add .

# 4. Commit the changes
echo "💾 Committing changes..."
git commit -m "chore: update gitignore and remove .DS_Store"

echo "✅ Done! Your repo is clean."