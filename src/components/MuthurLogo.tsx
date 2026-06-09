interface MuthurLogoProps {
  size?: number | string;
  color?: string;
  shadowColor?: string;
  className?: string;
}

export default function MuthurLogo({
  size = 24,
  color = 'currentColor',
  shadowColor = 'rgba(0,0,0,0.6)',
  className = '',
}: MuthurLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <polygon
        points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
        fill="none"
        stroke={color}
        strokeWidth="4"
      />
      {/* Inner hexagon (shadow) */}
      <polygon
        points="50,15 81,33 81,67 50,85 19,67 19,33"
        fill={shadowColor}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* 3D cube - top face */}
      <polygon
        points="50,35 65,43 50,51 35,43"
        fill={color}
        opacity="0.9"
      />
      {/* 3D cube - left face */}
      <polygon
        points="35,43 50,51 50,65 35,57"
        fill={shadowColor}
        stroke={color}
        strokeWidth="0.8"
      />
      {/* 3D cube - right face */}
      <polygon
        points="65,43 50,51 50,65 65,57"
        fill={shadowColor}
        stroke={color}
        strokeWidth="0.8"
        opacity="0.7"
      />
      {/* Vertical axis line (dashed) */}
      <line
        x1="50" y1="20" x2="50" y2="35"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.6"
      />
      {/* Bottom perspective lines (dashed) */}
      <line
        x1="35" y1="57" x2="20" y2="67"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.4"
      />
      <line
        x1="65" y1="57" x2="80" y2="67"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.4"
      />
      <line
        x1="50" y1="65" x2="50" y2="78"
        stroke={color}
        strokeWidth="0.8"
        strokeDasharray="2,2"
        opacity="0.4"
      />
      {/* M letter on front face */}
      <text
        x="50"
        y="55"
        textAnchor="middle"
        fontSize="10"
        fontFamily="'Share Tech Mono', monospace"
        fontWeight="bold"
        fill={color}
      >
        M
      </text>
    </svg>
  );
}
