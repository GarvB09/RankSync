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
 * Calls Riot API to verify an account and fetch real rank.
 * Flow: Account-V1 (PUUID) → VAL-MATCH-V1 (match list) → extract competitiveTier
 * Returns { puuid, rank, verified } or { notFound: true } or null on error.
 */
const fetchRiotData = async (gameName, tagLine, region = 'NA') => {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) return null;

  const routing = ROUTING[region] || 'americas';
  const platform = PLATFORM[region] || 'na';
  const headers = { 'X-Riot-Token': apiKey };

  try {
    // Step 1: Verify account exists and get PUUID
    const accountRes = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers }
    );

    if (accountRes.status === 404) return { notFound: true };
    if (!accountRes.ok) return null;

    const { puuid } = await accountRes.json();

    // Step 2: Fetch recent match list
    const matchListRes = await fetch(
      `https://${platform}.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}`,
      { headers }
    );

    if (!matchListRes.ok) {
      // Account is real but no match history accessible — still verified
      return { puuid, verified: true, rank: null };
    }

    const { history = [] } = await matchListRes.json();

    // Step 3: Walk recent matches until we find a ranked one
    for (const { matchId } of history.slice(0, 10)) {
      const matchRes = await fetch(
        `https://${platform}.api.riotgames.com/val/match/v1/matches/${matchId}`,
        { headers }
      );
      if (!matchRes.ok) continue;

      const match = await matchRes.json();
      if (!match.matchInfo?.isRanked) continue;

      const player = (match.players || []).find((p) => p.puuid === puuid);
      const rank = player?.competitiveTier ? TIER_TO_RANK[player.competitiveTier] : null;
      if (rank) return { puuid, verified: true, rank };
    }

    // Account verified but no ranked match found (unranked / placement)
    return { puuid, verified: true, rank: null };
  } catch {
    return null;
  }
};

// ─── @POST /api/riot/link ─────────────────────────────────────────────────────
exports.linkRiotAccount = async (req, res, next) => {
  try {
    const { gameName, tagLine } = req.body;

    if (!gameName || !tagLine) {
      return res.status(400).json({ success: false, message: 'Riot ID (name#tag) is required' });
    }

    const user = await User.findById(req.user.id);
    const region = user.region || 'NA';

    const data = await fetchRiotData(gameName, tagLine, region);

    if (data?.notFound) {
      return res.status(404).json({
        success: false,
        message: `Riot account "${gameName}#${tagLine}" not found. Check your Riot ID and try again.`,
      });
    }

    // Build the update — always save the Riot ID and PUUID; use real rank if found
    const update = {
      'riotId.gameName': gameName,
      'riotId.tagLine': tagLine,
      riotVerified: !!(data?.verified),
      ...(data?.puuid && { riotPuuid: data.puuid }),
      ...(data?.rank && { rank: data.rank }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('-password -googleId');

    const apiAvailable = data !== null;
    const rankFetched = !!(data?.rank);

    res.json({
      success: true,
      user: updatedUser,
      riotVerified: update.riotVerified,
      rank: data?.rank || null,
      message: !apiAvailable
        ? 'Riot account linked (API unavailable — rank not verified)'
        : data?.notFound
        ? 'Riot account not found'
        : rankFetched
        ? `Account verified! Rank set to ${data.rank}.`
        : 'Account verified! No ranked matches found yet — rank unchanged.',
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

    const data = await fetchRiotData(gameName, tagLine, region);

    if (data?.notFound) {
      return res.status(404).json({ success: false, message: 'Riot account not found' });
    }

    res.json({
      success: true,
      verified: !!(data?.verified),
      rank: data?.rank || null,
      puuid: data?.puuid || null,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @POST /api/riot/refresh ──────────────────────────────────────────────────
exports.refreshRank = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.riotId?.gameName) {
      return res.status(400).json({
        success: false,
        message: 'No Riot account linked. Please link your account first.',
      });
    }

    const data = await fetchRiotData(user.riotId.gameName, user.riotId.tagLine, user.region);

    if (data?.notFound) {
      return res.status(404).json({ success: false, message: 'Linked Riot account no longer exists' });
    }

    const update = {
      riotVerified: !!(data?.verified),
      ...(data?.rank && { rank: data.rank }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true }
    ).select('-password -googleId');

    res.json({
      success: true,
      rank: data?.rank || user.rank,
      riotVerified: update.riotVerified,
      user: updatedUser,
      message: data?.rank ? `Rank updated to ${data.rank}!` : 'Account re-verified. No new ranked matches found.',
    });
  } catch (error) {
    next(error);
  }
};
