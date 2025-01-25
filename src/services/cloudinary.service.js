const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
    /**
     * Upload a file to Cloudinary
     * @param {string} file - The file path or base64 data
     * @param {Object} options - Upload options (folder, public_id, etc.)
     * @returns {Promise<Object>} Upload result
     */
    static async uploadFile(file, options = {}) {
        try {
            const result = await cloudinary.uploader.upload(file, options);
            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                size: result.bytes
            };
        } catch (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Delete a file from Cloudinary
     * @param {string} publicId - The public ID of the file to delete
     * @returns {Promise<Object>} Deletion result
     */
    static async deleteFile(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return {
                success: result.result === 'ok',
                result: result.result
            };
        } catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Generate a signed URL for a file
     * @param {string} publicId - The public ID of the file
     * @param {Object} options - Options for URL generation (expiry, transformation, etc.)
     * @returns {string} Signed URL
     */
    static generateSignedUrl(publicId, options = {}) {
        try {
            const defaultOptions = {
                secure: true,
                ...options
            };
            return cloudinary.url(publicId, defaultOptions);
        } catch (error) {
            throw new Error(`Failed to generate signed URL: ${error.message}`);
        }
    }
}

module.exports = CloudinaryService; 