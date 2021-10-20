const { Pool, Client } = require('pg');
const XmlUtils = require('../utils/XmlUtils');
const Cursor = require('pg-cursor');
const { promisify}=require('util');
const moment = require('moment');
const fetch=require('node-fetch');
const StringUtils = require('../utils/StringUtils');
const logger = require('../logger');
// const gml2json = require('gml2json');
//const gmlToGeoJSON=require("../utils/Formatter");
const formatter2=require("../utils/FormatterOgr2Ogr");
const formatter3 = require('../utils/FormatterOgrCmd');
// var Geojson = require('ol/format/geojson');
// var geoJson = new Geojson();

// const ogc-schemas=require("ogc-schemas");
// const w3c-schemas=require("w3c-schemas");
// const GeoJSON=require('ol/format/GeoJSON');
/**
* fetch a single feature
* Fetch the feature with id `featureId` in the feature collection with id `collectionId`.
*  Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* featureId String local identifier of a feature
* returns featureGeoJSON
* */
const sendResponse = (response, payload) => {
  /**
    * The default response-code is 200. We want to allow to change that. in That case,
    * payload will be an object consisting of a code and a payload. If not customized
    * send 200 and the payload as received in this method.
    */
  console.log('In GeoJSON payload=');
  //    console.log(payload);
  /*    console.log("writers=");
    console.log(Object.entries(writers).length);
    console.log(writers);

    let formats={};
    for (const [key, value] of Object.entries(writerList)) {
      console.log(`${key}: ${value}`);
      formats[value]=writers[key].sendResponse;
    }

*/
  response.status(payload.code || 200);
  const responsePayload = payload.payload !== undefined ? payload.payload : payload;
  if (responsePayload instanceof Object) {
    response.type('application/geo+json');
    response.json(responsePayload);
  } else {
    response.type('application/geo+json');
    response.end(responsePayload);
  }
};

module.exports = {
  sendResponse,
};
