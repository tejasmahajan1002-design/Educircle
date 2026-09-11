const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { authenticate, authorizeAdmin, JWT_SECRET } = require('../middleware/auth');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../services/emailService');
const STUDENT_DIRECTORY = require('../services/studentDirectory');

const router = express.Router();

// ==========================================
// 1. AUTHENTICATION & PROFILE ROUTES
// ==========================================

// Register Student with OTP (Only ZPRN & Password required; Name & Email auto-detected from directory)
router.post('/auth/register', async (req, res) => {
  const { zprn, password, confirmPassword } = req.body;

  if (!zprn || !password || !confirmPassword) {
    return res.status(400).json({ message: 'ZPRN and passwords are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  // Automatically detect student name & email from studentDirectory
  const student = STUDENT_DIRECTORY.find(s => s.zprn.toUpperCase() === zprn.trim().toUpperCase());
  if (!student) {
    return res.status(400).json({ message: 'Invalid ZPRN Number. Only registered ECE students are allowed to register.' });
  }
  const name = student.name;
  const email = student.email.toLowerCase();
  const rollNumber = zprn.trim().toUpperCase();
  const department = 'Electronics and Computer Engineering';
  const year = '1st Year';
  const semester = '1st Sem';
  const mobileNumber = '';

  // Check duplicate verified email - if user exists, allow sending fresh OTP to re-verify
  const existingUser = db.users.findOne({ email });

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Generate 6-Digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHashed = bcrypt.hashSync(otpCode, 10);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  if (existingUser) {
    db.users.updateById(existingUser.id, {
      name,
      mobileNumber,
      rollNumber,
      department,
      year,
      semester,
      passwordHash,
      otpHash: otpHashed,
      otpExpiry,
      otpAttempts: 0,
      lastOtpRequestAt: new Date().toISOString(),
      emailVerified: false
    });
  } else {
    db.users.insertOne({
      name,
      email: email.toLowerCase(),
      mobileNumber,
      rollNumber,
      department,
      year,
      semester,
      passwordHash,
      role: 'student',
      trustScore: 75,
      ratingAverage: 0.0,
      status: 'active',
      emailVerified: false,
      otpHash: otpHashed,
      otpExpiry,
      otpAttempts: 0,
      lastOtpRequestAt: new Date().toISOString()
    });
  }

  // Dispatch Real-Time Email
  const emailRes = await sendVerificationEmail(email.toLowerCase(), name, otpCode);
  if (!emailRes.success) {
    return res.status(500).json({ message: `Failed to deliver email: ${emailRes.error || 'SMTP configuration error'}` });
  }

  res.status(201).json({
    success: true,
    message: `6-digit verification code sent to ${email}.`,
    email: email.toLowerCase(),
    otp: otpCode,
    expiresInSeconds: 300,
    resendCooldown: 60
  });
});

// Verify OTP
router.post('/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required.' });
  }

  const user = db.users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ message: 'No registration session found for this email.' });
  }

  if (user.emailVerified) {
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, otpHash: __, ...userWithoutHash } = user;
    return res.json({ token, user: userWithoutHash, message: 'Email already verified.' });
  }

  if ((user.otpAttempts || 0) >= 5) {
    return res.status(429).json({ message: 'Maximum verification attempts exceeded (5). Please request a new OTP.' });
  }

  if (new Date() > new Date(user.otpExpiry)) {
    return res.status(400).json({ message: 'Verification OTP has expired (5-minute validity). Please click Resend.' });
  }

  const isValid = bcrypt.compareSync(otp, user.otpHash);
  if (!isValid) {
    const newAttempts = (user.otpAttempts || 0) + 1;
    db.users.updateById(user.id, { otpAttempts: newAttempts });
    const remaining = Math.max(0, 5 - newAttempts);
    return res.status(400).json({
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      attemptsRemaining: remaining
    });
  }

  // Activate user
  db.users.updateById(user.id, {
    emailVerified: true,
    otpHash: null,
    otpExpiry: null,
    otpAttempts: 0
  });

  const updatedUser = db.users.findById(user.id);
  const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, otpHash: __, ...userWithoutHash } = updatedUser;

  res.json({
    success: true,
    message: 'Email verified successfully! Account activated.',
    token,
    user: userWithoutHash
  });
});

// Resend OTP
router.post('/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const user = db.users.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Registration record not found.' });

  if (user.emailVerified) {
    return res.json({ message: 'Account is already verified.' });
  }

  const elapsed = (Date.now() - new Date(user.lastOtpRequestAt || 0).getTime()) / 1000;
  if (elapsed < 60) {
    const waitSecs = Math.ceil(60 - elapsed);
    return res.status(429).json({ message: `Please wait ${waitSecs} seconds before requesting a new OTP.` });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHashed = bcrypt.hashSync(otpCode, 10);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.users.updateById(user.id, {
    otpHash: otpHashed,
    otpExpiry,
    otpAttempts: 0,
    lastOtpRequestAt: new Date().toISOString()
  });

  // Dispatch Real-Time Email
  const emailRes = await sendVerificationEmail(email.toLowerCase(), user.name, otpCode);
  if (!emailRes.success) {
    return res.status(500).json({ message: `Failed to deliver email: ${emailRes.error || 'SMTP configuration error'}` });
  }

  res.json({
    success: true,
    message: `Fresh verification code sent to ${email}.`,
    otp: otpCode,
    resendCooldown: 60
  });
});

