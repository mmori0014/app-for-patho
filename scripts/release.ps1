# release.ps1 - app-for-patho deployment script
# Usage: Run from C:\projects\app-for-patho

$ErrorActionPreference = "Stop"

# --- Config ---
$projectRoot   = "C:\projects\app-for-patho"
$questionsFile = "$projectRoot\src\questions.export.json"
$archiveDir    = "C:\Users\morimai\Documents\patho-backup"
$maxArchive    = 30
$backupPattern = "patho_backup_*.json"

# --- Step 1: Find latest backup in Downloads ---
$downloads = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
$latest = Get-ChildItem -Path $downloads -Filter $backupPattern |
          Sort-Object LastWriteTime -Descending |
          Select-Object -First 1

if (-not $latest) {
    Write-Error "バックアップファイルが見つかりません: $downloads\$backupPattern"
    exit 1
}

Write-Host "✔ バックアップ検出: $($latest.Name)" -ForegroundColor Cyan

# --- Step 2: Overwrite questions.export.json ---
Copy-Item -Path $latest.FullName -Destination $questionsFile -Force
Write-Host "✔ questions.export.json を上書きしました" -ForegroundColor Cyan

# --- Step 3: Git add / commit / push ---
Set-Location $projectRoot
git add src/questions.export.json
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Update questions from backup ($timestamp)"
git push
Write-Host "✔ Git push 完了" -ForegroundColor Cyan

# --- Step 4: Build ---
npm run build
Write-Host "✔ ビルド完了" -ForegroundColor Cyan

# --- Step 5: Firebase deploy ---
firebase deploy --only hosting
Write-Host "✔ Firebase デプロイ完了" -ForegroundColor Green

# --- Step 6: Archive backup (keep last 30) ---
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
}
Copy-Item -Path $latest.FullName -Destination $archiveDir -Force

$archived = Get-ChildItem -Path $archiveDir -Filter $backupPattern |
            Sort-Object LastWriteTime -Descending
if ($archived.Count -gt $maxArchive) {
    $archived | Select-Object -Skip $maxArchive | Remove-Item -Force
}
Write-Host "✔ アーカイブ保存: $archiveDir ($($[Math]::Min($archived.Count, $maxArchive))件)" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 リリース完了！" -ForegroundColor Green
