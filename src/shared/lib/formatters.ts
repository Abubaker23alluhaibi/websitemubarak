export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (currency === 'IQD') {
    return `${new Intl.NumberFormat('en-US').format(amount)} د.ع`;
  }
  if (currency === 'EUR') {
    return `${new Intl.NumberFormat('de-DE').format(amount)} €`;
  }
  return `${amount} ${currency}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
