const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

async function getAccessToken() {
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN env vars');
  }
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) {
    throw new Error(`Failed to refresh Spotify token: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function fetchJson(url, accessToken) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status} ${await res.text()}`);
  return res.json();
}

function trackFromItem(item, playing) {
  const artists = item.artists.map((a) => a.name).join(', ');
  const albumImage = item.album?.images?.[0]?.url ?? null;
  return {
    playing,
    track: item.name,
    artist: artists,
    albumImageUrl: albumImage,
    url: item.external_urls?.spotify ?? null,
  };
}

export async function getCurrentTrack() {
  const accessToken = await getAccessToken();

  const nowPlaying = await fetchJson(NOW_PLAYING_URL, accessToken);
  if (nowPlaying && nowPlaying.item) {
    return trackFromItem(nowPlaying.item, Boolean(nowPlaying.is_playing));
  }

  const recent = await fetchJson(RECENTLY_PLAYED_URL, accessToken);
  const lastItem = recent?.items?.[0]?.track;
  if (lastItem) {
    return trackFromItem(lastItem, false);
  }

  return null;
}

export async function fetchImageAsDataUri(url) {
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${buf.toString('base64')}`;
}