// Forgot Password - Send OTP
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const user = db.users.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Account with this email does not exist.' });

  if (!user.emailVerified) {
    return res.status(400).json({ message: 'This email is not verified. Please register first.' });
  }

  const elapsed = (Date.now() - new Date(user.lastOtpRequestAt || 0).getTime()) / 1000;
  if (elapsed < 60) {
    const waitSecs = Math.ceil(60 - elapsed);
    return res.status(429).json({ message: `Please wait ${waitSecs} seconds before requesting another code.` });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHashed = bcrypt.hashSync(otpCode, 10);
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.users.updateById(user.id, {
    otpHash: otpHashed,
    otpExpiry,
    otpAttempts: 0,
    lastOtpRequestAt: new Date().toISOString()
  });

  // Dispatch Email
  const emailRes = await sendResetPasswordEmail(email.toLowerCase(), user.name, otpCode);
  if (!emailRes.success) {
    return res.status(500).json({ message: `Failed to deliver email: ${emailRes.error || 'SMTP configuration error'}` });
  }

  res.json({
    success: true,
    message: `Password reset verification code sent to ${email}.`,
    otp: otpCode,
    expiresInSeconds: 300,
    resendCooldown: 60
  });
});

// Reset Password - Verify OTP & Set New Password
router.post('/auth/reset-password', async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const user = db.users.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'Account not found.' });

  if ((user.otpAttempts || 0) >= 5) {
    return res.status(429).json({ message: 'Maximum verification attempts exceeded. Please request a new code.' });
  }

  if (new Date() > new Date(user.otpExpiry)) {
    return res.status(400).json({ message: 'Reset code has expired. Please request a new code.' });
  }

  const isValid = bcrypt.compareSync(otp, user.otpHash);
  if (!isValid) {
    const newAttempts = (user.otpAttempts || 0) + 1;
    db.users.updateById(user.id, { otpAttempts: newAttempts });
    const remaining = Math.max(0, 5 - newAttempts);
    return res.status(400).json({
      message: `Invalid verification code. ${remaining} attempt(s) remaining.`,
      attemptsRemaining: remaining
    });
  }

  // Update password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);

  db.users.updateById(user.id, {
    passwordHash,
    otpHash: null,
    otpExpiry: null,
    otpAttempts: 0
  });

  res.json({
    success: true,
    message: 'Password reset successful! You can now log in with your new password.'
  });
});

// Login
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = db.users.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (user.role === 'student' && !user.emailVerified) {
    return res.status(403).json({
      message: 'Your email address is not verified yet. Please complete email verification.',
      requiresVerification: true,
      email: user.email
    });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ message: 'Your account has been blocked by the Administrator.' });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, otpHash: __, ...userWithoutHash } = user;
  res.json({ token, user: userWithoutHash });
});

// Get Current User Profile
router.get('/auth/me', authenticate, (req, res) => {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const { passwordHash: _, ...userWithoutHash } = user;
  res.json(userWithoutHash);
});

// Get Public User Profile
router.get('/users/:id', authenticate, (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  // Get ratings received by this user
  const ratings = db.ratings.find({ rateeId: user.id }).map(r => {
    const rater = db.users.findById(r.raterId);
    return {
      ...r,
      raterName: rater ? rater.name : 'Unknown Student'
    };
  });

  // Resources shared by user
  const resources = db.resources.find({ ownerId: user.id });

  // Count successful transactions (returns completed)
  const successfulTxCount = db.transactions.count({
    borrowerId: user.id,
    status: 'returned'
  }) + db.transactions.count({
    ownerId: user.id,
    status: 'returned'
  });

  const { passwordHash: _, email: __, ...publicProfile } = user;
  res.json({
    user: publicProfile,
    ratings,
    resources,
    successfulTransactionsCount: successfulTxCount
  });
});

// Get Leaderboard (Top Contributors)
router.get('/users/leaderboard/rankings', authenticate, (req, res) => {
  const allUsers = db.users.find({ role: 'student' });
  const ranked = allUsers.map(user => {
    // Calculate contribution score:
    // returns completed + resources uploaded * 2 + average rating * 5
    const uploadedCount = db.resources.count({ ownerId: user.id });
    const completedCount = db.transactions.count({ ownerId: user.id, status: 'returned' });
    const ratingBonus = user.ratingAverage * 10;
    const score = (completedCount * 15) + (uploadedCount * 10) + ratingBonus;

    return {
      id: user.id,
      name: user.name,
      department: user.department,
      trustScore: user.trustScore,
      ratingAverage: user.ratingAverage,
      score: Math.round(score),
      sharedCount: uploadedCount,
      completedCount
    };
  });

  // Sort descending
  ranked.sort((a, b) => b.score - a.score);
  res.json(ranked.slice(0, 10)); // Top 10
});


// ==========================================
// 2. RESOURCES & DIGITAL UPLOADS
// ==========================================

