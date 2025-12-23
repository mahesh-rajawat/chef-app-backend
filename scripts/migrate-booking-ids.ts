// src/scripts/migrate-booking-ids.ts


export async function migrateBookingIds(strapi: any) {
  console.log('Starting booking ID migration script...');

  // 1. Find all bookings that do not have a bookingId
  const bookingsToUpdate = await strapi.db.query('api::booking.booking').findMany({
    where: {
      bookingId: {
        $null: true,
      },
    },
  });

  if (bookingsToUpdate.length === 0) {
    console.log('No bookings found that need a custom ID. Migration not needed.');
    return;
  }

  console.log(`Found ${bookingsToUpdate.length} bookings to update.`);

  // 2. Find the highest existing bookingId to know where to start counting
  const latestBooking = await strapi.db.query('api::booking.booking').findMany({
    orderBy: { bookingId: 'desc' },
    limit: 1,
  });

  let nextId = 1;
  if (latestBooking && latestBooking.length > 0 && latestBooking[0].bookingId) {
    const lastId = parseInt(latestBooking[0].bookingId, 10);
    nextId = lastId + 1;
  }

  // 3. Loop through each booking and assign it a new, unique ID
  for (const booking of bookingsToUpdate) {
    try {
      const newBookingId = String(nextId).padStart(8, '0');
      
      await strapi.entityService.update('api::booking.booking', booking.id, {
        data: {
          bookingId: newBookingId,
        },
      });

      console.log(`- Successfully updated booking ${booking.id} with new ID: ${newBookingId}`);
      nextId++; // Increment for the next booking
    } catch (error: any) {
      console.error(`- Failed to update booking ${booking.id}:`, error.message);
    }
  }

  console.log('Booking ID migration finished.');
}
