use image::{imageops, GrayImage};

const MAX_WIDTH: u32 = 120;
const MAX_HEIGHT: u32 = 200;
const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;

const BAYER_MATRIX: [[u8; 4]; 4] = [
    [  0, 136,  34, 170],
    [204,  68, 238, 102],
    [ 51, 187,  17, 153],
    [255, 119, 221,  85],
];

fn bayer_threshold(pixel: u8, x: u32, y: u32) -> bool {
    pixel > BAYER_MATRIX[(y % 4) as usize][(x % 4) as usize]
}

fn pixels_to_braille(gray: &GrayImage, width: u32, height: u32) -> String {
    let mut result = String::with_capacity((width / 2 + 1) as usize * (height / 4 + 1) as usize);

    let mut y = 0;
    while y < height {
        let mut x = 0;
        while x < width {
            let mut byte: u8 = 0;

            // Left column: dots 1 (bit0), 2 (bit1), 3 (bit2), 7 (bit6)
            if y < height && bayer_threshold(gray.get_pixel(x, y)[0], x, y) {
                byte |= 0x01;
            }
            if y + 1 < height && bayer_threshold(gray.get_pixel(x, y + 1)[0], x, y + 1) {
                byte |= 0x02;
            }
            if y + 2 < height && bayer_threshold(gray.get_pixel(x, y + 2)[0], x, y + 2) {
                byte |= 0x04;
            }
            if y + 3 < height && bayer_threshold(gray.get_pixel(x, y + 3)[0], x, y + 3) {
                byte |= 0x40;
            }

            // Right column: dots 4 (bit3), 5 (bit4), 6 (bit5), 8 (bit7)
            if x + 1 < width {
                if y < height && bayer_threshold(gray.get_pixel(x + 1, y)[0], x + 1, y) {
                    byte |= 0x08;
                }
                if y + 1 < height && bayer_threshold(gray.get_pixel(x + 1, y + 1)[0], x + 1, y + 1) {
                    byte |= 0x10;
                }
                if y + 2 < height && bayer_threshold(gray.get_pixel(x + 1, y + 2)[0], x + 1, y + 2) {
                    byte |= 0x20;
                }
                if y + 3 < height && bayer_threshold(gray.get_pixel(x + 1, y + 3)[0], x + 1, y + 3) {
                    byte |= 0x80;
                }
            }

            let ch = char::from_u32(0x2800 + byte as u32).unwrap_or(' ');
            result.push(ch);
            x += 2;
        }
        result.push('\n');
        y += 4;
    }

    result
}

pub fn convert_to_braille(image_bytes: &[u8]) -> Result<String, String> {
    if image_bytes.len() > MAX_IMAGE_BYTES {
        return Err("Image too large (>5MB)".to_string());
    }

    let img = image::load_from_memory(image_bytes)
        .map_err(|e| format!("Decode failed: {}", e))?;

    let (src_w, src_h) = (img.width(), img.height());
    if src_w == 0 || src_h == 0 {
        return Err("Image has zero dimensions".to_string());
    }

    // Calculate target dimensions preserving aspect ratio
    let mut target_w = MAX_WIDTH;
    let mut target_h = (src_h as u64 * target_w as u64 / src_w as u64) as u32;

    // Compensate for character cell aspect ratio (chars are ~2x taller than wide)
    // Braille uses 2x4 grid, so effective pixel aspect is already partially handled
    // Apply 0.5 vertical scale to prevent tall/stretched output
    target_h = target_h / 2;

    if target_h > MAX_HEIGHT {
        target_h = MAX_HEIGHT;
        target_w = (src_w as u64 * target_h as u64 / src_h as u64) as u32;
    }

    // Ensure even dimensions for braille grid alignment
    target_w = (target_w / 2) * 2;
    target_h = (target_h / 4) * 4;

    if target_w < 2 || target_h < 4 {
        return Err("Image too small to render".to_string());
    }

    let gray = img.to_luma8();
    let resized = imageops::resize(&gray, target_w, target_h, imageops::FilterType::Lanczos3);

    Ok(pixels_to_braille(&resized, target_w, target_h))
}

pub async fn fetch_and_convert(url: &str) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("MUTHUR/0.1")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Image fetch failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status().as_u16()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    convert_to_braille(&bytes)
}
