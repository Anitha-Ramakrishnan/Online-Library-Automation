const { LowSync, JSONFileSync } = require('lowdb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'library.json');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new JSONFileSync(dbPath);
const db = new LowSync(adapter);
db.read();
db.data = db.data || { users: [], books: [], orders: [], order_items: [] };

if (db.data.users.length === 0) {
  const hashed = bcrypt.hashSync('password1', 10);
  db.data.users.push({ id: 1, username: 'user1', password: hashed, email: 'user1@example.com' });
}

if (db.data.books.length === 0) {
  db.data.books.push({ id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', price: 9.99 });
  db.data.books.push({ id: 2, title: '1984', author: 'George Orwell', price: 8.5 });
  db.data.books.push({ id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', price: 10.0 });
}

db.write();

function getNextId(collection) {
  if (!db.data[collection].length) return 1;
  return Math.max(...db.data[collection].map(item => item.id)) + 1;
}

module.exports = {
  getUserByUsername: (username) => db.data.users.find(u => u.username === username),
  updateUserPassword: (userId, hashedPassword) => {
    const user = db.data.users.find(u => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      db.write();
    }
  },
  getBooks: () => db.data.books,
  getBookById: (id) => db.data.books.find(book => book.id === id),
  createOrder: (userId, name, address, total, date, items) => {
    const orderId = getNextId('orders');
    db.data.orders.push({ id: orderId, userId, name, address, total, date });
    for (const item of items) {
      db.data.order_items.push({
        id: getNextId('order_items'),
        orderId,
        bookId: item.id,
        title: item.title,
        price: item.price,
        qty: item.qty
      });
    }
    db.write();
    return orderId;
  },
  getOrdersByUserId: (userId) => db.data.orders.filter(order => order.userId === userId).sort((a,b) => (a.id < b.id ? 1 : -1)),
  getOrderItems: (orderId) => db.data.order_items.filter(item => item.orderId === orderId)
};
