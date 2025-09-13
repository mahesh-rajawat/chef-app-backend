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

const convertGqlFiltersToDbFilters = (filters) => {
  if (!filters) {
    return {};
  }
  const dbFilters = {};
  // List of known GraphQL operators
  const OPERATORS = ['eq', 'ne', 'in', 'nin', 'lt', 'lte', 'gt', 'gte', 'contains', 'ncontains', 'containsi', 'ncontainsi'];

  for (const key in filters) {
    const filterValue = filters[key];

    if (typeof filterValue === 'object' && filterValue !== null) {
      const innerKeys = Object.keys(filterValue);
      // Check if the inner object is an operator object (e.g., { eq: 'value' })
      const isOperatorObject = innerKeys.length === 1 && OPERATORS.includes(innerKeys[0]);

      if (isOperatorObject) {
        // It's a simple filter like { rating: { gt: 4 } }
        const operator = innerKeys[0];
        const value = filterValue[operator];
        dbFilters[key] = { [`$${operator}`]: value };
      } else {
        // It's a nested relational filter like { cuisines: { name: { eq: 'Italian' } } }
        // We need to recurse to translate the inner object.
        dbFilters[key] = convertGqlFiltersToDbFilters(filterValue);
      }
    } else {
      // Fallback for direct equality, though GraphQL usually nests it
      dbFilters[key] = { $eq: filterValue };
    }
  }
  return dbFilters;
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use(({ nexus }) => ({
      types: [
        nexus.extendType({
          type: 'Chef',
          definition(t) {
            t.id('id');
          },
        }),
        nexus.extendType({
          type: 'UsersPermissionsMe',
          definition(t) {
            // Add the favoriteChefs relation
            t.field('favoriteChefs', {
              type: 'ChefRelationResponseCollection',
              description: 'User favorite chefs',
              async resolve(root, args, ctx) {
                const fullUser = await strapi.entityService.findOne(
                  'plugin::users-permissions.user',
                  root.id,
                  { populate: ['favoriteChefs'] }
                );
                return {
                  nodes: fullUser.favoriteChefs
                };
              },
            });
            // Add the addressBook component
            t.list.field('addressBook', {
              type: 'ComponentChefAppAddress',
              description: 'User address book',
            });
            t.field('cart', {
              type: 'JSON',
              description: 'User shopping cart',
            });
          },
        }),
        nexus.extendInputType({
          type: 'UsersPermissionsUserInput',
          definition(t) {
            // This tells the mutation to accept a 'cart' field of type JSON
            t.field('cart', {
              type: 'JSON',
            });
          },
        }),
        nexus.extendInputType({
          type: 'UsersPermissionsUserFiltersInput',
          definition(t) {
            t.field('id', { type: 'IDFilterInput' });
          },
        }),
        nexus.extendType({
          type: 'Query',
          definition(t) {
            t.field('myBookings', {
              type: 'BookingEntityResponseCollection',
              description: "Returns the bookings of the currently authenticated user",
              async resolve(root, args, ctx) {
                const user = ctx.state.user;
                // console.log(user);
                if (!user) {
                  return { nodes: [] };
                }
                const bookings = await strapi.db.query('api::booking.booking').findMany({
                  where: { user: { id: user.id } },
                  populate: { 
                    chef: {
                      populate: {
                        imageUrl: true
                      }
                    } 
                  },
                });
                 const uniqueBookings = Array.from(new Map(bookings.map(item => [item.documentId, item])).values());
                return {
                  nodes: uniqueBookings
                };
              },
            });

            t.field('chefsByLocation', {
              type: 'ChefEntityResponseCollection',
              args: {
                // Latitude and Longitude are now optional
                latitude: nexus.floatArg(),
                longitude: nexus.floatArg(),
                radius: nexus.floatArg({ default: 10 }),
                filters: nexus.arg({ type: 'ChefFiltersInput' }),
                sort: nexus.list(nexus.stringArg()),
              },
              async resolve(root, { latitude, longitude, radius, filters, sort }, ctx) {
                const gqlFilters = convertGqlFiltersToDbFilters(filters);
                const whereClause = {
                  ...gqlFilters,
                  publishedAt: { $notNull: true },
                };

                // Prepare the 'orderBy' clause from the sort string array
                const sortString = (sort && sort[0]) || 'rating:desc';
                const [sortField, sortOrder] = sortString.split(':');
                const orderBy = { [sortField]: sortOrder };

                // Fetch chefs using the Query Engine
                const filteredChefs = await strapi.db.query('api::chef.chef').findMany({
                  where: whereClause,
                  orderBy,
                  populate: ['imageUrl', 'cuisines'],
                });

                // If no location is provided, return the filtered list directly
                if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
                  return {
                    nodes: filteredChefs.map(chef => ({
                      __typename: 'Chef',
                      ...chef
                    }))
                  };
                }

                // If location is provided, filter the results by distance
                const nearbyChefs = filteredChefs.filter(chef => {
                  if (chef.latitude && chef.longitude) {
                    const distance = getDistance(latitude, longitude, chef.latitude, chef.longitude);
                    return distance <= radius;
                  }
                  return false;
                });

                return {
                  nodes: nearbyChefs.map(chef => ({
                    __typename: 'Chef',
                    ...chef
                  }))
                };
              }
            })
          }
        })
      ],
    }));
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) {},
};
