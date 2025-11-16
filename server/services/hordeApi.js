import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HORDE_API_BASE = 'https://stablehorde.net/api/v2';
const API_KEY = process.env.HORDE_API_KEY || '0000000000';

// AI Horde API Client
class HordeAPI {
  constructor() {
    this.client = axios.create({
      baseURL: HORDE_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY
      }
    });
  }

  /**
   * Submit an async image generation request
   * @param {Object} params - Generation parameters
   * @returns {Promise<Object>} Response with request ID
   */
  async postImageAsyncGenerate(params) {
    try {
      const response = await this.client.post('/generate/async', params);
      return response.data;
    } catch (error) {
      console.error('Error submitting generation request:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check the status of an image generation request
   * @param {string} requestId - The request ID to check
   * @returns {Promise<Object>} Status information
   */
  async getImageAsyncCheck(requestId) {
    try {
      const response = await this.client.get(`/generate/check/${requestId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Request not found');
      }
      console.error('Error checking request status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get the generated images for a completed request
   * @param {string} requestId - The request ID
   * @returns {Promise<Object>} Generated images data
   */
  async getImageAsyncStatus(requestId) {
    try {
      const response = await this.client.get(`/generate/status/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting generation status:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Download an image from URL
   * @param {string} url - Image URL
   * @returns {Promise<Buffer>} Image data
   */
  async downloadImage(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error downloading image:', error.message);
      throw error;
    }
  }

  /**
   * Get user info
   * @returns {Promise<Object>} User information
   */
  async getUserInfo() {
    try {
      const response = await this.client.get('/find_user');
      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new HordeAPI();
