// Shared offset-pagination helpers for list endpoints.
// Mirrors the page/limit semantics already used by getListings so every
// paginated endpoint returns the same `{ items, pagination }` envelope.

const intOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Parse `page` / `limit` query params into safe DB pagination args.
 * @param {object} query - typically req.query
 * @param {{ defaultLimit?: number, maxLimit?: number }} [opts]
 * @returns {{ page: number, limit: number, skip: number, take: number }}
 */
export const parsePagination = (query = {}, opts = {}) => {
  const { defaultLimit = 20, maxLimit = 100 } = opts;
  const page = Math.max(intOrUndefined(query.page) || 1, 1);
  const limit = Math.min(Math.max(intOrUndefined(query.limit) || defaultLimit, 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};

/**
 * Build the pagination metadata block returned alongside `items`.
 * @param {{ page: number, limit: number, total: number }} args
 */
export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0
});
