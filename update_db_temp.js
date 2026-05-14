const mongoose = require('mongoose');
const Device = require('./models/Device');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/scada_db')
  .then(async () => {
    await Device.updateMany({}, {
      $set: {
        'settings.thresholds.limit_so2': 100.0,
        'settings.thresholds.limit_pm': 250.0
      }
    });
    console.log('Update successful');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