// Get All Resources with Search & Filters
router.get('/resources', authenticate, (req, res) => {
  let resources = db.resources.find();

  const { search, category, condition, type, availability, department, semester, sortBy } = req.query;

  // 1. Text Search (Matches name, description, ownerName)
  if (search) {
    const q = search.toLowerCase();
    resources = resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(q))
    );
  }

  // 2. Filter Category
  if (category) {
    resources = resources.filter(r => r.category === category);
  }

  // 3. Filter Condition
  if (condition) {
    resources = resources.filter(r => r.condition === condition);
  }

  // 4. Filter Type (Physical Item vs Digital Resource)
  if (type) {
    resources = resources.filter(r => r.type === type);
  }

  // 5. Filter Availability
  if (availability) {
    resources = resources.filter(r => r.availability === availability);
  }

  // 6. Filter by Owner's Department/Semester
  if (department || semester) {
    resources = resources.filter(r => {
      const owner = db.users.findById(r.ownerId);
      if (!owner) return false;
      if (department && owner.department !== department) return false;
      if (semester && owner.semester !== semester) return false;
      return true;
    });
  }

  // 7. Sort listings
  if (sortBy === 'rating') {
    resources.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
  } else if (sortBy === 'popular') {
    // Rank popular based on number of borrow transactions
    resources.sort((a, b) => {
      const aCount = db.transactions.count({ resourceId: a.id });
      const bCount = db.transactions.count({ resourceId: b.id });
      return bCount - aCount;
    });
  } else {
    // Default: Newest
    resources.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(resources);
});

// Get Resource Details
router.get('/resources/:id', authenticate, (req, res) => {
  const resource = db.resources.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const owner = db.users.findById(resource.ownerId);
  const ownerDetails = owner ? {
    id: owner.id,
    name: owner.name,
    department: owner.department,
    year: owner.year,
    trustScore: owner.trustScore,
    ratingAverage: owner.ratingAverage
  } : null;

  res.json({
    resource,
    owner: ownerDetails
  });
});

// Add New Resource
router.post('/resources', authenticate, (req, res) => {
  const { name, category, description, type, condition, availability, lendingDuration, location, fileUrl, images, quantity, itemValue, listingMethod, price, swapPreferences } = req.body;

  if (!name || !category || !description || !type || !condition) {
    return res.status(400).json({ message: 'Missing required resource details.' });
  }

  const owner = db.users.findById(req.user.id);
  const qty = type === 'Physical Item' ? Math.max(1, parseInt(quantity) || 1) : 1;

  // Set mock default image if none uploaded
  let imgs = images || [];
  if (imgs.length === 0) {
    if (type === 'Digital Resource') {
      imgs.push('/images/mock_digital.png');
    } else {
      imgs.push(`/images/mock_${category.toLowerCase().replace(/[^a-z]/g, '_')}.png`);
    }
  }

  const newResource = db.resources.insertOne({
    ownerId: owner.id,
    ownerName: owner.name,
    name,
    category,
    description,
    type,
    condition,
    itemValue: parseInt(itemValue) || 1000,
    quantity: qty,
    availableQuantity: qty,
    listingMethod: listingMethod || 'rent',
    price: parseFloat(price) || 0.00,
    swapPreferences: swapPreferences || null,
    availability: availability || 'available',
    lendingDuration: parseInt(lendingDuration) || 0,
    location: location || 'Campus',
    images: imgs,
    fileUrl: type === 'Digital Resource' ? (fileUrl || '/files/sample_guide.pdf') : null,
    ratingAverage: 0.0
  });

  res.status(201).json(newResource);
});

// Edit Resource
router.put('/resources/:id', authenticate, (req, res) => {
  const resource = db.resources.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  // Only Owner can edit
  if (resource.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'You are not authorized to edit this resource.' });
  }

  // Prevent editing when resource has active transaction status
  const activeTx = db.transactions.findOne({
    resourceId: resource.id,
    status: 'borrowed'
  }) || db.transactions.findOne({
    resourceId: resource.id,
    status: 'overdue'
  });

  if (activeTx) {
    return res.status(400).json({ message: 'Cannot edit resource while it is currently borrowed or overdue.' });
  }

  const updated = db.resources.updateById(req.params.id, req.body);
  res.json(updated);
});

// Delete Resource
router.delete('/resources/:id', authenticate, (req, res) => {
  const resource = db.resources.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  // Owner or Admin can delete
  if (resource.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this resource.' });
  }

  // Prevent deletion when resource has an active borrowing transaction or pending approval
  const activeTx = db.transactions.findOne({
    resourceId: resource.id,
    status: 'borrowed'
  }) || db.transactions.findOne({
    resourceId: resource.id,
    status: 'overdue'
  }) || db.borrowRequests.findOne({
    resourceId: resource.id,
    status: 'requested'
  });

  if (activeTx) {
    return res.status(400).json({ message: 'Cannot delete resource with pending requests or active borrowings.' });
  }

  db.resources.deleteById(req.params.id);
  res.json({ message: 'Resource listing deleted successfully.' });
});


// ==========================================
// 3. BORROWING SYSTEM
// ==========================================

