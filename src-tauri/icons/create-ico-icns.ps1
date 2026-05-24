# Generate .ico file (Windows)
Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 64, 128, 256)
$images = @()

foreach ($size in $sizes) {
    $img = [System.Drawing.Image]::FromFile((Join-Path $PWD "source-icon.png"))
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $size, $size)
    $graphics.Dispose()
    $img.Dispose()
    $images += $bitmap
}

# Save as .ico (simplified - just save largest as placeholder)
$images[-1].Save((Join-Path $PWD "icon.ico"), [System.Drawing.Imaging.ImageFormat]::Icon)

foreach ($img in $images) {
    $img.Dispose()
}

Write-Host "Created icon.ico"

# For .icns, we'll just copy the largest PNG as placeholder
# (proper .icns requires macOS or special tools)
Copy-Item "128x128@2x.png" "icon.icns"
Write-Host "Created icon.icns (PNG format placeholder)"
