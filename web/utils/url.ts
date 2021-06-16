export function getQueryParams(url) {
  const parsedUrl = new URL(url);
  return parsedUrl.searchParams;
}
