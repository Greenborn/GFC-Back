const MemoryCache = require('greenborn-memory-cache');

const ACTIVE_WINDOW_MS = 60 * 1000; // 1 minuto
const JUDGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

const judgesCache = new MemoryCache({ cleanupIntervalMs: 60 * 60 * 1000 }); // contestId -> Set<user_id>
const activeJudges = new Map(); // "contestId:userId" -> timestamp

async function getContestJudges(contestId) {
  const cached = judgesCache.get(contestId);
  if (cached) return cached;

  const rows = await global.knex('contest_judge')
    .where('contest_id', contestId)
    .select('user_id');

  const users = new Set(rows.map(r => Number(r.user_id)).filter(n => !isNaN(n)));
  judgesCache.set(contestId, users, JUDGE_CACHE_TTL_MS);
  return users;
}

function invalidateContestJudges(contestId) {
  judgesCache.delete(contestId);
}

async function isJudge(contestId, userId) {
  const users = await getContestJudges(contestId);
  return users.has(Number(userId));
}

function markActive(contestId, userId) {
  activeJudges.set(`${contestId}:${userId}`, Date.now());
}

function removeActive(contestId, userId) {
  activeJudges.delete(`${contestId}:${userId}`);
}

function getActiveJudgeIds(contestId, now = Date.now()) {
  const threshold = now - ACTIVE_WINDOW_MS;
  const result = [];
  for (const [key, timestamp] of activeJudges.entries()) {
    if (timestamp <= threshold) continue;
    const [keyContest, keyUser] = key.split(':');
    if (keyContest === String(contestId)) {
      result.push({ userId: Number(keyUser), lastActive: timestamp });
    }
  }
  return result;
}

module.exports = {
  ACTIVE_WINDOW_MS,
  JUDGE_CACHE_TTL_MS,
  getContestJudges,
  invalidateContestJudges,
  isJudge,
  markActive,
  removeActive,
  getActiveJudgeIds
};
