const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwYGCJTmEONDbHLhEaDtXnAJNNg510q8NOalecEM3GtCcIBBriIyMlxgkS0O_o1Clw-/exec";

/**
 * Sends a notification by posting a payload to the Google Apps Script webhook.
 * This is a "fire and forget" function and does not block UI updates.
 * @param {object} payload The data to be sent.
 */
export const sendTelegramNotification = (payload) => {
  console.log("Fire and forget: Sending notification via Google Apps Script with payload:", payload);

  fetch(WEBHOOK_URL, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    body: JSON.stringify(payload)
  })
  .then(() => {
      console.log("Notification request successfully sent (fire and forget).");
  })
  .catch(error => {
    console.error("Error sending notification request:", error);
  });
};
