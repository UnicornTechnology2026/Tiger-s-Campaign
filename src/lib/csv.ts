import type { RecordRow } from '../types';

/** Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell). */
function cell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN') : '');

export function recordsToCsv(rows: RecordRow[]): string {
  const header = [
    'Customer Name',
    'Mobile Number',
    'Registered At',
    'OTP Verified',
    'Reward (ML)',
    'Claim ID',
    'Spun At',
    'Redemption Status',
    'Redeemed At',
  ];
  const lines = rows.map((r) =>
    [
      r.full_name,
      r.mobile,
      fmt(r.registered_at),
      r.otp_verified ? 'Yes' : 'No',
      r.reward_ml ?? '',
      r.claim_id ?? '',
      fmt(r.spun_at),
      r.redemption_status ?? '',
      fmt(r.redeemed_at),
    ]
      .map(cell)
      .join(','),
  );
  // BOM so Excel opens UTF-8 (Hindi/Marathi names) correctly.
  return '﻿' + [header.map(cell).join(','), ...lines].join('\r\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
