export default function formatApiError(errOrResponse) {
  const resp = errOrResponse?.response?.data ?? errOrResponse?.data ?? errOrResponse;
  if (!resp) return (errOrResponse && errOrResponse.message) || "Request failed";

  if (Array.isArray(resp.data)) {
    const parts = resp.data.map((d) => d.message || (d.path ? `${d.path.join('.')}: ${d.code}` : d.code));
    return `${resp.message || 'Invalid input data'}: ${parts.join('; ')}`;
  }

  return resp.message || JSON.stringify(resp);
}
