const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const api = {
  // Authentication
  auth: {
    googleLogin: (profile) => 
      fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      }).then(handleResponse),
      
    getProfile: () =>
      fetch(`${API_URL}/auth/profile`, {
        headers: getHeaders()
      }).then(handleResponse),

    updateProfile: (profileData) =>
      fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(profileData)
      }).then(handleResponse),

    getNearbyUsers: ({ lat, lng, maxDistance = 1000 }) =>
      fetch(`${API_URL}/auth/nearby-users?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`, {
        headers: getHeaders()
      }).then(handleResponse)
  },

  // Food posts
  food: {
    getPublicStats: () =>
      fetch(`${API_URL}/food/public`).then(handleResponse),

    create: (postData) =>
      fetch(`${API_URL}/food`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(postData)
      }).then(handleResponse),

    getAll: ({ page = 1, limit = 10, lat = null, lng = null } = {}) => {
      let queryParams = `?page=${page}&limit=${limit}`;
      if (lat && lng) {
        queryParams += `&lat=${lat}&lng=${lng}`;
      }
      return fetch(`${API_URL}/food${queryParams}`, {
        headers: getHeaders()
      }).then(handleResponse);
    },

    getById: (id) =>
      fetch(`${API_URL}/food/${id}`, {
        headers: getHeaders()
      }).then(handleResponse),

    updateStatus: (id, status) =>
      fetch(`${API_URL}/food/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      }).then(handleResponse),

    rate: (foodPostId, rating, comment) =>
      fetch(`${API_URL}/food/${foodPostId}/rate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ rating, comment })
      }).then(handleResponse),

    getMyRating: (foodPostId) =>
      fetch(`${API_URL}/food/${foodPostId}/my-rating`, {
        headers: getHeaders()
      }).then(handleResponse)
  },

  // Rooms
  rooms: {
    create: (roomData) =>
      fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(roomData)
      }).then(handleResponse),

    getAll: () =>
      fetch(`${API_URL}/rooms`, {
        headers: getHeaders()
      }).then(handleResponse),

    join: (code) =>
      fetch(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code })
      }).then(handleResponse),

    getDetails: (id) =>
      fetch(`${API_URL}/rooms/${id}`, {
        headers: getHeaders()
      }).then(handleResponse),

    manageRequest: (memberId, status) =>
      fetch(`${API_URL}/rooms/requests/${memberId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      }).then(handleResponse),

    leave: () =>
      fetch(`${API_URL}/rooms/leave`, {
        method: 'POST',
        headers: getHeaders()
      }).then(handleResponse)
  },

  // Requests
  requests: {
    create: (requestData) =>
      fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestData)
      }).then(handleResponse),

    getRequests: (type = 'incoming') =>
      fetch(`${API_URL}/requests?type=${type}`, {
        headers: getHeaders()
      }).then(handleResponse),

    updateStatus: (id, status) =>
      fetch(`${API_URL}/requests/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      }).then(handleResponse)
  },

  // Notifications
  notifications: {
    getAll: () =>
      fetch(`${API_URL}/notifications`, {
        headers: getHeaders()
      }).then(handleResponse),

    markAsRead: (id) =>
      fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse),

    markAllAsRead: () =>
      fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getHeaders()
      }).then(handleResponse)
  },

  // Messages (Group Chats & Direct DMs)
  messages: {
    send: (msgData) =>
      fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(msgData)
      }).then(handleResponse),

    getRoomMessages: (roomId) =>
      fetch(`${API_URL}/messages/room/${roomId}`, {
        headers: getHeaders()
      }).then(handleResponse),

    getDirectMessages: (peerId) =>
      fetch(`${API_URL}/messages/direct/${peerId}`, {
        headers: getHeaders()
      }).then(handleResponse)
  }
};
