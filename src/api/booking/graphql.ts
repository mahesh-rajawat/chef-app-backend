// src/api/booking/graphql.ts
import { convertGqlFiltersToDbFilters } from '../../utils/filters';

interface ResolverArgs {
  filters?: { [key: string]: any } | null;
  sort?: string[] | null;
  pagination?: { start?: number; limit?: number; page?: number; pageSize?: number; } | null;
}

export default ({ nexus, strapi }: { nexus: any, strapi: any }) => ({
  types: [
    // 1. Define a custom PageInfo type
    nexus.objectType({
      name: 'CustomBookingPageInfo',
      definition(t: any) {
        t.int('page');
        t.int('pageSize');
        t.int('pageCount');
        t.int('total');
      },
    }),
    // 2. Define a custom collection type that uses `nodes`
    nexus.objectType({
      name: 'CustomBookingResponseCollection',
      definition(t: any) {
        t.list.field('nodes', { type: 'Booking' });
        t.field('pageInfo', { type: 'CustomBookingPageInfo' });
      },
    }),
    
    // 3. Extend the root Query to add the 'myBookings' field
    nexus.extendType({
      type: 'Query',
      definition(t: any) {
        t.field('myBookings', {
          type: 'CustomBookingResponseCollection',
          args: {
            filters: nexus.arg({ type: 'JSON' }),
            sort: nexus.list(nexus.stringArg()),
            pagination: nexus.arg({ type: 'JSON' }),
          },
          description: "Returns the bookings of the currently authenticated user",
          async resolve(root: any, args: ResolverArgs, ctx: any) {
            const { filters, sort, pagination } = args;
            const user = ctx.state.user;

            if (!user) {
              return { nodes: [], pageInfo: { total: 0, page: 1, pageSize: 0, pageCount: 0 } };
            }

            const sortString = (sort && sort[0]) || 'bookingDate:desc';
            const gqlFilters = convertGqlFiltersToDbFilters(filters);
            
            const finalFilters = {
              ...gqlFilters,
              user: { id: { $eq: user.id } } 
            };

            const { results, pagination: resultPagination } = await (strapi as any).service('api::booking.booking').find({
              filters: finalFilters,
              sort: sortString,
              pagination: pagination || {},
              populate: { 
                chef: {
                  populate: { imageUrl: true }
                },
                deliveryAddress: true,
              },
            });
            console.log(results);
            return {
              nodes: results,
              pageInfo: resultPagination,
            };
          }
        });
      }
    })
  ]
});
