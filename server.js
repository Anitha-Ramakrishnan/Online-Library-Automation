const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'secret-online-library-123', resave: false, saveUninitialized: false }));

// Middleware: make user available to views
app.use((req,res,next)=>{
  res.locals.user = req.session.user || null;
  next();
});

app.get('/', (req,res)=>{
  if(req.session.user) return res.redirect('/library');
  res.redirect('/login');
});

app.get('/login', (req,res)=>{
  res.render('login', { error: null });
});
app.post('/login', (req,res)=>{
  const { username, password } = req.body;
  const user = db.getUserByUsername(username);
  if(user && bcrypt.compareSync(password, user.password)){
    req.session.user = { id: user.id, username: user.username, email: user.email };
    req.session.cart = [];
    return res.redirect('/library');
  }
  res.render('login', { error: 'Invalid username or password' });
});

app.get('/logout', (req,res)=>{
  req.session.destroy(()=>res.redirect('/login'));
});

app.get('/forgot', (req,res)=>{
  res.render('forgot', { message: null, error: null });
});
app.post('/forgot', (req,res)=>{
  const { username, email } = req.body;
  const user = db.getUserByUsername(username);
  if(!user || user.email !== email) return res.render('forgot', { message: null, error: 'No matching user found' });
  const hashedPassword = bcrypt.hashSync('reset123', 10);
  db.updateUserPassword(user.id, hashedPassword);
  res.render('forgot', { message: 'Password reset to "reset123" (demo). Please login.', error: null });
});

function requireAuth(req,res,next){
  if(!req.session.user) return res.redirect('/login');
  next();
}

app.get('/library', requireAuth, (req,res)=>{
  const books = db.getBooks();
  res.render('library', { books });
});

app.post('/cart/add', requireAuth, (req,res)=>{
  const bookId = parseInt(req.body.bookId,10);
  let qty = parseInt(req.body.quantity,10) || 1;
  if(qty < 1) qty = 1;
  const book = db.getBookById(bookId);
  if(!book) return res.redirect('/library');
  if(!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find(i => i.id === book.id);
  if(existing){
    existing.qty = (existing.qty || 1) + qty;
  } else {
    req.session.cart.push({ id: book.id, title: book.title, price: book.price, qty });
  }
  res.redirect('/cart');
});

app.post('/cart/remove', requireAuth, (req,res)=>{
  const bookId = parseInt(req.body.bookId,10);
  const removeAll = req.body.removeAll === '1';
  if(!req.session.cart) return res.redirect('/cart');
  const idx = req.session.cart.findIndex(i => i.id === bookId);
  if(idx === -1) return res.redirect('/cart');
  if(removeAll){
    req.session.cart.splice(idx,1);
  } else {
    req.session.cart[idx].qty = (req.session.cart[idx].qty || 1) - 1;
    if(req.session.cart[idx].qty <= 0) req.session.cart.splice(idx,1);
  }
  res.redirect('/cart');
});

app.post('/cart/update', requireAuth, (req,res)=>{
  const bookId = parseInt(req.body.bookId,10);
  let qty = parseInt(req.body.quantity,10) || 1;
  if(qty < 1) qty = 1;
  if(!req.session.cart) return res.redirect('/cart');
  const item = req.session.cart.find(i => i.id === bookId);
  if(item) item.qty = qty;
  res.redirect('/cart');
});

app.get('/cart', requireAuth, (req,res)=>{
  const cart = req.session.cart || [];
  res.render('cart', { cart });
});

app.post('/checkout', requireAuth, (req,res)=>{
  const { name, address } = req.body;
  const cart = req.session.cart || [];
  if(cart.length === 0) return res.redirect('/library');
  const total = cart.reduce((s,i)=>s + (i.price * (i.qty || 1)),0);
  const orderId = db.createOrder(req.session.user.id, name, address, total, new Date().toISOString(), cart);
  const order = {
    id: orderId,
    user: req.session.user.username,
    items: cart.map(i => ({ id: i.id, title: i.title, price: i.price, qty: i.qty })),
    name,
    address,
    total,
    date: new Date().toISOString()
  };
  req.session.cart = [];
  res.render('order-success', { order });
});

app.get('/orders', requireAuth, (req,res)=>{
  const orders = db.getOrdersByUserId(req.session.user.id);
  const fullOrders = orders.map(order => ({
    ...order,
    items: db.getOrderItems(order.id)
  }));
  res.render('orders', { orders: fullOrders });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Server listening on http://localhost:${PORT}`));
