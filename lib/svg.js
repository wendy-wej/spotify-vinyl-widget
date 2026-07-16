function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Rough width estimate (avg glyph ~0.58x font-size for this bold sans) so long
// titles truncate before they'd overflow the fixed-width card.
function fitText(str, fontSize, maxWidth) {
  const avgCharWidth = fontSize * 0.58;
  const maxChars = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  if (str.length <= maxChars) return str;
  return `${str.slice(0, maxChars - 1).trimEnd()}…`;
}

export function buildSvg({ track, artist, playing, albumDataUri, theme = 'dark' }) {
  const light = theme === 'light';
  const width = 560;
  const height = 260;
  const vinylSize = 204;
  const vinylX = 28;
  const vinylCx = vinylX + vinylSize / 2;
  const vinylCy = height / 2;

  const cardBg = light ? '#faf7f0' : '#121212';
  const cardBorder = light ? '#dedad2' : 'transparent';
  const trackColor = light ? '#191414' : '#ffffff';
  const artistColor = light ? 'rgba(25,20,20,0.55)' : 'rgba(255,255,255,0.6)';
  const spindleColor = light ? '#faf7f0' : '#121212';
  const armBaseBg = light ? '#d9d4c8' : '#2a2a2a';
  const armAngle = playing ? 24 : -12;
  const statusLabel = playing ? 'Now playing on' : 'Recently played on';

  const infoX = vinylX + vinylSize + 58; // left edge of the text column, past vinyl + tonearm
  const rightMargin = 24;
  const textMaxWidth = width - infoX - rightMargin;

  const trackFontSize = 22;
  const artistFontSize = 15;
  const trackText = escapeXml(fitText(track ?? 'Nothing playing', trackFontSize, textMaxWidth));
  const artistText = escapeXml(fitText(artist ?? '', artistFontSize, textMaxWidth));

  const statusY = vinylCy - 66;
  const trackY = vinylCy - 34;
  const artistY = vinylCy - 10;
  const barsBaseline = vinylCy + 24; // bottom edge the bars grow up from
  const barMaxHeight = 14;

  const bars = [0, 1, 2, 3]
    .map((i) => {
      const x = infoX + i * 8;
      const barClass = playing ? 'bar' : 'bar bar-paused';
      const delay = (i * 0.18).toFixed(2);
      return `<rect class="${barClass}" x="${x}" y="${barsBaseline - barMaxHeight}" width="3" height="${barMaxHeight}" rx="1.5" fill="#1DB954" style="animation-delay:${delay}s; transform-origin: ${x + 1.5}px ${barsBaseline}px;" />`;
    })
    .join('\n    ');

  const albumImage = albumDataUri
    ? `<image href="${albumDataUri}" x="${vinylSize * 0.09}" y="${vinylSize * 0.09}" width="${vinylSize * 0.82}" height="${vinylSize * 0.82}" clip-path="url(#art-clip)" preserveAspectRatio="xMidYMid slice" />`
    : '';

  // Spotify logo (24x24 source coords) scaled+placed as one unit so the wave
  // sits inside its green disc instead of overflowing it.
  const iconSize = 18;
  const iconScale = iconSize / 24;
  const iconX = infoX;
  const iconY = statusY - iconSize + 4;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" font-family="'DM Sans', Verdana, sans-serif">
  <style>
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .vinyl-group { transform-origin: ${vinylCx}px ${vinylCy}px; animation: spin 4s linear infinite; }
    .vinyl-paused { animation-play-state: paused; }
    @keyframes eq { 0% { transform: scaleY(0.25); } 100% { transform: scaleY(1); } }
    .bar { animation: eq 0.9s ease-in-out infinite alternate; }
    .bar-paused { animation: none; transform: scaleY(0.25); }
  </style>
  <defs>
    <clipPath id="art-clip">
      <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize * 0.41}" />
    </clipPath>
    <linearGradient id="armGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8d8d8" />
      <stop offset="100%" stop-color="#9a9a9a" />
    </linearGradient>
  </defs>

  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="16" fill="${cardBg}" stroke="${cardBorder}" />

  <g class="vinyl-group ${playing ? '' : 'vinyl-paused'}" transform="translate(${vinylX}, ${vinylCy - vinylSize / 2})">
    <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize / 2}" fill="#111" />
    <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize / 2 - 6}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="4" />
    <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize / 2 - 16}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3" />
    <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize / 2 - 26}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="3" />
    ${albumImage}
    <circle cx="${vinylSize / 2}" cy="${vinylSize / 2}" r="${vinylSize * 0.27 / 2}" fill="#f3ead7" stroke="rgba(0,0,0,0.3)" />
  </g>
  <circle cx="${vinylCx}" cy="${vinylCy}" r="5" fill="${spindleColor}" stroke="rgba(255,255,255,0.25)" stroke-width="2" />

  <g>
    <circle cx="${vinylX + vinylSize + 34}" cy="${vinylCy - 88}" r="10" fill="${armBaseBg}" />
    <rect x="${vinylX + vinylSize + 40}" y="${vinylCy - 82}" width="4" height="110" rx="2" fill="url(#armGradient)"
      transform="rotate(${armAngle} ${vinylX + vinylSize + 42} ${vinylCy - 80})" />
  </g>

  <g transform="translate(${iconX}, ${iconY}) scale(${iconScale})">
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z" fill="#121212" />
  </g>
  <text x="${iconX + iconSize + 8}" y="${statusY}" font-size="14" font-weight="700" letter-spacing="0.02em" fill="#1DB954">${escapeXml(statusLabel)}</text>

  <text x="${infoX}" y="${trackY}" font-size="${trackFontSize}" font-weight="700" fill="${trackColor}">${trackText}</text>
  <text x="${infoX}" y="${artistY}" font-size="${artistFontSize}" font-weight="500" fill="${artistColor}">${artistText}</text>

  ${bars}
</svg>`;
}
