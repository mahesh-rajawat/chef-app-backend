// src/utils/filters.ts

// This is a simple converter. For a production app, you might need a more robust one
// that handles all of Strapi's filter operators.
export const convertGqlFiltersToDbFilters = (filters: any): any => {
  if (!filters) {
    return {};
  }
  const dbFilters: { [key: string]: any } = {};
  const OPERATORS = ['eq', 'ne', 'in', 'nin', 'lt', 'lte', 'gt', 'gte', 'contains', 'ncontains', 'containsi', 'ncontainsi'];

  for (const key in filters) {
    const filterValue = filters[key];

    if (typeof filterValue === 'object' && filterValue !== null) {
      const innerKeys = Object.keys(filterValue);
      const isOperatorObject = innerKeys.length === 1 && OPERATORS.includes(innerKeys[0]);

      if (isOperatorObject) {
        const operator = innerKeys[0];
        const value = filterValue[operator];
        dbFilters[key] = { [`$${operator}`]: value };
      } else {
        dbFilters[key] = convertGqlFiltersToDbFilters(filterValue);
      }
    } else {
      dbFilters[key] = { $eq: filterValue };
    }
  }
  return dbFilters;
};
