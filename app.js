// ✅ Imports
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth');
const User = require('./models/User');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());


// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
  secret: 'quickhire_secret_key',
  resave: false,
  saveUninitialized: false
}));

// ✅ MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/quickhire', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});
app.get('/admin-signup.html', (req, res) => {
  if (req.session.user && req.session.user.role !== 'admin') {
    return res.redirect('/'); // Redirect if a non-admin tries to access
  }
  res.sendFile(path.join(__dirname, 'public', 'admin-signup.html'));
});

// ✅ Secure Admin Registration
app.post('/api/admin-register', async (req, res) => {
  const { username, email, password, adminCode } = req.body;

  // Validate input
  if (!username || !email || !password || !adminCode) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Check if the admin code matches
  if (adminCode !== process.env.ADMIN_SECRET_CODE) {
    return res.status(403).json({ message: 'Invalid admin secret code' });
  }

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    // Save user to database
    await user.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error('Admin registration error:', err.message);
    res.status(500).json({ message: 'Error registering admin' });
  }
});
// login functions
app.post('/login', async (req, res) => {
  const { username, role } = req.body;
    try {
      const user = await Signup.findOne({ email });

      if (!user || user.password !== password) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      req.session.user = {
          id: user._id,
          email: user.email,
          role: user.role
      };

      res.json({ success: true, role: user.role });
  } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
  res.cookie('userData', { username, role }, {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    secure: false  // set to true in production (HTTPS)
  });

  req.session.user = { username, role };
  res.redirect('/index.html');
});
async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
//login of middleware
  const data = await response.json();
  if (data.success) {
    alert("✅ Login successful!");
    switch (data.role) {
      case 'admin':
        window.location.href = '/admin.html';
        break;
      case 'member':
        window.location.href = '/member.html';
        break;
      case 'user':
        window.location.href = '/user.html';
        break;
      default:
        window.location.href = '/';
    }
  } else {
    alert("❌ " + data.message);
  }
}

// ✅ Session Check & Role-based Redirect
app.get('/home', (req, res) => {
  if (req.session && req.session.user) {
    const role = req.session.user.role;
    if (role === 'admin') return res.redirect('/admin.html');
    if (role === 'member') return res.redirect('/member.html');
    if (role === 'user') return res.redirect('/user.html');
  }
  res.redirect('/auth.html');
});

// ✅ Serve Static Files (except index.html by default)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ✅ Mount auth routes
app.use('/api', authRoutes);

// ✅ Middleware: Protect Routes
const protectPage = (req, res, next) => {
  if (!req.session.user) return res.redirect('/auth.html');
  next();
};

// ✅ Middleware: Role Check
function checkRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.session.user) return res.redirect('/auth.html');
    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).send('❌ Access Denied: You are not allowed to view this page.');
    }
    next();
  };
}

// ✅ Session check for frontend
app.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ✅ Public Auth Page
app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// ✅ Protected Homepage
app.get('/', protectPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Other Protected Pages
app.get('/:page', (req, res) => {
  const protectedPages = ['index.html', 'user.html', 'member.html', 'admin.html'];
  const page = req.params.page;
  if (protectedPages.includes(page) && !req.session.user) {
    return res.redirect('/auth.html');
  }
  res.sendFile(path.join(__dirname, 'public', page));
});

// ✅ Complaint Model
const complaintSchema = new mongoose.Schema({
  name: String,
  email: String,
  complaint: String,
  date: { type: Date, default: Date.now }
});
const Complaint = mongoose.model('Complaint', complaintSchema);

// ✅ Review Model
const reviewSchema = new mongoose.Schema({
  name: String,
  email: String,
  review: String,
  rating: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// ✅ Service Model
const serviceSchema = new mongoose.Schema({
  name: String,
  number: String,
  service: String,
  location: String,
  createdAt: { type: Date, default: Date.now }
});
const Service = mongoose.model('Service', serviceSchema);

// ✅ Booking Model
const bookingSchema = new mongoose.Schema({
  name: String,
  phone: String,
  location: String,
  date: String,
  time: String,
  serviceType: String,
});
const Booking = mongoose.model('Booking', bookingSchema);

// ✅ Complaint Route
app.post('/api/complaints', async (req, res) => {
  const { name, email, complaint } = req.body;
  if (!name || !email || !complaint) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const newComplaint = new Complaint({ name, email, complaint });
    await newComplaint.save();
    res.status(200).json({ message: 'Complaint submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error saving complaint' });
  }
});
//fetch complaints in re-page
app.get('/api/complaints', async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ date: -1 }); // Sort by your date field
    res.status(200).json(complaints);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching complaints' });
  }
});

// ✅ Submit Review Route
app.post('/api/reviews', async (req, res) => {
  const { name, email, review, rating } = req.body;
  if (!name || !email || !review || !rating) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    const newReview = new Review({ name, email, review, rating });
    await newReview.save();
    res.status(200).json({ message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error saving review' });
  }
});

// ✅ Fetch Reviews Route
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find();
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// ✅ Add Service Route (Single Version)
app.post('/add-service', async (req, res) => {
  try {
    const { name, number, service, location } = req.body;
    const newService = new Service({ name, number, service, location });
    await newService.save();
    res.json({ message: "Service successfully added!" });
  } catch (error) {
    console.error("Error saving service:", error);
    res.status(500).json({ message: "Failed to add service" });
  }
});

// ✅ Display Services
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching services' });
  }
});

// ✅ Booking Submission
const axios = require('axios');
app.post('/submit-booking', async (req, res) => {
  try {
    const { name, phone, location, date, time, serviceType } = req.body;

    if (!name || !phone || !location || !date || !time || !serviceType) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Save booking to MongoDB
    await Booking.create({ name, phone, location, date, time, serviceType });

    // Prepare SMS message
    const message = `Hi ${name}, your booking for ${serviceType} on ${date} at ${time} in ${location} has been confirmed.`;

    try {
      // Try sending SMS
      const smsResponse = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          sender_id: 'FSTSMS',
          message: message,
          language: 'english',
          route: 'v3',
          numbers: phone
        },
        {
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('SMS sent successfully:', smsResponse.data);
      res.json({ message: 'Booking successful and SMS sent!' });

    } catch (smsError) {
      console.error('SMS failed:', smsError.response?.data || smsError.message);
      res.json({ message: 'Booking successful, but SMS failed to send.' });
    }

  } catch (err) {
    console.error('Booking error on server:', err.message);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});
// Delete a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err.message);
    res.json({ success: false });
  }
});

// ✅ Fetch All Booked Slots
app.get('/api/bookedslots', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json(bookings);
  } catch (error) {
    res.status(500).send('Error fetching bookings.');
  }
});

// ✅ Role Check Route
app.get('/api/checkRole', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ role: req.session.user.role });
  } else {
    res.status(401).json({ role: 'Guest' });
  }
});

// ✅ Get user info for frontend
app.get('/get-user-info', (req, res) => {
  if (req.session.user) {
    const { email, role } = req.session.user;
    res.json({ email, role });
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});
app.get('/index.html', (req, res, next) => {
  const cookieData = req.cookies.userData;
  if (!cookieData) {
    return res.redirect('/auth.html');
  }

  // optional: validate cookie data
  console.log('User from cookie:', cookieData);
  next();
});


// ✅ Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
