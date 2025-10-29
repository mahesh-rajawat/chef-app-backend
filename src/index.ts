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

