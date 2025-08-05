import React from 'react';

interface AmbientLogoProps {
  theme?: 'light' | 'dark';
  size?: 'md' | 'lg' | 'xl';
}

export default function AmbientLogo({ theme = 'dark', size = 'md' }: AmbientLogoProps) {
  const isDarkTheme = theme === 'dark';
  let textSize = 'text-3xl';
  let barWidth = 'w-5';
  let barHeight = 'h-1.5';
  let marginLeft = 'ml-4';
  if (size === 'lg') {
    textSize = 'text-5xl';
    barWidth = 'w-10';
    barHeight = 'h-3';
    marginLeft = 'ml-10';
  } else if (size === 'xl') {
    textSize = 'text-7xl';
    barWidth = 'w-16';
    barHeight = 'h-4';
    marginLeft = 'ml-16';
  }
  return (
    <div className="flex items-center">
      <div className={`font-extrabold tracking-tight ${textSize} ${isDarkTheme ? 'text-gradient' : 'text-cyan-500'}`}>ambient</div>
    </div>
  );
} 