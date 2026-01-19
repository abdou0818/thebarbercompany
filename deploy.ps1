param(
  [string]$Message = "نشر: تحديثات الإعدادات وتحديث النسخة",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

function Bump-VersionFile {
  param([string]$Path)
  if (Test-Path $Path) {
    $json = Get-Content $Path -Raw | ConvertFrom-Json
    if (-not $json.version) { $json | Add-Member -NotePropertyName version -NotePropertyValue 0 }
    $json.version = [int]$json.version + 1
    $json.updatedAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
    $json | ConvertTo-Json -Depth 6 | Set-Content -Path $Path -Encoding UTF8
    Write-Host "تم رفع النسخة إلى: $($json.version)" -ForegroundColor Green
  } else {
    $obj = [PSCustomObject]@{
      version   = 1
      updatedAt = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
      settings  = @{}
    }
    $obj | ConvertTo-Json -Depth 3 | Set-Content -Path $Path -Encoding UTF8
    Write-Host "تم إنشاء ملف النسخة: $Path" -ForegroundColor Yellow
  }
}

# تأكد أن المجلد هو مستودع Git
if (-not (Test-Path ".git")) {
  Write-Host "تهيئة مستودع Git..." -ForegroundColor Yellow
  git init
}

# تأكد من وجود فرع رئيسي
try { git branch -M $Branch } catch { }

# حدّث ملف النسخة
$versionFile = Join-Path (Get-Location) "settings-version.json"
Bump-VersionFile -Path $versionFile

# أضف وادفع التغييرات
Write-Host "إضافة التغييرات والالتزام..." -ForegroundColor Yellow
git add -A
try {
  git commit -m $Message
} catch {
  Write-Host "لا توجد تغييرات جديدة للالتزام." -ForegroundColor Cyan
}

Write-Host "الدفع إلى المستودع البعيد..." -ForegroundColor Yellow
try {
  git push -u origin $Branch
} catch {
  Write-Host "فشل الدفع. تأكد من إعداد المستودع البعيد باستخدام:" -ForegroundColor Red
  Write-Host "git remote add origin https://github.com/<username>/<repo>.git" -ForegroundColor White
  Write-Host "ثم أعد تشغيل السكربت: ./deploy.ps1" -ForegroundColor White
}

Write-Host "تم تجهيز النشر. سيقوم GitHub Pages ببناء ونشر الموقع تلقائيًا." -ForegroundColor Green