// Create Borrow Request
router.post('/borrow/request', authenticate, (req, res) => {
  const { resourceId, borrowDate, returnDate, purpose, agreementAccepted } = req.body;

  if (!resourceId || !borrowDate || !returnDate || !purpose || !agreementAccepted) {
    return res.status(400).json({ message: 'All request fields and agreement acceptances are required.' });
  }

  const resource = db.resources.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  // Rule: A resource cannot be borrowed by its owner
  if (resource.ownerId === req.user.id) {
    return res.status(400).json({ message: 'You cannot borrow your own resource.' });
  }

  // Rule: Resource must be available
  if (resource.availability !== 'available') {
    return res.status(400).json({ message: 'This resource is not available for borrowing.' });
  }

  // Rule: Borrowers with unresolved overdue physical resources cannot borrow
  const overdueTxs = db.transactions.find({ borrowerId: req.user.id, status: 'overdue' });
  if (overdueTxs.length > 0) {
    return res.status(403).json({
      message: 'You currently have an overdue resource. Please complete the previous return before borrowing another item.'
    });
  }

  const newRequest = db.borrowRequests.insertOne({
    resourceId,
    requesterId: req.user.id,
    borrowDate,
    returnDate,
    purpose,
    agreementAccepted: !!agreementAccepted,
    status: 'requested'
  });

  // Create notifications for owner
  const requester = db.users.findById(req.user.id);
  db.notifications.insertOne({
    userId: resource.ownerId,
    content: `${requester.name} requested to borrow your item: "${resource.name}".`,
    type: 'request_received',
    relatedId: newRequest.id,
    isRead: false
  });

  res.status(201).json(newRequest);
});

// Fetch Borrow Requests (Sent/Received)
router.get('/borrow/requests', authenticate, (req, res) => {
  const userId = req.user.id;

  // Sent Requests
  const sent = db.borrowRequests.find({ requesterId: userId }).map(reqObj => {
    const resource = db.resources.findById(reqObj.resourceId);
    return {
      ...reqObj,
      resourceName: resource ? resource.name : 'Unknown Resource',
      resourceImage: resource && resource.images ? resource.images[0] : '',
      ownerId: resource ? resource.ownerId : '',
      ownerName: resource ? resource.ownerName : ''
    };
  });

  // Received Requests (Requests for my resources)
  const myResources = db.resources.find({ ownerId: userId }).map(r => r.id);
  const received = db.borrowRequests.find().filter(reqObj => myResources.includes(reqObj.resourceId)).map(reqObj => {
    const resource = db.resources.findById(reqObj.resourceId);
    const requester = db.users.findById(reqObj.requesterId);
    return {
      ...reqObj,
      resourceName: resource ? resource.name : 'Unknown Resource',
      resourceImage: resource && resource.images ? resource.images[0] : '',
      requesterName: requester ? requester.name : 'Unknown Student',
      requesterTrustScore: requester ? requester.trustScore : 0
    };
  });

  res.json({ sent, received });
});

// Respond to Borrow Request (Accept/Reject)
router.post('/borrow/requests/:id/respond', authenticate, (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid response status.' });
  }

  const borrowReq = db.borrowRequests.findById(req.params.id);
  if (!borrowReq) return res.status(404).json({ message: 'Borrow request not found.' });

  const resource = db.resources.findById(borrowReq.resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  // Only Owner can approve
  if (resource.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the resource owner can approve requests.' });
  }

  if (borrowReq.status !== 'requested') {
    return res.status(400).json({ message: 'This request has already been processed.' });
  }

  if (status === 'approved') {
    // Verify resource is still available
    if (resource.availability !== 'available') {
      return res.status(400).json({ message: 'Resource is no longer available.' });
    }

    // Approve the request
    db.borrowRequests.updateById(borrowReq.id, { status: 'approved' });

    // Mark resource as borrowed
    db.resources.updateById(resource.id, { availability: 'borrowed' });

    // Create Active Transaction
    db.transactions.insertOne({
      requestId: borrowReq.id,
      resourceId: resource.id,
      borrowerId: borrowReq.requesterId,
      ownerId: resource.ownerId,
      borrowDate: borrowReq.borrowDate,
      expectedReturnDate: borrowReq.returnDate,
      status: 'borrowed',
      qrToken: `qr_tx_${Math.random().toString(36).substring(3, 8).toUpperCase()}`,
      returnConfirmationRequested: false
    });

    // Automatically reject other pending requests for the same resource
    const siblingRequests = db.borrowRequests.find({ resourceId: resource.id, status: 'requested' });
    siblingRequests.forEach(reqObj => {
      db.borrowRequests.updateById(reqObj.id, { status: 'rejected' });
      db.notifications.insertOne({
        userId: reqObj.requesterId,
        content: `Your request to borrow "${resource.name}" was declined because it has been lent to another student.`,
        type: 'request_rejected',
        relatedId: reqObj.id,
        isRead: false
      });
    });

    // Notify Borrower
    db.notifications.insertOne({
      userId: borrowReq.requesterId,
      content: `Your borrow request for "${resource.name}" has been APPROVED. Propose hand-over details in chat.`,
      type: 'request_approved',
      relatedId: borrowReq.id,
      isRead: false
    });

  } else {
    // Reject the request
    db.borrowRequests.updateById(borrowReq.id, { status: 'rejected' });

    // Notify Borrower
    db.notifications.insertOne({
      userId: borrowReq.requesterId,
      content: `Your borrow request for "${resource.name}" was declined by the owner.`,
      type: 'request_rejected',
      relatedId: borrowReq.id,
      isRead: false
    });
  }

  res.json({ message: `Request successfully ${status}.` });
});

