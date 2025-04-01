export const minutesToMilliseconds = (minutes: number): number => minutes * 60000

export const formatTime = (ms: number): integer => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
