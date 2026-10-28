import { Router, Request, Response } from 'express';
import { driveStorageService } from '../services/driveStorage.js';
import fs from 'fs';
import path from 'path';

export const driveRouter = Router();

// Retrieve OAuth Client ID from env or firebase-applet-config.json
function getGoogleClientId(): string {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.oAuthClientId) return config.oAuthClientId;
    }
  } catch {
    // ignore
  }
  return '857140496927-1lj806cl8f9u4flrtov66fi25em4b5um.apps.googleusercontent.com';
}

/**
 * GET /api/drive/accounts
 * Return all connected Google Drive accounts (sanitized, no secrets)
 */
driveRouter.get('/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    const accounts = await driveStorageService.getAccounts(userId);
    const pooledStats = driveStorageService.getPooledStats(userId);
    res.json({
      accounts,
      stats: pooledStats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drive/config
 * Provides public client configuration for Firebase Auth popup
 */
driveRouter.get('/config', (req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return res.json({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        appId: config.appId,
        oAuthClientId: config.oAuthClientId,
      });
    }
  } catch (err) {
    console.warn('[Drive Config] Warning reading config:', err);
  }
  res.status(404).json({ error: 'Config not available' });
});

/**
 * GET /api/drive/oauth/url
 * Generate Google OAuth 2.0 URL with minimum Drive scopes
 */
driveRouter.get('/oauth/url', (req: Request, res: Response) => {
  const clientId = getGoogleClientId();
  const redirectUri = (req.query.redirectUri as string) || `${req.protocol}://${req.get('host')}/api/drive/oauth/callback`;
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
    }).toString();

  res.json({
    url: authUrl,
    clientId,
    redirectUri,
  });
});

/**
 * GET /api/drive/oauth/callback
 * Handles OAuth 2.0 code exchange callback
 */
driveRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).send('OAuth authorization code missing.');
  }

  try {
    const clientId = getGoogleClientId();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = `${req.protocol}://${req.get('host')}/api/drive/oauth/callback`;

    // Attempt token exchange if client secret exists
    if (clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (tokenRes.ok) {
        const tokens = await tokenRes.json();
        // Fetch user email using access token
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (userRes.ok) {
          const userInfo = await userRes.json();
          await driveStorageService.connectAccount({
            googleAccountEmail: userInfo.email,
            googleAccountId: userInfo.id,
            credentials: {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
            },
          });
        }
      }
    }

    // Redirect user back to settings
    res.redirect('/?tab=storage&connected=true');
  } catch (err) {
    console.error('[OAuth Callback Error]', err);
    res.redirect('/?tab=storage&error=oauth_failed');
  }
});

/**
 * POST /api/drive/accounts/connect
 * Connect an account (supports demo connect or token provision)
 */
driveRouter.post('/accounts/connect', async (req: Request, res: Response) => {
  try {
    const { email, storageLimitGb, storageUsedGb, accessToken, refreshToken } = req.body;
    const userId = (req.headers['x-user-id'] as string) || (req.body.userId as string) || 'user_default';
    if (!email) {
      return res.status(400).json({ error: 'Google account email is required' });
    }

    const limit = storageLimitGb ? storageLimitGb * 1024 * 1024 * 1024 : 15 * 1024 * 1024 * 1024;
    const used = storageUsedGb !== undefined ? storageUsedGb * 1024 * 1024 * 1024 : Math.round(1.5 * 1024 * 1024 * 1024);

    const account = await driveStorageService.connectAccount({
      userId,
      googleAccountEmail: email,
      storageLimit: limit,
      storageUsed: used,
      credentials: accessToken ? {
        accessToken,
        refreshToken,
      } : undefined,
    });

    res.json({
      message: `Google Drive account ${email} connected successfully.`,
      account,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/priority
 * Update priority sequence of accounts
 */
driveRouter.post('/accounts/priority', async (req: Request, res: Response) => {
  try {
    const { accountIds } = req.body;
    if (!Array.isArray(accountIds)) {
      return res.status(400).json({ error: 'accountIds array is required' });
    }

    const reordered = await driveStorageService.reorderAccounts(accountIds);
    res.json({
      message: 'Account priority updated.',
      accounts: reordered,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/:id/disconnect
 * Safely disconnects a Drive account without deleting user files
 */
driveRouter.post('/accounts/:id/disconnect', async (req: Request, res: Response) => {
  try {
    const success = await driveStorageService.disconnectAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }

    res.json({
      success: true,
      message: 'Account disconnected. Your photos remain safe in your Google Drive account.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/drive/accounts/:id
 * Removes a connected Google Drive storage account
 */
driveRouter.delete('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const success = await driveStorageService.deleteAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }

    res.json({
      success: true,
      message: 'Google Drive storage account removed.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/drive/accounts/:id/reconnect
 * Reactivates a disconnected account
 */
driveRouter.post('/accounts/:id/reconnect', async (req: Request, res: Response) => {
  try {
    const success = await driveStorageService.reconnectAccount(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Drive account not found.' });
    }

    res.json({
      success: true,
      message: 'Google Drive account reconnected.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/drive/accounts/:id/stats
 * Check fresh quota from Drive API
 */
driveRouter.get('/accounts/:id/stats', async (req: Request, res: Response) => {
  try {
    await driveStorageService.refreshQuotaFromDrive(req.params.id);
    const acc = driveStorageService.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found.' });
    res.json(acc);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
