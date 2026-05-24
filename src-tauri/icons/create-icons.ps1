# PowerShell script to resize icons using Windows APIs
Add-Type -AssemblyName System.Drawing

$source = "source-icon.png"
$sourcePath = Join-Path $PWD $source

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source icon not found"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

$sizes = @{
    "32x32.png" = 32
    "128x128.png" = 128
    "128x128@2x.png" = 256
}

foreach ($filename in $sizes.Keys) {
    $size = $sizes[$filename]
    $outputPath = Join-Path $PWD $filename
    
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.DrawImage($img, 0, 0, $size, $size)
    
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created $filename"
}

$img.Dispose()
Write-Host "All icons generated successfully!"
