// One-time helper: run `npm run get-refresh-token` to authorize this app against
// your Spotify account and print a long-lived refresh token to save as an env var.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { exec } from 'node:child_process';

const PORT = 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = ['user-read-currently-playing', 'user-read-recently-played', 'user-read-playback-state'];

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error(
    'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.\n' +
      'Create a .env file (see .env.example) or export them in your shell before running this script.'
  );
  process.exit(1);
}

const authorizeUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: SPOTIFY_CLIENT_ID,
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  scope: SCOPES.join(' '),
})}`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404).end();
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Authorization failed: ${error ?? 'no code returned'}`);
    console.error('Authorization failed:', error ?? 'no code returned');
    server.close();
    process.exit(1);
  }

  try {
    const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(data));

    res.writeHead(200, { 'Content-Type': 'text/html' }).end(
      '<html><body style="font-family: sans-serif; padding: 40px;">' +
        '<h2>Done — you can close this tab.</h2>' +
        '<p>Your refresh token was printed in the terminal. Save it as <code>SPOTIFY_REFRESH_TOKEN</code>.</p>' +
        '</body></html>'
    );

    console.log('\nSuccess! Add this to your .env and to your Vercel project env vars:\n');
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' }).end('Token exchange failed, see terminal.');
    console.error('Token exchange failed:', err.message);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 500);
  }
});

server.listen(PORT, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log(`Make sure this exact redirect URI is added to your Spotify app settings, then opening browser...\n`);
  console.log(authorizeUrl, '\n');

  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${opener} "${authorizeUrl}"`);
});
