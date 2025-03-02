
const ForwardedCV = require('../models/forwardcv.modal');

// Forward Selected CVs
exports.forwardCVs = async (req, res) => {
    try {
        const { selectedCVs } = req.body;

        if (!selectedCVs || selectedCVs.length === 0) {
            return res.status(400).json({ error: 'No CVs selected' });
        }

        // Assuming selectedCVs already have companyName, websiteUrl, and filePath
        const forwardedCV = new ForwardedCV({
            forwardedCVs: selectedCVs.map((cv) => ({
                companyName: cv.companyName,
                websiteUrl: cv.websiteUrl,
                filePath: cv.filePath,
            })),
        });

        await forwardedCV.save();

        res.status(201).json({ message: 'CVs forwarded successfully', data: forwardedCV });
    } catch (error) {
        res.status(500).json({ error: 'Failed to forward CVs', details: error.message });
    }
};

// Fetch forwarded CVs
exports.getForwardedCVs = async (req, res) => {
    try {
        const forwardedCVs = await ForwardedCV.find();
        res.status(200).json(forwardedCVs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch forwarded CVs' });
    }
};