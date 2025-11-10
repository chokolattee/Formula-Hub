const express = require('express');
const app = express();
const cors = require('cors')

const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const team = require('./routes/team');
const user = require('./routes/user');
const category = require('./routes/category');
const review = require('./routes/review');
const dashboard = require('./routes/dashboard');


app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use(cors());

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1', team);
app.use('/api/v1', user);
app.use('/api/v1', category);
app.use('/api/v1', review);
app.use('/api/v1', dashboard);

module.exports = app