import type { Schema, Struct } from '@strapi/strapi';

export interface ChefAppAvailability extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_availabilities';
  info: {
    displayName: 'Holidays';
  };
  attributes: {
    date: Schema.Attribute.Date;
  };
}

export interface ChefAppDiscussionEntry extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_discussion_entries';
  info: {
    displayName: 'DiscussionEntry';
  };
  attributes: {
    author: Schema.Attribute.Enumeration<['Customer', 'ChefLink Team']> &
      Schema.Attribute.Required;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    timestamp: Schema.Attribute.DateTime;
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

export interface ChefAppVerificationChecks extends Struct.ComponentSchema {
  collectionName: 'components_chef_app_verification_checks';
  info: {
    displayName: 'Verification Checks';
  };
  attributes: {
    backgroundCheck: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    foodSafety: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    identity: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    insurance: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
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
      'chef-app.availability': ChefAppAvailability;
      'chef-app.discussion-entry': ChefAppDiscussionEntry;
      'chef-app.ingredient': ChefAppIngredient;
      'chef-app.nutrition': ChefAppNutrition;
      'chef-app.verification-checks': ChefAppVerificationChecks;
      'chef-app.weekly-schedule': ChefAppWeeklySchedule;
    }
  }
}
