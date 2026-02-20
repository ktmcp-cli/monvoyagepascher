import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://api.mon-voyage-pas-cher.com';

function getHeaders() {
  const apiKey = getConfig('apiKey');
  if (!apiKey) {
    throw new Error('API key not configured. Run: monvoyagepascher config set --api-key YOUR_KEY');
  }
  return {
    'x-api-key': apiKey
  };
}

async function request(endpoint, params = {}) {
  try {
    const headers = getHeaders();
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers,
      params
    });

    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'API error');
    }

    return response.data;
  } catch (error) {
    if (error.response?.data?.message) {
      throw new Error(`API Error: ${error.response.data.message}`);
    }
    if (error.message.startsWith('API Error')) throw error;
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// Geography APIs
// ============================================================

/**
 * Search airports by country, coordinates, or IATA code
 */
export async function searchAirports(options = {}) {
  const params = {
    language: options.language || getConfig('language') || 'en'
  };

  if (options.location) params.location = options.location;
  if (options.radius) params.radius = options.radius;
  if (options.countrycode) params.countrycode = options.countrycode;
  if (options.topAirports) params.top_airports = options.topAirports;

  return await request('/airports', params);
}

/**
 * Find cities near coordinates or within a country
 */
export async function findCitiesFromLatLong(options = {}) {
  const params = {
    language: options.language || getConfig('language') || 'en'
  };

  if (options.location) params.location = options.location;
  if (options.radius) params.radius = options.radius;
  if (options.countrycode) params.countrycode = options.countrycode;
  if (options.limit) params.limit = options.limit;
  if (options.sort) params.sort = options.sort;

  return await request('/cities/findcitiesfromlatlong', params);
}

/**
 * Search cities by text (autocomplete-style)
 */
export async function findCitiesFromText(query, options = {}) {
  const params = {
    query,
    language: options.language || getConfig('language') || 'en'
  };

  if (options.countrycode) params.countrycode = options.countrycode;
  if (options.sort) params.sort = options.sort;

  return await request('/cities/findcitiesfromtext', params);
}

/**
 * Find significant cities by population threshold
 */
export async function getSignificantCities(options = {}) {
  const params = {
    language: options.language || getConfig('language') || 'en'
  };

  if (options.population) params.population = options.population;
  if (options.location) params.location = options.location;
  if (options.countrycode) params.countrycode = options.countrycode;
  if (options.limit) params.limit = options.limit;
  if (options.sort) params.sort = options.sort;

  return await request('/cities/significant', params);
}

/**
 * Get continent information
 */
export async function getContinents(options = {}) {
  const params = {
    language: options.language || getConfig('language') || 'en'
  };

  if (options.code) params.code = options.code;

  return await request('/continents', params);
}

/**
 * List countries or get specific country data
 */
export async function getCountries(options = {}) {
  const params = {
    language: options.language || getConfig('language') || 'en'
  };

  if (options.countrycode) params.countrycode = options.countrycode;

  return await request('/countries', params);
}

// ============================================================
// Services APIs
// ============================================================

/**
 * Get elevation for coordinates (up to 20 locations)
 */
export async function getElevation(locations, unit = 'meters') {
  const params = {
    locations,
    unit
  };

  return await request('/elevation', params);
}

/**
 * Calculate distance between two points
 */
export async function getDistance(locationA, locationB, unit = 'kms') {
  const params = {
    locationA,
    locationB,
    unit
  };

  return await request('/distance', params);
}

/**
 * Get sun positions (sunrise, sunset, etc.) for a location
 */
export async function getSunPositions(location, date = null) {
  const params = { location };
  if (date) params.date = date;

  return await request('/sun_positions', params);
}

/**
 * Get timezone and current time for a location
 */
export async function getTimezone(location) {
  const params = { location };

  return await request('/timezone', params);
}

/**
 * Health check endpoint
 */
export async function ping() {
  return await request('/pong');
}
