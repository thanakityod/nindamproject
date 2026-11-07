// GUWATCH888 App - Configuration
// Default Backend API endpoint (points to Cloud Server with MySQL ip_std6730251468)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'http://119.59.102.161:3108/api';

// Dr. Somsawut Course Nindam Endpoint
export const NINDAM_API_URL = 'http://119.59.102.161:3108/nindam_pro_api';

// GitHub Raw URL for Digital Watches JSON
export const GITHUB_JSON_URL =
  process.env.EXPO_PUBLIC_GITHUB_JSON_URL ||
  'https://raw.githubusercontent.com/thanakityod/6730251468IPFinal/main/data/digital_watches.json';
