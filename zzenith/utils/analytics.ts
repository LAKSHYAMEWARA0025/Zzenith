export function calculateEngagementRate(views: number, likes: number) {
  if (views === 0) return 0;
  return (likes / views) * 100;
}
