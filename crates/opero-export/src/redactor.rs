use image::{ImageBuffer, Rgba};
use opero_core::error::{OperoError, OperoResult};
use opero_core::models::AnnotationOverlay;
use std::path::Path;

/// [SEC-002] Irreversibly destroys underlying RGB pixel values inside every redaction/blur
/// bounding box and flattens optional Crop/Rectangle/Spotlight overlays onto an export-only buffer.
/// The internal Studio source image is NEVER mutated.
pub fn render_irreversibly_redacted_png(
    source_path: &Path,
    annotations: &[AnnotationOverlay],
) -> OperoResult<Vec<u8>> {
    let mut img: ImageBuffer<Rgba<u8>, Vec<u8>> = image::open(source_path)
        .map_err(|e| OperoError::Process(format!("Failed to decode source screenshot: {e}")))?
        .to_rgba8();
    let (w, h) = img.dimensions();

    // 1. Apply Spotlight surround dim first (so redaction always wins underneath/over)
    for ann in annotations.iter().filter(|a| a.annot_type == "spotlight") {
        let x0 = ((ann.geometry.x.clamp(0.0, 1.0)) * f64::from(w)) as u32;
        let y0 = ((ann.geometry.y.clamp(0.0, 1.0)) * f64::from(h)) as u32;
        let x1 = (((ann.geometry.x + ann.geometry.w).clamp(0.0, 1.0)) * f64::from(w)) as u32;
        let y1 = (((ann.geometry.y + ann.geometry.h).clamp(0.0, 1.0)) * f64::from(h)) as u32;
        for py in 0..h {
            for px in 0..w {
                if px < x0 || px >= x1 || py < y0 || py >= y1 {
                    let p = img.get_pixel_mut(px, py);
                    p[0] = ((u16::from(p[0]) * 45 + 23 * 55) / 100) as u8;
                    p[1] = ((u16::from(p[1]) * 45 + 35 * 55) / 100) as u8;
                    p[2] = ((u16::from(p[2]) * 45 + 52 * 55) / 100) as u8;
                }
            }
        }
    }

    // 2. Irreversible Pixel Redaction — permanently overwrites RGB bytes with zero-entropy #0F172A
    for ann in annotations
        .iter()
        .filter(|a| a.annot_type == "blur" || a.is_irreversible_redaction)
    {
        let x0 = ((ann.geometry.x.clamp(0.0, 1.0)) * f64::from(w)) as u32;
        let y0 = ((ann.geometry.y.clamp(0.0, 1.0)) * f64::from(h)) as u32;
        let x1 = (((ann.geometry.x + ann.geometry.w).clamp(0.0, 1.0)) * f64::from(w)).min(f64::from(w)) as u32;
        let y1 = (((ann.geometry.y + ann.geometry.h).clamp(0.0, 1.0)) * f64::from(h)).min(f64::from(h)) as u32;
        for py in y0..y1 {
            for px in x0..x1 {
                img.put_pixel(px, py, Rgba([15, 23, 42, 255]));
            }
        }
    }

    // 3. Draw crisp 3px Rectangle highlights
    for ann in annotations.iter().filter(|a| a.annot_type == "rect") {
        let x0 = ((ann.geometry.x.clamp(0.0, 1.0)) * f64::from(w)) as u32;
        let y0 = ((ann.geometry.y.clamp(0.0, 1.0)) * f64::from(h)) as u32;
        let x1 = (((ann.geometry.x + ann.geometry.w).clamp(0.0, 1.0)) * f64::from(w)).min(f64::from(w)) as u32;
        let y1 = (((ann.geometry.y + ann.geometry.h).clamp(0.0, 1.0)) * f64::from(h)).min(f64::from(h)) as u32;
        let border = Rgba([105, 188, 252, 255]); // #69BCFC
        for px in x0..x1 {
            for t in 0..3 {
                if y0 + t < h { img.put_pixel(px, y0 + t, border); }
                if y1.saturating_sub(1 + t) < h { img.put_pixel(px, y1.saturating_sub(1 + t), border); }
            }
        }
        for py in y0..y1 {
            for t in 0..3 {
                if x0 + t < w { img.put_pixel(x0 + t, py, border); }
                if x1.saturating_sub(1 + t) < w { img.put_pixel(x1.saturating_sub(1 + t), py, border); }
            }
        }
    }

    // 4. Apply non-destructive Crop destructively to export buffer so outside pixels are stripped
    let final_img = if let Some(crop) = annotations.iter().find(|a| a.annot_type == "crop") {
        let cx = ((crop.geometry.x.clamp(0.0, 0.98)) * f64::from(w)) as u32;
        let cy = ((crop.geometry.y.clamp(0.0, 0.98)) * f64::from(h)) as u32;
        let cw = ((crop.geometry.w.clamp(0.02, 1.0)) * f64::from(w)).max(16.0).min(f64::from(w - cx)) as u32;
        let ch = ((crop.geometry.h.clamp(0.02, 1.0)) * f64::from(h)).max(16.0).min(f64::from(h - cy)) as u32;
        image::imageops::crop_imm(&img, cx, cy, cw, ch).to_image()
    } else {
        img
    };

    let mut out = std::io::Cursor::new(Vec::new());
    final_img
        .write_to(&mut out, image::ImageFormat::Png)
        .map_err(|e| OperoError::Process(format!("Failed to encode redacted PNG: {e}")))?;
    Ok(out.into_inner())
}
