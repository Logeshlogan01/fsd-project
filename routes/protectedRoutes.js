// routes/protectedRoutes.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middleware/roleMiddleware');

// 🔐 Admin Dashboard - Only Admin
router.get('/admin.html', ensureAuthenticated, checkRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 🧑‍💼 Member Dashboard - Only Member
router.get('/member.html', ensureAuthenticated, checkRole('member'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/member.html'));
});

// 👤 User Dashboard - Only User
router.get('/user.html', ensureAuthenticated, checkRole('user'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/user.html'));
});

// 🛠️ Add Your Service - Admin or Member
router.get('/add-service.html', ensureAuthenticated, checkRole('admin', 'member'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/add-service.html'));
});

// 📅 Booking Page - Admin or User
router.get('/booking.html', ensureAuthenticated, checkRole('admin', 'user'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/booking.html'));
});

// 🔧 Service Page - All Roles
router.get('/service.html', ensureAuthenticated, checkRole('admin', 'user', 'member'), (req, res) => {
  res.sendFile(path.join(__dirname, '../public/service.html'));
});

module.exports = router;
app.get('/add-your-service.html', checkRole(['admin', 'member']), (req, res) => {
  res.sendFile(__dirname + '/public/add-your-service.html');
});

