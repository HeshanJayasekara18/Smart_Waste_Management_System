import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getCollectionRoutes = (filters) => API.get("/collection-routes", { params: filters });
export const createCollectionRoute = (data) => API.post("/collection-routes", data);
export const updateCollectionRoute = (id, data) => API.put(`/collection-routes/${id}`, data);
export const deleteCollectionRoute = (id) => API.delete(`/collection-routes/${id}`);
