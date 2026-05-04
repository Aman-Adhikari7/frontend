import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)       => api.post('/auth/register', data),
  login:          (data)       => api.post('/auth/login', data),
  getMe:          ()           => api.get('/auth/me'),
  updateProfile:  (data)       => api.put('/auth/profile', data),
  changePassword: (data)       => api.put('/auth/change-password', data),
  getAllUsers:     ()           => api.get('/auth/users'),
  toggleUser:     (id)         => api.put(`/auth/users/${id}/toggle`),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll:            (params)  => api.get('/events', { params }),
  getById:           (id)      => api.get(`/events/${id}`),
  create:            (data)    => api.post('/events', data),
  update:            (id, data)=> api.put(`/events/${id}`, data),
  delete:            (id)      => api.delete(`/events/${id}`),
  getQR:             (id)      => api.get(`/events/${id}/qr`),
  updateStatus:      (id, status) => api.put(`/events/${id}/status`, { status }),
  register:          (id)      => api.post(`/events/${id}/register`),
  getRegistrations:  (id)      => api.get(`/events/${id}/registrations`),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  scan:             (qrToken)  => api.post('/attendance/scan', { qrToken }),
  getMyHistory:     ()         => api.get('/attendance/my'),
  getByEvent:       (eventId)  => api.get(`/attendance/event/${eventId}`),
  getByUser:        (userId)   => api.get(`/attendance/user/${userId}`),
  markParticipation:(id)       => api.put(`/attendance/${id}/participate`),
  markWinner:       (id)       => api.put(`/attendance/${id}/win`),
  manualMark:       (data)     => api.post('/attendance/manual', data),
};

// ── Coins ─────────────────────────────────────────────────────────────────────
export const coinsAPI = {
  getBalance:         ()       => api.get('/coins/balance'),
  getTransactions:    (params) => api.get('/coins/transactions', { params }),
  getStore:           (params) => api.get('/coins/store', { params }),
  getMyMaterials:     ()       => api.get('/coins/my-materials'),
  redeemAttendance:   (data)   => api.post('/coins/redeem-attendance', data),
  unlockNotes:        (id)     => api.post(`/coins/unlock-notes/${id}`),
  unlockAI:           ()       => api.post('/coins/unlock-ai'),
  unlockCrashPack:    (id)     => api.post(`/coins/crash-pack/${id}`),
  adminGrant:         (data)   => api.post('/coins/admin/grant', data),
  adminDeduct:        (data)   => api.post('/coins/admin/deduct', data),
  addMaterial:        (data)   => api.post('/coins/admin/materials', data),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:      (params)        => api.get('/tasks', { params }),
  getById:     (id)            => api.get(`/tasks/${id}`),
  create:      (data)          => api.post('/tasks', data),
  update:      (id, data)      => api.put(`/tasks/${id}`, data),
  delete:      (id)            => api.delete(`/tasks/${id}`),
  submit:      (id, data)      => api.post(`/tasks/${id}/submit`, data),
  review:      (id, subId, data) => api.put(`/tasks/${id}/review/${subId}`, data),
};

// ── Polls ─────────────────────────────────────────────────────────────────────
export const pollsAPI = {
  getAll:    (params)          => api.get('/polls', { params }),
  getById:   (id)              => api.get(`/polls/${id}`),
  create:    (data)            => api.post('/polls', data),
  vote:      (id, optionIndex) => api.post(`/polls/${id}/vote`, { optionIndex }),
  getResults:(id)              => api.get(`/polls/${id}/results`),
  toggle:    (id)              => api.put(`/polls/${id}/toggle`),
  delete:    (id)              => api.delete(`/polls/${id}`),
};

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const leaderboardAPI = {
  getCoins:       (params)     => api.get('/leaderboard', { params }),
  getAttendance:  (params)     => api.get('/leaderboard/attendance', { params }),
  getStreaks:      (params)    => api.get('/leaderboard/streaks', { params }),
  getStats:       ()           => api.get('/leaderboard/stats'),
};

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiAPI = {
  getMicroLearning: (topic)    => api.post('/ai/microlearning', { topic }),
  getAccessStatus:  ()         => api.get('/ai/access-status'),
};

// ── Dopamine ──────────────────────────────────────────────────────────────────
export const dopamineAPI = {
  getSummary:    ()            => api.get('/dopamine/summary'),
  spin:          ()            => api.post('/dopamine/spin'),
  getSpinStatus: ()            => api.get('/dopamine/spin/status'),
  openMysteryBox:()            => api.post('/dopamine/mystery-box'),
  getStreak:     ()            => api.get('/dopamine/streak'),
};
