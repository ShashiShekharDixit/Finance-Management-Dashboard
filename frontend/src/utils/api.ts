import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ff_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token')
      localStorage.removeItem('ff_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
