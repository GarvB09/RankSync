import { useState } from 'react';
import { getRankIcon, getRankEmoji, getRankColorClass } from '../utils/rankUtils';

/**
 * RankIcon — shows the valorant-api.com rank image with emoji fallback on error.
 * Props:
 *   rank     — e.g. "Diamond 3"
 *   size     — Tailwind size class (default "w-6 h-6")
 *   style    — extra inline style object
 *   className — extra classes
 */
export default function RankIcon({ rank, size = 'w-6 h-6', style, className = '' }) {
  const [failed, setFailed] = useState(false);
  const src = getRankIcon(rank);

  if (!src || failed) {
    return (
      <span className={`font-bold ${getRankColorClass(rank)} ${className}`}>
        {getRankEmoji(rank)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={rank}
      className={`object-contain ${size} ${className}`}
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45))', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
