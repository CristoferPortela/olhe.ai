/**
 * schedule router
 */

import {factories} from '@strapi/strapi';

export default factories.createCoreRouter('api::schedule.schedule', {
  only: ['find', 'findOne', 'create'],
  config: {
    create: {
      auth: false,
    }
  }
});
