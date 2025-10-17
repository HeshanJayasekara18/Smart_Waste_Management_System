import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

//  Single Responsibility: Handles only API communication
export const getSchedules = (filters) => API.get("/schedules", { params: filters });
export const createSchedule = (data) => API.post("/schedules", data);
export const updateSchedule = (id, data) => API.put(`/schedules/${id}`, data);
export const changeScheduleStatus = (id, status) => API.patch(`/schedules/${id}/status`, { status });
export const deleteSchedule = (id) => API.delete(`/schedules/${id}`);
