import axios from "axios";
 
axios.defaults.withCredentials = true;
const responseBody = (response) => response.data; 
 
const requests = {
  get: (url, params) => axios.get(url, { params }).then(responseBody),
  post: (url, body) =>
    axios.post(url, body).then((response) => responseBody(response)),
  put: (url, body) => axios.put(url, body).then(responseBody),
  patch: (url, body) => axios.patch(url, body).then(responseBody),
  delete: (url) => axios.delete(url).then(responseBody),
  postForm: (url, data) =>
    axios
      .post(url, data, {
        headers: { "Content-type": "multipart/form-data" },
      })
      .then(responseBody),
  patchFileForm: (url, data) =>
    axios
      .patch(url, data, {
        headers: { "Content-type": "multipart/form-data" },
      })
      .then(responseBody),
  patchForm: (url, data) => axios.patch(url, data).then(responseBody),
};

 
export const PythonRequest = {
  chnageVoice : (url , body) => requests.postForm(url , body)
}; 

 

