const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateExactLogo() {
  try {
    // Create canvas with transparent background
    const width = 800;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Set background to transparent
    ctx.clearRect(0, 0, width, height);
    
    // Create circular logo parameters
    const centerX = 120;
    const centerY = height / 2;
    const outerRadius = 60;
    const innerRadius = 25;
    const lineThickness = 2;
    const squareSize = 3;
    
    // Set teal color
    ctx.strokeStyle = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    ctx.lineWidth = lineThickness;
    
    // Draw the circular band
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Clear the inner circle
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Create the exact maze-like pattern from the reference
    const segments = 32; // More segments for precision
    const rings = 5; // Multiple rings for complexity
    
    // Draw the maze-like pattern with exact structure
    for (let ring = 0; ring < rings; ring++) {
      const ringRadius = innerRadius + (ring + 1) * ((outerRadius - innerRadius) / (rings + 1));
      
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const nextAngle = ((i + 1) * 2 * Math.PI) / segments;
        
        // Create the maze-like pattern with specific intervals
        if (i % 3 === 0) { // Every 3rd segment
          const x1 = centerX + ringRadius * Math.cos(angle);
          const y1 = centerY + ringRadius * Math.sin(angle);
          const x2 = centerX + ringRadius * Math.cos(nextAngle);
          const y2 = centerY + ringRadius * Math.sin(nextAngle);
          
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }
    
    // Add radial lines at specific intervals
    for (let i = 0; i < segments; i += 4) { // Every 4th segment
      const angle = (i * 2 * Math.PI) / segments;
      const startX = centerX + innerRadius * Math.cos(angle);
      const startY = centerY + innerRadius * Math.sin(angle);
      const endX = centerX + outerRadius * Math.cos(angle);
      const endY = centerY + outerRadius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Add squares at specific strategic points
    for (let ring = 0; ring < rings; ring++) {
      const ringRadius = innerRadius + (ring + 1) * ((outerRadius - innerRadius) / (rings + 1));
      
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const x = centerX + ringRadius * Math.cos(angle);
        const y = centerY + ringRadius * Math.sin(angle);
        
        // Add squares at specific intervals to match the reference
        if (i % 4 === 0 || i % 8 === 0) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance >= innerRadius && distance <= outerRadius) {
            ctx.fillRect(x - squareSize/2, y - squareSize/2, squareSize, squareSize);
          }
        }
      }
    }
    
    // Add connecting lines to create the maze effect
    for (let ring = 0; ring < rings - 1; ring++) {
      const ringRadius1 = innerRadius + (ring + 1) * ((outerRadius - innerRadius) / (rings + 1));
      const ringRadius2 = innerRadius + (ring + 2) * ((outerRadius - innerRadius) / (rings + 1));
      
      for (let i = 0; i < segments; i += 6) { // Every 6th segment
        const angle = (i * 2 * Math.PI) / segments;
        const x1 = centerX + ringRadius1 * Math.cos(angle);
        const y1 = centerY + ringRadius1 * Math.sin(angle);
        const x2 = centerX + ringRadius2 * Math.cos(angle);
        const y2 = centerY + ringRadius2 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    
    // Add text "ambient" next to the circular logo
    const textGradient = ctx.createLinearGradient(200, 0, width, 0);
    textGradient.addColorStop(0, '#06b6d4'); // Light teal
    textGradient.addColorStop(1, '#0891b2'); // Darker teal
    
    ctx.font = 'bold 50px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textGradient;
    
    // Draw the text "ambient"
    ctx.fillText('ambient', 200, height / 2);
    
    // Convert to JPEG with white background
    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    
    // Save the JPEG file
    const outputPath = path.join(__dirname, 'public', 'images', 'ambient-exact-logo.jpeg');
    fs.writeFileSync(outputPath, jpegBuffer);
    
    console.log('✅ Ambient exact logo generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📏 Size: ${jpegBuffer.length} bytes`);
    
    // Also create a version with transparent background as PNG
    const pngBuffer = canvas.toBuffer('image/png');
    const pngOutputPath = path.join(__dirname, 'public', 'images', 'ambient-exact-logo.png');
    fs.writeFileSync(pngOutputPath, pngBuffer);
    
    console.log('✅ PNG version with transparent background also created!');
    console.log(`📁 PNG saved to: ${pngOutputPath}`);
    
    // Create a smaller version
    const smallCanvas = createCanvas(400, 100);
    const smallCtx = smallCanvas.getContext('2d');
    smallCtx.clearRect(0, 0, 400, 100);
    
    // Scale down the circular logo for small version
    const smallCenterX = 60;
    const smallCenterY = 50;
    const smallOuterRadius = 30;
    const smallInnerRadius = 12;
    const smallLineThickness = 1;
    const smallSquareSize = 2;
    
    // Set teal color for small version
    smallCtx.strokeStyle = '#06b6d4';
    smallCtx.fillStyle = '#06b6d4';
    smallCtx.lineWidth = smallLineThickness;
    
    // Draw the small circular band
    smallCtx.beginPath();
    smallCtx.arc(smallCenterX, smallCenterY, smallOuterRadius, 0, 2 * Math.PI);
    smallCtx.stroke();
    
    // Clear the inner circle
    smallCtx.globalCompositeOperation = 'destination-out';
    smallCtx.beginPath();
    smallCtx.arc(smallCenterX, smallCenterY, smallInnerRadius, 0, 2 * Math.PI);
    smallCtx.fill();
    smallCtx.globalCompositeOperation = 'source-over';
    
    // Create the exact maze-like pattern for small version
    const smallSegments = 20;
    const smallRings = 4;
    
    // Draw the maze-like pattern with exact structure
    for (let ring = 0; ring < smallRings; ring++) {
      const ringRadius = smallInnerRadius + (ring + 1) * ((smallOuterRadius - smallInnerRadius) / (smallRings + 1));
      
      for (let i = 0; i < smallSegments; i++) {
        const angle = (i * 2 * Math.PI) / smallSegments;
        const nextAngle = ((i + 1) * 2 * Math.PI) / smallSegments;
        
        // Create the maze-like pattern with specific intervals
        if (i % 3 === 0) { // Every 3rd segment
          const x1 = smallCenterX + ringRadius * Math.cos(angle);
          const y1 = smallCenterY + ringRadius * Math.sin(angle);
          const x2 = smallCenterX + ringRadius * Math.cos(nextAngle);
          const y2 = smallCenterY + ringRadius * Math.sin(nextAngle);
          
          smallCtx.beginPath();
          smallCtx.moveTo(x1, y1);
          smallCtx.lineTo(x2, y2);
          smallCtx.stroke();
        }
      }
    }
    
    // Add radial lines at specific intervals
    for (let i = 0; i < smallSegments; i += 4) { // Every 4th segment
      const angle = (i * 2 * Math.PI) / smallSegments;
      const startX = smallCenterX + smallInnerRadius * Math.cos(angle);
      const startY = smallCenterY + smallInnerRadius * Math.sin(angle);
      const endX = smallCenterX + smallOuterRadius * Math.cos(angle);
      const endY = smallCenterY + smallOuterRadius * Math.sin(angle);
      
      smallCtx.beginPath();
      smallCtx.moveTo(startX, startY);
      smallCtx.lineTo(endX, endY);
      smallCtx.stroke();
    }
    
    // Add squares at specific strategic points
    for (let ring = 0; ring < smallRings; ring++) {
      const ringRadius = smallInnerRadius + (ring + 1) * ((smallOuterRadius - smallInnerRadius) / (smallRings + 1));
      
      for (let i = 0; i < smallSegments; i++) {
        const angle = (i * 2 * Math.PI) / smallSegments;
        const x = smallCenterX + ringRadius * Math.cos(angle);
        const y = smallCenterY + ringRadius * Math.sin(angle);
        
        // Add squares at specific intervals to match the reference
        if (i % 4 === 0 || i % 8 === 0) {
          const distance = Math.sqrt((x - smallCenterX) ** 2 + (y - smallCenterY) ** 2);
          if (distance >= smallInnerRadius && distance <= smallOuterRadius) {
            smallCtx.fillRect(x - smallSquareSize/2, y - smallSquareSize/2, smallSquareSize, smallSquareSize);
          }
        }
      }
    }
    
    // Add connecting lines to create the maze effect
    for (let ring = 0; ring < smallRings - 1; ring++) {
      const ringRadius1 = smallInnerRadius + (ring + 1) * ((smallOuterRadius - smallInnerRadius) / (smallRings + 1));
      const ringRadius2 = smallInnerRadius + (ring + 2) * ((smallOuterRadius - smallInnerRadius) / (smallRings + 1));
      
      for (let i = 0; i < smallSegments; i += 6) { // Every 6th segment
        const angle = (i * 2 * Math.PI) / smallSegments;
        const x1 = smallCenterX + ringRadius1 * Math.cos(angle);
        const y1 = smallCenterY + ringRadius1 * Math.sin(angle);
        const x2 = smallCenterX + ringRadius2 * Math.cos(angle);
        const y2 = smallCenterY + ringRadius2 * Math.sin(angle);
        
        smallCtx.beginPath();
        smallCtx.moveTo(x1, y1);
        smallCtx.lineTo(x2, y2);
        smallCtx.stroke();
      }
    }
    
    const smallTextGradient = smallCtx.createLinearGradient(110, 0, 400, 0);
    smallTextGradient.addColorStop(0, '#06b6d4');
    smallTextGradient.addColorStop(1, '#0891b2');
    
    smallCtx.font = 'bold 25px Inter, system-ui, sans-serif';
    smallCtx.textAlign = 'left';
    smallCtx.textBaseline = 'middle';
    smallCtx.fillStyle = smallTextGradient;
    smallCtx.fillText('ambient', 110, 50);
    
    const smallJpegBuffer = smallCanvas.toBuffer('image/jpeg', { quality: 0.95 });
    const smallOutputPath = path.join(__dirname, 'public', 'images', 'ambient-exact-logo-small.jpeg');
    fs.writeFileSync(smallOutputPath, smallJpegBuffer);
    
    console.log('✅ Small version also created!');
    console.log(`📁 Small version: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating exact logo:', error);
  }
}

generateExactLogo(); 