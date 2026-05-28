const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bitebridge';
    
    // For MongoDB Atlas (srv) connection strings, local DNS servers sometimes fail to resolve SRV records.
    // Setting dns servers to Google and Cloudflare DNS ensures seamless resolution.
    if (connUri.startsWith('mongodb+srv://')) {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    }

    const conn = await mongoose.connect(connUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
