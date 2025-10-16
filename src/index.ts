import { Core } from "@strapi/strapi";
import chefGraphqlExtension from './api/chef/graphql';


export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');
    extensionService.use(chefGraphqlExtension);
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
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // if (process.env.NODE_ENV === 'development') {
    //   try {
    //     console.log('Development environment detected, running seed script...');
    //     // 3. Call your seed function and pass the strapi instance
    //     await seed(strapi);
    //   } catch (error) {
    //     console.error('Could not run seed script:', error);
    //   }
    // }
  },
};
