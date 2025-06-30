function extractTokenFromUrl(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get("token");
}

// Example usage:
const url =
  "http://localhost:3000/tenant/submit-lease?token=omooo&propertyName=harrison";
const token = extractTokenFromUrl(url);
console.log(token);
