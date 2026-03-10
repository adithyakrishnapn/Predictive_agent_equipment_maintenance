import Vendor from '../models/Vendor.js';
import logger from '../utils/logger.js';

/**
 * Get all vendors
 */
export const getAllVendors = async (req, res, next) => {
  try {
    const { specialization, active } = req.query;
    
    let query = {};
    
    if (specialization) {
      query.specialization = specialization;
    }
    
    if (active !== undefined) {
      query.is_active = active === 'true';
    }
    
    const vendors = await Vendor.find(query).sort({ rating: -1 });
    
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    logger.error('Error in getAllVendors:', error);
    next(error);
  }
};

/**
 * Get vendor by ID
 */
export const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error(`Error in getVendorById ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Create new vendor
 */
export const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    
    logger.info(`New vendor created: ${vendor.name}`);
    
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Error creating vendor:', error);
    next(error);
  }
};

/**
 * Update vendor
 */
export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error(`Error updating vendor ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Delete vendor (soft delete)
 */
export const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vendor deactivated successfully'
    });
  } catch (error) {
    logger.error(`Error deleting vendor ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Add service record to vendor
 */
export const addServiceRecord = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    vendor.service_history.push(req.body);
    
    // Update rating if provided
    if (req.body.rating) {
      const totalRatings = vendor.service_history.reduce((sum, service) => {
        return sum + (service.rating || 0);
      }, 0);
      vendor.rating = totalRatings / vendor.service_history.length;
    }
    
    await vendor.save();
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error(`Error adding service record for vendor ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Get recommended vendors for machine type
 */
export const getRecommendedVendors = async (req, res, next) => {
  try {
    const { machineType } = req.params;
    
    const vendors = await Vendor.find({
      specialization: machineType,
      is_active: true
    }).sort({ rating: -1, service_rate: 1 }).limit(5);
    
    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    logger.error(`Error getting recommended vendors for ${req.params.machineType}:`, error);
    next(error);
  }
};
