require('dotenv').config();
const axios = require('axios');

const NODE_API_BASE_URL = process.env.NODE_API_BASE_URL || 'http://localhost:7779';
const USERNAME = process.env.ADMIN_USERNAME;
const PASSWORD = process.env.ADMIN_PASSWORD;

async function login() {
  const res = await axios.post(`${NODE_API_BASE_URL}/api/auth/login`, { username: USERNAME, password: PASSWORD });
  const token = res.data && res.data.token;
  if (!token) throw new Error('Login inválido');
  return token;
}

async function getContestId(token) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const res = await axios.get(`${NODE_API_BASE_URL}/api/contest?sort=-id&page=1&per-page=1`, { headers });
  const id = res.data && res.data.items && res.data.items[0] && res.data.items[0].id;
  if (!id) throw new Error('No se encontró concurso');
  return id;
}

async function getProfileIdFromContest(token, contestId) {
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const url = `${NODE_API_BASE_URL}/api/contest-result?expand=profile&filter[contest_id]=${contestId}`;
  const res = await axios.get(url, { headers });
  const first = res.data && res.data.items && res.data.items[0];
  const pid = (first && first.image && first.image.profile_id) || (first && first.profile && first.profile.id);
  if (!pid) throw new Error('No se encontró profile_id para concurso');
  return pid;
}

async function run() {
  const start = Date.now();
  console.log('🚀 TEST DETALLE DE RANKING - NODE.JS API');
  console.log(`🔗 Node.js API: ${NODE_API_BASE_URL}`);
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const contestId = Number(process.env.RANKING_CONTEST_ID) || await getContestId(token);
  const profileIdEnv = Number(process.env.RANKING_PROFILE_ID);
  const profileId = Number.isFinite(profileIdEnv) && profileIdEnv > 0 ? profileIdEnv : await getProfileIdFromContest(token, contestId);

  console.log('🔒 Probando sin autenticación...');
  const resUnauth = await axios.get(`${NODE_API_BASE_URL}/api/ranking/detalle?contest_id=${contestId}&profile_id=${profileId}`, { validateStatus: () => true });
  console.log(`📊 Status sin token: ${resUnauth.status}`);

  console.log('🧪 Probando con autenticación...');
  const res = await axios.get(`${NODE_API_BASE_URL}/api/ranking/detalle?contest_id=${contestId}&profile_id=${profileId}`, { headers });
  console.log(`📊 Status: ${res.status}`);
  const data = res.data;
  console.log(`🏆 Contest: ${data && data.contest && data.contest.id}`);
  console.log(`👤 Profile: ${data && data.profile && data.profile.id} ${data && data.profile && data.profile.name} ${data && data.profile && data.profile.last_name}`);
  console.log(`🗂️ Categories: ${(data && data.categories && data.categories.length) || 0}`);
  console.log(`📋 Sections: ${(data && data.sections && data.sections.length) || 0}`);
  console.log(`🖼️ Results: ${(data && data.results && data.results.length) || 0}`);
  const firstRes = data && data.results && data.results[0];
  const firstImg = firstRes && firstRes.images && firstRes.images[0];
  console.log(`🎨 Obra: ${firstImg && firstImg.title}`);
  console.log(`🖼️ Miniatura: ${firstImg && firstImg.thumbnail_url}`);
  console.log(`📈 Ranking total_score: ${data && data.ranking && data.ranking.total_score}`);
  console.log(`📌 Ranking position: ${data && data.ranking && data.ranking.position}`);
  console.log('🧪 Probando variante sin contest_id...');
  const year = Number(process.env.RANKING_YEAR) || new Date().getFullYear();
  const resVar = await axios.get(`${NODE_API_BASE_URL}/api/ranking/detalle?profile_id=${profileId}&year=${year}`, { headers });
  console.log(`📊 Status variante: ${resVar.status}`);
  console.log(`📦 Items: ${(resVar.data && resVar.data.items && resVar.data.items.length) || 0}`);
  const firstItem = resVar.data && resVar.data.items && resVar.data.items[0];
  const firstResVar = firstItem && firstItem.results && firstItem.results[0];
  const firstImgVar = firstResVar && firstResVar.images && firstResVar.images[0];
  console.log(`🎨 Obra (var): ${firstImgVar && firstImgVar.title}`);
  console.log(`🖼️ Miniatura (var): ${firstImgVar && firstImgVar.thumbnail_url}`);
  console.log(`📅 Año: ${resVar.data && resVar.data.year}`);
  const end = Date.now();
  console.log(`⏱️ Tiempo: ${end - start}ms`);
}

if (require.main === module) {
  run().then(() => { process.exit(0); }).catch(err => { console.error('❌', err.message); if (err.response) { console.error('📊 Status:', err.response.status); console.error('📄 Data:', JSON.stringify(err.response.data)); } process.exit(1); });
}

module.exports = { run, login, getContestId, getProfileIdFromContest };