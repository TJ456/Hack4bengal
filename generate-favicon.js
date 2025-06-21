import sharp from 'sharp';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateFavicon() {
  try {
    // Read the SVG file
    const svgBuffer = fs.readFileSync(join(__dirname, './public/favicon.svg'));
    
    // Convert to PNG at multiple sizes for favicon
    const sizes = [16, 32, 48];
    
    // Process each size
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(__dirname, `./public/favicon-${size}.png`));
      
      console.log(`Generated ${size}x${size} favicon`);
    }
    
    // Generate Apple Touch Icons
    const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];
    
    for (const size of appleSizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(__dirname, `./public/apple-touch-icon-${size}x${size}.png`));
      
      console.log(`Generated ${size}x${size} Apple Touch Icon`);
    }
    
    // Generate Android/Microsoft icons
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(join(__dirname, './public/android-chrome-192x192.png'));
    
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(join(__dirname, './public/android-chrome-512x512.png'));
    
    console.log('Favicon generation complete!');
  } catch (error) {
    console.error('Error generating favicon:', error);
  }
}

generateFavicon();
