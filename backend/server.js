const express = require('express');
const cors = require('cors');
const config = require('./src/config');
const routes = require('./src/routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);



const port = config.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});