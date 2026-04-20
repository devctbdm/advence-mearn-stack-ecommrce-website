import cloudinary from '../config/cloudinary.js';
import Slider from '../models/Slider.js';

// @desc    Get all slider images
// @route   GET /api/sliders
// @access  Public
const getSliders = async (req, res) => {
  try {
    let sliders = await Slider.find({ isActive: true }).sort('createdAt');
    
    // Backward compatibility: convert old 'images' field to new structure
    sliders = sliders.map(slider => {
      const hasMain = slider.mainImages && slider.mainImages.length > 0;
      const hasSide = slider.sideImages && slider.sideImages.length > 0;
      
      if (!hasMain && !hasSide && slider.images && slider.images.length > 0) {
        // Old slider format: split images array
        const allImages = slider.images;
        return {
          ...slider.toObject(),
          mainImages: allImages.slice(0, 3),
          sideImages: allImages.slice(3, 5),
        };
      }
      return slider;
    });
    
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sliders for admin
// @route   GET /api/sliders/admin/all
// @access  Private/Admin
const getAllSliders = async (req, res) => {
  try {
    let sliders = await Slider.find().sort('createdAt');
    
    // Backward compatibility: convert old 'images' field to new structure
    sliders = sliders.map(slider => {
      const hasMain = slider.mainImages && slider.mainImages.length > 0;
      const hasSide = slider.sideImages && slider.sideImages.length > 0;
      if (!hasMain && !hasSide && slider.images && slider.images.length > 0) {
        const allImages = slider.images;
        return {
          ...slider.toObject(),
          mainImages: allImages.slice(0, 3),
          sideImages: allImages.slice(3, 5),
        };
      }
      return slider;
    });
    
    res.json(sliders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single slider
// @route   GET /api/sliders/:id
// @access  Public
const getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }
    
    // Backward compatibility: convert old 'images' field
    const hasMain = slider.mainImages && slider.mainImages.length > 0;
    const hasSide = slider.sideImages && slider.sideImages.length > 0;
    if (!hasMain && !hasSide && slider.images && slider.images.length > 0) {
      const allImages = slider.images;
      slider.mainImages = allImages.slice(0, 3);
      slider.sideImages = allImages.slice(3, 5);
    }
    
    res.json(slider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create slider
// @route   POST /api/sliders
// @access  Private/Admin
const createSlider = async (req, res) => {
  try {
    console.log('=== CREATE SLIDER DEBUG ===');
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);

    const mainImages = [];
    const sideImages = [];

    if (req.files && req.files.mainImages && Array.isArray(req.files.mainImages)) {
      req.files.mainImages.forEach((file, index) => {
        mainImages.push({
          url: file.path || file.secure_url || file.url,
          publicId: file.filename || file.public_id || file.publicId,
          order: index,
        });
      });
    }

    if (req.files && req.files.sideImages && Array.isArray(req.files.sideImages)) {
      req.files.sideImages.forEach((file, index) => {
        sideImages.push({
          url: file.path || file.secure_url || file.url,
          publicId: file.filename || file.public_id || file.publicId,
          order: index,
        });
      });
    }

    console.log('Main images count:', mainImages.length);
    console.log('Side images count:', sideImages.length);

    if (mainImages.length === 0 && sideImages.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const slider = await Slider.create({
      mainImages,
      sideImages,
      isActive: true,
    });

    console.log('Slider created:', slider._id);
    res.status(201).json(slider);
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update slider
// @route   PUT /api/sliders/:id
// @access  Private/Admin
const updateSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }

    const updateData = { ...req.body };

    if (req.files && req.files.mainImages && Array.isArray(req.files.mainImages)) {
      const newMain = req.files.mainImages.map((file, index) => ({
        url: file.path || file.secure_url || file.url,
        publicId: file.filename || file.public_id || file.publicId,
        order: slider.mainImages.length + index,
      }));
      updateData.mainImages = [...slider.mainImages, ...newMain];
    }

    if (req.files && req.files.sideImages && Array.isArray(req.files.sideImages)) {
      const newSide = req.files.sideImages.map((file, index) => ({
        url: file.path || file.secure_url || file.url,
        publicId: file.filename || file.public_id || file.publicId,
        order: slider.sideImages.length + index,
      }));
      updateData.sideImages = [...slider.sideImages, ...newSide];
    }

    const updatedSlider = await Slider.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json(updatedSlider);
  } catch (error) {
    console.error('Update slider error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete slider
// @route   DELETE /api/sliders/:id
// @access  Private/Admin
const deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({ message: 'Slider not found' });
    }

    const allImages = [...(slider.mainImages || []), ...(slider.sideImages || [])];
    if (allImages.length > 0) {
      for (const image of allImages) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await slider.deleteOne();
    res.json({ message: 'Slider removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createSlider,
  deleteSlider,
  getSliderById,
  getSliders,
  getAllSliders,
  updateSlider,
};
