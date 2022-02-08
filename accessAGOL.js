import fetch from "node-fetch";
import FormData from "isomorphic-form-data";
import arcgisRestRequest from "@esri/arcgis-rest-request";
arcgisRestRequest.setDefaultRequestOptions({ fetch, FormData });
import { ApiKey } from "@esri/arcgis-rest-auth";
import { addFeatures, updateFeatures, queryFeatures } from "@esri/arcgis-rest-feature-layer";
import { ApplicationSession } from "@esri/arcgis-rest-auth";
let authentication;

const accessAGOL = {
  createSessionAndToken: async function (clientId, clientSecret) {
    const session = new ApplicationSession({
      clientId: clientId,
      clientSecret: clientSecret,
    });
    const token = await session.getToken("https://www.arcgis.com/sharing/generateToken");
    authentication = new ApiKey({
      key: token,
    });
  },
  updateFeatureLayer: async function (url, data) {
    const response = await updateFeatures({
      url: url,
      authentication,
      features: data,
    }).catch((err) => {
      console.error(err);
    });
    console.info(response);
    return response;
  },
  addToFeatureLayer: async function (url, data) {
    const response = await addFeatures({
      url: url,
      authentication,
      features: data,
    }).catch((err) => {
      console.error(err);
    });
    console.info(response);
    return response;
  },

  findExistingFeatures: async function (url, data, attributeName) {
    const sensorIds = data.map((feature) => `'${feature.attributes[attributeName]}'`).join(","); // should refactor to generic
    const existingFeatures = await queryFeatures({
      url: url,
      authentication,
      where: `SensorId IN (${sensorIds})`,
      outFields: "objectid, SensorId, GlobalID",
    });
    return existingFeatures;
  },
};

export default accessAGOL;
