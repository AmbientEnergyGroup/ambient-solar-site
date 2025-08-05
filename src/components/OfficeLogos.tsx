import React from 'react';
import Image from "next/image";

interface OfficeLogoProps {
  office: string;
  className?: string;
  size?: number;
}

export function OfficeLogo({ office, size = 48 }: { office: string; size?: number }) {
  switch (office) {
    case "Fresno":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Simple mountain range */}
          <path d="M2 20L6 14L10 18L14 12L18 16L22 10V22H2V20Z" fill="#9CA3AF"/>
          <path d="M4 18L6 15L8 18L10 14L12 16L14 12L16 14L18 10L20 12L22 8" stroke="#6B7280" strokeWidth="1" fill="none"/>
          <circle cx="18" cy="13" r="1.5" fill="#6B7280"/>
        </svg>
      );
    case "Lancaster":
      return (
        <Image
          src="/images/lancaster-logo.jpeg"
          alt="Lancaster Office Logo"
          width={size}
          height={size}
          style={{ borderRadius: 8, objectFit: "contain", background: "#fff" }}
        />
      );
    case "Bakersfield":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Desert ground */}
          <rect x="2" y="18" width="20" height="4" fill="#FDE68A"/>
          {/* Oil rig */}
          <rect x="6" y="10" width="2" height="8" fill="#6B7280"/>
          <rect x="8" y="12" width="2" height="6" fill="#A3A3A3"/>
          <rect x="10" y="14" width="2" height="4" fill="#6B7280"/>
          <rect x="12" y="16" width="2" height="2" fill="#A3A3A3"/>
          {/* Sun */}
          <circle cx="18" cy="8" r="3" fill="#F59E42"/>
          {/* Dots for desert */}
          <circle cx="4" cy="20" r="1" fill="#9CA3AF"/>
          <circle cx="8" cy="21" r="0.5" fill="#9CA3AF"/>
          <circle cx="20" cy="19" r="1" fill="#9CA3AF"/>
        </svg>
      );
    case "Los Angeles":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Ground */}
          <rect x="2" y="18" width="20" height="4" fill="#A3A3A3"/>
          {/* Skyline */}
          <rect x="4" y="14" width="2" height="4" fill="#6B7280"/>
          <rect x="7" y="10" width="2" height="8" fill="#A3A3A3"/>
          <rect x="10" y="12" width="2" height="6" fill="#6B7280"/>
          <rect x="13" y="8" width="2" height="10" fill="#A3A3A3"/>
          <rect x="16" y="13" width="2" height="5" fill="#6B7280"/>
          <rect x="19" y="15" width="2" height="3" fill="#A3A3A3"/>
          {/* Palm tree trunk */}
          <rect x="17.5" y="12" width="1" height="3" fill="#6B7280"/>
          {/* Palm leaves */}
          <line x1="18" y1="12" x2="20" y2="10" stroke="#6B7280" strokeWidth="1"/>
          <line x1="18" y1="12" x2="21" y2="12" stroke="#6B7280" strokeWidth="1"/>
          <line x1="18" y1="12" x2="20" y2="14" stroke="#6B7280" strokeWidth="1"/>
          {/* LA sun */}
          <circle cx="21" cy="8" r="1.5" fill="#F59E42"/>
          {/* Dots for city lights */}
          <line x1="19" y1="18" x2="21" y2="16" stroke="#9CA3AF" strokeWidth="2"/>
        </svg>
      );
    default:
      return null;
  }
}

export default OfficeLogo; 