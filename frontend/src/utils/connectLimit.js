export const DAILY_LIKE_LIMIT = 5;

export function getTodayLikes() {
  try {
    const stored = JSON.parse(localStorage.getItem('playpair-likes') || '{}');
    const today = new Date().toDateString();
    return stored.date === today ? (stored.count || 0) : 0;
  } catch { return 0; }
}

export function incrementLike() {
  const today = new Date().toDateString();
  const count = getTodayLikes() + 1;
  localStorage.setItem('playpair-likes', JSON.stringify({ date: today, count }));
  return count;
}

export function hasLikesLeft() {
  return getTodayLikes() < DAILY_LIKE_LIMIT;
}
