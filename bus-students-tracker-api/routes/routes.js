const express = require('express');
const router = express.Router();
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute
} = require('../controllers/routeController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Read: All authenticated users
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Create / Update: ADMIN and TRANSPORT_STAFF
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createRoute);
router.put('/:id', requireRole('ADMIN', 'TRANSPORT_STAFF'), updateRoute);

// Delete: ADMIN only
router.delete('/:id', requireRole('ADMIN'), deleteRoute);

module.exports = router;
