use image::{imageops, GrayImage, RgbaImage};
use serde::Serialize;

const MAX_WIDTH: u32 = 120;
const MAX_HEIGHT: u32 = 200;
const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;

// Color ASCII settings
const COLOR_MAX_COLS: u32 = 80;
const COLOR_MAX_ROWS: u32 = 60;

const BAYER_MATRIX: [[u8; 4]; 4] = [
    [0, 136, 34, 170],
    [204, 68, 238, 102],
    [51, 187, 17, 153],
    [255, 119, 221, 85],
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
                if y + 1 < height && bayer_threshold(gray.get_pixel(x + 1, y + 1)[0], x + 1, y + 1)
                {
                    byte |= 0x10;
                }
                if y + 2 < height && bayer_threshold(gray.get_pixel(x + 1, y + 2)[0], x + 1, y + 2)
                {
                    byte |= 0x20;
                }
                if y + 3 < height && bayer_threshold(gray.get_pixel(x + 1, y + 3)[0], x + 1, y + 3)
                {
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

    let img = image::load_from_memory(image_bytes).map_err(|e| format!("Decode failed: {}", e))?;

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
    target_h /= 2;

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
    let bytes = fetch_image_bytes(url).await?;
    convert_to_braille(&bytes)
}

async fn fetch_image_bytes(url: &str) -> Result<Vec<u8>, String> {
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
    Ok(bytes.to_vec())
}

// --- Colored ASCII rendering using half-block characters ---

#[derive(Serialize, Clone)]
pub struct ColorCell {
    pub ch: String,
    pub fg: [u8; 3],
    pub bg: [u8; 3],
}

#[derive(Serialize)]
pub struct ColorAsciiResult {
    pub rows: Vec<Vec<ColorCell>>,
    pub width: u32,
    pub height: u32,
}

/// Convert image bytes to a colored ASCII grid using half-block characters.
/// Each cell represents 2 vertical pixels: the upper pixel is the foreground color
/// of a half-block char, and the lower pixel is the background color.
pub fn convert_to_color_ascii(image_bytes: &[u8]) -> Result<ColorAsciiResult, String> {
    if image_bytes.len() > MAX_IMAGE_BYTES {
        return Err("Image too large (>5MB)".to_string());
    }

    let img = image::load_from_memory(image_bytes).map_err(|e| format!("Decode failed: {}", e))?;

    let (src_w, src_h) = (img.width(), img.height());
    if src_w == 0 || src_h == 0 {
        return Err("Image has zero dimensions".to_string());
    }

    // Calculate target pixel dimensions
    // Each cell = 1 column wide, 2 pixels tall (half-block technique)
    let mut cols = COLOR_MAX_COLS;
    let pixel_w = cols;
    let mut pixel_h = (src_h as u64 * pixel_w as u64 / src_w as u64) as u32;

    // Ensure even height for half-block pairing
    pixel_h = (pixel_h / 2) * 2;

    let rows = pixel_h / 2;
    if rows > COLOR_MAX_ROWS {
        let pixel_h_new = COLOR_MAX_ROWS * 2;
        cols = (src_w as u64 * pixel_h_new as u64 / src_h as u64) as u32;
        pixel_h = pixel_h_new;
    }

    if cols < 1 || pixel_h < 2 {
        return Err("Image too small to render".to_string());
    }

    // Resize to target pixel dimensions in RGBA
    let rgba: RgbaImage = imageops::resize(
        &img.to_rgba8(),
        cols,
        pixel_h,
        imageops::FilterType::Lanczos3,
    );

    let final_rows = pixel_h / 2;
    let mut result_rows: Vec<Vec<ColorCell>> = Vec::with_capacity(final_rows as usize);

    for row in 0..final_rows {
        let y_top = row * 2;
        let y_bot = y_top + 1;
        let mut row_cells: Vec<ColorCell> = Vec::with_capacity(cols as usize);

        for x in 0..cols {
            let top_pixel = rgba.get_pixel(x, y_top);
            let bot_pixel = rgba.get_pixel(x, y_bot);

            // Use upper half-block: foreground = top pixel, background = bottom pixel
            let fg = [top_pixel[0], top_pixel[1], top_pixel[2]];
            let bg = [bot_pixel[0], bot_pixel[1], bot_pixel[2]];

            row_cells.push(ColorCell {
                ch: "\u{2580}".to_string(), // Upper half block
                fg,
                bg,
            });
        }

        result_rows.push(row_cells);
    }

    Ok(ColorAsciiResult {
        rows: result_rows,
        width: cols,
        height: final_rows,
    })
}

pub async fn fetch_and_convert_color(url: &str) -> Result<ColorAsciiResult, String> {
    let bytes = fetch_image_bytes(url).await?;
    convert_to_color_ascii(&bytes)
}
