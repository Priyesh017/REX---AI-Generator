export interface PaginationMeta {
  total?: number;
  page?: number;
  limit: number;
  hasNext?: boolean;
  nextCursor?: string | null;
  hasMore?: boolean;
}
