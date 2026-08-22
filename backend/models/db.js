const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get filepath for a collection
const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

// Generic database loader and saver
const readCollection = (collection) => {
  const file = getFilePath(collection);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
};

const writeCollection = (collection, data) => {
  const file = getFilePath(collection);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
    return false;
  }
};

// Database interface class
class Collection {
  constructor(name) {
    this.name = name;
  }

  find(query = {}) {
    const data = readCollection(this.name);
    return data.filter(item => {
      for (const key in query) {
        if (query[key] !== item[key]) return false;
      }
      return true;
    });
  }

  findOne(query = {}) {
    const data = readCollection(this.name);
    return data.find(item => {
      for (const key in query) {
        if (query[key] !== item[key]) return false;
      }
      return true;
    });
  }

  findById(id) {
    return this.findOne({ id });
  }

  insertOne(doc) {
    const data = readCollection(this.name);
    const newDoc = {
      id: doc.id || Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    data.push(newDoc);
    writeCollection(this.name, data);
    return newDoc;
  }

  updateOne(query = {}, updates = {}) {
    const data = readCollection(this.name);
    let updatedDoc = null;
    const newData = data.map(item => {
      let matches = true;
      for (const key in query) {
        if (query[key] !== item[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedDoc = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        return updatedDoc;
      }
      return item;
    });

    if (updatedDoc) {
      writeCollection(this.name, newData);
    }
    return updatedDoc;
  }

  updateById(id, updates = {}) {
    return this.updateOne({ id }, updates);
  }

  deleteOne(query = {}) {
    const data = readCollection(this.name);
    const initialLength = data.length;
    const newData = data.filter(item => {
      let matches = true;
      for (const key in query) {
        if (query[key] !== item[key]) {
          matches = false;
          break;
        }
      }
      return !matches;
    });

    if (newData.length < initialLength) {
      writeCollection(this.name, newData);
      return true;
    }
    return false;
  }

  deleteById(id) {
    return this.deleteOne({ id });
  }

  count(query = {}) {
    return this.find(query).length;
  }

  clear() {
    writeCollection(this.name, []);
    return true;
  }
}

// Instantiate collections
const db = {
  users: new Collection('users'),
  resources: new Collection('resources'),
  borrowRequests: new Collection('borrowRequests'),
  transactions: new Collection('transactions'),
  exchangeRequests: new Collection('exchangeRequests'),
  messages: new Collection('messages'),
  notifications: new Collection('notifications'),
  ratings: new Collection('ratings'),
  reports: new Collection('reports'),
  lostAndFound: new Collection('lostAndFound')
};

module.exports = db;
