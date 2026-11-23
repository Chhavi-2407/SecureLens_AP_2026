
import api from "./api";

const projectService = {
  async getAll() {
    const response = await api.get("/projects");
    return response.data.data;
  },

  async getById(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data.data;
  },

  async create(data) {
    const response = await api.post("/projects", data);
    return response.data.data;
  },

  async delete(id) {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

export default projectService;
