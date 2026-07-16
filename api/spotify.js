import { getCurrentTrack, fetchImageAsDataUri } from '../lib/spotify.js';
import { buildSvg } from '../lib/svg.js';

export default async function handler(req, res) {
  const theme = req.query?.theme === 'light' ? 'light' : 'dark';

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=1, s-maxage=1, stale-while-revalidate');

  try {
    const current = await getCurrentTrack();

    if (!current) {
      res.status(200).send(buildSvg({ track: 'Nothing playing', artist: '', playing: false, theme }));
      return;
    }

    const albumDataUri = await fetchImageAsDataUri(current.albumImageUrl);

    res.status(200).send(
      buildSvg({
        track: current.track,
        artist: current.artist,
        playing: current.playing,
        albumDataUri,
        theme,
      })
    );
  } catch (err) {
    res.status(200).send(
      buildSvg({ track: 'Unable to load Spotify', artist: err.message ?? '', playing: false, theme })
    );
  }
}