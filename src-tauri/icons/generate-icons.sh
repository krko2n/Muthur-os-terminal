#!/bin/bash
# Generate placeholder icons using ImageMagick or fallback
if command -v convert &> /dev/null; then
    # ImageMagick available
    convert -size 32x32 xc:#00ff41 -pointsize 20 -fill black -gravity center -annotate +0+0 "M" 32x32.png
    convert -size 128x128 xc:#00ff41 -pointsize 80 -fill black -gravity center -annotate +0+0 "M" 128x128.png
    convert -size 256x256 xc:#00ff41 -pointsize 160 -fill black -gravity center -annotate +0+0 "M" 128x128@2x.png
else
    echo "ImageMagick not available - icons must be created manually"
fi
