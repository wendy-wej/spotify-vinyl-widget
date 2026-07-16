// Layout constants below are derived directly from the original Claude Design
// prototype's flexbox math (card padding 0 28px, gap 8px between the vinyl /
// tonearm / info flex children, align-items: center), not eyeballed — see
// the comments at each block for the arithmetic. This keeps the SVG a
// faithful port instead of an approximation.

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Rough width estimate (avg glyph ~0.58x font-size for this bold sans) so long
// titles truncate before they'd overflow the fixed-width column.
function fitText(str, fontSize, maxWidth) {
  const avgCharWidth = fontSize * 0.58;
  const maxChars = Math.max(1, Math.floor(maxWidth / avgCharWidth));
  if (str.length <= maxChars) return str;
  return `${str.slice(0, maxChars - 1).trimEnd()}…`;
}

const CARD_W = 560;
const CARD_H = 260;
const PAD_X = 28; // card's `padding: 0 28px`
const GAP = 8; // card's flex `gap: 8px` between the 3 top-level children

const VINYL_SIZE = 204;
const TONEARM_W = 58;

// The 204-tall flex children are vertically centered in the 260-tall card:
// (260 - 204) / 2 = 28.
const VINYL_Y = (CARD_H - VINYL_SIZE) / 2;
const VINYL_X = PAD_X;
const VINYL_CX = VINYL_X + VINYL_SIZE / 2;
const VINYL_CY = VINYL_Y + VINYL_SIZE / 2;

const TONEARM_X = VINYL_X + VINYL_SIZE + GAP; // 28 + 204 + 8 = 240
const TONEARM_Y = VINYL_Y;

const INFO_X = TONEARM_X + TONEARM_W + GAP; // 240 + 58 + 8 = 306
const INFO_RIGHT = CARD_W - PAD_X; // 532
const INFO_MAX_WIDTH = INFO_RIGHT - INFO_X; // 226

// Info column rows (status+icon / track / artist / bars) are stacked with an
// 8px gap and, as a block, vertically centered on the card's midline — same
// as the vinyl/tonearm, since all three are flex siblings with
// align-items: center. Row heights approximate the source's intrinsic CSS
// line-heights (row1: 20px icon; row2: 22px * 1.2 line-height; row3: 15px *
// 1.2; row4: explicit 18px), since text-node heights aren't in the DOM.
const ROW1_H = 20;
const ROW2_H = 22 * 1.2;
const ROW3_H = 15 * 1.2;
const ROW4_H = 18;
const BLOCK_H = ROW1_H + ROW2_H + ROW3_H + ROW4_H + GAP * 3;
const BLOCK_TOP = VINYL_CY - BLOCK_H / 2;

const ROW1_CENTER = BLOCK_TOP + ROW1_H / 2;
const ROW2_CENTER = BLOCK_TOP + ROW1_H + GAP + ROW2_H / 2;
const ROW3_CENTER = BLOCK_TOP + ROW1_H + GAP + ROW2_H + GAP + ROW3_H / 2;
const ROW4_TOP = BLOCK_TOP + ROW1_H + GAP + ROW2_H + GAP + ROW3_H + GAP;
const ROW4_CENTER = ROW4_TOP + ROW4_H / 2;

const BAR_MAX_H = 14;
const BAR_W = 3;
const BAR_GAP = 5; // source: bars row `gap: 5px`
const BAR_PITCH = BAR_W + BAR_GAP;
const BAR_BOTTOM = ROW4_CENTER + BAR_MAX_H / 2;
const BAR_TOP = ROW4_CENTER - BAR_MAX_H / 2;

const ICON_SIZE = 20; // source svg is rendered at width20 height20 (viewBox 0 0 24 24)
const ICON_SCALE = ICON_SIZE / 24;

// Tonearm base circle: CSS `left: 34px; top: 14px; width/height: 20px` inside
// the 58x204 tonearm container -> center is offset by +10 (half the 20px
// circle) from that top-left.
const ARM_BASE_CX = TONEARM_X + 34 + 10; // 284
const ARM_BASE_CY = TONEARM_Y + 14 + 10; // 52
const ARM_BASE_R = 10;

// Rod: CSS `left: 42px; top: 22px; width: 4px; height: 110px`, rotating
// around its own `transform-origin: 2px 2px` (2px right, 2px down from the
// rod's top-left) -- which lands exactly on the base circle's center, i.e.
// the physical hinge point.
const ARM_ROD_X = TONEARM_X + 42; // 282
const ARM_ROD_Y = TONEARM_Y + 22; // 50
const ARM_ROD_W = 4;
const ARM_ROD_H = 110;
const ARM_PIVOT_X = ARM_ROD_X + 2; // 284 === ARM_BASE_CX
const ARM_PIVOT_Y = ARM_ROD_Y + 2; // 52 === ARM_BASE_CY

// Stylus nub: CSS `bottom: -16px; left: -4px; width: 12px; height: 20px`
// relative to the rod (rotates with it).
const ARM_NUB_X = ARM_ROD_X - 4;
const ARM_NUB_Y = ARM_ROD_Y + ARM_ROD_H + 16 - 20;
const ARM_NUB_W = 12;
const ARM_NUB_H = 20;

const SPOTIFY_ICON_PATH =
  'M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25zm-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1zm-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85z';

