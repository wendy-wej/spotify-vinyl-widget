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

// Greedy word-wrap into at most maxLines, based on an estimated avg glyph
// width for the given font size/weight. A single word longer than a whole
// line gets hard-broken. If the text still doesn't fit in maxLines, the last
// line is ellipsis-truncated.
function wrapText(str, fontSize, maxWidth, maxLines, avgCharFactor) {
  const text = (str ?? '').trim();
  const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * avgCharFactor)));
  if (!text) return [''];

  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  const pushCurrent = () => {
    if (current) lines.push(current);
    current = '';
  };

  for (const word of words) {
    let candidate = current ? `${current} ${word}` : word;
    while (candidate.length > maxChars) {
      if (current) {
        pushCurrent();
        candidate = word;
        continue;
      }
      // a single word longer than one line: hard-break it
      lines.push(candidate.slice(0, maxChars));
      candidate = candidate.slice(maxChars);
    }
    current = candidate;
  }
  pushCurrent();

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    if (last.length > maxChars - 1) last = last.slice(0, maxChars - 1).trimEnd();
    kept[maxLines - 1] = `${last}…`;
    return kept;
  }
  return lines;
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

// Smaller than the original mockup's 22/15/14px — the card is a fixed 226px
// text column, and full-size text was overflowing/crowding for anything but
// short titles. These leave headroom for two-line wrapping instead.
const STATUS_FONT_SIZE = 11;
const TRACK_FONT_SIZE = 16;
const ARTIST_FONT_SIZE = 12;
const TRACK_MAX_LINES = 2;
const ARTIST_MAX_LINES = 2;
const LINE_HEIGHT_FACTOR = 1.25;

const ROW1_H = 16; // icon height
const ROW4_H = 14; // bars row
const ICON_SIZE = 16;
const ICON_SCALE = ICON_SIZE / 24;

