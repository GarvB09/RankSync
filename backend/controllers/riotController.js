/**
 * Riot API Controller
 * Verifies Valorant accounts and fetches real rank via match history
 */

const User = require('../models/User');
const { RANKS } = require('../models/User');

// Valorant competitive tier number → rank string
const TIER_TO_RANK = {
  3: 'Iron 1',      4: 'Iron 2',      5: 'Iron 3',
  6: 'Bronze 1',    7: 'Bronze 2',    8: 'Bronze 3',
  9: 'Silver 1',   10: 'Silver 2',   11: 'Silver 3',
  12: 'Gold 1',    13: 'Gold 2',     14: 'Gold 3',
  15: 'Platinum 1',16: 'Platinum 2', 17: 'Platinum 3',
  18: 'Diamond 1', 19: 'Diamond 2',  20: 'Diamond 3',
  21: 'Ascendant 1',22: 'Ascendant 2',23: 'Ascendant 3',
  24: 'Immortal 1', 25: 'Immortal 2', 26: 'Immortal 3',
  27: 'Radiant',
};

// Our region codes → Riot routing / platform values
const ROUTING = { NA: 'americas', EU: 'europe', AP: 'asia', KR: 'asia', BR: 'americas', LATAM: 'americas' };
const PLATFORM = { NA: 'na', EU: 'eu', AP: 'ap', KR: 'kr', BR: 'br', LATAM: 'latam' };

/**
 * Verifies a Riot account exists via Account-V1 and returns the PUUID.
 * Note: Riot's VAL-MATCH-V1 requires player OAuth (RSO) — rank cannot be
 * fetched server-side with a dev key. Account existence is all we can confirm.
 * Returns { puuid, verified: true } or { notFound: true } or null on API error.
 */
const verifyRiotAccount = async (gameName, tagLine, region = 'NA') => {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) return null;

  const routing = ROUTING[region] || 'americas';
  const headers = { 'X-Riot-Token': apiKey };

  try {
    const accountRes = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers }
    );

    if (accountRes.status === 404) return { notFound: true };
    if (!accountRes.ok) return null;

    const { puuid } = await accountRes.json();
    return { puuid, verified: true };
  } catch {
    return null;
  }
};

// ─── @POST /api/riot/link ─────────────────────────────────────────────────────
exports.linkRiotAccount = async (req, res, next) => {
  try {
    const { gameName, tagLine, rank } = req.body;

    if (!gameName || !tagLine) {
      return res.status(400).json({ success: false, message: 'Riot ID (name#tag) is required' });
    }

    const user = await User.findById(req.user.id);
    const region = user.region || 'NA';

    const data = await verifyRiotAccount(gameName, tagLine, region);

    if (data?.notFound) {
      return res.status(404).json({
        success: false,
        message: `Riot account "${gameName}#${tagLine}" not found. Check your Riot ID and try again.`,
      });
    }

    const update = {
      'riotId.gameName': gameName,
      'riotId.tagLine': tagLine,
      riotVerified: !!(data?.verified),
      ...(data?.puuid && { riotPuuid: data.puuid }),
      // Use the rank the player provided, fall back to their existing rank
      ...(rank && { rank }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('-password -googleId');

    res.json({
      success: true,
      user: updatedUser,
      riotVerified: update.riotVerified,
      message: data?.verified
        ? 'Riot account verified! Your rank has been saved.'
        : 'Riot account linked (could not reach Riot API — account unverified).',
    });
  } catch (error) {
    next(error);
  }
};

// ─── @GET /api/riot/rank/:gameName/:tagLine ───────────────────────────────────
exports.getRank = async (req, res, next) => {
  try {
    const { gameName, tagLine } = req.params;
    const region = req.query.region || 'NA';

    const data = await verifyRiotAccount(gameName, tagLine, region);

    if (data?.notFound) {
      return res.status(404).json({ success: false, message: 'Riot account not found' });
    }

    res.json({ success: true, verified: !!(data?.verified), puuid: data?.puuid || null });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/riot/refresh ──────────────────────────────────────────────────
// Re-verifies the linked account is still valid (account not deleted/renamed)
exports.refreshRank = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.riotId?.gameName) {
      return res.status(400).json({ success: false, message: 'No Riot account linked.' });
    }

    const data = await verifyRiotAccount(user.riotId.gameName, user.riotId.tagLine, user.region);

    if (data?.notFound) {
      return res.status(404).json({ success: false, message: 'Linked Riot account no longer exists' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { riotVerified: !!(data?.verified) } },
      { new: true }
    ).select('-password -googleId');

    res.json({
      success: true,
      riotVerified: !!(data?.verified),
      user: updatedUser,
      message: 'Riot account re-verified!',
    });
  } catch (error) {
    next(error);
  }
};
