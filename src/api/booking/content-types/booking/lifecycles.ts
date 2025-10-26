// src/api/booking/content-types/booking/lifecycles.ts
import fetch from 'node-fetch'; // Make sure you have `node-fetch@2` installed

interface PopulatedBooking {
    id: number;
    bookingId: string;
    statusCode: string;
    user?: {
        id: number;
        pushToken?: string;
    }
}

async function sendExpoPushNotification(pushToken: string, title: string, body: string, data: object) {
    const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data
    };

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        console.log('Successfully sent push notification via Expo.');
    } catch (error) {
        console.error('Error sending push notification via Expo:', error);
    }
}


export default {
  async afterUpdate(event: { result: any; params: { data: any } }) {
    const { result, params } = event;
    const { data } = params;

    if (data.statusCode) {
      console.log(`Booking ${result.id} status changed to ${result.statusCode}. Attempting to send notification.`);

      const booking = await (strapi).entityService.findOne('api::booking.booking', result.id, {
        populate: { user: true },
      }) as PopulatedBooking;

      const pushToken = booking.user?.pushToken;

      if (pushToken) {
        // Use the new function to send the notification via Expo
        const title = `Booking #${result.bookingId} Updated`;
        const body = `Your booking: ${result.statusCode}`;
        await sendExpoPushNotification(pushToken, title, body, { bookingId: result.documentId });
      } else {
        console.warn(`No push token found for user on booking #${result.bookingId}.`);
      }
    }
  },
};