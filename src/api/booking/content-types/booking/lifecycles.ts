export default {
  async beforeCreate(event) {
    const { data } = event.params;

    // Find the most recent booking to determine the next ID
    const latestBooking = await strapi.db.query('api::booking.booking').findMany({
      orderBy: { bookingId: 'desc' },
      limit: 1,
    });

    let nextId = 1;
    if (latestBooking && latestBooking.length > 0) {
      // Extract the number from the last booking's ID and increment it
      const lastId = parseInt(latestBooking[0].bookingId, 10);
      nextId = lastId + 1;
    }

    // Pad the number with leading zeros to make it 8 digits long (e.g., 00000001)
    data.bookingId = String(nextId).padStart(8, '0');
  },
};