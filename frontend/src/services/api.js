import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise(function (resolve, reject) {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    await api.post("/auth/refresh-token");
    processQueue(null);
  } catch (err) {
    processQueue(err);
    if (
      !window.location.pathname.includes("/login") &&
      !window.location.pathname.includes("/signup")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  } finally {
    isRefreshing = false;
  }
};

// Skip auth endpoints from the refresh interceptor
const AUTH_SKIP_URLS = ["/auth/login", "/auth/register", "/auth/refresh-token"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (AUTH_SKIP_URLS.some((url) => originalRequest.url?.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshToken();
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
