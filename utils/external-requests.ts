import axios, { AxiosResponse } from "axios";

axios.defaults.withCredentials = true;
const responseBody = (response: AxiosResponse) => response.data;

const requests = {
  get: (url: string, params: any) =>
    axios.get(url, { params }).then(responseBody),
  post: (url: string, body: any) =>
    axios.post(url, body).then((response) => responseBody(response)),
  put: (url: string, body: any) => axios.put(url, body).then(responseBody),
  patch: (url: string, body: any) => axios.patch(url, body).then(responseBody),
  delete: (url: string) => axios.delete(url).then(responseBody),
  postForm: (url: string, data: any) =>
    axios
      .post(url, data, {
        headers: { "Content-type": "multipart/form-data" },
      })
      .then(responseBody),
  patchFileForm: (url: string, data: any) =>
    axios
      .patch(url, data, {
        headers: { "Content-type": "multipart/form-data" },
      })
      .then(responseBody),
  patchForm: (url: string, data: any) =>
    axios.patch(url, data).then(responseBody),
};

export const PythonRequest = {
  chnageVoice: (url: string, body: any) => requests.postForm(url, body),
};