// Fetch Transactions (My Borrowings / My Lendings)
router.get('/borrow/transactions', authenticate, (req, res) => {
  const userId = req.user.id;

  const borrowings = db.transactions.find({ borrowerId: userId }).map(tx => {
    const resource = db.resources.findById(tx.resourceId);
    const owner = db.users.findById(tx.ownerId);
    return {
      ...tx,
      resourceName: resource ? resource.name : 'Unknown Resource',
      resourceImage: resource && resource.images ? resource.images[0] : '',
      ownerName: owner ? owner.name : 'Unknown Student'
    };
  });

  const lendings = db.transactions.find({ ownerId: userId }).map(tx => {
    const resource = db.resources.findById(tx.resourceId);
    const borrower = db.users.findById(tx.borrowerId);
    return {
      ...tx,
      resourceName: resource ? resource.name : 'Unknown Resource',
      resourceImage: resource && resource.images ? resource.images[0] : '',
      borrowerName: borrower ? borrower.name : 'Unknown Student',
      borrowerTrustScore: borrower ? borrower.trustScore : 0
    };
  });

  res.json({ borrowings, lendings });
});

// Borrower Requests Return Confirmation
router.post('/borrow/transactions/:id/return-request', authenticate, (req, res) => {
  const tx = db.transactions.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  // Rule: Only borrower can request return confirmation
  if (tx.borrowerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the borrower can request return confirmation.' });
  }

  if (tx.status === 'returned') {
    return res.status(400).json({ message: 'Resource has already been confirmed as returned.' });
  }

  // Update transaction flag
  db.transactions.updateById(tx.id, { returnConfirmationRequested: true });

  // Notify Owner
  const borrower = db.users.findById(req.user.id);
  const resource = db.resources.findById(tx.resourceId);
  db.notifications.insertOne({
    userId: tx.ownerId,
    content: `${borrower.name} requested return confirmation for: "${resource.name}". Please confirm hand-over.`,
    type: 'return_requested',
    relatedId: tx.id,
    isRead: false
  });

  res.json({ message: 'Return confirmation request submitted. Waiting for owner approval.' });
});

// Owner Confirms Return & Triggers Trust Score Updates
router.post('/borrow/transactions/:id/confirm-return', authenticate, (req, res) => {
  const tx = db.transactions.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  // Rule: Only the owner can confirm a normal return
  if (tx.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the resource owner can confirm return.' });
  }

  if (tx.status === 'returned') {
    return res.status(400).json({ message: 'Resource has already been returned.' });
  }

  const now = new Date();
  const dueDate = new Date(tx.expectedReturnDate);
  const isOverdue = now > dueDate;

  // Complete Transaction
  db.transactions.updateById(tx.id, {
    status: 'returned',
    actualReturnDate: now.toISOString(),
    returnConfirmationRequested: false
  });

  // Make resource available again
  db.resources.updateById(tx.resourceId, { availability: 'available' });

  // Adjust Borrower's Trust Score
  const borrower = db.users.findById(tx.borrowerId);
  if (borrower) {
    let trustDiff = 0;
    if (isOverdue) {
      // Calculate overdue days
      const diffTime = Math.abs(now - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      trustDiff = -(diffDays * 5); // Lose 5 points per overdue day
    } else {
      trustDiff = +5; // Return on time
    }

    const newScore = Math.max(0, Math.min(100, (borrower.trustScore || 75) + trustDiff));
    db.users.updateById(borrower.id, { trustScore: newScore });
  }

  // Adjust Owner's Trust Score for successful sharing
  const owner = db.users.findById(tx.ownerId);
  if (owner) {
    const newScore = Math.max(0, Math.min(100, (owner.trustScore || 75) + 3)); // +3 trust score for successfully lending
    db.users.updateById(owner.id, { trustScore: newScore });
  }

  // Notify Borrower
  const resource = db.resources.findById(tx.resourceId);
  db.notifications.insertOne({
    userId: tx.borrowerId,
    content: `Your return of "${resource.name}" has been confirmed. You can now leave a rating!`,
    type: 'return_confirmed',
    relatedId: tx.id,
    isRead: false
  });

  res.json({ message: 'Return confirmed. Resource is available again.' });
});

// Leave Transaction Rating
router.post('/borrow/transactions/:id/rate', authenticate, (req, res) => {
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
  }

  const tx = db.transactions.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  // Rule: Ratings only allowed after completed transaction
  if (tx.status !== 'returned') {
    return res.status(400).json({ message: 'Ratings are only allowed after transaction is completed.' });
  }

  // Check role of rater
  let rateeId = '';
  if (tx.borrowerId === req.user.id) {
    rateeId = tx.ownerId; // Borrower rating Owner
  } else if (tx.ownerId === req.user.id) {
    rateeId = tx.borrowerId; // Owner rating Borrower
  } else {
    return res.status(403).json({ message: 'You are not part of this transaction.' });
  }

  // Rule: Users cannot rate themselves (enforced implicitly by query above, but let's double check)
  if (rateeId === req.user.id) {
    return res.status(400).json({ message: 'You cannot rate yourself.' });
  }

  // Check if already rated by this user for this transaction
  const existingRating = db.ratings.findOne({ transactionId: tx.id, raterId: req.user.id });
  if (existingRating) {
    return res.status(400).json({ message: 'You have already submitted a rating for this transaction.' });
  }

  // Save Rating
  db.ratings.insertOne({
    transactionId: tx.id,
    raterId: req.user.id,
    rateeId,
    rating: parseInt(rating),
    review: review || ''
  });

  // Recompute Ratee's average ratings
  const rateeRatings = db.ratings.find({ rateeId });
  const avg = rateeRatings.reduce((sum, r) => sum + r.rating, 0) / rateeRatings.length;
  db.users.updateById(rateeId, { ratingAverage: parseFloat(avg.toFixed(1)) });

  res.status(201).json({ message: 'Rating submitted successfully.' });
});

