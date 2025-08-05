const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = crypto.randomUUID() + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 5 // Maximum 5 files per request
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a',
            'application/pdf', 'text/plain',
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
    }
});

class MediaController {
    constructor() {
        this.setupRoutes();
    }

    setupRoutes() {
        // File upload endpoints
        router.post('/upload', upload.single('file'), ValidationMiddleware.validateFileUpload(), this.uploadFile.bind(this));
        router.post('/upload-multiple', upload.array('files', 5), this.uploadMultipleFiles.bind(this));
        
        // File management
        router.get('/', ValidationMiddleware.paginationValidation(), this.getMediaFiles.bind(this));
        router.get('/:mediaId', this.getMediaDetail.bind(this));
        router.delete('/:mediaId', this.deleteMediaFile.bind(this));
        
        // File access
        router.get('/:mediaId/download', this.downloadFile.bind(this));
        router.get('/:mediaId/thumbnail', this.getThumbnail.bind(this));
        router.get('/:mediaId/metadata', this.getMetadata.bind(this));
        
        // File processing status
        router.get('/:mediaId/processing-status', this.getProcessingStatus.bind(this));
        router.post('/:mediaId/reprocess', this.reprocessFile.bind(this));
        
        // Virus scan results
        router.get('/:mediaId/virus-scan', this.getVirusScanResult.bind(this));
        
        // File sharing (physicians only)
        router.post('/:mediaId/share', AuthMiddleware.requirePhysician, this.shareFile.bind(this));
        router.delete('/:mediaId/share/:shareToken', AuthMiddleware.requirePhysician, this.revokeFileShare.bind(this));
        
        // Bulk operations
        router.post('/bulk-delete', this.bulkDeleteFiles.bind(this));
        router.post('/bulk-process', this.bulkProcessFiles.bind(this));
    }

    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error: 'No file uploaded',
                    code: 'FILE_REQUIRED'
                });
            }

            const { responseId, tags, description } = req.body;
            const file = req.file;

            // Determine file type
            const fileType = this.determineFileType(file.mimetype);
            
            // Generate file hash for integrity checking
            const fileBuffer = await fs.readFile(file.path);
            const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            // Create media record
            const result = await req.app.locals.db.query(`
                INSERT INTO media_uploads (
                    patient_id, response_id, filename, original_filename,
                    file_type, mime_type, file_size, file_path, file_hash,
                    virus_scan_status, processing_status, metadata, tags
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending', $10, $11)
                RETURNING id, filename, file_type, file_size, uploaded_at
            `, [
                req.user.userType === 'patient' ? req.user.id : null,
                responseId || null,
                file.filename,
                file.originalname,
                fileType,
                file.mimetype,
                file.size,
                file.path,
                fileHash,
                JSON.stringify({
                    originalName: file.originalname,
                    uploadedBy: req.user.email,
                    uploadedAt: new Date().toISOString(),
                    description: description || null
                }),
                JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : [])
            ]);

            // Start background processing (virus scan, thumbnail generation, etc.)
            this.startBackgroundProcessing(result.rows[0].id, file.path, file.mimetype);

            res.status(201).json({
                success: true,
                message: 'File uploaded successfully',
                file: {
                    id: result.rows[0].id,
                    filename: result.rows[0].filename,
                    originalFilename: file.originalname,
                    fileType: result.rows[0].file_type,
                    fileSize: result.rows[0].file_size,
                    uploadedAt: result.rows[0].uploaded_at,
                    processingStatus: 'pending',
                    virusScanStatus: 'pending'
                }
            });

        } catch (error) {
            console.error('Upload file error:', error);
            
            // Clean up temporary file
            if (req.file && req.file.path) {
                fs.unlink(req.file.path).catch(err => 
                    console.error('Failed to clean up temp file:', err)
                );
            }

            res.status(500).json({
                error: 'File upload failed',
                code: 'UPLOAD_ERROR'
            });
        }
    }

    async uploadMultipleFiles(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: 'No files uploaded',
                    code: 'FILES_REQUIRED'
                });
            }

            const { responseId, tags, description } = req.body;
            const uploadedFiles = [];
            const errors = [];

            for (const file of req.files) {
                try {
                    const fileType = this.determineFileType(file.mimetype);
                    const fileBuffer = await fs.readFile(file.path);
                    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                    const result = await req.app.locals.db.query(`
                        INSERT INTO media_uploads (
                            patient_id, response_id, filename, original_filename,
                            file_type, mime_type, file_size, file_path, file_hash,
                            virus_scan_status, processing_status, metadata, tags
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'pending', $10, $11)
                        RETURNING id, filename, file_type, file_size, uploaded_at
                    `, [
                        req.user.userType === 'patient' ? req.user.id : null,
                        responseId || null,
                        file.filename,
                        file.originalname,
                        fileType,
                        file.mimetype,
                        file.size,
                        file.path,
                        fileHash,
                        JSON.stringify({
                            originalName: file.originalname,
                            uploadedBy: req.user.email,
                            uploadedAt: new Date().toISOString(),
                            description: description || null
                        }),
                        JSON.stringify(tags ? tags.split(',').map(t => t.trim()) : [])
                    ]);

                    uploadedFiles.push({
                        id: result.rows[0].id,
                        filename: result.rows[0].filename,
                        originalFilename: file.originalname,
                        fileType: result.rows[0].file_type,
                        fileSize: result.rows[0].file_size,
                        uploadedAt: result.rows[0].uploaded_at
                    });

                    // Start background processing
                    this.startBackgroundProcessing(result.rows[0].id, file.path, file.mimetype);

                } catch (fileError) {
                    console.error(`Error processing file ${file.originalname}:`, fileError);
                    errors.push({
                        filename: file.originalname,
                        error: 'Processing failed'
                    });

                    // Clean up failed file
                    fs.unlink(file.path).catch(err => 
                        console.error('Failed to clean up temp file:', err)
                    );
                }
            }

            const response = {
                success: true,
                message: `${uploadedFiles.length} file(s) uploaded successfully`,
                files: uploadedFiles
            };

            if (errors.length > 0) {
                response.errors = errors;
                response.message += `, ${errors.length} file(s) failed`;
            }

            res.status(201).json(response);

        } catch (error) {
            console.error('Upload multiple files error:', error);
            
            // Clean up all temporary files
            if (req.files) {
                for (const file of req.files) {
                    fs.unlink(file.path).catch(err => 
                        console.error('Failed to clean up temp file:', err)
                    );
                }
            }

            res.status(500).json({
                error: 'Multiple file upload failed',
                code: 'MULTIPLE_UPLOAD_ERROR'
            });
        }
    }

    async getMediaFiles(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const fileType = req.query.fileType || '';
            const status = req.query.status || '';
            const responseId = req.query.responseId || '';

            let whereClause = 'WHERE 1=1';
            let params = [];
            let paramCount = 0;

            // Apply user-specific filters
            if (req.user.userType === 'patient') {
                paramCount++;
                whereClause += ` AND (mu.patient_id = $${paramCount} OR EXISTS (
                    SELECT 1 FROM patient_responses pr 
                    WHERE pr.id = mu.response_id AND pr.patient_id = $${paramCount}
                ))`;
                params.push(req.user.id);
            } else if (req.user.userType === 'physician') {
                paramCount++;
                whereClause += ` AND EXISTS (
                    SELECT 1 FROM patient_responses pr
                    JOIN physician_patient_relationships ppr ON pr.patient_id = ppr.patient_id
                    WHERE (mu.response_id = pr.id OR mu.patient_id = pr.patient_id)
                    AND ppr.physician_id = $${paramCount} AND ppr.is_active = true
                )`;
                params.push(req.user.id);
            }

            if (fileType) {
                paramCount++;
                whereClause += ` AND mu.file_type = $${paramCount}`;
                params.push(fileType);
            }

            if (status) {
                paramCount++;
                whereClause += ` AND mu.processing_status = $${paramCount}`;
                params.push(status);
            }

            if (responseId) {
                paramCount++;
                whereClause += ` AND mu.response_id = $${paramCount}`;
                params.push(responseId);
            }

            const media = await req.app.locals.db.query(`
                SELECT mu.id, mu.filename, mu.original_filename, mu.file_type,
                       mu.mime_type, mu.file_size, mu.virus_scan_status,
                       mu.processing_status, mu.tags, mu.uploaded_at,
                       pr.id as response_id,
                       q.title as questionnaire_title
                FROM media_uploads mu
                LEFT JOIN patient_responses pr ON mu.response_id = pr.id
                LEFT JOIN questionnaires q ON pr.questionnaire_id = q.id
                ${whereClause}
                ORDER BY mu.uploaded_at DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...params, limit, offset]);

            const totalCount = await req.app.locals.db.query(`
                SELECT COUNT(*) as count FROM media_uploads mu ${whereClause}
            `, params);

            res.json({
                success: true,
                media: media.rows.map(m => ({
                    id: m.id,
                    filename: m.filename,
                    originalFilename: m.original_filename,
                    fileType: m.file_type,
                    mimeType: m.mime_type,
                    fileSize: m.file_size,
                    virusScanStatus: m.virus_scan_status,
                    processingStatus: m.processing_status,
                    tags: m.tags || [],
                    uploadedAt: m.uploaded_at,
                    response: m.response_id ? {
                        id: m.response_id,
                        questionnaireTitle: m.questionnaire_title
                    } : null
                })),
                pagination: {
                    page,
                    limit,
                    total: parseInt(totalCount.rows[0].count),
                    pages: Math.ceil(totalCount.rows[0].count / limit)
                }
            });

        } catch (error) {
            console.error('Get media files error:', error);
            res.status(500).json({
                error: 'Failed to load media files',
                code: 'MEDIA_FILES_ERROR'
            });
        }
    }

    // Helper methods
    determineFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'document';
    }

    async startBackgroundProcessing(mediaId, filePath, mimeType) {
        // In a real implementation, this would trigger background jobs
        // For now, we'll simulate immediate processing
        try {
            // Simulate virus scan
            setTimeout(async () => {
                await req.app.locals.db.query(`
                    UPDATE media_uploads 
                    SET virus_scan_status = 'clean', 
                        virus_scan_result = $2,
                        processing_status = 'completed',
                        processed_at = NOW()
                    WHERE id = $1
                `, [mediaId, JSON.stringify({
                    scanner: 'simulated',
                    result: 'clean',
                    scannedAt: new Date().toISOString()
                })]);
            }, 2000);

        } catch (error) {
            console.error('Background processing error:', error);
        }
    }

    // Placeholder methods for remaining endpoints
    async getMediaDetail(req, res) {
        res.json({ success: true, message: 'Media detail endpoint - implementation pending' });
    }

    async deleteMediaFile(req, res) {
        res.json({ success: true, message: 'Delete media endpoint - implementation pending' });
    }

    async downloadFile(req, res) {
        res.json({ success: true, message: 'Download file endpoint - implementation pending' });
    }

    async getThumbnail(req, res) {
        res.json({ success: true, message: 'Get thumbnail endpoint - implementation pending' });
    }

    async getMetadata(req, res) {
        res.json({ success: true, message: 'Get metadata endpoint - implementation pending' });
    }

    async getProcessingStatus(req, res) {
        res.json({ success: true, message: 'Processing status endpoint - implementation pending' });
    }

    async reprocessFile(req, res) {
        res.json({ success: true, message: 'Reprocess file endpoint - implementation pending' });
    }

    async getVirusScanResult(req, res) {
        res.json({ success: true, message: 'Virus scan result endpoint - implementation pending' });
    }

    async shareFile(req, res) {
        res.json({ success: true, message: 'Share file endpoint - implementation pending' });
    }

    async revokeFileShare(req, res) {
        res.json({ success: true, message: 'Revoke file share endpoint - implementation pending' });
    }

    async bulkDeleteFiles(req, res) {
        res.json({ success: true, message: 'Bulk delete endpoint - implementation pending' });
    }

    async bulkProcessFiles(req, res) {
        res.json({ success: true, message: 'Bulk process endpoint - implementation pending' });
    }
}

// Initialize controller
new MediaController();

module.exports = router;