const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateSpiralLogo() {
  try {
    // Create canvas with transparent background
    const width = 800;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, width, height);
    
    // Create spiral pattern parameters - perfectly symmetrical
    const centerX = 80; // Move to left side
    const centerY = height / 2;
    const squareSize = 4; // Smaller squares to prevent touching
    const spacing = 6; // Smaller spacing
    
    // Create gradient for the squares
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#06b6d4'); // Light teal
    gradient.addColorStop(0.5, '#0891b2'); // Medium teal
    gradient.addColorStop(1, '#0e7490'); // Dark teal
    
    // Draw spiral pattern - perfectly symmetrical
    let angle = 0;
    let radius = 8; // Smaller starting radius
    const angleStep = 0.8; // Faster rotation for tighter spiral
    const radiusStep = 0.3; // Smaller radius increase for compactness
    
    ctx.fillStyle = gradient;
    
    // Create the spiral pattern - perfectly symmetrical
    for (let i = 0; i < 100; i++) { // Fewer iterations for symmetrical design
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      // Only draw squares within a perfect square area (60x60 pixels)
      if (x >= 50 && x <= 110 && y >= 70 && y <= 130) {
        ctx.fillRect(x - squareSize/2, y - squareSize/2, squareSize, squareSize);
      }
      
      angle += angleStep;
      radius += radiusStep;
    }
    
    // Add subtle shadow
    ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Redraw the spiral with shadow
    angle = 0;
    radius = 8;
    for (let i = 0; i < 100; i++) {
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (x >= 50 && x <= 110 && y >= 70 && y <= 130) {
        ctx.fillRect(x - squareSize/2, y - squareSize/2, squareSize, squareSize);
      }
      
      angle += angleStep;
      radius += radiusStep;
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add text "ambient" next to the square spiral - smaller font
    const textGradient = ctx.createLinearGradient(130, 0, width, 0);
    textGradient.addColorStop(0, '#06b6d4'); // Light teal
    textGradient.addColorStop(1, '#0891b2'); // Darker teal
    
    ctx.font = 'bold 45px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textGradient;
    
    // Draw the text "ambient" next to the square spiral
    ctx.fillText('ambient', 130, height / 2);
    
    // Convert to JPEG with white background
    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
    // Save the JPEG file
    const outputPath = path.join(__dirname, 'public', 'images', 'ambient-spiral-logo.jpeg');
    fs.writeFileSync(outputPath, jpegBuffer);
    
    console.log('✅ Ambient spiral logo generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 Size: ${jpegBuffer.length} bytes`);
    
    // Also create a version with transparent background as PNG
    const pngBuffer = canvas.toBuffer('image/png');
    const pngOutputPath = path.join(__dirname, 'public', 'images', 'ambient-spiral-logo.png');
    fs.writeFileSync(pngOutputPath, pngBuffer);
    
    console.log('✅ PNG version with transparent background also created!');
    console.log(`📁 PNG saved to: ${pngOutputPath}`);
    
    // Create a smaller version
    const smallCanvas = createCanvas(400, 100);
    const smallCtx = smallCanvas.getContext('2d');
    smallCtx.clearRect(0, 0, 400, 100);
    
    // Scale down the spiral for small version - perfectly symmetrical
    const smallSquareSize = 2;
    const smallSpacing = 3;
    const smallCenterX = 30; // Move to left side
    const smallCenterY = 50;
    
    const smallGradient = smallCtx.createLinearGradient(0, 0, 400, 0);
    smallGradient.addColorStop(0, '#06b6d4');
    smallGradient.addColorStop(0.5, '#0891b2');
    smallGradient.addColorStop(1, '#0e7490');
    
    smallCtx.fillStyle = smallGradient;
    
    // Create smaller spiral - perfectly symmetrical
    let smallAngle = 0;
    let smallRadius = 4;
    const smallAngleStep = 1.0;
    const smallRadiusStep = 0.2;
    
    for (let i = 0; i < 60; i++) {
      const x = smallCenterX + smallRadius * Math.cos(smallAngle);
      const y = smallCenterY + smallRadius * Math.sin(smallAngle);
      
      if (x >= 15 && x <= 45 && y >= 35 && y <= 65) {
        smallCtx.fillRect(x - smallSquareSize/2, y - smallSquareSize/2, smallSquareSize, smallSquareSize);
      }
      
      smallAngle += smallAngleStep;
      smallRadius += smallRadiusStep;
    }
    
    // Add shadow to small version
    smallCtx.shadowColor = 'rgba(6, 182, 212, 0.3)';
    smallCtx.shadowBlur = 4;
    smallCtx.shadowOffsetX = 1;
    smallCtx.shadowOffsetY = 1;
    
    // Redraw small spiral with shadow
    smallAngle = 0;
    smallRadius = 4;
    for (let i = 0; i < 60; i++) {
      const x = smallCenterX + smallRadius * Math.cos(smallAngle);
      const y = smallCenterY + smallRadius * Math.sin(smallAngle);
      
      if (x >= 15 && x <= 45 && y >= 35 && y <= 65) {
        smallCtx.fillRect(x - smallSquareSize/2, y - smallSquareSize/2, smallSquareSize, smallSquareSize);
      }
      
      smallAngle += smallAngleStep;
      smallRadius += smallRadiusStep;
    }
    
    // Reset shadow
    smallCtx.shadowColor = 'transparent';
    smallCtx.shadowBlur = 0;
    smallCtx.shadowOffsetX = 0;
    smallCtx.shadowOffsetY = 0;
    
    const smallTextGradient = smallCtx.createLinearGradient(60, 0, 400, 0);
    smallTextGradient.addColorStop(0, '#06b6d4');
    smallTextGradient.addColorStop(1, '#0891b2');
    
    smallCtx.font = 'bold 22px Inter, system-ui, sans-serif';
    smallCtx.textAlign = 'left';
    smallCtx.textBaseline = 'middle';
    smallCtx.fillStyle = smallTextGradient;
    smallCtx.fillText('ambient', 60, 50);
    
    const smallJpegBuffer = smallCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    const smallOutputPath = path.join(__dirname, 'public', 'images', 'ambient-spiral-logo-small.jpeg');
    fs.writeFileSync(smallOutputPath, smallJpegBuffer);
    
    console.log('✅ Small version also created!');
    console.log(`📁 Small version: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating spiral logo:', error);
  }
}

generateSpiralLogo(); 