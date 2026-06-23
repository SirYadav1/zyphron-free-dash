import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')  // BUG-H5 FIX: sessionStorage instead of localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Add CSRF token for state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfMeta = document.querySelector('meta[name="csrf-token"]')
    if (csrfMeta) {
      config.headers['X-CSRF-Token'] = csrfMeta.getAttribute('content')
    }
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthAttempt) {
      sessionStorage.removeItem('access_token')  // BUG-H5 FIX
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default client
