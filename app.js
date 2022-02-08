import fetch from "node-fetch";
import { Headers } from "node-fetch";
import CONSTANTS from "./assets/settings.js";
import sendSMTP from "./sendSMTP.js";
import accessAGOL from "./accessAGOL.js";

const GetSensorData = async () => {
  const headers = new Headers();
  const endpoint = new URL(CONSTANTS.API_SIGFOX.URL + CONSTANTS.API_SIGFOX.DEVICES_QUERY.ENDPOINT);
  endpoint.search = new URLSearchParams(CONSTANTS.API_SIGFOX.DEVICES_QUERY.PARAMS).toString();
  const credentials = Buffer.from(CONSTANTS.API_SIGFOX.USER + ":" + CONSTANTS.API_SIGFOX.PASS).toString("base64");
  headers.set("Authorization", "Basic " + credentials);
  const response = await fetch(endpoint, { method: "GET", headers: headers });
  if (!response || response.status != 200) {
    throw `Invalid Sigfox HTTP response (${response.status})`;
  }
  const jsonResponse = await response.json();
  return jsonResponse.data;
};

const ConditionCheck = (sensors) => {
  return sensors.filter((sensor) => sensor.state === CONSTANTS.MISC_CONFIG.WARNING_STATE);
};

const NotificationEmail = (sensors) => {
  // Email
  const subject = `Sigfox Alert: ${sensors.length} Sensor(s) At Alert Level ${CONSTANTS.MISC_CONFIG.WARNING_STATE}`;
  let body = "";
  sensors.forEach((sensor) => {
    body += `\n ID:${sensor.id} Name:${sensor.name}`;
  });
  sendSMTP.sendEmail(subject, body);
};

const UpdateAGOLDataset = async (features, rows) => {
  const isExisting = (feature, onlyReturnExisting) => {
    const existingFeature = agolFeatures.find((agolFeature) => {
      return feature.attributes.SensorId === agolFeature.attributes.SensorId;
    });
    if (existingFeature && onlyReturnExisting) {
      feature.attributes.OBJECTID = existingFeature.attributes.OBJECTID;
      return feature;
    } else if (!existingFeature & !onlyReturnExisting) return feature;
    return false;
  };
  // Inject OBJECTID from any existing features in AGOL for the update function

  let agolFeatures = await accessAGOL.findExistingFeatures(
    CONSTANTS.AGOL_NOVEGEN.FEATURE_LAYER,
    features,
    "SensorId"
    );
    agolFeatures = agolFeatures.features;
    const newFeatures = features.filter((feature) => isExisting(feature, false));
    const existingFeatures = features.filter((feature) => isExisting(feature, true));
  // AGOL Feature Service
  if (existingFeatures.length) await accessAGOL.updateFeatureLayer(CONSTANTS.AGOL_NOVEGEN.FEATURE_LAYER, existingFeatures);
  // AGOL Feature Service
  if (newFeatures.length) await accessAGOL.addToFeatureLayer(CONSTANTS.AGOL_NOVEGEN.FEATURE_LAYER, newFeatures);
  // AGOL Table
  agolFeatures = await accessAGOL.findExistingFeatures(
    CONSTANTS.AGOL_NOVEGEN.FEATURE_LAYER,
    features,
    "SensorId"
  );
  agolFeatures = agolFeatures.features;
  rows.forEach(row=>{
    const existingFeature = agolFeatures.find((agolFeature) => {
      return row.attributes.SensorId === agolFeature.attributes.SensorId;
    });
    row.attributes.SensorGId = existingFeature.attributes.GlobalID
  })
  accessAGOL.addToFeatureLayer(CONSTANTS.AGOL_NOVEGEN.TABLE, rows)
};

const FormatForAGOL = async (sigfoxData) => {
  const features = [];
  const rows = [];
  // Format into Esri standard
  sigfoxData.forEach((sensor) => {
    // Features
    let feature = {
      geometry: { long: 0, lat: 0, spatialReference: { wkid: 4326 } },
      attributes: {},
    };
    // Not all sensors seem to have lastComputedLocation
    // (note that lat-lon is in 'lastComputedLocation', not 'location')
    if (sensor.lastComputedLocation) {
      feature.geometry.x = sensor.lastComputedLocation.lng;
      feature.geometry.y = sensor.lastComputedLocation.lat;
      feature.attributes.lon = sensor.lastComputedLocation.lng;
      feature.attributes.lat = sensor.lastComputedLocation.lat;
    }
    feature.attributes.PlacementDate = sensor.activationTime;
    feature.attributes.SensorId = sensor.id;
    feature.attributes.AssetOwner = sensor.lqi;
    feature.attributes.LastModTime = sensor.lastEditionTime;
    features.push(feature);

    // Rows
    const row = {attributes:{}}
    row.attributes = Object.assign({}, sensor)
    row.attributes.location = JSON.stringify(row.location)
    row.attributes.lastComputedLocation = JSON.stringify(row.lastComputedLocation)
    row.attributes.deviceType = JSON.stringify(row.deviceType)
    row.attributes.token = JSON.stringify(row.token)
    row.attributes.contract = JSON.stringify(row.contract)
    row.attributes.modemCertificate = JSON.stringify(row.modemCertificate)
    row.attributes.productCertificate = JSON.stringify(row.productCertificate)
    row.attributes.SensorId = sensor.id
    rows.push(row)
  });
  return {features, rows};
};

const init = async () => {
  // Auth
  await accessAGOL.createSessionAndToken(CONSTANTS.AGOL_NOVEGEN.CLIENT, CONSTANTS.AGOL_NOVEGEN.SECRET);
  const sigfoxData = await GetSensorData();
  const alertedSensors = ConditionCheck(sigfoxData);
  if (alertedSensors.length) NotificationEmail(alertedSensors);
  const {features, rows} = await FormatForAGOL(sigfoxData);
  UpdateAGOLDataset(features, rows);
};

init();
