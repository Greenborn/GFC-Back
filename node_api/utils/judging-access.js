async function canJudge(req, contestId) {
  if (String(req.user.role_id) === '1') return true;
  const juez = await global.knex('contest_judge')
    .where({ contest_id: contestId, user_id: req.user.id })
    .first();
  return !!juez;
}

module.exports = { canJudge };
