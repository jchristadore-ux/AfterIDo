import type { Address, PersonName, Profile } from '@/types';
import { STATE_NAME } from '@/data/states';

export function fullName(n: PersonName): string {
  return [n.first, n.middle, n.last].filter(Boolean).join(' ').trim();
}

export function initials(n: PersonName): string {
  return [n.first, n.last]
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function addressBlock(a: Address): string {
  const cityLine = [a.city, a.state, a.zip].filter(Boolean).join(a.city && a.state ? ', ' : ' ');
  return [a.line1, a.line2, cityLine].filter(Boolean).join('\n');
}

export function addressOneLine(a: Address): string {
  return addressBlock(a).split('\n').join(', ');
}

/** Formats an ISO yyyy-mm-dd without letting the browser shift it a timezone. */
export function formatDate(iso: string | undefined, style: 'long' | 'short' = 'long'): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function marriagePlace(p: Profile): string {
  const { county, state } = p.marriage;
  const stateName = state ? STATE_NAME[state] ?? state : '';
  if (county && stateName) return `${county} County, ${stateName}`;
  return stateName || county || '';
}

export function formatMinutes([lo, hi]: [number, number]): string {
  const asText = (m: number) => (m >= 60 ? `${Math.round((m / 60) * 10) / 10} hr` : `${m} min`);
  if (lo === hi) return asText(hi);
  // Drop the repeated unit only when both ends share it: "20–40 min", but
  // "45 min–2 hr".
  const sameUnit = lo >= 60 === hi >= 60;
  return sameUnit
    ? `${lo >= 60 ? Math.round((lo / 60) * 10) / 10 : lo}–${asText(hi)}`
    : `${asText(lo)}–${asText(hi)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

/** "in 3 days" / "yesterday" — used by the reminders list. */
export function relativeDay(iso: string): string {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return '';
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(target) - startOf(new Date())) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `in ${days} days`;
}
