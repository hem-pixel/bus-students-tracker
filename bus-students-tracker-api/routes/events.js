const express = require('express');
const router = express.Router();
const {
  getEvents,
  getUnresolvedEvents,
  createEvent,
  resolveEvent
} = require('../controllers/eventController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

const ALLOWED_VIEW_ROLES = ['ADMIN', 'TRANSPORT_STAFF', 'BUS_IN_CHARGE', 'DRIVER'];

router.get('/unresolved', requireRole(...ALLOWED_VIEW_ROLES), getUnresolvedEvents);
router.get('/', requireRole(...ALLOWED_VIEW_ROLES), getEvents);
router.post('/', requireRole('ADMIN', 'TRANSPORT_STAFF'), createEvent);
router.put('/:id/resolve', requireRole('ADMIN', 'TRANSPORT_STAFF'), resolveEvent);

module.exports = router;
