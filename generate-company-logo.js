const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateCompanyLogo() {
  try {
    // Create canvas with transparent background
    const width = 800;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, width, height);
    
    // Create a simple geometric design on the left side
    // This will be a modern, abstract sun-like shape
    const designX = 80;
    const designY = height / 2;
    const designSize = 60;
    
    // Create gradient for the design
    const designGradient = ctx.createRadialGradient(designX, designY, 0, designX, designY, designSize);
    designGradient.addColorStop(0, '#06b6d4'); // Light teal center
    designGradient.addColorStop(0.7, '#0891b2'); // Darker teal
    designGradient.addColorStop(1, '#0e7490'); // Darkest teal
    
    // Draw the main circle
    ctx.beginPath();
    ctx.arc(designX, designY, designSize, 0, 2 * Math.PI);
    ctx.fillStyle = designGradient;
    ctx.fill();
    
    // Add inner circle for depth
    ctx.beginPath();
    ctx.arc(designX, designY, designSize * 0.6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    
    // Add center dot
    ctx.beginPath();
    ctx.arc(designX, designY, designSize * 0.2, 0, 2 * Math.PI);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();
    
    // Create gradient for the text
    const textGradient = ctx.createLinearGradient(designX + designSize + 20, 0, width, 0);
    textGradient.addColorStop(0, '#06b6d4'); // Light teal
    textGradient.addColorStop(1, '#0891b2'); // Darker teal
    
    // Set font properties
    ctx.font = 'bold 80px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Apply gradient to text
    ctx.fillStyle = textGradient;
    
    // Draw the text "ambient"
    ctx.fillText('ambient', designX + designSize + 30, height / 2);
    
    // Convert to JPEG with white background
    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
    // Save the JPEG file
    const outputPath = path.join(__dirname, 'public', 'images', 'ambient-company-logo.jpeg');
    fs.writeFileSync(outputPath, jpegBuffer);
    
    console.log('✅ Ambient company logo generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 Size: ${jpegBuffer.length} bytes`);
    
    // Also create a version with transparent background as PNG
    const pngBuffer = canvas.toBuffer('image/png');
    const pngOutputPath = path.join(__dirname, 'public', 'images', 'ambient-company-logo.png');
    fs.writeFileSync(pngOutputPath, pngBuffer);
    
    console.log('✅ PNG version with transparent background also created!');
    console.log(`📁 PNG saved to: ${pngOutputPath}`);
    
    // Create a smaller version
    const smallCanvas = createCanvas(400, 100);
    const smallCtx = smallCanvas.getContext('2d');
    smallCtx.clearRect(0, 0, 400, 100);
    
    // Scale down the design for small version
    const smallDesignX = 40;
    const smallDesignY = 50;
    const smallDesignSize = 30;
    
    const smallDesignGradient = smallCtx.createRadialGradient(smallDesignX, smallDesignY, 0, smallDesignX, smallDesignY, smallDesignSize);
    smallDesignGradient.addColorStop(0, '#06b6d4');
    smallDesignGradient.addColorStop(0.7, '#0891b2');
    smallDesignGradient.addColorStop(1, '#0e7490');
    
    // Draw small design
    smallCtx.beginPath();
    smallCtx.arc(smallDesignX, smallDesignY, smallDesignSize, 0, 2 * Math.PI);
    smallCtx.fillStyle = smallDesignGradient;
    smallCtx.fill();
    
    smallCtx.beginPath();
    smallCtx.arc(smallDesignX, smallDesignY, smallDesignSize * 0.6, 0, 2 * Math.PI);
    smallCtx.fillStyle = '#ffffff';
    smallCtx.fill();
    
    smallCtx.beginPath();
    smallCtx.arc(smallDesignX, smallDesignY, smallDesignSize * 0.2, 0, 2 * Math.PI);
    smallCtx.fillStyle = '#06b6d4';
    smallCtx.fill();
    
    const smallTextGradient = smallCtx.createLinearGradient(smallDesignX + smallDesignSize + 10, 0, 400, 0);
    smallTextGradient.addColorStop(0, '#06b6d4');
    smallTextGradient.addColorStop(1, '#0891b2');
    
    smallCtx.font = 'bold 40px Inter, system-ui, sans-serif';
    smallCtx.textAlign = 'left';
    smallCtx.textBaseline = 'middle';
    smallCtx.fillStyle = smallTextGradient;
    smallCtx.fillText('ambient', smallDesignX + smallDesignSize + 15, 50);
    
    const smallJpegBuffer = smallCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    const smallOutputPath = path.join(__dirname, 'public', 'images', 'ambient-company-logo-small.jpeg');
    fs.writeFileSync(smallOutputPath, smallJpegBuffer);
    
    console.log('✅ Small version also created!');
    console.log(`📁 Small version: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating company logo:', error);
  }
}

generateCompanyLogo(); 