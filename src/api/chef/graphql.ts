// src/api/chef/graphql.ts

// Make sure this path is correct for your project
import { findBestActiveRule } from '../../utils/discountCalculation';
import { getDistance } from '../../utils/location';
import { convertGqlFiltersToDbFilters } from '../../utils/filters';

interface ResolverArgs {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  filters?: { [key: string]: any } | null;
  sort?: string[] | null;
  pagination?: { start?: number; limit?: number; page?: number; pageSize?: number; } | null;
}

export default ({ nexus, strapi }: { nexus: any, strapi: any }) => ({
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
    
    // --- Define the response type for Chef Registration ---
    nexus.objectType({
      name: 'ChefRegisterPayload',
      definition(t: any) {
        t.string('jwt');
        t.field('user', { type: 'UsersPermissionsMe' });
        t.field('chef', { type: 'Chef' });
      },
    }),

    // --- Extend Mutation to add registerChef ---
    nexus.extendType({
      type: 'Mutation',
      definition(t: any) {
        t.field('registerChef', {
          type: 'ChefRegisterPayload',
          args: {
            // Required basic info
            username: nexus.nonNull(nexus.stringArg()),
            email: nexus.nonNull(nexus.stringArg()),
            password: nexus.nonNull(nexus.stringArg()),
            name: nexus.nonNull(nexus.stringArg()), 
            
            // --- NEW: Added fields from the registration form ---
            phoneNumber: nexus.stringArg(),
            minGuests: nexus.intArg(),
            maxGuests: nexus.intArg(),
            yearsOfExperience: nexus.intArg(),
            
            instagram: nexus.stringArg(),
            portfolio: nexus.stringArg(),
            bio: nexus.arg({ type: 'JSON' }),
          },
          async resolve(parent: any, args: any, ctx: any) {
            const { 
              username, email, password, name,
              phoneNumber, minGuests, maxGuests, yearsOfExperience,
              instagram, portfolio, bio 
            } = args;

            // 1. Find the 'Chef' role ID
            const chefRole = await strapi.db.query('plugin::users-permissions.role').findOne({
              where: { name: 'Chef' } 
            });

            if (!chefRole) {
              throw new Error('Chef role not found. Please create it in the admin panel.');
            }

            // 2. Create the User
            const user = await strapi.plugin('users-permissions').service('user').add({
              username,
              email,
              password,
              role: chefRole.id,
              confirmed: true,
              provider: 'local',
            });

            // 3. Create the Chef Profile and link it to the User
            const chef = await strapi.entityService.create('api::chef.chef', {
              data: {
                name: name,
                user: user.id,
            
                phoneNumber,
                minGuests,
                maxGuests,
                yearsOfExperience,
                socialLinks: {
                  instagram,
                  portfolio,
                },
                bio,
                isVerified: false,
                rating: 0,
                reviewCount: 0,
                priceRange: 'Standard', 
                publishedAt: new Date().toISOString(),
              },
            });

            // 4. Generate JWT Token
            const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

            return {
              jwt,
              user,
              chef,
            };
          }
        });
      }
    }),

    nexus.extendType({
      type: 'Chef',
      definition(t: any) {
        t.boolean('hasActiveDiscount', {
          description: 'Whether the chef has any active discounts right now',
          async resolve(chef: any) {
            const idToUse = chef.documentId || chef.id;
            if (!idToUse) return false;
            const bestRule = await findBestActiveRule(strapi, idToUse);
            return !!bestRule;
          }
        });

        t.boolean('isVerified', {
          description: 'Whether the chef has a clear criminal history check',
          resolve: (chef: any) => chef.isVerified,
        });
      }
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
            filters: nexus.arg({ type: 'JSON' }),
            sort: nexus.list(nexus.stringArg()),
            pagination: nexus.arg({ type: 'JSON' }),
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
                populate: ['imageUrl', 'cuisines', 'specialtyDishes', 'availability', 'holidays'],
              });

              return {
                nodes: results,
                pageInfo: resultPagination,
              };
            }
            
            const { results: allFilteredChefs } = await (strapi as any).service('api::chef.chef').find({
              filters: gqlFilters || {},
              sort: sortString,
              pagination: { start: 0, limit: -1 },
              populate: ['imageUrl', 'cuisines', 'specialtyDishes', 'availability', 'holidays'],
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
  ],
  resolversConfig: {
    'Mutation.registerChef': {
      auth: false,
    },
  },
});