const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// --- Configuration ---
const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
const TELEGRAM_CHAT_ID = functions.config().telegram.chat_id;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

/**
 * =================================================================
 * INTERNAL HELPER FUNCTIONS
 * =================================================================
 */

/**
 * Sends a pre-formatted message to the configured Telegram chat.
 * @param {string} message The message text to send.
 */
const sendTelegramMessage = async (message) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram token or chat ID is not configured. Please run `firebase functions:config:set telegram.token=... telegram.chat_id=...`");
    return;
  }
  if (!message) {
    console.warn("Attempted to send an empty message. Aborting.");
    return;
  }

  try {
    await axios.post(TELEGRAM_API_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
    console.log("Telegram notification sent successfully.");
  } catch (error) {
    console.error("Error sending Telegram notification:", error.response ? error.response.data : error.message);
  }
};

/**
 * Formats the notification message based on the provided data object.
 * This logic is adapted from your Google Apps Script.
 * @param {object} data The data from the client.
 * @returns {string} A Markdown-formatted string for Telegram.
 */
const formatMessage = (data) => {
    const timestamp = new Date();
    
    // Format date/time in Thai locale with Gregorian year (ค.ศ.)
    const dateOptions = { timeZone: 'Asia/Bangkok', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const dateString = timestamp.toLocaleString('th-TH', dateOptions);
    const timeString = timestamp.toLocaleString('th-TH', timeOptions);
    const yearBE = timestamp.getFullYear() + 543;
    const yearCE = timestamp.getFullYear();
    const fullDateTimeStringFinal = dateString.replace(String(yearBE), String(yearCE)) + ' เวลา ' + timeString;
    
    let title = '';
    let details = '';
    const reasonOrLocation = data.reason || data.location || data.details; 
    const purposeText = reasonOrLocation ? `\n📌 *เหตุผล/สถานที่:* ${reasonOrLocation}` : '';

    // Use newAvailable (for tools) or newQuantity (for parts/safety)
    const remainingStock = data.newAvailable !== undefined ? data.newAvailable : data.newQuantity; 

    switch (data.type) {
        case 'add_new_item': 
            title = '✨ แจ้งเตือนการเพิ่มรายการใหม่'; 
            details = `จำนวนเริ่มต้น: ${data.quantity}`; 
            break;
        case 'restock': 
            title = '📦 แจ้งเตือนการเติมสต็อก'; 
            details = `จำนวน: +${data.quantityChanged} (คงเหลือ: ${remainingStock})`; 
            break;
        case 'withdraw': 
            title = '✅ แจ้งเตือนการเบิก'; 
            details = `จำนวน: ${Math.abs(data.quantityChanged)} ${data.unit || 'ชิ้น'} (คงเหลือ: ${remainingStock})`;
            break;
        case 'adjust': 
            title = '✏️ แจ้งเตือนการแก้ไขข้อมูล'; 
            details = (remainingStock !== undefined) ? `คงเหลือใหม่: ${remainingStock}` : `ข้อมูลทั่วไป`; 
            break;
        case 'delete': 
            title = '❌ แจ้งเตือนการลบรายการ'; 
            details = `ถูกลบออกจากคลัง`; 
            break;
        case 'borrow': 
            title = '🛠️ แจ้งเตือนการยืมเครื่องมือ'; 
            details = `*คงเหลือ:* ${data.newAvailable}/${data.total}\n*ถูกยืมไป:* ${data.newBorrowed}`; 
            break;
        case 'return': 
            title = '👍 แจ้งเตือนการคืนเครื่องมือ'; 
            details = `*คงเหลือ:* ${data.newAvailable}/${data.total}\n*ถูกยืมไป:* ${data.newBorrowed}`; 
            break;
        default: 
            console.warn(`Unknown notification type: "${data.type}"`);
            return null; // Return null for unknown types
    }

    details += purposeText; 
    const userText = data.user ? `\n👷‍♂️ *ผู้ดำเนินการ:* ${data.user}` : '';
    
    let message = `*${title}*\n-------------------------------------\n*รายการ:* ${data.itemName}\n*รายละเอียด:* ${details}${userText}\n🕒 *เวลา:* ${fullDateTimeStringFinal}`;

    // Append stock status warnings
    if (remainingStock !== undefined) {
        if (remainingStock === 0) {
            message += "\n\n*❌ สินค้าหมดแล้ว!*";
        } else if (remainingStock < 2) { // You can adjust this threshold
            message += "\n\n*⚠️ สินค้าใกล้หมด!*";
        }
    }
    return message;
};


/**
 * =================================================================
 * CALLABLE CLOUD FUNCTION
 * =================================================================
 */

/**
 * A callable function that receives data from the client, formats it,
 * and sends a notification to Telegram.
 */
exports.notifyTelegram = functions.region("asia-southeast1").https.onCall(async (data, context) => {
  // 1. Authentication Check
  // Ensure the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  // 2. Data Validation (Basic)
  // Ensure we have the minimum required data to send a message.
  if (!data.itemName || !data.type) {
     throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with "itemName" and "type" arguments.'
    );
  }

  // 3. Format the message using our powerful formatting function
  const message = formatMessage(data);

  // 4. Send the notification
  await sendTelegramMessage(message);

  // 5. Return a success response to the client
  return { status: "success", message: "Notification sent." };
});
