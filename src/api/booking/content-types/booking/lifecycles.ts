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
  /**
   * Runs AFTER a new booking is created.
   * This is where we send the confirmation email.
   */
  async afterCreate(event: { result: any }) {
    const { result } = event; // 'result' is the newly created booking

    try {
      // Find the booking and populate all the data we need for the email
      const booking = await (strapi as any).entityService.findOne('api::booking.booking', result.id, {
        populate: { user: true, chef: true, deliveryAddress: true },
      });

      if (booking && booking.user) {
        const pushToken = booking.user?.pushToken;
        await sendExpoPushNotification(pushToken, 'Booking Confirmation', 'You booked the chef successfully', { bookingId: result.documentId });
        // await (strapi as any).plugin('email').service('email').send({
        //   to: booking.user.email,
        //   from: 'support@cheflink.app', // Must be a verified sender in SendGrid
        //   subject: `Your ChefLink Booking is Confirmed! (#${booking.bookingId})`,
        //   html: `
        //     <h1>Your Booking is Confirmed!</h1>
        //     <p>Hi ${booking.user.username},</p>
        //     <p>Thank you for booking with ChefLink. Your booking with <strong>${booking.chef.name}</strong> is confirmed.</p>
        //     <hr>
        //     <h3>Details:</h3>
        //     <ul>
        //       <li><strong>Booking ID:</strong> #${booking.bookingId}</li>
        //       <li><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</li>
        //       <li><strong>Time:</strong> ${booking.bookingTime}</li>
        //       <li><strong>Address:</strong> ${booking.deliveryAddress.street}, ${booking.deliveryAddress.city}</li>
        //       <li><strong>Total Paid:</strong> €${booking.totalFee.toFixed(2)}</li>
        //     </ul>
        //     <p>We look forward to serving you!</p>
        //     <p>- The ChefLink Team</p>
        //   `,
        // });
      }
    } catch (err) {
      console.error('Error sending booking confirmation email:', err);
    }
  },
  async beforeCreate(event: { params: { data: any } }) {
    const { data } = event.params;

    // Find the most recent booking to determine the next ID
    const latestBooking = await (strapi as any).db.query('api::booking.booking').findMany({
      orderBy: { bookingId: 'desc' },
      limit: 1,
    });

    let nextId = 1;
    if (latestBooking && latestBooking.length > 0 && latestBooking[0].bookingId) {
      // Extract the number from the last booking's ID and increment it
      const lastId = parseInt(latestBooking[0].bookingId, 10);
      nextId = lastId + 1;
    }

    data.bookingId = String(nextId).padStart(8, '0');
  },

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