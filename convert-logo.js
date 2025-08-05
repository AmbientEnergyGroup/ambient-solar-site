const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertSvgToJpeg() {
  try {
    // Read the SVG file
    const svgPath = path.join(__dirname, 'template-2', 'public', 'images', 'ambient-logo.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Convert SVG to JPEG using sharp
    const jpegBuffer = await sharp(Buffer.from(svgContent))
      .jpeg({ quality: 90 })
      .resize(1200, 300) // 2x the original size for better quality
      .toBuffer();
    
    // Save the JPEG file
    const outputPath = path.join(__dirname, 'public', 'images', 'ambient-logo.jpeg');
    fs.writeFileSync(outputPath, jpegBuffer);
    
    console.log('✅ Ambient logo converted to JPEG successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 Size: ${jpegBuffer.length} bytes`);
    
    // Also create a smaller version
    const smallJpegBuffer = await sharp(Buffer.from(svgContent))
      .jpeg({ quality: 85 })
      .resize(600, 150) // Original size
      .toBuffer();
    
    const smallOutputPath = path.join(__dirname, 'public', 'images', 'ambient-logo-small.jpeg');
    fs.writeFileSync(smallOutputPath, smallJpegBuffer);
    
    console.log('✅ Small version also created!');
    console.log(`📁 Small version: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('❌ Error converting SVG to JPEG:', error);
  }
}

convertSvgToJpeg(); 