// Dispute Transaction
router.post('/borrow/transactions/:id/dispute', authenticate, (req, res) => {
  const tx = db.transactions.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  if (tx.borrowerId !== req.user.id && tx.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'You are not authorized to dispute this transaction.' });
  }

  db.transactions.updateById(tx.id, { status: 'disputed' });

  // Log in reports automatically
  db.reports.insertOne({
    reporterId: req.user.id,
    reporterName: db.users.findById(req.user.id).name,
    targetId: tx.id,
    targetName: `Transaction #${tx.id}`,
    targetType: 'transaction',
    reason: `Dispute raised over item return or condition. Borrower: ${tx.borrowerId}, Owner: ${tx.ownerId}`,
    status: 'pending',
    actionTaken: ''
  });

  res.json({ message: 'Dispute submitted. Administrators have been notified to review this case.' });
});


// ==========================================
// 4. RESOURCE EXCHANGE SYSTEM
// ==========================================

// Propose Exchange Swap
router.post('/exchange/propose', authenticate, (req, res) => {
  const { ownerId, requesterResourceId, ownerResourceId, durationDays } = req.body;

  if (!ownerId || !requesterResourceId || !ownerResourceId || !durationDays) {
    return res.status(400).json({ message: 'All exchange details are required.' });
  }

  const reqItem = db.resources.findById(requesterResourceId);
  const ownItem = db.resources.findById(ownerResourceId);

  if (!reqItem || !ownItem) {
    return res.status(404).json({ message: 'Resources involved not found.' });
  }

  if (reqItem.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'You must own the resource you want to swap.' });
  }

  if (reqItem.availability !== 'available' || ownItem.availability !== 'available') {
    return res.status(400).json({ message: 'Both resources must be available to exchange.' });
  }

  const exchangeReq = db.exchangeRequests.insertOne({
    requesterId: req.user.id,
    requesterName: db.users.findById(req.user.id).name,
    ownerId,
    requesterResourceId,
    ownerResourceId,
    durationDays: parseInt(durationDays),
    status: 'pending'
  });

  // Notify Owner
  const requester = db.users.findById(req.user.id);
  db.notifications.insertOne({
    userId: ownerId,
    content: `${requester.name} proposed an exchange: "${reqItem.name}" ↔ "${ownItem.name}" for ${durationDays} days.`,
    type: 'exchange_proposed',
    relatedId: exchangeReq.id,
    isRead: false
  });

  res.status(201).json(exchangeReq);
});

// Fetch Exchange Requests (Sent / Received)
router.get('/exchange/requests', authenticate, (req, res) => {
  const userId = req.user.id;

  const sent = db.exchangeRequests.find({ requesterId: userId }).map(ex => {
    const ownItem = db.resources.findById(ex.ownerResourceId);
    const reqItem = db.resources.findById(ex.requesterResourceId);
    const owner = db.users.findById(ex.ownerId);
    return {
      ...ex,
      ownerResourceName: ownItem ? ownItem.name : 'Unknown',
      requesterResourceName: reqItem ? reqItem.name : 'Unknown',
      ownerName: owner ? owner.name : 'Unknown'
    };
  });

  const received = db.exchangeRequests.find({ ownerId: userId }).map(ex => {
    const ownItem = db.resources.findById(ex.ownerResourceId);
    const reqItem = db.resources.findById(ex.requesterResourceId);
    const requester = db.users.findById(ex.requesterId);
    return {
      ...ex,
      ownerResourceName: ownItem ? ownItem.name : 'Unknown',
      requesterResourceName: reqItem ? reqItem.name : 'Unknown',
      requesterName: requester ? requester.name : 'Unknown'
    };
  });

  res.json({ sent, received });
});

// Respond to Exchange Request
router.post('/exchange/requests/:id/respond', authenticate, (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid response status.' });
  }

  const exchangeReq = db.exchangeRequests.findById(req.params.id);
  if (!exchangeReq) return res.status(404).json({ message: 'Exchange request not found.' });

  if (exchangeReq.ownerId !== req.user.id) {
    return res.status(403).json({ message: 'Only the requested owner can respond.' });
  }

  if (exchangeReq.status !== 'pending') {
    return res.status(400).json({ message: 'Request has already been processed.' });
  }

  const reqItem = db.resources.findById(exchangeReq.requesterResourceId);
  const ownItem = db.resources.findById(exchangeReq.ownerResourceId);

  if (status === 'accepted') {
    if (!reqItem || !ownItem || reqItem.availability !== 'available' || ownItem.availability !== 'available') {
      return res.status(400).json({ message: 'One of the resources is no longer available.' });
    }

    db.exchangeRequests.updateById(exchangeReq.id, { status: 'accepted' });

    // Mark both items as borrowed
    db.resources.updateById(reqItem.id, { availability: 'borrowed' });
    db.resources.updateById(ownItem.id, { availability: 'borrowed' });

    // Create two active transactions
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + exchangeReq.durationDays);

    // Transaction A: Requester borrowing Owner's item
    db.transactions.insertOne({
      requestId: exchangeReq.id,
      resourceId: ownItem.id,
      borrowerId: exchangeReq.requesterId,
      ownerId: exchangeReq.ownerId,
      borrowDate: new Date().toISOString(),
      expectedReturnDate: returnDate.toISOString(),
      status: 'borrowed',
      qrToken: `qr_ex_req_${exchangeReq.id.substring(0,4)}`,
      returnConfirmationRequested: false
    });

    // Transaction B: Owner borrowing Requester's item
    db.transactions.insertOne({
      requestId: exchangeReq.id,
      resourceId: reqItem.id,
      borrowerId: exchangeReq.ownerId,
      ownerId: exchangeReq.requesterId,
      borrowDate: new Date().toISOString(),
      expectedReturnDate: returnDate.toISOString(),
      status: 'borrowed',
      qrToken: `qr_ex_own_${exchangeReq.id.substring(0,4)}`,
      returnConfirmationRequested: false
    });

    // Notify requester
    db.notifications.insertOne({
      userId: exchangeReq.requesterId,
      content: `Your proposed swap of "${reqItem.name}" for "${ownItem.name}" was ACCEPTED. Arrange meetups!`,
      type: 'exchange_approved',
      relatedId: exchangeReq.id,
      isRead: false
    });

  } else {
    db.exchangeRequests.updateById(exchangeReq.id, { status: 'rejected' });
    // Notify requester
    db.notifications.insertOne({
      userId: exchangeReq.requesterId,
      content: `Your proposed swap of "${reqItem.name}" for "${ownItem.name}" was declined.`,
      type: 'exchange_rejected',
      relatedId: exchangeReq.id,
      isRead: false
    });
  }

  res.json({ message: `Exchange swap successfully ${status}.` });
});


