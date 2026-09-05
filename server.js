require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectToDatabase = require('./lib/mongodb');

const loginHandler = require('./api/auth/login');
const winnersHandler = require('./api/winners');
const checkResultHandler = require('./api/check_result');
const settingsHandler = require('./api/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// API Routes
app.all('/api/auth/login', (req, res) => loginHandler(req, res));
app.all('/api/winners', (req, res) => winnersHandler(req, res));
app.all('/api/settings', (req, res) => settingsHandler(req, res));
app.all('/api/check_result', (req, res) => checkResultHandler(req, res));
app.all('/api/check_result.php', (req, res) => checkResultHandler(req, res));

// Clean URL Aliases
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get(['/admin__login.php', '/admin__login.php.html', '/admin-login', '/admin-login.html'], (req, res) => {
  res.redirect('/admin');
});

app.get(['/dashboard', '/admin-dashboard', '/admin-dashboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// App & Document Portal Aliases
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.get('/app/dashboard(.php)?', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'dashboard.html'));
});

app.get('/app/:page.php', (req, res) => {
  const fs = require('fs');
  const htmlFile = path.join(__dirname, 'app', req.params.page + '.html');
  if (fs.existsSync(htmlFile)) {
    res.sendFile(htmlFile);
  } else {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database & start server
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` Kerala Lottery Portal is running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Admin Portal: http://localhost:${PORT}/admin`);
    console.log(` Admin Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(` MongoDB Status: ${process.env.MONGODB_URI ? 'Configured' : 'Local Fallback'}`);
    console.log(` Admin User: ${process.env.ADMIN_USERNAME || 'admin'}`);
    console.log(`======================================================\n`);
  });
}).catch(err => {
  console.error('Server startup error:', err);
});

