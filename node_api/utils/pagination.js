function buildPaginationResponse(req, totalCount, page, perPage) {
  const pageCount = Math.max(1, Math.ceil(totalCount / perPage));
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;

  const buildHref = (pageNumber) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    }
    params.set('page', String(pageNumber));
    return `${baseUrl}?${params.toString()}`;
  };

  const links = {
    self: { href: buildHref(page) },
    first: { href: buildHref(1) },
    last: { href: buildHref(pageCount) }
  };
  if (page < pageCount) links.next = { href: buildHref(page + 1) };
  if (page > 1) links.prev = { href: buildHref(page - 1) };

  return {
    _links: links,
    _meta: { totalCount, pageCount, currentPage: page, perPage }
  };
}

module.exports = { buildPaginationResponse };
