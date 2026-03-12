import axios from "axios";

// Connects to the SHARED backend (same backend as User/Worker Portal)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminLogin = (email, password) =>
  api.post("/auth/login", { email, password, role: "admin" }).then(r => r.data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers     = ()   => api.get("/users").then(r => r.data);
export const getUserStats = ()   => api.get("/users/stats").then(r => r.data);
export const deleteUser   = (id) => api.delete(`/users/${id}`).then(r => r.data);

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories  = ()         => api.get("/categories").then(r => r.data);
export const createCategory = (data)     => api.post("/categories", data).then(r => r.data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data).then(r => r.data);
export const deleteCategory = (id)       => api.delete(`/categories/${id}`).then(r => r.data);

// ── Workers ───────────────────────────────────────────────────────────────────
export const getAllWorkers  = ()      => api.get("/workers/all").then(r => r.data);
export const approveWorker = (id)    => api.patch(`/workers/${id}/approve`).then(r => r.data);
export const deleteWorker  = (id)    => api.delete(`/workers/${id}`).then(r => r.data);
export const updateWorker  = (id, d) => api.put(`/workers/${id}`, d).then(r => r.data);

// ── Bookings ──────────────────────────────────────────────────────────────────
export const getBookings   = ()   => api.get("/bookings").then(r => r.data);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`).then(r => r.data);

// ── Commission ────────────────────────────────────────────────────────────────
export const getCommissionWallet       = ()       => api.get("/commission/wallet").then(r => r.data);
export const getCommissionSummary      = ()       => api.get("/commission/summary").then(r => r.data);
export const getCommissionTransactions = (params) => api.get("/commission/transactions", { params }).then(r => r.data);
export const withdrawFromWallet        = (data)   => api.post("/commission/withdraw", data).then(r => r.data);

// ── Pincode ───────────────────────────────────────────────────────────────────
export const lookupPincode = (pincode) => api.get(`/pincode/${pincode}`).then(r => r.data);