// ==========================================
// 5. CHAT ENGINE
// ==========================================

// Get conversation history with user
router.get('/chat/messages/:partnerId', authenticate, (req, res) => {
  const userId = req.user.id;
  const partnerId = req.params.partnerId;

  const messages = db.messages.find().filter(m =>
    (m.senderId === userId && m.receiverId === partnerId) ||
    (m.senderId === partnerId && m.receiverId === userId)
  );

  // Sort by timestamp
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json(messages);
});

// Get all active chats/contacts list for current user
router.get('/chat/contacts', authenticate, (req, res) => {
  const userId = req.user.id;
  const messages = db.messages.find().filter(m => m.senderId === userId || m.receiverId === userId);

  const contactIds = new Set();
  messages.forEach(m => {
    if (m.senderId !== userId) contactIds.add(m.senderId);
    if (m.receiverId !== userId) contactIds.add(m.receiverId);
  });

  const contacts = Array.from(contactIds).map(cid => {
    const contact = db.users.findById(cid);
    // Find last message
    const history = messages.filter(m => m.senderId === cid || m.receiverId === cid);
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastMsg = history[0];

    return {
      id: cid,
      name: contact ? contact.name : 'Unknown User',
      department: contact ? contact.department : '',
      trustScore: contact ? contact.trustScore : 75,
      lastMessage: lastMsg ? lastMsg.content : '',
      lastMessageTime: lastMsg ? lastMsg.timestamp : ''
    };
  });

  res.json(contacts);
});

// Post a Message
router.post('/chat/messages', authenticate, (req, res) => {
  const { receiverId, content, resourceId } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ message: 'Missing recipient or content.' });
  }

  const newMessage = db.messages.insertOne({
    senderId: req.user.id,
    receiverId,
    content,
    resourceId: resourceId || null,
    timestamp: new Date().toISOString()
  });

  // Notify recipient via Notification if they're offline (in-app alert fallback)
  const sender = db.users.findById(req.user.id);
  db.notifications.insertOne({
    userId: receiverId,
    content: `${sender.name} sent you a message: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
    type: 'message_received',
    relatedId: newMessage.id,
    isRead: false
  });

  res.status(201).json(newMessage);
});


// ==========================================
// 6. NOTIFICATIONS CENTER
// ==========================================

// Get My Notifications
router.get('/notifications', authenticate, (req, res) => {
  const list = db.notifications.find({ userId: req.user.id });
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Mark Read
router.put('/notifications/:id/read', authenticate, (req, res) => {
  const notif = db.notifications.findById(req.params.id);
  if (!notif) return res.status(404).json({ message: 'Notification not found.' });

  if (notif.userId !== req.user.id) {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  const updated = db.notifications.updateById(req.params.id, { isRead: true });
  res.json(updated);
});

// Mark All Read
router.post('/notifications/read-all', authenticate, (req, res) => {
  const notifs = db.notifications.find({ userId: req.user.id, isRead: false });
  notifs.forEach(n => {
    db.notifications.updateById(n.id, { isRead: true });
  });
  res.json({ message: 'All notifications marked as read.' });
});


// ==========================================
// 7. LOST & FOUND BULLETIN
// ==========================================

// List Bulletin Items
router.get('/lostfound', authenticate, (req, res) => {
  const posts = db.lostAndFound.find();
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// Add Lost or Found Item
router.post('/lostfound', authenticate, (req, res) => {
  const { title, description, image, date, type, generalLocation } = req.body;

  if (!title || !description || !date || !type || !generalLocation) {
    return res.status(400).json({ message: 'Missing required parameters.' });
  }

  const user = db.users.findById(req.user.id);
  const newPost = db.lostAndFound.insertOne({
    posterId: req.user.id,
    posterName: user.name,
    title,
    description,
    image: image || '',
    date,
    type, // 'lost' or 'found'
    generalLocation,
    status: 'open'
  });

  res.status(201).json(newPost);
});

// Mark resolved or delete
router.delete('/lostfound/:id', authenticate, (req, res) => {
  const post = db.lostAndFound.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });

  if (post.posterId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized.' });
  }

  db.lostAndFound.deleteById(req.params.id);
  res.json({ message: 'Bulletin post removed successfully.' });
});


// ==========================================
// 8. REPORT SYSTEM
// ==========================================

// File a Report
router.post('/reports', authenticate, (req, res) => {
  const { targetId, targetType, reason } = req.body;

  if (!targetId || !targetType || !reason) {
    return res.status(400).json({ message: 'All fields are required to submit a report.' });
  }

  let targetName = 'Unknown';
  if (targetType === 'resource') {
    const r = db.resources.findById(targetId);
    if (r) targetName = r.name;
  } else if (targetType === 'user') {
    const u = db.users.findById(targetId);
    if (u) targetName = u.name;
  } else if (targetType === 'transaction') {
    targetName = `Transaction #${targetId}`;
  }

  const newReport = db.reports.insertOne({
    reporterId: req.user.id,
    reporterName: db.users.findById(req.user.id).name,
    targetId,
    targetName,
    targetType, // 'user' | 'resource' | 'transaction'
    reason,
    status: 'pending',
    actionTaken: ''
  });

  res.status(201).json(newReport);
});


