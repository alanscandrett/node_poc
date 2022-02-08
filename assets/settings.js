process.chdir('..')
import { config } from "dotenv";
const result = config();

if (result.error) {
  throw result.error;
}
// MISC
const MISC_CONFIG = {
  WARNING_STATE: 5,
};

// Email
const EMAIL = {
  SMTP_SERVER: "smtp.gmail.com",
  ACCOUNT: process.env.EMAIL_ACCOUNT,
  PASS: process.env.EMAIL_PASS,
  RECIPIENT: process.env.EMAIL_RECIPIENT,
  SMTP_HOST: process.env.SMTP_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  TEMPLATE_WARNING: `
        Subject: Sensor Warnings

        The following sensors are at a WARNING state:`,
};

// Devices API
const API_SIGFOX = {
  URL: "https://api.sigfox.com/v2/",
  USER: process.env.API_SIGFOX_USER,
  PASS: process.env.API_SIGFOX_PASS,
  DEVICES_QUERY: {
    ENDPOINT: "devices/?",
    PARAMS: {
      deep: "false",
      authorizations: "false",
      limit: "100",
      offset: "0",
    },
  },
};

// ArcGIS Online
const AGOL_NOVEGEN = {
  URL: "https://novegen-ie.maps.arcgis.com/",
  API_KEY: process.env.AGOL_API_KEY,
  USER: process.env.AGOL_NOVEGEN_USER,
  PASS: process.env.AGOL_NOVEGEN_PASS,
  CLIENT: process.env.AGOL_CLIENT_ID,
  SECRET: process.env.AGOL_CLIENT_SECRET,
  FEATURE_LAYER: "https://services7.arcgis.com/jVxJOd32zJSIJMUL/arcgis/rest/services/sigfox_iot_fs/FeatureServer/0",
  TABLE: "https://services7.arcgis.com/jVxJOd32zJSIJMUL/arcgis/rest/services/sigfox_iot_fs/FeatureServer/1"
};

export default { AGOL_NOVEGEN, API_SIGFOX, EMAIL, MISC_CONFIG };
