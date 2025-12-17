$ErrorActionPreference = 'Stop'
$dir = "src/assets/tabbar"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
Add-Type -AssemblyName System.Drawing

function New-IconHome([string]$path, [string]$hex) {
  $bmp = New-Object System.Drawing.Bitmap 48,48
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.Clear([System.Drawing.Color]::Transparent)
  $color = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $brush = New-Object System.Drawing.SolidBrush $color
  $points = @([System.Drawing.Point]::new(24,8), [System.Drawing.Point]::new(8,22), [System.Drawing.Point]::new(40,22))
  $gfx.FillPolygon($brush, $points)
  $gfx.FillRectangle($brush, 14, 22, 20, 18)
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $gfx.FillRectangle($white, 22, 26, 4, 10)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $white.Dispose(); $brush.Dispose(); $gfx.Dispose(); $bmp.Dispose()
}

function New-IconPlus([string]$path, [string]$hex) {
  $bmp = New-Object System.Drawing.Bitmap 48,48
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.Clear([System.Drawing.Color]::Transparent)
  $color = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $pen = New-Object System.Drawing.Pen $color, 6
  $gfx.DrawLine($pen, 24, 10, 24, 38)
  $gfx.DrawLine($pen, 10, 24, 38, 24)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $pen.Dispose(); $gfx.Dispose(); $bmp.Dispose()
}

function New-IconUser([string]$path, [string]$hex) {
  $bmp = New-Object System.Drawing.Bitmap 48,48
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gfx.Clear([System.Drawing.Color]::Transparent)
  $color = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $brush = New-Object System.Drawing.SolidBrush $color
  $gfx.FillEllipse($brush, 16, 8, 16, 16)
  $gfx.FillEllipse($brush, 8, 22, 32, 20)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $brush.Dispose(); $gfx.Dispose(); $bmp.Dispose()
}

New-IconHome  "src/assets/tabbar/home.png"         "#9ca3af"
New-IconHome  "src/assets/tabbar/home-active.png"  "#16a34a"
New-IconPlus  "src/assets/tabbar/plus.png"         "#9ca3af"
New-IconPlus  "src/assets/tabbar/plus-active.png"  "#16a34a"
New-IconUser  "src/assets/tabbar/user.png"         "#9ca3af"
New-IconUser  "src/assets/tabbar/user-active.png"  "#16a34a"
Write-Host "PNG icons generated."
