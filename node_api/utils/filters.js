function normalizeFilterValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return value;
}

function parseFilterParams(query) {
  const filter = {};
  if (query.filter && typeof query.filter === 'object') {
    Object.assign(filter, query.filter);
  }
  for (const [key, value] of Object.entries(query)) {
    const match = key.match(/^filter\[(.+)\]$/);
    if (match) {
      filter[match[1]] = value;
    }
  }
  return filter;
}

function applyFilterObject(query, filter, { nestedKey = '', skipKeys = [] } = {}) {
  if (!filter || typeof filter !== 'object') return;
  const prefix = nestedKey ? `${nestedKey}.` : '';

  for (const [key, value] of Object.entries(filter)) {
    if (value == null) continue;
    if (skipKeys.includes(key)) continue;

    if (nestedKey && key === nestedKey && typeof value === 'object') {
      applyFilterObject(query, value, { nestedKey, skipKeys });
      continue;
    }

    const filterKey = key.replace(new RegExp(`^${prefix}`), '');

    if (typeof value === 'object' && !Array.isArray(value)) {
      if (value.in != null) {
        const normalized = normalizeFilterValue(value.in);
        query.whereIn(filterKey, Array.isArray(normalized) ? normalized : [normalized]);
        continue;
      }
      if (value.between != null) {
        const normalized = normalizeFilterValue(value.between);
        if (Array.isArray(normalized) && normalized.length === 2) {
          const [a, b] = normalized.map(Number).sort((x, y) => x - y);
          query.whereBetween(filterKey, [a, b]);
        }
        continue;
      }
      if (value.inside != null) {
        const normalized = normalizeFilterValue(value.inside);
        if (Array.isArray(normalized) && normalized.length === 2) {
          const [a, b] = normalized.map(Number).sort((x, y) => x - y);
          query.where(filterKey, '>', a).andWhere(filterKey, '<', b);
        }
        continue;
      }
    }

    const normalized = normalizeFilterValue(value);
    if (Array.isArray(normalized)) {
      query.whereIn(filterKey, normalized);
    } else {
      query.where(filterKey, normalized);
    }
  }
}

module.exports = { normalizeFilterValue, parseFilterParams, applyFilterObject };
