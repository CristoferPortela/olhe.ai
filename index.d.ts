import {CoreApi, Strapi, Utils} from "@strapi/types";

declare module '@strapi/types' {
  // @ts-ignore
  declare function createCoreService<string, TService extends CoreApi.Service.Extendable<TUID>>(uid: TUID, cfg?: WithStrapiCallback<Utils.PartialWithThis<CoreApi.Service.Extendable<TUID> & TService>>): ({strapi}: {
    strapi: Strapi;
    // @ts-ignores
  }) => TService & CoreApi.Service.ContentType<string>;
}