const BAR_MAX_H = 11;
const BAR_W = 2.5;
const BAR_GAP = 4;
const BAR_PITCH = BAR_W + BAR_GAP;

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
  // Source design uses -12deg at rest, but that swings the stylus tip to
  // x~=306 -- right where the info column starts -- overlapping the artist
  // text. -6deg keeps the tip inside the tonearm's own column (x~=296).
  // Playing angle: at the source's original 24deg, the stylus tip (the
  // nub's bottom-center, ~124px out from the pivot) lands ~109px from the
  // vinyl's center -- outside its 102px radius, i.e. floating just past the
  // edge instead of touching the record. 30deg brings it to ~97px from
  // center, landing inside the outer plain-groove band (between the album
  // art's 83.64px edge and the vinyl's 102px edge), so the needle actually
  // rests on the vinyl's surface.
  const armAngle = playing ? 30 : -6;
  const statusLabel = playing ? 'Now playing on' : 'Recently played on';

  const trackLines = wrapText(track ?? 'Nothing playing', TRACK_FONT_SIZE, INFO_MAX_WIDTH, TRACK_MAX_LINES, 0.58).map(
    escapeXml
  );
  const artistLines = wrapText(artist ?? '', ARTIST_FONT_SIZE, INFO_MAX_WIDTH, ARTIST_MAX_LINES, 0.52).map(escapeXml);

  const trackLineHeight = TRACK_FONT_SIZE * LINE_HEIGHT_FACTOR;
  const artistLineHeight = ARTIST_FONT_SIZE * LINE_HEIGHT_FACTOR;
  const row2H = trackLines.length * trackLineHeight;
  const row3H = artistLines.length * artistLineHeight;

  // Info column rows (status+icon / track / artist / bars) stack with an 8px
  // gap and, as a block, vertically center on the card's midline — same as
  // the vinyl/tonearm, since all three are flex siblings with
  // align-items: center. Row2/row3 heights depend on how many lines the
  // track/artist wrapped to, so the whole block is computed per-render.
  const blockH = ROW1_H + row2H + row3H + ROW4_H + GAP * 3;
  const blockTop = VINYL_CY - blockH / 2;

  const row1Center = blockTop + ROW1_H / 2;
  const row2Top = blockTop + ROW1_H + GAP;
  const row3Top = row2Top + row2H + GAP;
  const row4Top = row3Top + row3H + GAP;
  const row4Center = row4Top + ROW4_H / 2;

  const barBottom = row4Center + BAR_MAX_H / 2;
  const barTop = row4Center - BAR_MAX_H / 2;

  // Source only renders bars at all when `playing` is true (`bars = playing
  // ? [...] : null`) -- paused state shows an empty row, not dimmed bars.
  const bars = playing
    ? [0, 1, 2, 3]
        .map((i) => {
          const x = INFO_X + i * BAR_PITCH;
          const delay = (i * 0.18).toFixed(2);
          return `<rect class="bar" x="${x}" y="${barTop}" width="${BAR_W}" height="${BAR_MAX_H}" rx="1.25" fill="#1DB954" style="animation-delay:${delay}s; transform-origin: ${x + BAR_W / 2}px ${barBottom}px;" />`;
        })
        .join('\n    ')
    : '';

  const trackTextEls = trackLines
    .map(
      (line, i) =>
        `<text x="${INFO_X}" y="${row2Top + trackLineHeight * (i + 0.5)}" dominant-baseline="middle" font-size="${TRACK_FONT_SIZE}" font-weight="700" fill="${trackColor}">${line}</text>`
    )
    .join('\n  ');

  const artistTextEls = artistLines
    .map(
      (line, i) =>
        `<text x="${INFO_X}" y="${row3Top + artistLineHeight * (i + 0.5)}" dominant-baseline="middle" font-size="${ARTIST_FONT_SIZE}" font-weight="500" fill="${artistColor}">${line}</text>`
    )
    .join('\n  ');

  const albumImage = albumDataUri
    ? `<image href="${albumDataUri}" x="${VINYL_X + VINYL_SIZE * 0.09}" y="${VINYL_Y + VINYL_SIZE * 0.09}" width="${VINYL_SIZE * 0.82}" height="${VINYL_SIZE * 0.82}" clip-path="url(#art-clip)" preserveAspectRatio="xMidYMid slice" />`
    : '';

  // Fine concentric groove rings approximating the source's
  // `repeating-radial-gradient` texture (a 1px-bright/3px-transparent ring
  // repeating every 4px from the center). Album art is drawn on top and
  // obscures the inner rings, leaving only the outer groove band visible —
  // matching "outer ring = plain grooves, inner ring = album art, center =
  // plain label". Coordinates are absolute (VINYL_CX/CY), not relative to a
  // translated group — see the note on the vinyl <g> below for why.
  const grooves = [];
  for (let r = 6; r < VINYL_SIZE / 2; r += 4) {
    grooves.push(
      `<circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />`
    );
  }

  // The vinyl <g> below deliberately carries no transform="translate(...)"
  // attribute. An SVG presentation attribute and a CSS animation that both
  // target `transform` on the same element don't combine -- the
  // CSS-animated value (just the rotation) replaces the attribute value
  // outright the moment the animation applies (even while paused), silently
  // dropping the translate. That shifted the whole vinyl by
  // (VINYL_X, VINYL_Y) relative to the spindle, which lives outside this
  // group and so wasn't affected -- exactly the "spindle floating
  // off-center" bug. Fix: draw everything at absolute coordinates instead,
  // so this group only ever rotates in place around (VINYL_CX, VINYL_CY).
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
      <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="${VINYL_SIZE * 0.41}" />
    </clipPath>
    <linearGradient id="armGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8d8d8" />
      <stop offset="100%" stop-color="#9a9a9a" />
    </linearGradient>
    <radialGradient id="sheen" cx="35%" cy="30%" r="75%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.10)" />
      <stop offset="45%" stop-color="rgba(255,255,255,0)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>

  <rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${CARD_H - 1}" rx="16" fill="${cardBg}" stroke="${cardBorder}" />

  <g class="vinyl-group ${playing ? '' : 'vinyl-paused'}">
    <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="${VINYL_SIZE / 2}" fill="#111" />
    ${grooves.join('\n    ')}
    <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="${VINYL_SIZE / 2}" fill="url(#sheen)" />
    ${albumImage}
    <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="${VINYL_SIZE * 0.135}" fill="#f3ead7" stroke="rgba(0,0,0,0.3)" />
  </g>
  <circle cx="${VINYL_CX}" cy="${VINYL_CY}" r="5" fill="${spindleColor}" stroke="rgba(255,255,255,0.25)" stroke-width="2" />

  <circle cx="${ARM_BASE_CX}" cy="${ARM_BASE_CY}" r="${ARM_BASE_R}" fill="${armBaseBg}" />
  <g transform="rotate(${armAngle} ${ARM_PIVOT_X} ${ARM_PIVOT_Y})">
    <rect x="${ARM_ROD_X}" y="${ARM_ROD_Y}" width="${ARM_ROD_W}" height="${ARM_ROD_H}" rx="2" fill="url(#armGradient)" />
    <rect x="${ARM_NUB_X}" y="${ARM_NUB_Y}" width="${ARM_NUB_W}" height="${ARM_NUB_H}" rx="3" fill="#c9c9c9" />
  </g>

  <g transform="translate(${INFO_X}, ${row1Center - ICON_SIZE / 2}) scale(${ICON_SCALE})">
    <circle cx="12" cy="12" r="12" fill="#1DB954" />
    <path d="${SPOTIFY_ICON_PATH}" fill="#121212" />
  </g>
  <text x="${INFO_X + ICON_SIZE + 6}" y="${row1Center}" dominant-baseline="middle" font-size="${STATUS_FONT_SIZE}" font-weight="700" letter-spacing="0.02em" fill="#1DB954">${escapeXml(statusLabel)}</text>

  ${trackTextEls}
  ${artistTextEls}

  ${bars}
</svg>`;
}
