const bcrypt = require('bcryptjs');
const db = require('./models/db');

async function seed() {
  console.log('Seeding database with CampusShare demo data...');

  // 1. Clear database collections
  Object.values(db).forEach(coll => coll.clear());

  // 2. Hash passwords
  const salt = bcrypt.genSaltSync(10);
  const userPasswordHash = bcrypt.hashSync('password123', salt);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);

  // 3. Create 10 Students and 1 Admin
  const departments = ['Computer Science', 'Electronics & Comm', 'Mechanical Eng', 'Civil Eng', 'Electrical Eng'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const studentsData = [
    { name: 'Aarav Mehta', email: 'aarav@campushare.edu', rollNumber: 'CS23B1001', department: 'Computer Science', year: '3rd Year', semester: '5th Sem', trustScore: 85, ratingAverage: 4.8 },
    { name: 'Ananya Sharma', email: 'ananya@campushare.edu', rollNumber: 'EC23B1002', department: 'Electronics & Comm', year: '3rd Year', semester: '5th Sem', trustScore: 92, ratingAverage: 4.9 },
    { name: 'Vikram Singh', email: 'vikram@campushare.edu', rollNumber: 'ME22B1003', department: 'Mechanical Eng', year: '4th Year', semester: '7th Sem', trustScore: 65, ratingAverage: 3.5 }, // low score
    { name: 'Diya Patel', email: 'diya@campushare.edu', rollNumber: 'CS24B1004', department: 'Computer Science', year: '2nd Year', semester: '3rd Sem', trustScore: 80, ratingAverage: 4.2 },
    { name: 'Kabir Verma', email: 'kabir@campushare.edu', rollNumber: 'EE23B1005', department: 'Electrical Eng', year: '3rd Year', semester: '5th Sem', trustScore: 78, ratingAverage: 4.0 },
    { name: 'Neha Reddy', email: 'neha@campushare.edu', rollNumber: 'CV22B1006', department: 'Civil Eng', year: '4th Year', semester: '7th Sem', trustScore: 95, ratingAverage: 5.0 },
    { name: 'Rohan Gupta', email: 'rohan@campushare.edu', rollNumber: 'CS25B1007', department: 'Computer Science', year: '1st Year', semester: '1st Sem', trustScore: 75, ratingAverage: 0.0 }, // New student
    { name: 'Isha Nair', email: 'isha@campushare.edu', rollNumber: 'EC24B1008', department: 'Electronics & Comm', year: '2nd Year', semester: '3rd Sem', trustScore: 88, ratingAverage: 4.5 },
    { name: 'Siddharth Sen', email: 'siddharth@campushare.edu', rollNumber: 'ME23B1009', department: 'Mechanical Eng', year: '3rd Year', semester: '5th Sem', trustScore: 45, ratingAverage: 3.0 }, // Low trust score (overdue candidate)
    { name: 'Meera Joshi', email: 'meera@campushare.edu', rollNumber: 'EE24B1010', department: 'Electrical Eng', year: '2nd Year', semester: '3rd Sem', trustScore: 82, ratingAverage: 4.3 }
  ];

  const students = [];
  studentsData.forEach((s, index) => {
    const student = db.users.insertOne({
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber,
      department: s.department,
      year: s.year,
      semester: s.semester,
      passwordHash: userPasswordHash,
      role: 'student',
      trustScore: s.trustScore,
      ratingAverage: s.ratingAverage,
      status: 'active'
    });
    students.push(student);
  });

  // Insert Admin
  const admin = db.users.insertOne({
    name: 'CampusShare Admin',
    email: 'admin@campushare.edu',
    rollNumber: 'ADMIN001',
    department: 'Administration',
    year: 'N/A',
    semester: 'N/A',
    passwordHash: adminPasswordHash,
    role: 'admin',
    trustScore: 100,
    ratingAverage: 5.0,
    status: 'active'
  });

  console.log(`Seeded ${students.length} students and 1 admin.`);

  // 4. Create 20 Physical Resources
  // Owner mappings: let's spread them out
  const physicalResourcesData = [
    { name: 'Arduino Uno R3', category: 'Electronics & IoT', condition: 'Good', lendingDuration: 7, location: 'CS Lab 2', type: 'Physical Item', ownerIdx: 0, availability: 'available' },
    { name: 'ESP32 Development Board', category: 'Electronics & IoT', condition: 'New', lendingDuration: 10, location: 'ECE Department Room 12', type: 'Physical Item', ownerIdx: 1, availability: 'borrowed' }, // Borrowed (Overdue)
    { name: 'Casio fx-991EX Scientific Calculator', category: 'Student Equipment', condition: 'Good', lendingDuration: 5, location: 'Library Lobby', type: 'Physical Item', ownerIdx: 3, availability: 'available' },
    { name: 'Mini Digital Multimeter', category: 'Tools', condition: 'Good', lendingDuration: 3, location: 'Electrical Lab 1', type: 'Physical Item', ownerIdx: 4, availability: 'available' },
    { name: 'Raspberry Pi 4 Model B (4GB)', category: 'Electronics & IoT', condition: 'Good', lendingDuration: 14, location: 'CS Lab 3', type: 'Physical Item', ownerIdx: 5, availability: 'borrowed' }, // Borrowed (Overdue)
    { name: 'GATE CSE Handbook 2025 (Made Easy)', category: 'Books', condition: 'Good', lendingDuration: 30, location: 'Hostel A Room 302', type: 'Physical Item', ownerIdx: 2, availability: 'available' },
    { name: 'Breadboard and 65pcs Jumper Wires', category: 'Electronics & IoT', condition: 'Used', lendingDuration: 15, location: 'ECE Lab', type: 'Physical Item', ownerIdx: 7, availability: 'available' },
    { name: 'Engineering Drawing Drafter', category: 'Student Equipment', condition: 'Used', lendingDuration: 21, location: 'Drawing Hall B', type: 'Physical Item', ownerIdx: 9, availability: 'available' },
    { name: 'HC-SR04 Ultrasonic Sensors (x3)', category: 'Electronics & IoT', condition: 'New', lendingDuration: 5, location: 'Hostel B Room 105', type: 'Physical Item', ownerIdx: 0, availability: 'available' },
    { name: 'Soldering Iron Kit (60W)', category: 'Tools', condition: 'Good', lendingDuration: 3, location: 'Mechanical Workshop', type: 'Physical Item', ownerIdx: 2, availability: 'borrowed' }, // Borrowed (Normal)
    { name: 'White Lab Coat (Size L)', category: 'Student Equipment', condition: 'Good', lendingDuration: 2, location: 'Chemistry Lab Entrance', type: 'Physical Item', ownerIdx: 5, availability: 'available' },
    { name: 'DHT11 Temperature & Humidity Sensor', category: 'Electronics & IoT', condition: 'New', lendingDuration: 5, location: 'CS Lab 2', type: 'Physical Item', ownerIdx: 0, availability: 'available' },
    { name: 'Digital Oscilloscope Probe (100MHz)', category: 'Tools', condition: 'Good', lendingDuration: 7, location: 'ECE Lab 4', type: 'Physical Item', ownerIdx: 1, availability: 'available' },
    { name: 'ESP8266 NodeMCU Board', category: 'Electronics & IoT', condition: 'Used', lendingDuration: 10, location: 'Hostel A Room 211', type: 'Physical Item', ownerIdx: 4, availability: 'available' },
    { name: 'Engineering Thermodynamics by PK Nag', category: 'Books', condition: 'Used', lendingDuration: 14, location: 'Library Cafe', type: 'Physical Item', ownerIdx: 8, availability: 'borrowed' }, // Borrowed (Overdue)
    { name: 'Set of Drawing Instruments', category: 'Student Equipment', condition: 'Good', lendingDuration: 7, location: 'Hostel C Room 104', type: 'Physical Item', ownerIdx: 9, availability: 'available' },
    { name: 'Micro SD Card 32GB', category: 'Electronics & IoT', condition: 'New', lendingDuration: 10, location: 'Hostel A Room 405', type: 'Physical Item', ownerIdx: 3, availability: 'available' },
    { name: 'Standard Breadboard Power Supply Module', category: 'Electronics & IoT', condition: 'Good', lendingDuration: 5, location: 'ECE Lab', type: 'Physical Item', ownerIdx: 7, availability: 'available' },
    { name: 'Higher Engineering Mathematics by BS Grewal', category: 'Books', condition: 'Good', lendingDuration: 20, location: 'Hostel B Room 220', type: 'Physical Item', ownerIdx: 6, availability: 'available' },
    { name: 'Intel Galileo Gen 2 Board', category: 'Electronics & IoT', condition: 'Fair', lendingDuration: 14, location: 'CS Lab 2', type: 'Physical Item', ownerIdx: 1, availability: 'available' }
  ];

  const physicalResources = [];
  physicalResourcesData.forEach((res) => {
    const owner = students[res.ownerIdx];
    const inserted = db.resources.insertOne({
      ownerId: owner.id,
      ownerName: owner.name,
      name: res.name,
      category: res.category,
      description: `Premium high-quality ${res.name} available for college students. Pick up from ${res.location}.`,
      type: 'Physical Item',
      condition: res.condition,
      availability: res.availability,
      lendingDuration: res.lendingDuration,
      location: res.location,
      images: [`/images/mock_${res.category.toLowerCase().replace(/[^a-z]/g, '_')}.png`],
      ratingAverage: parseFloat((3.5 + Math.random() * 1.5).toFixed(1))
    });
    physicalResources.push(inserted);
  });

  console.log(`Seeded ${physicalResources.length} physical resources.`);

  // 5. Create 15 Digital Study Resources
  const digitalResourcesData = [
    { name: 'Computer Networks Lecture Notes (Unit 1-5)', category: 'Study Materials', subCategory: 'Notes', ownerIdx: 0 },
    { name: 'Microprocessor & Microcontroller Lab Manual', category: 'Study Materials', subCategory: 'Lab Manuals', ownerIdx: 1 },
    { name: 'Digital Signal Processing PPT Slides', category: 'Study Materials', subCategory: 'PPTs', ownerIdx: 1 },
    { name: 'GATE CSE 2024 Solved Answer Key & Explanations', category: 'Study Materials', subCategory: 'Previous Year Papers', ownerIdx: 3 },
    { name: 'Database Management Systems Assignment 2 (SQL)', category: 'Study Materials', subCategory: 'Assignments', ownerIdx: 0 },
    { name: 'Data Structures Lab Notes (C++)', category: 'Study Materials', subCategory: 'Notes', ownerIdx: 7 },
    { name: 'Theory of Computation Mock Exams', category: 'Study Materials', subCategory: 'Assignments', ownerIdx: 4 },
    { name: 'Compiler Design PPT Overview', category: 'Study Materials', subCategory: 'PPTs', ownerIdx: 5 },
    { name: 'Physics I Lab Manual (Optics & Laser)', category: 'Study Materials', subCategory: 'Lab Manuals', ownerIdx: 9 },
    { name: 'GATE ECE 2023 Solved Paper', category: 'Study Materials', subCategory: 'Previous Year Papers', ownerIdx: 7 },
    { name: 'Web Technology Project Report & Code Structure', category: 'Study Materials', subCategory: 'Notes', ownerIdx: 3 },
    { name: 'Operating Systems Semestral Assignments', category: 'Study Materials', subCategory: 'Assignments', ownerIdx: 0 },
    { name: 'Power Systems Lab Instruction Manual', category: 'Study Materials', subCategory: 'Lab Manuals', ownerIdx: 9 },
    { name: 'Environmental Science PPT presentation', category: 'Study Materials', subCategory: 'PPTs', ownerIdx: 6 },
    { name: 'Control Systems Handwritten Revision Notes', category: 'Study Materials', subCategory: 'Notes', ownerIdx: 9 }
  ];

  const digitalResources = [];
  digitalResourcesData.forEach((res) => {
    const owner = students[res.ownerIdx];
    const inserted = db.resources.insertOne({
      ownerId: owner.id,
      ownerName: owner.name,
      name: res.name,
      category: res.category,
      subCategory: res.subCategory,
      description: `Complete ${res.subCategory} covering course curriculum. Approved by subject instructors.`,
      type: 'Digital Resource',
      condition: 'New',
      availability: 'available',
      lendingDuration: 0,
      location: 'Online Download',
      images: [`/images/mock_digital.png`],
      fileUrl: `/files/mock_${res.name.toLowerCase().replace(/[^a-z]/g, '_')}.pdf`,
      ratingAverage: parseFloat((4.0 + Math.random() * 1.0).toFixed(1))
    });
    digitalResources.push(inserted);
  });

  console.log(`Seeded ${digitalResources.length} digital study resources.`);

  // 6. Seed Borrowing Transactions & Requests (10 total, 3 overdue)
  const now = new Date();

  // Helper function to create ISO strings offset by days
  const getOffsetDate = (days) => {
    const d = new Date();
    d.setDate(now.getDate() + days);
    return d.toISOString();
  };

  // Transaction 1: OVERDUE 5 DAYS. Owner: Student 1 (Ananya), Borrower: Student 8 (Siddharth - low trust user)
  // Resource: ESP32 Dev Board (ID matches physicalResources[1])
  const esp32 = physicalResources[1];
  const t1Request = db.borrowRequests.insertOne({
    resourceId: esp32.id,
    requesterId: students[8].id,
    borrowDate: getOffsetDate(-15),
    returnDate: getOffsetDate(-5),
    purpose: 'Developing an IoT based weather monitoring project for smart cities.',
    agreementAccepted: true,
    status: 'approved'
  });
  db.transactions.insertOne({
    requestId: t1Request.id,
    resourceId: esp32.id,
    borrowerId: students[8].id,
    ownerId: students[1].id,
    borrowDate: getOffsetDate(-15),
    expectedReturnDate: getOffsetDate(-5),
    status: 'overdue',
    qrToken: `qr_tx_${Math.random().toString(36).substring(4, 9)}`
  });

  // Transaction 2: OVERDUE 10 DAYS. Owner: Student 5 (Neha), Borrower: Student 2 (Vikram - low trust user)
  // Resource: Raspberry Pi 4 (physicalResources[4])
  const pi = physicalResources[4];
  const t2Request = db.borrowRequests.insertOne({
    resourceId: pi.id,
    requesterId: students[2].id,
    borrowDate: getOffsetDate(-24),
    returnDate: getOffsetDate(-10),
    purpose: 'Mini project on face recognition attendance system.',
    agreementAccepted: true,
    status: 'approved'
  });
  db.transactions.insertOne({
    requestId: t2Request.id,
    resourceId: pi.id,
    borrowerId: students[2].id,
    ownerId: students[5].id,
    borrowDate: getOffsetDate(-24),
    expectedReturnDate: getOffsetDate(-10),
    status: 'overdue',
    qrToken: `qr_tx_${Math.random().toString(36).substring(4, 9)}`
  });

  // Transaction 3: OVERDUE 3 DAYS. Owner: Student 8 (Siddharth), Borrower: Student 2 (Vikram)
  // Resource: Engineering Thermodynamics PK Nag (physicalResources[14])
  const bookPk = physicalResources[14];
  const t3Request = db.borrowRequests.insertOne({
    resourceId: bookPk.id,
    requesterId: students[2].id,
    borrowDate: getOffsetDate(-17),
    returnDate: getOffsetDate(-3),
    purpose: 'Preparing for mechanical mid-sem exams.',
    agreementAccepted: true,
    status: 'approved'
  });
  db.transactions.insertOne({
    requestId: t3Request.id,
    resourceId: bookPk.id,
    borrowerId: students[2].id,
    ownerId: students[8].id,
    borrowDate: getOffsetDate(-17),
    expectedReturnDate: getOffsetDate(-3),
    status: 'overdue',
    qrToken: `qr_tx_${Math.random().toString(36).substring(4, 9)}`
  });

  // Transaction 4: BORROWED (NORMAL - DUE IN 2 DAYS). Owner: Student 2 (Vikram), Borrower: Student 0 (Aarav)
  // Resource: Soldering Iron Kit (physicalResources[9])
  const solder = physicalResources[9];
  const t4Request = db.borrowRequests.insertOne({
    resourceId: solder.id,
    requesterId: students[0].id,
    borrowDate: getOffsetDate(-1),
    returnDate: getOffsetDate(2),
    purpose: 'Need to solder jumper pins onto ESP8266.',
    agreementAccepted: true,
    status: 'approved'
  });
  db.transactions.insertOne({
    requestId: t4Request.id,
    resourceId: solder.id,
    borrowerId: students[0].id,
    ownerId: students[2].id,
    borrowDate: getOffsetDate(-1),
    expectedReturnDate: getOffsetDate(2),
    status: 'borrowed',
    qrToken: `qr_tx_${Math.random().toString(36).substring(4, 9)}`
  });

  // Transaction 5: COMPLETED (RETURNED ON TIME). Owner: Student 3 (Diya), Borrower: Student 1 (Ananya)
  // Resource: Casio fx-991EX (physicalResources[2]) - previously borrowed and completed
  const calReq = db.borrowRequests.insertOne({
    resourceId: physicalResources[2].id,
    requesterId: students[1].id,
    borrowDate: getOffsetDate(-8),
    returnDate: getOffsetDate(-4),
    purpose: 'Exams prep.',
    agreementAccepted: true,
    status: 'returned'
  });
  const t5Completed = db.transactions.insertOne({
    requestId: calReq.id,
    resourceId: physicalResources[2].id,
    borrowerId: students[1].id,
    ownerId: students[3].id,
    borrowDate: getOffsetDate(-8),
    expectedReturnDate: getOffsetDate(-4),
    actualReturnDate: getOffsetDate(-4),
    status: 'returned',
    qrToken: `qr_tx_${Math.random().toString(36).substring(4, 9)}`
  });

  // Create active pending borrow request: Student 4 (Kabir) requests Student 0's Arduino (physicalResources[0])
  db.borrowRequests.insertOne({
    resourceId: physicalResources[0].id,
    requesterId: students[4].id,
    borrowDate: getOffsetDate(1),
    returnDate: getOffsetDate(8),
    purpose: 'Embedded systems lab project.',
    agreementAccepted: true,
    status: 'requested'
  });

  // Create active pending borrow request: Student 6 (Rohan) requests Student 3's Calculator (physicalResources[2])
  db.borrowRequests.insertOne({
    resourceId: physicalResources[2].id,
    requesterId: students[6].id,
    borrowDate: getOffsetDate(2),
    returnDate: getOffsetDate(7),
    purpose: 'Probability and Statistics Mid-sem test.',
    agreementAccepted: true,
    status: 'requested'
  });

  console.log('Seeded borrow requests and transactions.');

  // 7. Seed Ratings
  // Rater: Ananya (1), Ratee: Diya (3) for the completed calculator transaction
  db.ratings.insertOne({
    transactionId: t5Completed.id,
    raterId: students[1].id,
    rateeId: students[3].id,
    rating: 5,
    review: 'Awesome owner! Fast handover and calculator was in prestine condition. Thank you!'
  });
  // Rater: Diya (3), Ratee: Ananya (1)
  db.ratings.insertOne({
    transactionId: t5Completed.id,
    raterId: students[3].id,
    rateeId: students[1].id,
    rating: 5,
    review: 'Returned on time and was very polite. Highly recommended!'
  });

  console.log('Seeded transactions ratings.');

  // 8. Seed Notifications (5 notifications)
  // For Aarav (0)
  db.notifications.insertOne({
    userId: students[0].id,
    content: `${students[4].name} requested to borrow your Arduino Uno R3.`,
    type: 'request_received',
    relatedId: physicalResources[0].id,
    isRead: false
  });
  // For Kabir (4)
  db.notifications.insertOne({
    userId: students[4].id,
    content: 'Welcome to CampusShare! Complete your profile to get started.',
    type: 'welcome',
    relatedId: '',
    isRead: true
  });
  // For Siddharth (8)
  db.notifications.insertOne({
    userId: students[8].id,
    content: 'Your borrowed ESP32 Development Board is 5 days OVERDUE. Return immediately to avoid trust score drop!',
    type: 'overdue',
    relatedId: t1Request.id,
    isRead: false
  });
  // For Ananya (1)
  db.notifications.insertOne({
    userId: students[1].id,
    content: `Diya Patel approved your request for Casio fx-991EX Scientific Calculator.`,
    type: 'request_approved',
    relatedId: calReq.id,
    isRead: true
  });
  // For Vikram (2)
  db.notifications.insertOne({
    userId: students[2].id,
    content: 'Your borrowed Raspberry Pi 4 is 10 days OVERDUE. Your account is restricted.',
    type: 'overdue',
    relatedId: t2Request.id,
    isRead: false
  });

  console.log('Seeded notifications.');

  // 9. Seed Lost & Found
  db.lostAndFound.insertOne({
    posterId: students[0].id,
    posterName: students[0].name,
    title: 'Found Black Leather Keyholder',
    description: 'Found near the Library entrance steps around 4 PM. Has 3 keys and a small blue tag.',
    image: '',
    date: getOffsetDate(-2).split('T')[0],
    type: 'found',
    generalLocation: 'Library Entrance steps',
    status: 'open'
  });

  db.lostAndFound.insertOne({
    posterId: students[5].id,
    posterName: students[5].name,
    title: 'Lost Parker Fountain Pen',
    description: 'Lost my silver-plated Parker fountain pen. Probably left it in CS Seminar Hall during morning class.',
    image: '',
    date: getOffsetDate(-1).split('T')[0],
    type: 'lost',
    generalLocation: 'CS Seminar Hall',
    status: 'open'
  });

  console.log('Seeded Lost & Found bulletin items.');

  // 10. Seed Exchange Requests
  // Rohan (6) wants to swap ESP8266 (owner Kabir 4) with Arduino
  db.exchangeRequests.insertOne({
    requesterId: students[6].id,
    requesterName: students[6].name,
    ownerId: students[4].id,
    requesterResourceId: physicalResources[0].id, // Mocking swap item
    ownerResourceId: physicalResources[13].id, // ESP8266 NodeMCU
    durationDays: 7,
    status: 'pending'
  });

  // 11. Seed Reports (For admin validation)
  db.reports.insertOne({
    reporterId: students[1].id,
    reporterName: students[1].name,
    targetId: physicalResources[19].id, // Intel Galileo
    targetName: physicalResources[19].name,
    targetType: 'resource',
    reason: 'Listing displays functional product images but owner mentioned it has broken power circuits.',
    status: 'pending',
    actionTaken: ''
  });

  db.reports.insertOne({
    reporterId: students[5].id,
    reporterName: students[5].name,
    targetId: students[2].id, // Vikram (who is late returning Pi)
    targetName: students[2].name,
    targetType: 'user',
    reason: 'Vikram has been keeping my Raspberry Pi for over 10 days post due date, ignoring messages.',
    status: 'pending',
    actionTaken: ''
  });

  // 12. Seed Messages (Initial Chat between Aarav & Kabir)
  db.messages.insertOne({
    senderId: students[4].id,
    receiverId: students[0].id,
    content: 'Hi Aarav, is your Arduino Uno available tomorrow? I need it for a quick test.',
    timestamp: getOffsetDate(-1)
  });
  db.messages.insertOne({
    senderId: students[0].id,
    receiverId: students[4].id,
    content: 'Hi Kabir! Yes, it is available. I just placed a request on the dashboard. Propose a meeting point!',
    timestamp: getOffsetDate(-1)
  });
  db.messages.insertOne({
    senderId: students[4].id,
    receiverId: students[0].id,
    content: 'Awesome, will meet you near CS Lab 2 tomorrow morning at 10 AM. Sending a request now.',
    timestamp: getOffsetDate(-1)
  });

  console.log('Seeded Messages.');

  console.log('Database successfully seeded with demo data!');
}

if (require.main === module) {
  seed();
}

module.exports = seed;
