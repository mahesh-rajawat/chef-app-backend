// src/utils/discountCalculation.ts

// import type { Strapi } from '@strapi/strapi';

/**
 * Calculates the final price after applying one rule.
 * @param {number} price - The original price.
 * @param {object} rule - The price rule object.
 * @returns {number} The new, discounted price.
 */
export function calculateDiscount(price: number, rule: any): number {
  let discountedPrice = price;
  if (rule.discountType === 'Percentage') {
    discountedPrice = price * (1 - (rule.discountAmount / 100));
  } else if (rule.discountType === 'Fixed') {
    discountedPrice = price - rule.discountAmount;
  }
  return Math.max(0, discountedPrice); // Ensure price doesn't go below zero
}

/**
 * Finds all active rules for a chef and returns the single rule
 * that provides the best (largest) discount.
 * @param {Strapi} strapi - The global Strapi instance.
 * @param {string} chefId - The ID of the chef to check for rules.
 * @returns {Promise<object | null>} The rule object that provides the best price, or null.
 */
export async function findBestActiveRule(strapi: any, chefId: string) {
  if (!chefId) {
    return null;
  }
  
  const now = new Date().toISOString();
  const { results: activeRules } = await strapi.service('api::price-rule.price-rule').find({
    filters: {
      isEnabled: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      chefs: {
      documentId: {
        $eq: chefId
      }
    },
    },
    populate: ['chefs'],
    pagination: { limit: -1 }
  });

  if (!activeRules || activeRules.length === 0) {
    return null;
  }
  console.log(`[Debug] findBestActiveRule: No rules are active today or for chefId: ${chefId}`, activeRules);
   
  // Find the rule that gives the best discount.
  // We do this by calculating the final price for each and finding the lowest.
  let bestRule = null;
  let lowestPrice = Infinity;

  // We need a dummy price to compare percentages vs. fixed amounts
  // 100 is a good baseline for comparison
  const basePrice = 100; 

  for (const rule of activeRules) {
    const discountedPrice = calculateDiscount(basePrice, rule);
    if (discountedPrice < lowestPrice) {
      lowestPrice = discountedPrice;
      bestRule = rule;
    }
  }

  return bestRule;
}
