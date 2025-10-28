// src/index.ts

// @ts-ignore
import chefGraphqlExtension from './api/chef/graphql';
import dishGraphqlExtension from './api/dish/graphql/extension'; 
// @ts-ignore
import { seed } from '../scripts/seed';
import { findBestActiveRule } from './utils/discountCalculation';
import bookingGraphqlExtension from './api/booking/graphql'; 
import userGraphqlExtension from './extensions/user.graphql';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: any }) {
    const extensionService = strapi.plugin('graphql').service('extension');
    extensionService.use(chefGraphqlExtension);
    extensionService.use(dishGraphqlExtension);
    extensionService.use(bookingGraphqlExtension);
    extensionService.use(userGraphqlExtension);

    extensionService.use(({ nexus }) => ({
      types: [
        nexus.extendType({
          type: 'Chef',
          definition(t: any) {
            // This ensures the documentId from the old API still works
            t.id('id');
          },
        }),
        nexus.extendType({
          type: 'Address',
          definition(t: any) {
            t.id('id');
          },
        }),
        nexus.extendType({
          type: 'UsersPermissionsUser',
          definition(t: any) {
            t.id('id');
          },
        }),
        // nexus.extendType({
        //   type: 'Chef',
        //   definition(t: any) {
        //     t.boolean('hasActiveDiscount', {
        //       description: 'Whether the chef has any active discounts right now',
        //       async resolve(chef: any) {
        //         console.log("strapi index", chef);
        //         const bestRule = await findBestActiveRule(strapi, chef.documentId);
        //         console.log("strapi index", bestRule);
        //         return !!bestRule; // Return true if a rule exists, false otherwise
        //       }
        //     });
        //     t.boolean('isVerified', {
        //       description: 'Whether the chef has a clear criminal history check',
        //       resolve: (chef: any) => chef.isVerified,
        //     });
        //   }
        // }),
        // nexus.extendType({
        //   type: 'Query',
        //   definition(t: any) {
        //     t.field('me', {
        //       type: 'UsersPermissionsMe',
        //       async resolve(parent: any, args: any, ctx: any) {
        //         if (!ctx.state.user) {
        //           return null;
        //         }
        //         // Fetch the user ONCE, and populate all relations.
        //         // This is the single source of truth.
        //         const user = await strapi.entityService.findOne(
        //           'plugin::users-permissions.user', 
        //           ctx.state.user.id, 
        //           { populate: ['addresses', 'favoriteChefs'] } 
        //         );

        //         // Manually format relations to match GraphQL { data, meta } structure
        //         // This is the key to preventing the "cannot return null" errors
        //         return {
        //           ...user,
        //           addresses: {
        //             nodes: user.addresses || []
        //           },
        //           favoriteChefs: {
        //             nodes: user.favoriteChefs || [],
        //             meta: { pagination: { total: (user.favoriteChefs || []).length } }
        //           }
        //         };
        //       }
        //     });
        //   }
        // }),
        // 2. Extend the User *output* type
        // nexus.extendType({
        //   type: 'UsersPermissionsMe',
        //   definition(t: any) {
        //     t.id('id');
        //     t.string('username');
        //     t.string('email');
            
        //     t.string('phone');
        //     t.boolean('pushNotifications');
        //     t.boolean('emailNotifications');
        //     t.string('pushToken');
        //     t.field('cart', { type: 'JSON' });
        //     t.field('addresses', {
        //       type: 'AddressEntityResponseCollection',
        //       description: 'User address book collection',
        //       resolve: (parent: any) => parent.addresses,
        //     });
            
        //     t.field('favoriteChefs', {
        //       type: 'ChefEntityResponseCollection',
        //       description: 'User favorite chefs',
        //       resolve: (parent: any) => parent.favoriteChefs,
        //     });
        //   },
        // }),
        
        // nexus.extendType({
        //   type: 'UsersPermissionsUserInput',
        //   definition(t: any) {
        //     t.string('phone');
        //     t.boolean('pushNotifications');
        //     t.boolean('emailNotifications');
        //     t.string('pushToken');
            
        //     t.field('cart', { type: 'JSON' });

        //     t.list.field('address', {
        //       type: 'ComponentChefAppAddressInput',
        //     });
        //   },
        // }),
        
        // nexus.objectType({
        //   name: 'ComponentChefAppAddress',
        //   definition(t: any) {
        //     t.id('id');
        //     t.string('name');
        //     t.string('label');
        //     t.string('street');
        //     t.string('city');
        //     t.string('postalCode');
        //   },
        // }),
        nexus.extendInputType({
          type: 'UsersPermissionsUserFiltersInput',
          definition(t: any) {
            t.field('id', { type: 'IDFilterInput' });
          },
        }),
      ],
    }));

  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // if (process.env.NODE_ENV === 'development') {
    //   try {
    //     console.log('Development environment detected, running seed script...');
    //     await seed(strapi);
    //   } catch (error) {
    //     console.error('Could not run seed script:', error);
    //   }
    // }
  },
};

