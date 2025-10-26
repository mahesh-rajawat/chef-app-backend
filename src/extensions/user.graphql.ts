// src/extensions/user.graphql.ts
// This file contains all logic for the User type

export default ({ nexus, strapi }: { nexus: any, strapi: any }) => ({
  types: [

    // 2. Extend the User *output* type
    nexus.extendType({
			type: 'Query',
			definition(t: any) {
				t.field('me', {
					type: 'UsersPermissionsMe',
					async resolve(parent: any, args: any, ctx: any) {
						if (!ctx.state.user) {
							return null;
						}
						// Fetch the user ONCE, and populate all relations.
						// This is the single source of truth.
						const user = await strapi.entityService.findOne(
							'plugin::users-permissions.user', 
							ctx.state.user.id, 
							{ populate: ['addresses', 'favoriteChefs'] } 
						);

						// Manually format relations to match GraphQL { data, meta } structure
						// This is the key to preventing the "cannot return null" errors
						return {
							...user,
							addresses: {
								nodes: user.addresses || []
							},
							favoriteChefs: {
								nodes: user.favoriteChefs || [],
								meta: { pagination: { total: (user.favoriteChefs || []).length } }
							}
						};
					}
				});
			}
		}),
        // 2. Extend the User *output* type
			nexus.extendType({
				type: 'UsersPermissionsMe',
				definition(t: any) {
					t.id('id');
					t.string('username');
					t.string('email');
					
					t.string('phone');
					t.boolean('pushNotifications');
					t.boolean('emailNotifications');
					t.string('pushToken');
					t.field('cart', { type: 'JSON' });
					t.field('addresses', {
						type: 'AddressEntityResponseCollection',
						description: 'User address book collection',
						resolve: (parent: any) => parent.addresses,
					});
					
					t.field('favoriteChefs', {
						type: 'ChefEntityResponseCollection',
						description: 'User favorite chefs',
						resolve: (parent: any) => parent.favoriteChefs,
					});
				},
			}),
			
			nexus.extendType({
				type: 'UsersPermissionsUserInput',
				definition(t: any) {
					t.string('phone');
					t.boolean('pushNotifications');
					t.boolean('emailNotifications');
					t.string('pushToken');
					
					t.field('cart', { type: 'JSON' });

					t.list.field('address', {
						type: 'ComponentChefAppAddressInput',
					});
				},
			}),
        
			nexus.objectType({
				name: 'ComponentChefAppAddress',
				definition(t: any) {
					t.id('id');
					t.string('name');
					t.string('label');
					t.string('street');
					t.string('city');
					t.string('postalCode');
				},
			}),
  ],
});
