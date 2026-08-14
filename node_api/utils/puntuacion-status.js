async function getContestType(contestId) {
  const contest = await global.knex('contest').where({ id: contestId }).first();
  if (!contest) return null;
  return contest.organization_type || null;
}

async function getContestMetrics(contestId) {
  const organizationType = await getContestType(contestId);
  if (!organizationType) return [];
  return global.knex('metric_abm')
    .where({ organization_type: organizationType })
    .orderBy('id', 'asc');
}

async function getPuntuacionStatus(contestId, userId = null) {
  const metrics = await getContestMetrics(contestId);
  const metricsById = new Map(metrics.map(m => [m.id, m]));

  const imagesResult = await global.knex('contest_result')
    .where('contest_id', contestId)
    .select('image_id');
  const totalCount = imagesResult.length;
  const imageIds = imagesResult.map(r => r.image_id);

  const rows = await global.knex('contest_puntuacion_vote')
    .where('contest_id', contestId)
    .select('image_id', 'user_id', 'metric_abm_id');

  const perImage = new Map(); // image_id -> Map(metric_abm_id -> count)
  const userVotes = new Map(); // image_id -> metric_abm_id (del usuario)
  const judgedImages = new Set();
  for (const row of rows) {
    judgedImages.add(Number(row.image_id));
    let voteMap = perImage.get(Number(row.image_id));
    if (!voteMap) {
      voteMap = new Map();
      perImage.set(Number(row.image_id), voteMap);
    }
    const mid = Number(row.metric_abm_id);
    voteMap.set(mid, (voteMap.get(mid) || 0) + 1);
    if (userId != null && Number(row.user_id) === Number(userId)) {
      userVotes.set(Number(row.image_id), mid);
    }
  }

  const items = imageIds.map(imageId => {
    const numId = Number(imageId);
    const voteMap = perImage.get(numId) || new Map();
    const votes = [];
    let totalVotes = 0;
    for (const [metricAbmId, count] of voteMap.entries()) {
      votes.push({ metric_abm_id: metricAbmId, metric_abm: metricsById.get(metricAbmId) || null, count });
      totalVotes += count;
    }
    votes.sort((a, b) => b.count - a.count);
    return { image_id: numId, votes, total_votes: totalVotes, my_vote: userVotes.get(numId) ?? null };
  });

  const judgedCount = judgedImages.size;

  return {
    items,
    metrics,
    organization_type: await getContestType(contestId),
    judged_count: judgedCount,
    total_count: totalCount,
    all_judged: totalCount > 0 && judgedCount >= totalCount
  };
}

module.exports = { getContestType, getContestMetrics, getPuntuacionStatus };
