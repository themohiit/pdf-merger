import axios from 'axios';

const API_BASE = '';

axios.defaults.baseURL = API_BASE;

/**
 * Sends files to the backend for merging.
 * @param {File[]} files - Array of PDF File objects in desired merge order
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{success: boolean, downloadUrl: string, pageCount: number}>}
 */
export const mergePDFs = async (files, onProgress) => {
  const formData = new FormData();

  // Append files in order
  files.forEach((file) => {
    formData.append('files', file);
  });

  // Send the order as indices (files are already in order)
  const order = files.map((_, index) => index);
  formData.append('order', JSON.stringify(order));

  try {
    const response = await axios.post('/api/merge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percent);
      },
    });

    return response.data;
  } catch (error) {
    let message = 'Failed to merge PDFs. Please try again.';
    if (error.response?.data) {
      const serverError = error.response.data.error;
      if (typeof serverError === 'string') {
        message = serverError;
      } else if (serverError && typeof serverError === 'object') {
        message = serverError.message || JSON.stringify(serverError);
      } else if (error.response.data.message) {
        message = error.response.data.message;
      }
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
};

