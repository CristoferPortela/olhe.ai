import {factories} from "@strapi/strapi";
import {sanitize} from "@strapi/utils";

export default {
  createSchedule(ctx, next) {
    return sanitize.contentAPI.output({ok: 'ok'}, strapi.contentType('api::schedule.schedule'))
  }
}
