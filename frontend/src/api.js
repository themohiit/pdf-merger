import axios from 'axios';

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
    const message =
      error.response?.data?.error ||
      error.message ||
      'Failed to merge PDFs. Please try again.';
    throw new Error(message);
  }
};
