import type { PlayerAccent } from '../types/game'

export const PLAYER_ACCENT_ORDER: PlayerAccent[] = [
  'coral-red',
  'royal-blue',
  'emerald-green',
  'amethyst-purple',
  'warm-gold',
  'magenta',
  'sky-blue',
  'orange',
  'teal',
  'raspberry'
]

export const PLAYER_ACCENT_COLORS: Record<PlayerAccent, string> = {
  'coral-red': '#cf4b3f',
  'royal-blue': '#3c5ecf',
  'emerald-green': '#2f8a55',
  'amethyst-purple': '#7b53b5',
  'warm-gold': '#b7862f',
  magenta: '#bb3f8d',
  'sky-blue': '#4c92d9',
  orange: '#cf6e2f',
  teal: '#2f7f86',
  raspberry: '#b23b63'
}

export function getAccentColor(accent: string | undefined, fallback = '#5f7480'): string {
  if (!accent) return fallback
  return PLAYER_ACCENT_COLORS[accent as PlayerAccent] ?? fallback
}
