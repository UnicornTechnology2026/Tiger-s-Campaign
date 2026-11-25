// Generates ONE common QR code for the whole campaign.
//
//   npm run qr -- https://your-campaign.vercel.app
//   (or set CAMPAIGN_URL in .env / the environment)
//
// Output: qr-output/campaign-qr.png (1200px, for print) and campaign-qr.svg (vector).
import { mkdir } from 'node:fs/promises';
import QRCode from 'qrcode';

const url = process.argv[2] || process.env.CAMPAIGN_URL;

if (!url || !/^https:\/\//i.test(url)) {
  console.error('Usage: npm run qr -- https://your-campaign-domain.example');
  console.error('The URL must be the public HTTPS address of the deployed campaign.');
  process.exit(1);
}

await mkdir('qr-output', { recursive: true });

const opts = {
  errorCorrectionLevel: 'H', // survives scuffs / a logo / table-stand wear
  margin: 4, // keep the quiet zone when printing
  color: { dark: '#1a0b2e', light: '#ffffff' },
};

await QRCode.toFile('qr-output/campaign-qr.png', url, { ...opts, width: 1200 });
await QRCode.toFile('qr-output/campaign-qr.svg', url, { ...opts, type: 'svg' });

console.log(`QR code for ${url}`);
console.log('  qr-output/campaign-qr.png');
console.log('  qr-output/campaign-qr.svg');
