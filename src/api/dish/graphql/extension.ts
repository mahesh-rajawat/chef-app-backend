// src/api/dish/graphql/extension.ts

import { findBestActiveRule, calculateDiscount } from '../../../utils/discountCalculation';

// This function will be imported and used in src/index.ts
// It accepts the 'nexus' object and the 'strapi' instance
export default ({ nexus, strapi }: { nexus: any, strapi: any }) => ({
  types: [
    nexus.extendType({
      type: 'Dish',
      definition(t: any) {
        // Add new fields to the Dish type to show discount info
        t.float('originalPrice');
        t.boolean('hasActiveDiscount');

        // Override baseChefFee to apply the best discount
        t.float('baseChefFee', {
          async resolve(dish: any) {

            // We must fetch the dish with its chef relation to find the rule
            const fullDish = await strapi.entityService.findOne('api::dish.dish', dish.id, { populate: ['chef'] });
            if (!fullDish?.chef) return dish.baseChefFee;
            
            const bestRule = await findBestActiveRule(strapi, fullDish.chef.documentId);
             console.log("base rule", bestRule);
            if (!bestRule) return dish.baseChefFee;
            
            return calculateDiscount(dish.baseChefFee, bestRule);
          }
        });
        
        // Override feePerPerson to apply the best discount
        t.float('feePerPerson', {
          async resolve(dish: any) {
            const fullDish = await strapi.entityService.findOne('api::dish.dish', dish.id, { populate: ['chef'] });
            if (!fullDish?.chef) return dish.feePerPerson;

            const bestRule = await findBestActiveRule(strapi, fullDish.chef.documentId);
           
            if (!bestRule) return dish.feePerPerson;

            return calculateDiscount(dish.feePerPerson, bestRule);
          }
        });

        // Resolver for originalPrice
        t.float('originalPrice', {
          async resolve(dish: any) {
            const fullDish = await strapi.entityService.findOne('api::dish.dish', dish.id, { populate: ['chef'] });
            if (!fullDish?.chef) return null;

            const bestRule = await findBestActiveRule(strapi, fullDish.chef.documentId);
            // If there's a rule, show the original price. Otherwise, null.
            return bestRule ? dish.baseChefFee : null;
          }
        });
        
        // Resolver for hasActiveDiscount
        t.boolean('hasActiveDiscount', {
          async resolve(dish: any) {
            const fullDish = await strapi.entityService.findOne('api::dish.dish', dish.id, { populate: ['chef'] });
            if (!fullDish?.chef) return false;

            const bestRule = await findBestActiveRule(strapi, fullDish.chef.documentId);
            return !!bestRule;
          }
        });
      }
    })
  ]
});
