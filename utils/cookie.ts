export function createCookie(name: string, value: any, daysToLive: number) {
  const date = new Date();
  date.setTime(date.getTime() + daysToLive * 24 * 60 * 60 * 1000);
  let expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${value}; ${expires}; path=/;secure=true`;
}

export function deleteCookie(name: string) {
  createCookie(name, null, 0);
}

export function getCookie(cookies: any, name: string) {
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
const HavenCookies = {
  getCookie,
  deleteCookie,
  createCookie,
};

export default HavenCookies;
