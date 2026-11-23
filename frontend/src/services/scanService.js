
import api from "./api";

const scanService = {
  async createScan(scanData) {
    const response = await api.post("/scans", scanData);
    return response.data.data;
  },

  async getProjectScans(projectId) {
    const response = await api.get(`/scans/project/${projectId}`);
    return response.data.data;
  },

  async getScanById(scanId) {
    const response = await api.get(`/scans/${scanId}`);
    return response.data.data;
  },
};

export default scanService;
