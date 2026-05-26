type PaginationQuery = {
  page?: unknown;
  limit?: unknown;
};

export type PaginationOptions = {
  limit: number;
  offset: number;
  page: number;
};

function firstValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Build pagination options from query params.
 */
export const paginate = (query: PaginationQuery, defaultLimit = 20): PaginationOptions => {
  const page = Math.max(1, Number.parseInt(String(firstValue(query.page) ?? ""), 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(firstValue(query.limit) ?? ""), 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
};

/**
 * Wrap a find-and-count result into a standard paginated response.
 */
export const paginatedResponse = <TRow>(
  rows: TRow[],
  count: number,
  { page, limit }: Pick<PaginationOptions, "page" | "limit">,
) => ({
  items: rows,
  pagination: {
    page,
    limit,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
  },
});
