const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({ origin: ['http://localhost:5173','http://localhost:3000'], credentials: true }));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/invoices',  require('./routes/invoices'));
app.use('/api/expenses',  require('./routes/expenses'));
app.use('/api/income',    require('./routes/income'));
app.use('/api/gst',       require('./routes/gst'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/estimates', require('./routes/estimates'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
