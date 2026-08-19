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

// Carga los nombres de los jueces del concurso para mostrarlos junto a su voto,
// replicando el formato { user: { profile: { name, last_name } } }.
async function loadJudgeUsers(contestId) {
  const map = new Map();
  try {
    const rows = await global.knex('contest_judge as cj')
      .select('cj.user_id', 'u.username', 'p.name', 'p.last_name')
      .leftJoin('user as u', 'cj.user_id', 'u.id')
      .leftJoin('profile as p', 'u.profile_id', 'p.id')
      .where('cj.contest_id', contestId);
    for (const r of rows) {
      map.set(Number(r.user_id), {
        username: r.username,
        name: r.name,
        last_name: r.last_name
      });
    }
  } catch (e) {
    console.error('Error al cargar jueces para puntuación', e);
  }
  return map;
}

async function getPuntuacionStatus(contestId, userId = null) {
  const metrics = await getContestMetrics(contestId);
  const metricsById = new Map(metrics.map(m => [m.id, m]));

  const judgeUsers = await loadJudgeUsers(contestId);

  const imagesResult = await global.knex('contest_result')
    .where('contest_id', contestId)
    .select('image_id');
  const totalCount = imagesResult.length;
  const imageIds = imagesResult.map(r => r.image_id);

  const rows = await global.knex('contest_puntuacion_vote')
    .where('contest_id', contestId)
    .select('image_id', 'user_id', 'metric_abm_id');

  const perImage = new Map(); // image_id -> Map(metric_abm_id -> count)
  const judgeVotesByImage = new Map(); // image_id -> [{ user_id, metric_abm_id }]
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
    let judgeVotes = judgeVotesByImage.get(Number(row.image_id));
    if (!judgeVotes) {
      judgeVotes = [];
      judgeVotesByImage.set(Number(row.image_id), judgeVotes);
    }
    judgeVotes.push({ user_id: Number(row.user_id), metric_abm_id: mid });
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
    const judgeVotes = (judgeVotesByImage.get(numId) || []).map(jv => {
      const info = judgeUsers.get(jv.user_id) || {};
      return {
        user_id: jv.user_id,
        username: info.username ?? null,
        name: info.name ?? null,
        last_name: info.last_name ?? null,
        metric_abm_id: jv.metric_abm_id,
        metric_abm: metricsById.get(jv.metric_abm_id) || null
      };
    });
    return { image_id: numId, votes, total_votes: totalVotes, my_vote: userVotes.get(numId) ?? null, judge_votes: judgeVotes };
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
