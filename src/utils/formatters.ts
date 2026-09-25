export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

export type StockLevel = 'CRITICO' | 'BAJO' | 'NORMAL';

export const getStockLevel = (stock: number, stockMin: number): StockLevel => {
  if (stock <= 0) return 'CRITICO';
  if (stock <= stockMin) return 'BAJO';
  return 'NORMAL';
};

export const getStockBadgeConfig = (level: StockLevel) => {
  switch (level) {
    case 'CRITICO':
      return {
        label: 'Agotado / Crítico',
        bgColor: 'bg-rose-100 text-rose-800 border-rose-200',
        dotColor: 'bg-rose-500',
      };
    case 'BAJO':
      return {
        label: 'Stock Mínimo',
        bgColor: 'bg-amber-100 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'NORMAL':
    default:
      return {
        label: 'Normal',
        bgColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
  }
};

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const content = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
