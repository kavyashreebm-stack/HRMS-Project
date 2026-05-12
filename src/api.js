import axios from "axios";

// ─── Base API instance ───────────────────────────────────────────────────────
const API_BASE_URL = "https://qvg1co5l50.execute-api.ap-southeast-2.amazonaws.com";

const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increase timeout to 30 seconds for uploads
});

export const FILE_BASE_URL = `${API_BASE_URL}/uploads`;

// ─── Attach JWT token automatically to every request ────────────────────────
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Auth Endpoints ──────────────────────────────────────────────────────────
export const registerUser = (data) => API.post("/auth/register", data);
// data: { email, password, role }

export const loginUser = (data) => API.post("/auth/login", data);
// data: { email, password }
// returns: { access_token, token_type }

// ─── Candidate Endpoints ─────────────────────────────────────────────────────
export const getCandidateProfile = (userId) =>
    API.get(`/candidate/profile/${userId}`);

export const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    
    // Retry logic for unstable network uploads
    try {
        return await API.post("/candidate/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    } catch (error) {
        if (error.code === 'ERR_NETWORK') {
            console.warn("Network error during upload, retrying once...");
            return await API.post("/candidate/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        throw error;
    }
};

export const updateCandidateProfile = (userId, data) =>
    API.put(`/candidate/profile/${userId}`, data);

export const applyForJob = (data) => API.post("/candidate/apply", data);

export const getCandidateOptions = () => API.get("/candidate/options");

export const getCandidateDashboard = () => API.get("/candidate/dashboard");

export const markNotificationsAsRead = () => API.post("/candidate/notifications/read-all");

export const getCandidateApplications = () => API.get("/candidate/applications");

export const deleteApplication = (appId) => API.delete(`/candidate/application/${appId}`);

// ─── HR Admin Endpoints ──────────────────────────────────────────────────────
export const getAllCandidates = () => API.get("/hr/candidates");

export const getCandidateById = (userId) =>
    API.get(`/hr/candidates/${userId}`);

export const getHRStats = () => API.get("/hr/dashboard/stats");

export const getHRJobsOverview = () => API.get("/hr/dashboard/jobs-overview");

export const getHRApplications = (params) => API.get("/hr/applications", { params });

export const updateApplicationStatus = (appId, status) =>
    API.put(`/hr/applications/${appId}/status`, { status });

// 💼 HR Job Management
export const postJob = (data) => API.post("/hr/jobs", data);
export const getHRJobs = () => API.get("/hr/jobs");
export const deleteJob = (jobId) => API.delete(`/hr/jobs/${jobId}`);

export default API;