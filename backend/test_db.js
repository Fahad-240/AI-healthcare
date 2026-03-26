const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('CONNECTED SUCCESSFULLY');
    process.exit(0);
  })
  .catch(err => {
    console.error('CONNECTION FAILED:');
    console.error(err);
    process.exit(1);
  });

// Timeout after 15 seconds
setTimeout(() => {
  console.error('CONNECTION TIMED OUT');
  process.exit(1);
}, 15000);
