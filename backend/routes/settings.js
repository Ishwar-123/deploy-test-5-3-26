import express from 'express';
import { Setting } from '../models/index.js';
import { uploadPDF } from '../config/localStorage.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET Catalog URL
router.get('/catalog', async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: 'catalog_pdf' } });
        if (!setting) {
            return res.status(404).json({ message: 'Catalog not found' });
        }
        res.json({ url: setting.value });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Upload Catalog (Admin Only)
router.post('/catalog', protect, adminOnly, uploadPDF.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/books/${req.file.filename}`;

        // Update or Create Setting
        const [setting, created] = await Setting.findOrCreate({
            where: { key: 'catalog_pdf' },
            defaults: { value: fileUrl }
        });

        if (!created) {
            setting.value = fileUrl;
            await setting.save();
        }

        res.json({ message: 'Catalog uploaded successfully', url: fileUrl });
    } catch (error) {
        console.error('Catalog upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// GET GST Percentage
router.get('/gst', async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: 'gst_percentage' } });
        res.json({ gst: setting ? parseFloat(setting.value) : 18 });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE GST Percentage (Admin Only)
router.post('/gst', protect, adminOnly, async (req, res) => {
    try {
        const { gst } = req.body;
        if (gst === undefined || isNaN(gst)) {
            return res.status(400).json({ message: 'Invalid GST value' });
        }

        const [setting, created] = await Setting.findOrCreate({
            where: { key: 'gst_percentage' },
            defaults: { value: gst.toString() }
        });

        if (!created) {
            setting.value = gst.toString();
            await setting.save();
        }

        res.json({ message: 'GST updated successfully', gst: parseFloat(setting.value) });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET Security Settings
router.get('/security', async (req, res) => {
    try {
        const setting = await Setting.findOne({ where: { key: 'screenshot_protection' } });
        res.json({ screenshotProtection: setting ? setting.value === 'true' : true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE Security Settings (Admin Only)
router.post('/security', protect, adminOnly, async (req, res) => {
    try {
        const { screenshotProtection } = req.body;
        if (screenshotProtection === undefined) {
            return res.status(400).json({ message: 'Invalid value' });
        }

        const [setting, created] = await Setting.findOrCreate({
            where: { key: 'screenshot_protection' },
            defaults: { value: screenshotProtection.toString() }
        });

        if (!created) {
            setting.value = screenshotProtection.toString();
            await setting.save();
        }

        res.json({ message: 'Security settings updated', screenshotProtection: setting.value === 'true' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
