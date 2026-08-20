import axios from "axios";
import router from "@/router";
const token = localStorage.getItem("prelo-token");

let isShowAlert = false; // 避免顯示太多次 ElMessageBox

if (token) {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
}
axios.defaults.baseURL = import.meta.env.VITE_APIURL;

axios.interceptors.response.use(
  (response) => {
    isShowAlert = false;
    return response;
  },
  (err) => {
    if (err && err.response) {
      if (err.response.status === 401) {
        localStorage.removeItem("prelo-token");
        delete axios.defaults.headers.common["Authorization"];
        router.push("/login");
        return Promise.reject(err);
      }

      const errorMessage = err.response.data?.message || "發生錯誤，請重試";
      const errorType = err.response.status >= 500 ? "error" : "warning";

      ElMessage({
        message: errorMessage,
        center: true,
        type: errorType,
      });
    } else {
      if (!isShowAlert) {
        ElMessageBox.alert(
          "系統連線異常，若持續出現此訊息請先聯絡「網路管理員」或「後端工程師」",
          "連線異常",
          {
            confirmButtonText: "了解",
            type: "warning",
          },
        );
        isShowAlert = true;
      }
    }
    return Promise.reject(err);
  },
);

const request = {
  get(url, params) {
    return axios.get(url, params);
  },
  post(url, data = {}, config) {
    return axios.post(url, data, config);
  },
  delete(url, data = {}) {
    return axios.delete(url, data);
  },
  put(url, data = {}) {
    return axios.put(url, data);
  },
  patch(url, data = {}) {
    return axios.patch(url, data);
  },
};

export default request;
