import Highlight from '../models/Highlight.js';

// @desc    Get highlights for a book
// @route   GET /api/highlights/book/:bookId
// @access  Private
export const getHighlights = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user.id;

        const highlights = await Highlight.findAll({
            where: {
                userId,
                bookId: parseInt(bookId)
            },
            order: [['createdAt', 'ASC']]
        });

        res.json({ success: true, count: highlights.length, data: highlights });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch highlights' });
    }
};

// @desc    Add a highlight
// @route   POST /api/highlights
// @access  Private
export const addHighlight = async (req, res) => {
    try {
        const { bookId, content, position, comment, color } = req.body;
        const userId = req.user.id;

        const highlight = await Highlight.create({
            userId,
            bookId: parseInt(bookId),
            content,
            position,
            comment,
            color: color || '#ffeb3b'
        });

        res.status(201).json({ success: true, data: highlight });
    } catch (error) {
        console.error('Error adding highlight:', error);
        res.status(500).json({ success: false, message: 'Failed to add highlight' });
    }
};

// @desc    Update a highlight (e.g. change comment or color)
// @route   PUT /api/highlights/:id
// @access  Private
export const updateHighlight = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { comment, color } = req.body;

        const highlight = await Highlight.findByPk(id);

        if (!highlight) {
            return res.status(404).json({ success: false, message: 'Highlight not found' });
        }

        // Ensure user owns the highlight
        if (highlight.userId !== userId) {
            return res.status(401).json({ success: false, message: 'Not authorized to update this highlight' });
        }

        highlight.comment = comment !== undefined ? comment : highlight.comment;
        highlight.color = color !== undefined ? color : highlight.color;

        await highlight.save();

        res.json({ success: true, data: highlight });
    } catch (error) {
        console.error('Error updating highlight:', error);
        res.status(500).json({ success: false, message: 'Failed to update highlight' });
    }
};

// @desc    Delete a highlight
// @route   DELETE /api/highlights/:id
// @access  Private
export const deleteHighlight = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const highlight = await Highlight.findByPk(id);

        if (!highlight) {
            return res.status(404).json({ success: false, message: 'Highlight not found' });
        }

        // Ensure user owns the highlight
        if (highlight.userId !== userId) {
            return res.status(401).json({ success: false, message: 'Not authorized to delete this highlight' });
        }

        await highlight.destroy();

        res.json({ success: true, message: 'Highlight removed' });
    } catch (error) {
        console.error('Error deleting highlight:', error);
        res.status(500).json({ success: false, message: 'Failed to delete highlight' });
    }
};
