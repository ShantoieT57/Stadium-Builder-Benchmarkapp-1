export const readScalarParam = (url: URL, name: string) =>
  url.searchParams.get(name)?.trim() || undefined;
export const readArrayParam = (url: URL, name: string) =>
  url.searchParams.getAll(name).filter(Boolean);
export const paginate = <T>(items: T[], url: URL) => {
  const page = Number(readScalarParam(url, 'page') ?? 1);
  const pageSize = Number(readScalarParam(url, 'pageSize') ?? 20);
  return {
    slice: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
};
