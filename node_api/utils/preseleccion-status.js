function parseVotes(raw) {
  let parsed;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { parsed = null; }
  } else {
    parsed = raw;
  }
  if (Array.isArray(parsed)) return parsed.length > 0;
  if (parsed && typeof parsed === 'object') return Object.keys(parsed).length > 0;
  return false;
}

async function preseleccionCompleta(contestId) {
  const totalResult = await global.knex('contest_result')
    .where('contest_id', contestId)
    .count('id as count')
    .first();
  const total = Number(totalResult?.count || 0);
  if (total <= 0) return false;

  const rows = await global.knex('contest_preselected_photo')
    .select('votes')
    .where('contest_id', contestId);

  const voted = rows.filter(row => parseVotes(row.votes)).length;
  return voted >= total;
}

async function getApprovalStatus(contestId) {
  const judgesResult = await global.knex('contest_judge')
    .where('contest_id', contestId)
    .count('* as count')
    .first();
  const judgesCount = Number(judgesResult?.count || 0);

  const approvals = await global.knex('contest_preselection_approval')
    .select('user_id', 'approved_at')
    .where('contest_id', contestId);

  const approvedCount = approvals.length;

  return {
    judges_count: judgesCount,
    approved_count: approvedCount,
    all_approved: judgesCount > 0 && approvedCount >= judgesCount,
    preseleccion_completa: await preseleccionCompleta(contestId),
    items: approvals
  };
}

module.exports = { preseleccionCompleta, getApprovalStatus, parseVotes };
