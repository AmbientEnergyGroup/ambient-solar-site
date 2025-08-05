const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateAmbientLogo() {
  try {
    // Create canvas with transparent background
    const width = 800;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient for the text
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#06b6d4'); // Light teal
    gradient.addColorStop(1, '#0891b2'); // Darker teal
    
    // Set font properties to match the application
    ctx.font = 'bold 120px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Apply gradient to text
    ctx.fillStyle = gradient;
    
    // Draw the text "ambient"
    ctx.fillText('ambient', width / 2, height / 2);
    
    // Convert to JPEG with white background
    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
    // Save the JPEG file
    const outputPath = path.join(__dirname, 'public', 'images', 'ambient-logo-teal.jpeg');
    fs.writeFileSync(outputPath, jpegBuffer);
    
    console.log('✅ Ambient teal logo generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 Size: ${jpegBuffer.length} bytes`);
    
    // Also create a version with transparent background as PNG
    const pngBuffer = canvas.toBuffer('image/png');
    const pngOutputPath = path.join(__dirname, 'public', 'images', 'ambient-logo-teal.png');
    fs.writeFileSync(pngOutputPath, pngBuffer);
    
    console.log('✅ PNG version with transparent background also created!');
    console.log(`📁 PNG saved to: ${pngOutputPath}`);
    
    // Create a smaller version
    const smallCanvas = createCanvas(400, 100);
    const smallCtx = smallCanvas.getContext('2d');
    smallCtx.clearRect(0, 0, 400, 100);
    
    const smallGradient = smallCtx.createLinearGradient(0, 0, 400, 0);
    smallGradient.addColorStop(0, '#06b6d4');
    smallGradient.addColorStop(1, '#0891b2');
    
    smallCtx.font = 'bold 60px Inter, system-ui, sans-serif';
    smallCtx.textAlign = 'center';
    smallCtx.textBaseline = 'middle';
    smallCtx.fillStyle = smallGradient;
    smallCtx.fillText('ambient', 200, 50);
    
    const smallJpegBuffer = smallCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    const smallOutputPath = path.join(__dirname, 'public', 'images', 'ambient-logo-teal-small.jpeg');
    fs.writeFileSync(smallOutputPath, smallJpegBuffer);
    
    console.log('✅ Small version also created!');
    console.log(`📁 Small version: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating Ambient logo:', error);
  }
}

generateAmbientLogo(); 