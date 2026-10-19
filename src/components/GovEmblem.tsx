import React from 'react';

interface GovEmblemProps {
  size?: number;
  className?: string;
}

export const GovEmblem: React.FC<GovEmblemProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`gov-emblem ${className}`}
      aria-label="Lambang Resmi Pemerintah Sistem Tanggap Bencana"
    >
      <defs>
        <linearGradient id="govGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="govShieldBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0a192f" />
        </linearGradient>
      </defs>

      {/* Perisai Segilima Resmi */}
      <path
        d="M24 3.5L42 9.5V22C42 33.5 34.3 43.2 24 46C13.7 43.2 6 33.5 6 22V9.5L24 3.5Z"
        fill="url(#govShieldBg)"
        stroke="url(#govGoldGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Sayap / Ornamen Garuda Sisi Kanan (Merah) */}
      <path
        d="M24 6.8L38.5 11.6V20.5C38.5 28 32.5 35 24 39.5V6.8Z"
        fill="#dc2626"
        opacity="0.95"
      />

      {/* Sayap / Ornamen Garuda Sisi Kiri (Putih) */}
      <path
        d="M24 6.8L9.5 11.6V20.5C9.5 28 15.5 35 24 39.5V6.8Z"
        fill="#f8fafc"
        opacity="0.98"
      />

      {/* Lingkaran / Garis Pemisah Tengah */}
      <path d="M24 6.8V39.5" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1" />

      {/* Bintang Emas Ketuhanan & Kedaulatan di Titik Pusat */}
      <polygon
        points="24,14 26.2,20.8 33.4,20.8 27.6,25 29.8,31.8 24,27.6 18.2,31.8 20.4,25 14.6,20.8 21.8,20.8"
        fill="url(#govGoldGrad)"
        stroke="#78350f"
        strokeWidth="0.5"
      />

      {/* Pita Bhinneka Tunggal Ika / Pita Bencana di Bawah */}
      <path
        d="M13 41.5C16.5 43.5 20.2 44.5 24 44.5C27.8 44.5 31.5 43.5 35 41.5"
        stroke="#f59e0b"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
