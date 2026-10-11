const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactBrlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatCurrencyFromCents(amountInCents: number): string {
  return brlFormatter.format(amountInCents / 100);
}

export function formatCompactCurrencyFromCents(amountInCents: number): string {
  if (Math.abs(amountInCents) < 100000) {
    return formatCurrencyFromCents(amountInCents);
  }
  return compactBrlFormatter.format(amountInCents / 100);
}

export function formatPercentage(
  value: number | null | undefined,
  options?: { showSign?: boolean },
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  const formatted = `${percentFormatter.format(Math.abs(value))}%`;
  if (!options?.showSign) {
    return value < 0 ? `-${formatted}` : formatted;
  }
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return `0,0%`;
}

export function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatShortDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];
  const monthIdx = Number.parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${months[monthIdx] || parts[1]}`;
}

export function formatMonthYearBR(yearMonth: string): string {
  const parts = yearMonth.split('-');
  if (parts.length < 2) return yearMonth;
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const monthIdx = Number.parseInt(parts[1], 10) - 1;
  return `${months[monthIdx] || parts[1]}/${parts[0].slice(2)}`;
}

/**
 * Parses a Brazilian currency input string (e.g. "1.234,56" or "15,90" or "15.90" or "25")
 * into integer cents (e.g. 123456, 1590, 2500).
 */
export function parseCurrencyInputToCents(raw: string): number {
  const cleaned = raw.replace(/[^\d.,]/g, '').trim();
  if (!cleaned) return 0;

  // If user typed comma as decimal separator (standard BR: "1.250,90" or "15,90")
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // If user typed a single dot with 1 or 2 decimals (e.g. "15.90")
  const dotParts = cleaned.split('.');
  if (dotParts.length === 2 && dotParts[1].length <= 2) {
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100);
  }

  // Otherwise treat dots as thousands separators (e.g. "1.500")
  const digitsOnly = cleaned.replace(/\./g, '');
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isNaN(parsed) ? 0 : parsed * 100;
}

export function centsToDecimalInput(cents: number): string {
  if (!cents || cents <= 0) return '';
  return (cents / 100).toFixed(2).replace('.', ',');
}
