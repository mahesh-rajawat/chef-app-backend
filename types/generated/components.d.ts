import type { Schema, Struct } from '@strapi/strapi';

export interface ChefAppAddress extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_addresses';
  info: {
    displayName: 'address';
  };
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String;
    postalCode: Schema.Attribute.String & Schema.Attribute.Required;
    street: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ChefAppAvailability extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_availabilities';
  info: {
    displayName: 'Holidays';
  };
  attributes: {
    date: Schema.Attribute.Date;
  };
}

export interface ChefAppIngredient extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_ingredients';
  info: {
    displayName: 'ingredient';
  };
  attributes: {
    name: Schema.Attribute.String;
    perPerson: Schema.Attribute.Boolean;
    quantity: Schema.Attribute.Decimal;
    unit: Schema.Attribute.String;
  };
}

export interface ChefAppNutrition extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_nutritions';
  info: {
    displayName: 'Nutrition';
  };
  attributes: {
    calories: Schema.Attribute.String;
    carbs: Schema.Attribute.String;
    fats: Schema.Attribute.String;
    protein: Schema.Attribute.String;
  };
}

export interface ChefAppWeeklySchedule extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_weekly_schedules';
  info: {
    displayName: 'Weekly Schedule';
  };
  attributes: {
    dayOfWeek: Schema.Attribute.Enumeration<
      [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]
    >;
    isAvailable: Schema.Attribute.Boolean;
    timeSlots: Schema.Attribute.Text;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'chef-app.address': ChefAppAddress;
      'chef-app.availability': ChefAppAvailability;
      'chef-app.ingredient': ChefAppIngredient;
      'chef-app.nutrition': ChefAppNutrition;
      'chef-app.weekly-schedule': ChefAppWeeklySchedule;
    }
  }
}
