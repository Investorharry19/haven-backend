export function createCookie(name, value, daysToLive) {
  const date = new Date();
  date.setTime(date.getTime() + daysToLive * 24 * 60 * 60 * 1000);
  let expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${value}; ${expires}; path=/;secure=true`;
}

export function deleteCookie(name) {
  createCookie(name, null, null);
}

export function getCookie(cookies, name) {
  const cDecoded = decodeURIComponent(cookies);
  const cArray = cDecoded.split("; ");
  let result = "";
  cArray.forEach((element) => {
    if (element.indexOf(name) == 0) {
      result = element.substring(name.length + 1);
    }
  });
  return result;
}
const IbmCookies = {
  getCookie,
  deleteCookie,
  createCookie,
};

export default IbmCookies;
