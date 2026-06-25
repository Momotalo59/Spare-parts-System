
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3003;

// More specific CORS configuration
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Pusher server is running!');
});

app.post('/notify', async (req, res) => {
  console.log('\n[INFO] Received request on /notify at', new Date().toISOString());
  const transaction = req.body;
  const { APPS_SCRIPT_URL } = process.env;

  if (!APPS_SCRIPT_URL) {
    console.error('[ERROR] APPS_SCRIPT_URL is not defined in .env file');
    return res.status(500).send({ message: 'Server configuration error.' });
  }

  if (!transaction || Object.keys(transaction).length === 0) {
    console.error('[ERROR] Received empty or invalid transaction data:', transaction);
    return res.status(400).send({ message: 'No transaction data received.' });
  }

  console.log('[DATA] Received transaction data:', JSON.stringify(transaction, null, 2));

  let message = 'แจ้งเตือนการทำรายการอะไหล่\n------------------------------------\n';
  const user = transaction.user || 'N/A';
  const timestamp = new Date(transaction.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  switch (transaction.type) {
    case 'เบิก/ยืม':
      message += `🙋‍♂️ *ผู้ดำเนินการ:* ${user}\n`;
      message += `📤 *ประเภท:* ${transaction.type}\n`;
      message += `📦 *รายการ:* ${transaction.itemName}\n`;
      message += `🔢 *จำนวน:* ${transaction.quantity}\n`;
      if (transaction.details) {
        message += `📍 *สถานที่ใช้งาน:* ${transaction.details}\n`;
      }
      break;
    case 'คืน':
      message += `🙋‍♂️ *ผู้ดำเนินการ:* ${user}\n`;
      message += `📥 *ประเภท:* ${transaction.type}\n`;
      message += `📦 *รายการ:* ${transaction.itemName}\n`;
      message += `🔢 *จำนวน:* ${transaction.quantity}\n`;
      break;
    default:
      console.warn(`[WARN] Unknown transaction type: \"${transaction.type}\". Skipping notification.`);
      return res.status(200).send({ message: 'Unknown transaction type. No notification sent.' });
  }
  
  message += `------------------------------------\n⏰ *เวลา:* ${timestamp}`;

  console.log('[MESSAGE] Prepared message to send:\n', message);

  try {
    console.log(`[ACTION] Sending POST request to Google Apps Script URL...`);
    const response = await axios.post(APPS_SCRIPT_URL, 
      { text: message }, 
      {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      }
    );
    console.log('[SUCCESS] Successfully sent notification. Google Apps Script response status:', response.status);
    res.status(200).send({ message: 'Notification sent successfully.' });
  } catch (error) {
    console.error("[ERROR] Failed to send notification via Apps Script.");
    if (error.response) {
      console.error('  - Status:', error.response.status);
      console.error('  - Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('  - Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        console.error('  - No response received from Google Apps Script. Is the URL correct and the script deployed?');
    } else {
      console.error('  - Error setting up the request:', error.message);
    }
    res.status(500).send({ message: 'Failed to send notification.' });
  }
});

const server = app.listen(port, () => {
  console.log(`Pusher server listening for requests at http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
