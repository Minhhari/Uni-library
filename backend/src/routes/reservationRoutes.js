const express = require('express');
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getAllReservations,
  approveReservation,
  rejectReservation,
} = require('../controllers/reservationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// POST /api/reservation         – User đặt chỗ sách (phải login)
router.post('/', protect, createReservation);

// GET  /api/reservation/my      – User xem reservation của mình
router.get('/my', protect, getMyReservations);

// GET  /api/reservation/all     – Admin / Librarian xem tất cả
router.get('/all', protect, authorize('admin', 'librarian'), getAllReservations);

// PUT  /api/reservation/approve/:id  – Admin / Librarian duyệt
router.put('/approve/:id', protect, authorize('admin', 'librarian'), approveReservation);

// PUT  /api/reservation/reject/:id   – Admin / Librarian từ chối
router.put('/reject/:id', protect, authorize('admin', 'librarian'), rejectReservation);

module.exports = router;
