import axios from 'axios'

export const getWeatherList = () => axios.get('/api/weather').then(({ data }) => data)
export const searchWeatherLocations = (query) =>
  axios.get('/api/weather/search', { params: { q: query } }).then(({ data }) => data)
export const getWeatherDetail = (cityId) =>
  axios.get(`/api/weather/${encodeURIComponent(cityId)}`).then(({ data }) => data)
export const getDogBreeds = () => axios.get('/api/breeds').then(({ data }) => data)
export const getNearbyPetPlaces = (lat, lon) =>
  axios.get('/api/places', { params: { lat, lon } }).then(({ data }) => data)
