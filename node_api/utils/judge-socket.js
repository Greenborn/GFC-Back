const {
  isJudge,
  markActive,
  removeActive,
  getActiveJudgeIds
} = require('./judge-activity');

const socketContests = new WeakMap(); // socket -> Set<contestId> (concursos donde el socket se marcó como juez presente)

function roomName(contestId) {
  return `contest:${contestId}`;
}

function joinedContests(client) {
  let set = socketContests.get(client);
  if (!set) {
    set = new Set();
    socketContests.set(client, set);
  }
  return set;
}

async function getContest(contestId) {
  return global.knex('contest').where('id', contestId).first();
}

async function buildPresence(contest, active) {
  const items = active.map(({ userId, lastActive }) => ({ user_id: userId, last_active: lastActive }));

  if (active.length > 0) {
    const users = await global.knex('user')
      .whereIn('id', active.map(a => a.userId))
      .select('id', 'username', 'email', 'profile_id');
    const usersById = new Map(users.map(u => [u.id, u]));
    for (const item of items) {
      item.user = usersById.get(item.user_id) || null;
    }
  }

  return { items, is_judging: contest ? !!contest.is_judging : false };
}

function broadcastPresence(socket, contestId) {
  return getContest(contestId)
    .then(contest => buildPresence(contest, getActiveJudgeIds(contestId)))
    .then(payload => socket.emitToRoom(roomName(contestId), 'contest:judges:update', payload))
    .catch(err => console.error(`[Socket] Error al difundir presencia: ${err.message}`));
}

async function canJudgeContest(contestId, userId) {
  const u = await global.knex('user').where('id', userId).first();
  if (u && String(u.role_id) === '1') return true;
  const juez = await global.knex('contest_judge')
    .where({ contest_id: contestId, user_id: userId })
    .first();
  return !!juez;
}

function init(socket) {
  // Cleanup de presencia cuando un socket se desconecta.
  socket.io.on('connection', (client) => {
    const userId = client.data?.user?.id;
    if (userId == null) return;

    client.on('disconnect', () => {
      const joined = socketContests.get(client);
      socketContests.delete(client);
      if (!joined || joined.size === 0) return;

      for (const contestId of joined) {
        removeActive(contestId, userId);
        broadcastPresence(socket, contestId);
      }
    });
  });

  socket.onFunction('contest:join', async ({ payload, ack, user, socket: client }) => {
    try {
      if (!payload || payload.contest_id == null) {
        return ack({ success: false, error: 'contest_id es obligatorio' });
      }

      const contestId = parseInt(payload.contest_id, 10);
      if (isNaN(contestId)) {
        return ack({ success: false, error: 'contest_id debe ser un número' });
      }

      const contest = await getContest(contestId);
      if (!contest) {
        return ack({ success: false, error: 'El concurso especificado no existe' });
      }

      const canJoin = await canJudgeContest(contestId, user.id);
      if (!canJoin) {
        return ack({ success: false, error: 'Acceso denegado: solo administradores o jueces del concurso' });
      }

      client.join(roomName(contestId));

      if (contest.is_judging && await isJudge(contestId, user.id)) {
        markActive(contestId, user.id);
        joinedContests(client).add(contestId);
      }

      const presence = await buildPresence(contest, getActiveJudgeIds(contestId));
      broadcastPresence(socket, contestId);
      ack({ success: true, ...presence });
    } catch (error) {
      console.error(`[Socket] Error en contest:join: ${error.message}`);
      ack({ success: false, error: error.message });
    }
  });

  socket.onFunction('contest:heartbeat', async ({ payload, ack, user }) => {
    try {
      if (!payload || payload.contest_id == null) {
        return ack({ success: false, error: 'contest_id es obligatorio' });
      }

      const contestId = parseInt(payload.contest_id, 10);
      if (isNaN(contestId)) {
        return ack({ success: false, error: 'contest_id debe ser un número' });
      }

      const contest = await getContest(contestId);
      if (!contest) {
        return ack({ success: false, error: 'El concurso especificado no existe' });
      }

      if (!contest.is_judging) {
        return ack({ success: false, error: 'El concurso no está en fase de juzgamiento' });
      }

      if (!await isJudge(contestId, user.id)) {
        return ack({ success: false, error: 'Acceso denegado: el usuario no es juez de este concurso' });
      }

      markActive(contestId, user.id);
      ack({ success: true, contest_id: contestId, is_judging: true, last_active: Date.now() });
    } catch (error) {
      console.error(`[Socket] Error en contest:heartbeat: ${error.message}`);
      ack({ success: false, error: error.message });
    }
  });

  socket.onFunction('contest:leave', async ({ payload, ack, socket: client }) => {
    try {
      const contestId = parseInt(payload?.contest_id, 10);
      if (isNaN(contestId)) {
        return ack({ success: false, error: 'contest_id es obligatorio' });
      }

      client.leave(roomName(contestId));
      const joined = socketContests.get(client);
      if (joined) joined.delete(contestId);
      broadcastPresence(socket, contestId);
      ack({ success: true });
    } catch (error) {
      console.error(`[Socket] Error en contest:leave: ${error.message}`);
      ack({ success: false, error: error.message });
    }
  });
}

module.exports = { init };
