const express = require('express');
const router = express.Router();
const {
  verifyDriverPreDispatch,
  manualDispatchOverride,
  getBusVerificationStatus,
  getAllVerificationLogs
} = require('../controllers/verificationController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Student is 403 Forbidden across driver verification endpoints
const VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];
const OPERATOR_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE'];
const OVERRIDE_ROLES = ['ADMIN', 'TRANSPORT_STAFF'];

// Driver pre-dispatch verification
router.post('/verify-driver', requireRole(...OPERATOR_ROLES), verifyDriverPreDispatch);
router.post('/', requireRole(...OPERATOR_ROLES), verifyDriverPreDispatch);

// Dispatch supervisor override
router.post('/override', requireRole(...OVERRIDE_ROLES), manualDispatchOverride);

// Bus verification status
router.get('/status/:bus_id', requireRole(...VIEW_ROLES), getBusVerificationStatus);

// Verification logs & audit trail
router.get('/logs', requireRole(...VIEW_ROLES), getAllVerificationLogs);

module.exports = router;
