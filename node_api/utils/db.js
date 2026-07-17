async function insertAndGetId(knex, table, data) {
  const [row] = await knex(table).insert(data).returning('id');
  return row?.id ?? row;
}

async function insertAndGet(knex, table, data) {
  const id = await insertAndGetId(knex, table, data);
  return knex(table).where({ id }).first();
}

module.exports = { insertAndGetId, insertAndGet };
