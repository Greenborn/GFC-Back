async function canJudge(req, contestId) {
  const juez = await global.knex('contest_judge')
    .where({ contest_id: contestId, user_id: req.user.id })
    .first();
  return !!juez;
}

async function canViewJudging(req, contestId) {
  const contest = await global.knex('contest').where({ id: contestId }).first();
  if (!contest || contest.deleted_at) return false;

  const isTestContest = contest.is_test === 1 || contest.is_test === true || String(contest.is_test) === '1';
  if (isTestContest) {
    const userCanSeeTest = req.user && (req.user.is_test_enabled === 1 || req.user.is_test_enabled === true || String(req.user.is_test_enabled) === '1');
    if (!userCanSeeTest) return false;
  }

  return true;
}

module.exports = { canJudge, canViewJudging };
