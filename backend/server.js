const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const socketIo = require('socket.io');
const apiRoutes = require('./routes/api');
const db = require('./models/db');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup static directories for uploads and placeholders
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');
const fs = require('fs');

[uploadsDir, publicDir, path.join(publicDir, 'images'), path.join(publicDir, 'files')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

// Attach API Routes
app.use('/api', apiRoutes);

// Simple Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`User registered online: ${userId} (${socket.id})`);
    }
  });

  socket.on('send_message', (msg) => {
    // msg: { senderId, receiverId, content, resourceId }
    console.log('Received message packet:', msg);
    const saved = db.messages.insertOne({
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      resourceId: msg.resourceId || null,
      timestamp: new Date().toISOString()
    });

    // Send to recipient if online
    const receiverSocketId = onlineUsers.get(msg.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', saved);
    }

    // Send copy back to sender to confirm
    socket.emit('message_sent', saved);

    // Generate notification for recipient
    const sender = db.users.findById(msg.senderId);
    const notif = db.notifications.insertOne({
      userId: msg.receiverId,
      content: `${sender ? sender.name : 'Someone'} sent you a message: "${msg.content.substring(0, 30)}..."`,
      type: 'message_received',
      relatedId: saved.id,
      isRead: false
    });

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('notification', notif);
    }
  });

  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        console.log(`User went offline: ${uid}`);
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// ==========================================
// BACKGROUND AUTOMATED SYSTEM (RETURN PROTECTION & REMINDERS)
// ==========================================
function runBackgroundChecks() {
  console.log('Running background checks on active borrowings...');
  const now = new Date();
  const transactions = db.transactions.find();

  transactions.forEach(tx => {
    if (tx.status === 'returned' || tx.status === 'rejected') return;

    const dueDate = new Date(tx.expectedReturnDate);
    const resource = db.resources.findById(tx.resourceId);
    if (!resource) return;

    // Calculate time difference in days
    const timeDiff = dueDate - now;
    const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    // 1. OVERDUE HANDLER (Time is in the past, status is not returned)
    if (now > dueDate && tx.status !== 'overdue') {
      console.log(`Transaction ${tx.id} for "${resource.name}" is now OVERDUE! Updating status...`);

      // Update transaction status
      db.transactions.updateById(tx.id, { status: 'overdue' });

      // Deduct trust score for borrower initially when it becomes overdue
      const borrower = db.users.findById(tx.borrowerId);
      if (borrower) {
        const penalty = 15; // Deduct 15 points immediately
        const newScore = Math.max(0, (borrower.trustScore || 75) - penalty);
        db.users.updateById(borrower.id, { trustScore: newScore });

        // Add overdue notification
        const notif = db.notifications.insertOne({
          userId: tx.borrowerId,
          content: `URGENT: Your borrowed item "${resource.name}" is overdue. Your trust score decreased by ${penalty} points.`,
          type: 'overdue',
          relatedId: tx.id,
          isRead: false
        });

        // Notify user if online
        const socketId = onlineUsers.get(tx.borrowerId);
        if (socketId) {
          io.to(socketId).emit('notification', notif);
        }
      }

      // Notify owner as well
      const ownerNotif = db.notifications.insertOne({
        userId: tx.ownerId,
        content: `Your resource "${resource.name}" lent to ${borrower ? borrower.name : 'a student'} is now overdue.`,
        type: 'overdue',
        relatedId: tx.id,
        isRead: false
      });
      const ownerSocketId = onlineUsers.get(tx.ownerId);
      if (ownerSocketId) {
        io.to(ownerSocketId).emit('notification', ownerNotif);
      }
    }

    // 2. DUE REMINDERS
    // Send notifications: 3 days before, 1 day before, and on the day
    if (tx.status === 'borrowed') {
      let reminderMsg = null;
      let reminderType = 'due_soon';

      if (diffDays === 3) {
        reminderMsg = `Reminder: Your borrowed item "${resource.name}" is due in 3 days.`;
      } else if (diffDays === 1) {
        reminderMsg = `Reminder: Your borrowed item "${resource.name}" is due tomorrow!`;
      } else if (diffDays === 0) {
        reminderMsg = `Reminder: Your borrowed item "${resource.name}" is due TODAY. Please request return confirmation once handed over.`;
        reminderType = 'due_today';
      }

      if (reminderMsg) {
        // Prevent duplicate reminders on the same day (check if we sent one recently)
        const recentNotifs = db.notifications.find({ userId: tx.borrowerId, type: reminderType, relatedId: tx.id });
        if (recentNotifs.length === 0) {
          const reminderNotif = db.notifications.insertOne({
            userId: tx.borrowerId,
            content: reminderMsg,
            type: reminderType,
            relatedId: tx.id,
            isRead: false
          });

          // Notify online
          const borrowerSocket = onlineUsers.get(tx.borrowerId);
          if (borrowerSocket) {
            io.to(borrowerSocket).emit('notification', reminderNotif);
          }
        }
      }
    }
  });
}

// Run checks once on boot, then every 5 minutes (for demo purposes - standard is daily)
setTimeout(() => {
  runBackgroundChecks();
}, 2000);

setInterval(runBackgroundChecks, 5 * 60 * 1000);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CampusShare backend server running on port ${PORT}`);
});
