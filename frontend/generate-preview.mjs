import sharp from 'sharp';

// ── Step 1: Load logo, strip white background → transparent PNG ──────────────
const { data, info } = await sharp('public/logo.png')
  .resize(180, 180)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (r > 210 && g > 210 && b > 210) data[i + 3] = 0;
}

const logoPng = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png().toBuffer();

// ── Step 2: White + orange light-theme banner ─────────────────────────────────
const bg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FFF7F0"/>
    </linearGradient>
    <radialGradient id="glowL" cx="18%" cy="30%" r="45%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="85%" cy="80%" r="40%">
      <stop offset="0%" stop-color="#FF6B00" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="orange" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#FF6B00"/>
      <stop offset="100%" stop-color="#FF9A3C"/>
    </linearGradient>
    <!-- Card shadow filter -->
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="#FF6B00" flood-opacity="0.08"/>
    </filter>
    <filter id="pillShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.06"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glowL)"/>
  <rect width="1200" height="630" fill="url(#glowR)"/>

  <!-- Subtle dot grid -->
  <g fill="#FF6B00" fill-opacity="0.06">
    <rect x="60"  y="60"  width="3" height="3" rx="1.5"/>
    <rect x="120" y="60"  width="3" height="3" rx="1.5"/>
    <rect x="180" y="60"  width="3" height="3" rx="1.5"/>
    <rect x="60"  y="120" width="3" height="3" rx="1.5"/>
    <rect x="120" y="120" width="3" height="3" rx="1.5"/>
    <rect x="60"  y="180" width="3" height="3" rx="1.5"/>
    <rect x="1020" y="60"  width="3" height="3" rx="1.5"/>
    <rect x="1080" y="60"  width="3" height="3" rx="1.5"/>
    <rect x="1140" y="60"  width="3" height="3" rx="1.5"/>
    <rect x="1020" y="120" width="3" height="3" rx="1.5"/>
    <rect x="1080" y="120" width="3" height="3" rx="1.5"/>
    <rect x="1020" y="540" width="3" height="3" rx="1.5"/>
    <rect x="1080" y="540" width="3" height="3" rx="1.5"/>
    <rect x="1140" y="540" width="3" height="3" rx="1.5"/>
  </g>

  <!-- Left orange accent bar -->
  <rect x="100" y="150" width="5" height="330" rx="2.5" fill="url(#orange)"/>

  <!-- Logo circle — white card with orange ring -->
  <circle cx="197" cy="228" r="90"
    fill="#FFFFFF" stroke="#FF6B00" stroke-width="2"
    filter="url(#shadow)"/>

  <!-- PlayPair wordmark -->
  <text x="314" y="208"
    font-family="'Anton','Impact',sans-serif" font-size="64" letter-spacing="2"
    fill="#1A1A1A">Play</text>
  <text x="458" y="208"
    font-family="'Anton','Impact',sans-serif" font-size="64" letter-spacing="2"
    fill="url(#orange)">Pair</text>

  <!-- Sub-label -->
  <circle cx="316" cy="236" r="3.5" fill="#FF6B00"/>
  <text x="330" y="244"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="17" font-weight="600" letter-spacing="4"
    fill="#9E9E9E">VALORANT DUO FINDER</text>

  <!-- Divider -->
  <line x1="314" y1="268" x2="820" y2="268" stroke="#E8E4DF" stroke-width="1.5"/>

  <!-- Headline -->
  <text x="314" y="334"
    font-family="'Anton','Impact',sans-serif" font-size="62"
    fill="#1A1A1A">Find Your Gaming</text>
  <text x="314" y="400"
    font-family="'Anton','Impact',sans-serif" font-size="62"
    fill="url(#orange)">Duo.</text>

  <!-- Tagline -->
  <text x="314" y="448"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="22" fill="#6B6B6B">Find a duo based on your playstyle and rank.</text>
  <text x="314" y="476"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="22" font-weight="700" fill="#444">Stop solo queue.</text>

  <!-- Right feature pills — white cards -->
  <rect x="940" y="175" width="200" height="68" rx="16"
    fill="#FFFFFF" stroke="#E8E4DF" stroke-width="1.5" filter="url(#pillShadow)"/>
  <text x="963" y="207" font-size="20">🏆</text>
  <text x="993" y="205" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">RANK MATCH</text>
  <text x="993" y="228" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#9E9E9E">Iron → Radiant</text>

  <rect x="958" y="260" width="200" height="68" rx="16"
    fill="#FFFFFF" stroke="#E8E4DF" stroke-width="1.5" filter="url(#pillShadow)"/>
  <text x="981" y="292" font-size="20">🌏</text>
  <text x="1011" y="290" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">REGION</text>
  <text x="1011" y="313" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#9E9E9E">Asia Pacific</text>

  <rect x="940" y="345" width="200" height="68" rx="16"
    fill="#FFFFFF" stroke="#E8E4DF" stroke-width="1.5" filter="url(#pillShadow)"/>
  <text x="963" y="377" font-size="20">🎯</text>
  <text x="993" y="375" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">PLAYSTYLE</text>
  <text x="993" y="398" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#9E9E9E">Your style, your duo</text>

  <rect x="958" y="430" width="200" height="68" rx="16"
    fill="#FFFFFF" stroke="#E8E4DF" stroke-width="1.5" filter="url(#pillShadow)"/>
  <text x="981" y="462" font-size="20">💬</text>
  <text x="1011" y="460" font-family="'Anton','Impact',sans-serif" font-size="19" fill="#FF6B00">CHAT</text>
  <text x="1011" y="483" font-family="'DM Sans','Helvetica Neue',Arial,sans-serif" font-size="13" fill="#9E9E9E">Built-in messaging</text>

  <!-- Bottom bar -->
  <rect x="0" y="578" width="1200" height="52" fill="#FFF3E8"/>
  <line x1="0" y1="578" x2="1200" y2="578" stroke="#FF6B00" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="574" cy="604" r="3.5" fill="#FF6B00" opacity="0.7"/>
  <text x="586" y="610"
    font-family="'DM Sans','Helvetica Neue',Arial,sans-serif"
    font-size="16" font-weight="600" letter-spacing="1"
    fill="#9E9E9E">www.playpair.in</text>
</svg>
`.trim();

// ── Step 3: Composite real logo onto white background ─────────────────────────
await sharp(Buffer.from(bg))
  .resize(1200, 630)
  .composite([{
    input: logoPng,
    top: 138,
    left: 107,
  }])
  .png({ quality: 95 })
  .toFile('public/preview.png');

console.log('✅  public/preview.png generated — white+orange theme with real logo');
