const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const GetProviders = require('./GetProviders');
const models = require('../models');
/**
* fetch a single feature
* Fetch the feature with id `featureId` in the feature collection with id `collectionId`.  Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* featureId String local identifier of a feature
* returns featureGeoJSON
* */
const getFeature = async ({ collectionId, featureId }) => {
  let retdata={
    'payload':{
        'links': [],
        'properties': {}
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId2=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }
    retdata=await mls.getFeature({providers, collectionId, featureId });
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}
/**
* fetch features
* Fetch features of the feature collection with id `collectionId`.  Every feature in a dataset belongs to a collection. A dataset may consist of multiple feature collections. A feature collection is often a collection of features of a similar type, based on a common schema.  Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* limit Integer The optional limit parameter limits the number of items that are presented in the response document.  Only items are counted that are on the first level of the collection in the response document. Nested objects contained within the explicitly requested items shall not be counted.  Minimum = 1. Maximum = 10000. Default = 10. (optional)
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth):  * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional)  The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`.  For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge).  If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box.  If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots.  Examples:  * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\"  Only features that have a temporal property that intersects the value of `datetime` are selected.  If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* returns featureCollectionGeoJSON
* */
const getFeatures = async (request, { collectionId, limit, bbox, datetime }) => {
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getFeatures({providers, collectionId, startindex,limit, bbox, datetime });
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}

const getFeaturesByPosition = async (request, { collectionId, coords, z, datetime, parameterName, crs, f }) => {
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getFeaturesByPosition({providers, collectionId, coords, z, datetime, parameterName, crs, f, startindex });
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}

const getFeaturesByRadius = async (request, { collectionId, coords, within, withinUnits, z, datetime, parameterName, crs, f }) => {
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getFeaturesByRadius({ providers, collectionId, coords, within, withinUnits, z, datetime, parameterName, crs, f, startindex});
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}

const getFeaturesByArea = async (request, { collectionId, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f }) => {
  console.log("In Modeler -getFeaturesByArea- -coords=");
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getFeaturesByArea({ providers, collectionId, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f, startindex});
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}


/**
* get collections
* Fetch collections from a service, e.g. WFS202Capability
*
* collectionId String local identifier of a collection
* limit Integer The optional limit parameter limits the number of items that are presented in the response document.  Only items are counted that are on the first level of the collection in the response document. Nested objects contained within the explicitly requested items shall not be counted.  Minimum = 1. Maximum = 10000. Default = 10. (optional)
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth):  * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional)  The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`.  For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge).  If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box.  If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots.  Examples:  * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\"  Only features that have a temporal property that intersects the value of `datetime` are selected.  If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* returns featureCollectionGeoJSON
* */
const getCollections = async ({ resource, retdata, dataset }) => {
  let status=0;
  try{
    let providers=resource.providers;
    if (!providers || (typeof providers === "undefined") || (!Array.isArray(providers)) || (providers.length<1)){
      logger.log('warn','No provider for resource = '+resource.title);
      return {status,dataset};
    }
    let provider=providers[0];
    if (provider.type !== "collection"){
      logger.log('warn','The first provider is not for collection for resource = '+resource.title);
      return {status,dataset};
    }

    let providerName=provider.name;
    if ((!providerName || providerName === undefined)){
      logger.log('warn','The first provider has no provider name for resource = '+resource.title);
      return {status,dataset};
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      logger.log('warn','There is no model for provider = '+providerName);
      return {status,dataset};
    }

    return await mls.getCollections({provider, retdata, dataset});
//    return {status,retdata};
  }catch(excep_var){
    logger.log('warn','Internal Server Error for resource='+resource.title+'. Error-message: '+excep_var.message);
    return {status,retdata};
  }

}

const getLocations = async (request, { collectionId, limit, bbox, datetime, startindex }) => {
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getLocations({providers, collectionId, startindex,limit, bbox, datetime });
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}

const getFeaturesByLocationId = async (request, { collectionId, limit, locId, datetime, startindex }) => {
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'Not implemented'
  };
  console.log("collectionId=");
  console.log(collectionId);
  let payload=await GetProviders.getProviders({collectionId});
  if (payload.status_code != 200){
    retdata.status_code=payload.status_code;
    retdata.message=payload.message;
    return retdata;
  }
  try {
    let providers = payload.payload.providers;
    if ((!providers || providers === undefined || !Array.isArray(providers) || providers.length < 1 )){
      retdata.status=500;
      retdata.message='There is no "providers" section.';
      return retdata;
    }
    let providerName=providers[0].name;
    if ((!providerName || providerName === undefined)){
      retdata.status=500;
      retdata.message='The 1st of the "providers" section does not have a valid name.';
      return retdata;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      retdata.status=500;
      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
      return retdata;
    }

    let startindex=0;
    let sstartindex=request.query["startindex"];
    if (sstartindex!==undefined){
      startindex=parseInt(sstartindex);
    }
    let offset=request.query["offset"];
    if (offset!==undefined){
      startindex=parseInt(offset);
    }

    retdata=await mls.getFeaturesByLocationId({providers, collectionId, startindex,limit, locId, datetime });
  }catch(excep_var){
    retdata.status=500;
    retdata.message='Internal Server Error - '+excep_var.message;
  }
  return retdata;
}

module.exports = {
  getFeature,
  getFeatures,
  getCollections,
  getFeaturesByPosition,
  getFeaturesByRadius,
  getLocations,
  getFeaturesByLocationId,
  getFeaturesByArea
};