// ==========================================
// 9. ADMIN SYSTEM (PROTECTED)
// ==========================================

// Get Stats
router.get('/admin/stats', authenticate, authorizeAdmin, (req, res) => {
  const totalStudents = db.users.count({ role: 'student' });
  const totalResources = db.resources.count();
  const activeBorrowings = db.transactions.count({ status: 'borrowed' });
  const successfulReturns = db.transactions.count({ status: 'returned' });
  const overdueResources = db.transactions.count({ status: 'overdue' });
  const pendingReports = db.reports.count({ status: 'pending' });

  res.json({
    totalStudents,
    totalResources,
    activeBorrowings,
    successfulReturns,
    overdueResources,
    pendingReports
  });
});

// Get Users List (with details)
router.get('/admin/users', authenticate, authorizeAdmin, (req, res) => {
  const users = db.users.find().map(u => {
    const { passwordHash: _, ...userWithoutHash } = u;
    // append active borrow counts
    const activeBorrows = db.transactions.count({ borrowerId: u.id, status: 'borrowed' });
    const overdueBorrows = db.transactions.count({ borrowerId: u.id, status: 'overdue' });
    return {
      ...userWithoutHash,
      activeBorrows,
      overdueBorrows
    };
  });
  res.json(users);
});

// Block/Unblock User
router.post('/admin/users/:id/toggle-block', authenticate, authorizeAdmin, (req, res) => {
  const user = db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Cannot block administrative accounts.' });
  }

  const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
  db.users.updateById(user.id, { status: nextStatus });

  res.json({ message: `User account is now ${nextStatus}.`, status: nextStatus });
});

// Admin Review Reports
router.get('/admin/reports', authenticate, authorizeAdmin, (req, res) => {
  const list = db.reports.find();
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// Resolve Report
router.post('/admin/reports/:id/resolve', authenticate, authorizeAdmin, (req, res) => {
  const { actionTaken } = req.body;
  const rep = db.reports.findById(req.params.id);
  if (!rep) return res.status(404).json({ message: 'Report not found.' });

  db.reports.updateById(rep.id, {
    status: 'resolved',
    actionTaken: actionTaken || 'Reviewed and dismissed.'
  });

  res.json({ message: 'Report successfully marked as resolved.' });
});

// Get Overdue Resources
router.get('/admin/overdue', authenticate, authorizeAdmin, (req, res) => {
  const overdueList = db.transactions.find({ status: 'overdue' }).map(tx => {
    const resource = db.resources.findById(tx.resourceId);
    const borrower = db.users.findById(tx.borrowerId);
    const owner = db.users.findById(tx.ownerId);

    const now = new Date();
    const dueDate = new Date(tx.expectedReturnDate);
    const overdueTime = Math.abs(now - dueDate);
    const overdueDays = Math.ceil(overdueTime / (1000 * 60 * 60 * 24));

    return {
      id: tx.id,
      resourceName: resource ? resource.name : 'Unknown Resource',
      borrowerName: borrower ? borrower.name : 'Unknown Borrower',
      borrowerEmail: borrower ? borrower.email : '',
      ownerName: owner ? owner.name : 'Unknown Owner',
      dueDate: tx.expectedReturnDate,
      overdueDays
    };
  });
  res.json(overdueList);
});

// Admin Sends Warning Alert
router.post('/admin/transactions/:id/warn', authenticate, authorizeAdmin, (req, res) => {
  const tx = db.transactions.findById(req.params.id);
  if (!tx) return res.status(404).json({ message: 'Transaction not found.' });

  const resource = db.resources.findById(tx.resourceId);

  // Send warnings to Borrower
  db.notifications.insertOne({
    userId: tx.borrowerId,
    content: `ADMIN WARNING: You have an overdue item: "${resource ? resource.name : 'Physical Resource'}". Return it immediately to avoid permanent suspensions.`,
    type: 'overdue_warning',
    relatedId: tx.id,
    isRead: false
  });

  res.json({ message: 'Warning alert sent successfully to borrower.' });
});

module.exports = router;
