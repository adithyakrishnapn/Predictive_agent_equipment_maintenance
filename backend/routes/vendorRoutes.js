const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

// GET all vendors
router.get('/', vendorController.getAllVendors);

// GET vendor by ID
router.get('/:id', vendorController.getVendorById);

// GET recommended vendors for machine type
router.get('/recommended/:machineType', vendorController.getRecommendedVendors);

// POST create new vendor
router.post('/', vendorController.createVendor);

// PUT update vendor
router.put('/:id', vendorController.updateVendor);

// DELETE vendor (soft delete)
router.delete('/:id', vendorController.deleteVendor);

// POST add service record
router.post('/:id/service', vendorController.addServiceRecord);

module.exports = router;
