Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 400
$banner = New-Object System.Drawing.Bitmap $width, $height

$graphics = [System.Drawing.Graphics]::FromImage($banner)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

# Background - dark with subtle gradient
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(0, $height)),
    [System.Drawing.Color]::FromArgb(255, 5, 10, 5),
    [System.Drawing.Color]::FromArgb(255, 2, 5, 2)
)
$graphics.FillRectangle($bgBrush, 0, 0, $width, $height)

# Matrix green color
$matrixGreen = [System.Drawing.Color]::FromArgb(255, 0, 255, 65)
$matrixGreenDim = [System.Drawing.Color]::FromArgb(100, 0, 255, 65)

# Draw scanlines effect
$scanlinePen = New-Object System.Drawing.Pen($matrixGreenDim, 1)
for ($y = 0; $y -lt $height; $y += 4) {
    $graphics.DrawLine($scanlinePen, 0, $y, $width, $y)
}

# Load and draw icon in center-left
$iconPath = "src-tauri\icons\128x128@2x.png"
if (Test-Path $iconPath) {
    $icon = [System.Drawing.Image]::FromFile((Resolve-Path $iconPath))
    $iconSize = 200
    $iconX = 150
    $iconY = ($height - $iconSize) / 2

    # Glow effect
    for ($i = 20; $i -gt 0; $i -= 2) {
        $glowAlpha = [int](10 - ($i / 2))
        $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($glowAlpha, 0, 255, 65))
        $graphics.FillEllipse($glowBrush, $iconX - $i, $iconY - $i, $iconSize + ($i * 2), $iconSize + ($i * 2))
        $glowBrush.Dispose()
    }

    $graphics.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)
    $icon.Dispose()
}

# Text content
$titleFont = New-Object System.Drawing.Font("Consolas", 56, [System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font("Consolas", 20)
$taglineFont = New-Object System.Drawing.Font("Consolas", 14)

$textBrush = New-Object System.Drawing.SolidBrush($matrixGreen)
$textX = 400

# Title
$graphics.DrawString("MUTHUR", $titleFont, $textBrush, $textX, 80)

# Subtitle
$graphics.DrawString("OS TERMINAL", $subtitleFont, $textBrush, $textX, 160)

# Tagline
$tagline = "Advanced Terminal Interface with AI Integration"
$graphics.DrawString($tagline, $taglineFont, $textBrush, $textX, 210)

# Tech stack line
$techStack = "Tauri v2 // Rust // React 19 // Three.js"
$dimTextBrush = New-Object System.Drawing.SolidBrush($matrixGreenDim)
$graphics.DrawString($techStack, $taglineFont, $dimTextBrush, $textX, 250)

# Border glow
$borderPen = New-Object System.Drawing.Pen($matrixGreen, 2)
$graphics.DrawRectangle($borderPen, 10, 10, $width - 20, $height - 20)

# Grid pattern overlay
$gridPen = New-Object System.Drawing.Pen($matrixGreenDim, 1)
for ($x = 0; $x -lt $width; $x += 50) {
    $graphics.DrawLine($gridPen, $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 50) {
    $graphics.DrawLine($gridPen, 0, $y, $width, $y)
}

# Save
$banner.Save("banner.png", [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$banner.Dispose()
$bgBrush.Dispose()
$scanlinePen.Dispose()
$textBrush.Dispose()
$dimTextBrush.Dispose()
$borderPen.Dispose()
$gridPen.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$taglineFont.Dispose()

Write-Host "Banner created: banner.png"
