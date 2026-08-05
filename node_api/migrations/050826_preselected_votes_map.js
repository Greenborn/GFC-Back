exports.up = async (knex) => {
  const hasTable = await knex.schema.hasTable('contest_preselected_photo');
  if (!hasTable) return;

  const rows = await knex('contest_preselected_photo').select('id', 'votes');

  for (const row of rows) {
    if (row.votes === null || row.votes === undefined) continue;

    let parsed;
    if (typeof row.votes === 'string') {
      try { parsed = JSON.parse(row.votes); } catch { continue; }
    } else {
      parsed = row.votes;
    }

    let map;
    if (Array.isArray(parsed)) {
      // Legacy: array de user_id que aceptaron
      map = {};
      parsed.forEach((id) => { map[String(id)] = 'aceptar'; });
    } else if (parsed && typeof parsed === 'object') {
      map = parsed;
    } else {
      continue;
    }

    await knex('contest_preselected_photo')
      .where({ id: row.id })
      .update({ votes: JSON.stringify(map) });
  }
};

exports.down = async (knex) => {
  const hasTable = await knex.schema.hasTable('contest_preselected_photo');
  if (!hasTable) return;

  const rows = await knex('contest_preselected_photo').select('id', 'votes');

  for (const row of rows) {
    if (row.votes === null || row.votes === undefined) continue;

    let parsed;
    if (typeof row.votes === 'string') {
      try { parsed = JSON.parse(row.votes); } catch { continue; }
    } else {
      parsed = row.votes;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;

    // Down: vuelve a array de aceptadores (pierde los rechazos)
    const accepters = Object.entries(parsed)
      .filter(([, v]) => v === 'aceptar')
      .map(([k]) => Number(k));

    await knex('contest_preselected_photo')
      .where({ id: row.id })
      .update({ votes: JSON.stringify(accepters) });
  }
};
