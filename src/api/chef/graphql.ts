// src/api/chef/graphql.ts

import { convertGqlFiltersToDbFilters } from '../../../src/utils/filters';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};


// --- THE FIX: Use a simpler, more generic interface that doesn't rely on generated types ---
interface ResolverArgs {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  filters?: { [key: string]: any } | null;
  sort?: string[] | null;
  pagination?: { start?: number; limit?: number; page?: number; pageSize?: number; } | null;
}
// -----------------------------------------------------------------------------------------

export default ({ nexus }: { nexus: any }) => ({
  types: [
    nexus.objectType({
      name: 'CustomPageInfo',
      definition(t: any) {
        t.int('page');
        t.int('pageSize');
        t.int('pageCount');
        t.int('total');
      },
    }),
    nexus.objectType({
      name: 'CustomChefResponseCollection',
      definition(t: any) {
        t.list.field('nodes', { type: 'Chef' });
        t.field('pageInfo', { type: 'CustomPageInfo' });
      },
    }),
    
    nexus.extendType({
      type: 'Query',
      definition(t: any) {
        t.field('chefsByLocation', {
          type: 'CustomChefResponseCollection',
          args: {
            latitude: nexus.floatArg(),
            longitude: nexus.floatArg(),
            radius: nexus.floatArg({ default: 10 }),
            // --- THE FIX: Use 'JSON' as the type for filters and pagination ---
            filters: nexus.arg({ type: 'JSON' }),
            sort: nexus.list(nexus.stringArg()),
            pagination: nexus.arg({ type: 'JSON' }),
            // -----------------------------------------------------------------
          },
          async resolve(root: any, args: ResolverArgs, ctx: any) {
            const { latitude, longitude, radius, filters, sort, pagination } = args;
            const sortString = (sort && sort[0]) || 'rating:desc';

            const gqlFilters = convertGqlFiltersToDbFilters(filters);

            if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
              const { results, pagination: resultPagination } = await (strapi as any).service('api::chef.chef').find({
                filters: gqlFilters || {},
                sort: sortString,
                pagination: pagination || {},
                populate: ['imageUrl', 'cuisines', 'specialtyDishes'],
              });

              return {
                nodes: results,
                pageInfo: resultPagination,
              };
            }
            
            const { results: allFilteredChefs } = await (strapi as any).service('api::chef.chef').find({
              filters: gqlFilters || {},
              sort: sortString,
              pagination: { start: 0, limit: -1 }, // Fetch all
              populate: ['imageUrl', 'cuisines', 'specialtyDishes'],
            });

            const nearbyChefs = allFilteredChefs.filter((chef: any) => {
              if (chef.latitude && chef.longitude) {
                const distance = getDistance(latitude, longitude, chef.latitude, chef.longitude);
                return distance <= radius!;
              }
              return false;
            });

            const start = pagination?.start || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 25);
            const limit = pagination?.limit === -1 ? nearbyChefs.length : (pagination?.limit || pagination?.pageSize || 25);
            const paginatedChefs = nearbyChefs.slice(start, start + limit);

            const total = nearbyChefs.length;
            const pageSize = limit;
            const pageCount = limit > 0 ? Math.ceil(total / limit) : 1;
            const page = limit > 0 ? Math.floor(start / limit) + 1 : 1;

            return {
              nodes: paginatedChefs,
              pageInfo: {
                page,
                pageSize,
                pageCount,
                total,
              },
            };
          }
        });
      }
    })
  ]
});

