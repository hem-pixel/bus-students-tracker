const express = require('express');
const router = express.Router();
const {
  pingCamera,
  rebootCamera,
  runNetworkDiagnostics
} = require('../controllers/diagnosticsController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

router.post('/ping', requireRole(...ALLOWED_VIEW_ROLES), pingCamera);
router.post('/camera/:id/ping', requireRole(...ALLOWED_VIEW_ROLES), pingCamera);

router.post('/reboot', requireRole('ADMIN', 'TRANSPORT_STAFF'), rebootCamera);
router.post('/camera/:id/reboot', requireRole('ADMIN', 'TRANSPORT_STAFF'), rebootCamera);

router.get('/:id/network', requireRole(...ALLOWED_VIEW_ROLES), runNetworkDiagnostics);
router.get('/camera/:id/network', requireRole(...ALLOWED_VIEW_ROLES), runNetworkDiagnostics);

module.exports = router;
