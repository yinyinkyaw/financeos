const THAI_BAHT_FORMATTER = new Intl.NumberFormat('en-TH', {
  style: 'currency',
  currency: 'THB',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBaht(amountSatang: number): string {
  return THAI_BAHT_FORMATTER.format(amountSatang / 100);
}
