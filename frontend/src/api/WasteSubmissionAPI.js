// src/api/WasteSubmissionAPI.js
import axios from "axios";

const base = process.env.REACT_APP_API_URL || "http://localhost:5000/api/waste-submissions";

const client = axios.create({
  baseURL: base,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

const WasteSubmissionAPI = {
  async create(payload) {
    const res = await client.post("/", payload);
        return res.data;
  },
  async list() {
    const res = await client.get("/");
      return res.data;
  },
  async get(id) {
    const res = await client.get(`/${id}`);
      return res.data;
  },
  async update(id, payload) {
    const res = await client.put(`/${id}`, payload);
      return res.data;
  },
  async updateStatus(id, statusPayload) {
    const res = await client.put(`/${id}/status`, statusPayload);
      return res.data;
  },
  async remove(id) {
    const res = await client.delete(`/${id}`);
      return res.data;
  }
};

export default WasteSubmissionAPI;
