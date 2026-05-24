Add-Type -AssemblyName System.Drawing

$sourceIcon = "source-icon.png"

if (-not (Test-Path $sourceIcon)) {
    Write-Error "Source icon not found: $sourceIcon"
    exit 1
}

$source = [System.Drawing.Image]::FromFile((Resolve-Path $sourceIcon))

Write-Host "Source image: $($source.Width)x$($source.Height)"

# Function to resize with high quality
function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )

    $resized = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($resized)

    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($Image, 0, 0, $Width, $Height)

    $resized.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $resized.Dispose()

    Write-Host "Created: $OutputPath ($(((Get-Item $OutputPath).Length / 1KB).ToString('0.0')) KB)"
}

# Generate all sizes
Write-Host "`nGenerating PNG icons..."
Resize-Image -Image $source -Width 32 -Height 32 -OutputPath "32x32.png"
Resize-Image -Image $source -Width 128 -Height 128 -OutputPath "128x128.png"
Resize-Image -Image $source -Width 256 -Height 256 -OutputPath "128x128@2x.png"

$source.Dispose()

Write-Host "`nAll PNG icons generated successfully!"
Write-Host "Next: Run create-ico-icns.ps1 to generate .ico and .icns files"