export function buildSvg({ track, artist, playing, albumDataUri, theme = 'dark' }) {
  const light = theme === 'light';

  const cardBg = light ? '#faf7f0' : '#121212';
  const cardBorder = light ? '#dad7d0' : 'transparent'; // oklch(0.88 0.01 90) converted to sRGB
  const trackColor = light ? '#191414' : '#ffffff';
  const artistColor = light ? 'rgba(25,20,20,0.55)' : 'rgba(255,255,255,0.6)';
  const spindleColor = light ? '#faf7f0' : '#121212';
  const armBaseBg = light ? '#d9d4c8' : '#2a2a2a';
  const armAngle = playing ? 24 : -12;
  const statusLabel = playing ? 'Now playing on' : 'Recently played on';

  const trackText = escapeXml(fitText(track ?? 'Nothing playing', 22, INFO_MAX_WIDTH));
  const artistText = escapeXml(fitText(artist ?? '', 15, INFO_MAX_WIDTH));

  // Source only renders bars at all when `playing` is true (`bars = playing
  // ? [...] : null`) -- paused state shows an empty row, not dimmed bars.
  const bars = playing
    ? [0, 1, 2, 3]
        .map((i) => {
          const x = INFO_X + i * BAR_PITCH;
          const delay = (i * 0.18).toFixed(2);
          return `<rect class="bar" x="${x}" y="${BAR_TOP}" width="${BAR_W}" height="${BAR_MAX_H}" rx="1.5" fill="#1DB954" style="animation-delay:${delay}s; transform-origin: ${x + BAR_W / 2}px ${BAR_BOTTOM}px;" />`;
        })
        .join('\n    ')
    : '';

  const albumImage = albumDataUri
    ? `<image href="${albumDataUri}" x="${VINYL_SIZE * 0.09}" y="${VINYL_SIZE * 0.09}" width="${VINYL_SIZE * 0.82}" height="${VINYL_SIZE * 0.82}" clip-path="url(#art-clip)" preserveAspectRatio="xMidYMid slice" />`
    : '';

  // Fine concentric groove rings approximating the source's
  // `repeating-radial-gradient` texture (a 1px-bright/3px-transparent ring
  // repeating every 4px from the center).
  const grooves = [];
  for (let r = 6; r < VINYL_SIZE / 2; r += 4) {
    grooves.push(
      `<circle cx="${VINYL_SIZE / 2}" cy="${VINYL_SIZE / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />`
    );
  }

  return `<svg width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" xmlns="http://www.w3.org/2000/svg" font-family="'DM Sans', sans-serif">
  <style>
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .vinyl-group { transform-origin: ${VINYL_CX}px ${VINYL_CY}px; animation: spin 4s linear infinite; }
    .vinyl-paused { animation-play-state: paused; }
    @keyframes eq { 0% { transform: scaleY(0.25); } 100% { transform: scaleY(1); } }
    .bar { animation: eq 0.9s ease-in-out infinite alternate; }
  </style>
  <defs>
    <clipPath id="art-clip">
      <circle cx="${VINYL_SIZE / 2}" cy="${VINYL_SIZE / 2}" r="${VINYL_SIZE * 0.41}" />
    </clipPath>
    <linearGradient id="armGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8d8d8" />
      <stop offset="100%" stop-color="#9a9a9a" />
    </linearGradient>
  </defs>

  <rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${CARD_H - 1}" rx="16" fill="${cardBg}" stroke="${cardBorder}" />

  <g class="vinyl-group ${playing ? '' : 'vinyl-paused'}" transform="translate(${VINYL_X}, ${VINYL_Y})">
    <circle cx="${VINYL_SIZE / 2}" cy="${VINYL_SIZE / 2}" r="${VINYL_SIZE / 2}" fill="#111" />
    ${grooves.join('\n    ')}
    <circle cx="${VINYL_SIZE / 2}" cy="${VINYL_SIZE / 2}" r="${VINYL_SIZE / 2}" fill="url(#sheen)" />
    ${albumImage}
    <circle cx="${VINYL_SIZE / 2}" cy="${VINYL_SIZE / 2}" r="${VINYL_SIZE * 0.135}" fill="#f3ead7" stroke="rgba(0,0,0,0.3)" />
  </g>
  <defs>
    <radialGradient id="sheen" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.10)" />
      <stop offset="45%" stop-color="rgba(255,255,255,0)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>
  <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="5" fill="${spindleColor}" stroke="rgba(255,255,255,0.25)" stroke-width="2" />

  <circle cx="${ARM_BASE_CX}" cy="${ARM_BASE_CY}" r="${ARM_BASE_R}" fill="${armBaseBg}" />
  <g transform="rotate(${armAngle} ${ARM_PIVOT_X} ${ARM_PIVOT_Y})">
    <rect x="${ARM_ROD_X}" y="${ARM_ROD_Y}" width="${ARM_ROD_W}" height="${ARM_ROD_H}" rx="2" fill="url(#armGradient)" />
    <rect x="${ARM_NUB_X}" y="${ARM_NUB_Y}" width="${ARM_NUB_W}" height="${ARM_NUB_H}" rx="3" fill="#c9c9c9" />
  </g>

  <g transform="translate(${INFO_X}, ${ROW1_CENTER - ICON_SIZE / 2}) scale(${ICON_SCALE})">
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path d="${SPOTIFY_ICON_PATH}" fill="#121212" />
  </g>
  <text x="${INFO_X + ICON_SIZE + 8}" y="${ROW1_CENTER}" dominant-baseline="middle" font-size="14" font-weight="700" letter-spacing="0.02em" fill="#1DB954">${escapeXml(statusLabel)}</text>

  <text x="${INFO_X}" y="${ROW2_CENTER}" dominant-baseline="middle" font-size="22" font-weight="700" fill="${trackColor}">${trackText}</text>
  <text x="${INFO_X}" y="${ROW3_CENTER}" dominant-baseline="middle" font-size="15" font-weight="500" fill="${artistColor}">${artistText}</text>

  ${bars}
</svg>`;
}
