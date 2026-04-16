import sharp from 'sharp';
import { readFileSync } from 'fs';

// ── Step 1: Load logo, strip white background → transparent PNG ──────────────
const logoRaw = await sharp('public/logo.png')
  .resize(180, 180)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { data, info } = logoRaw;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  // Treat near-white pixels as transparent
  if (r > 210 && g > 210 && b > 210) data[i + 3] = 0;
}

const logoPng = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png().toBuffer();

// ── Step 2: Build the dark 1200×630 background ────────────────────────────────
const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"  stop-color="#0D0D0D"/>
      <stop offset="100%" stop-color="#161616"/>
    </linearGradient>
    <radialGradient id="glowL" cx="18%" cy="30%" r="42%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="80%" cy="75%" r="40%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="orange" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#FF6B00"/>
      <stop offset="100%" stop-color="#FF9A3C"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glowL)"/>
  <rect width="1200" height="630" fill="url(#glowR)"/>

  <!-- Subtle grid -->
  <g stroke="#ffffff" stroke-opacity="0.025" stroke-width="1">
    <line x1="0" y1="126" x2="1200" y2="126"/><line x1="0" y1="252" x2="1200" y2="252"/>
    <line x1="0" y1="378" x2="1200" y2="378"/><line x1="0" y1="504" x2="1200" y2="504"/>
    <line x1="240" y1="0" x2="240" y2="630"/><line x1="480" y1="0" x2="480" y2="630"/>
    <line x1="720" y1="0" x2="720" y2="630"/><line x1="960" y1="0" x2="960" y2="630"/>
  </g>

  <!-- Left orange accent bar -->
  <rect x="100" y="160" width="4" height="310" rx="2" fill="url(#orange)" opacity="0.8"/>

  <!-- Logo placeholder circle (logo composited on top) -->
  <circle cx="197" cy="228" r="90" fill="#1A1A1A" stroke="#FF6B00" stroke-width="1.5" stroke-opacity="0.5"/>

  <!-- PlayPair wordmark -->
  <text x="310" y="208"
    font-family="'Anton','Impact',sans-serif" font-size="64" letter-spacing="2"
    fill="#F0F0F0">Play</text>
  <text x="453" y="208"
    font-family="'Anton','Impact',sans-serif" font-size="64" letter-spacing="2"
    fill="url(#orange)">Pair</text>

  <!-- Sub-label -->
  <circle cx="312" cy="236" r="3.5" fill="#FF6B00" opacity="0.9"/>
  <text x="326" y="244"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="17" font-weight="500" letter-spacing="4"
    fill="#666">VALORANT DUO FINDER</text>

  <!-- Divider -->
  <line x1="310" y1="268" x2="820" y2="268" stroke="#2A2A2A" stroke-width="1"/>

  <!-- Headline -->
  <text x="310" y="334"
    font-family="'Anton','Impact',sans-serif" font-size="62"
    fill="#F0F0F0">Find Your Gaming</text>
  <text x="310" y="400"
    font-family="'Anton','Impact',sans-serif" font-size="62"
    fill="url(#orange)">Duo.</text>

  <!-- Tagline -->
  <text x="310" y="448"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="22" fill="#666">Find a duo based on your playstyle and rank.</text>
  <text x="310" y="476"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="22" font-weight="700" fill="#888">Stop solo queue.</text>

  <!-- Right feature pills -->
  <rect x="940" y="185" width="192" height="64" rx="14" fill="#1C1C1C" stroke="#2A2A2A" stroke-width="1"/>
  <text x="964" y="214" font-size="20">🏆</text>
  <text x="994" y="215" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">RANK MATCH</text>
  <text x="994" y="237" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#555">Iron → Radiant</text>

  <rect x="958" y="268" width="192" height="64" rx="14" fill="#1C1C1C" stroke="#2A2A2A" stroke-width="1"/>
  <text x="982" y="297" font-size="20">🌏</text>
  <text x="1012" y="298" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">REGION</text>
  <text x="1012" y="320" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#555">Asia Pacific</text>

  <rect x="940" y="351" width="192" height="64" rx="14" fill="#1C1C1C" stroke="#2A2A2A" stroke-width="1"/>
  <text x="964" y="380" font-size="20">🎯</text>
  <text x="994" y="381" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">PLAYSTYLE</text>
  <text x="994" y="403" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#555">Your style, your duo</text>

  <rect x="958" y="434" width="192" height="64" rx="14" fill="#1C1C1C" stroke="#2A2A2A" stroke-width="1"/>
  <text x="982" y="463" font-size="20">💬</text>
  <text x="1012" y="464" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">CHAT</text>
  <text x="1012" y="486" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#555">Built-in messaging</text>

  <!-- Bottom bar -->
  <rect x="0" y="580" width="1200" height="50" fill="#111"/>
  <line x1="0" y1="580" x2="1200" y2="580" stroke="#FF6B00" stroke-width="1" stroke-opacity="0.25"/>
  <circle cx="570" cy="605" r="3" fill="#FF6B00" opacity="0.5"/>
  <text x="582" y="611"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="16" letter-spacing="1" fill="#444">www.playpair.in</text>
</svg>
`.trim();

// ── Step 3: Composite logo onto background ────────────────────────────────────
await sharp(Buffer.from(bg))
  .resize(1200, 630)
  .composite([{
    input: logoPng,
    top: 138,   // center in the circle (228 - 90 = 138)
    left: 107,  // center in the circle (197 - 90 = 107)
  }])
  .png({ quality: 95 })
  .toFile('public/preview.png');

console.log('✅  public/preview.png generated (1200×630) with real logo');
