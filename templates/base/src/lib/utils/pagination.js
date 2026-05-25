/**
 * Build pagination options from query params.
 * @param {object} query - req.query
 * @param {number} [defaultLimit=20]
 * @returns {{ limit: number, offset: number, page: number }}
 */
export const paginate = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * Wrap a find-and-count result into a standard paginated response.
 */
export const paginatedResponse = (rows, count, { page, limit }) => ({
  items: rows,
  pagination: {
    page,
    limit,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
  },
});
