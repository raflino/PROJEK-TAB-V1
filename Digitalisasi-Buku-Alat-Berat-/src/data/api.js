// src/data/api.js
const IP_ADDRESS = "192.168.1.4";
const PORT = "5234";

export const BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;

export const API_ENDPOINTS = {
    // ── Auth ──────────────────────────────────────────────────────
    securityQuestions: `${BASE_URL}/failure-auth/security-questions`,
    register:          `${BASE_URL}/failure-auth/register`,
    login:             `${BASE_URL}/failure-auth/login`,
    forgotPassword:    `${BASE_URL}/failure-auth/forgot-password`,
    verifyReset:       `${BASE_URL}/failure-auth/verify-reset`,
 
    // ── User ──────────────────────────────────────────────────────
    getProfile: (nim) => `${BASE_URL}/User/GetProfile/${nim}`,
 
    // ── Failure Code ──────────────────────────────────────────────
    search: `${BASE_URL}/FailureDiagnosis/search`,
    detail: `${BASE_URL}/FailureDiagnosis/detail`,
    analyzeSMode: `${BASE_URL}/FailureDiagnosis/s-mode/analyze`,
 
    // ── Diagnosis History ─────────────────────────────────────────
    getHistory:    (nim)       => `${BASE_URL}/FailureDiagnosis/history/${nim}`,
    saveHistory:   `${BASE_URL}/history/save`,
    historySummary: `${BASE_URL}/history/summary`,
    historyDetail: `${BASE_URL}/history/detail`,
    deleteHistory: (sessionId) => `${BASE_URL}/FailureDiagnosis/history/${sessionId}`,
};

export default BASE_URL;


