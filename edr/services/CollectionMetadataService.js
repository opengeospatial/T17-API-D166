/* eslint-disable no-unused-vars */
const Service = require('./Service');
const GetCollectionsData = require('../models/GetCollectionsData');
const Negotiator = require('negotiator');
const Modeler = require('../models/Modeler');

/**
* List data instances of {collectionId}
* This will provide list of the avalable instances of the collection Use content negotiation to request HTML or JSON.
*
* collectionId String Identifier (id) of a specific collection
* f String format to return the data response in (optional)
* returns instances
* */
const getCollectionInstances = ({ collectionId, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getCollectionInstances....");
      resolve(Service.successResponse({
        collectionId,
        f,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List query types supported by the collection
* This will provide information about the query types that are supported by the chosen collection Use content negotiation to request HTML or JSON.
*
* collectionId String Identifier (id) of a specific collection
* f String format to return the data response in (optional)
* returns collection
* */
const getQueries = (request, { collectionId, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getQueries....");
//      resolve(Service.successResponse({
//        collectionId,
//        f,
//      }));
      var retdata=undefined;
      var preferMediaType=negotiateMediaType(request);
      let f=request.query["f"];
      if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
        preferMediaType=f;
      }
      if (preferMediaType==="text/html"){
        retdata=await GetCollectionsData.getCollectionsDataHtml({"dataset":collectionId});
      }else{
        retdata=await GetCollectionsData.getCollectionsDataJson({"dataset":collectionId});
      }
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }

    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List available location identifers for the collection
* List the locations available for the collection
*
* collectionId String Identifier (id) of a specific collection
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth): * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional) The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`. For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge). If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box. If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* returns edrFeatureCollectionGeoJSON
* */
const listCollectionDataLocations = (request, { collectionId, bbox, datetime }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In listCollectionDataLocations....");

//      resolve(Service.successResponse({
//        collectionId,
//        bbox,
//        datetime,
//      }));
      console.log("First CollectionId=");
      console.log(collectionId);
      let retdata=await Modeler.getLocations(request,{"collectionId":collectionId, "bbox":bbox, "datetime":datetime});
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }

    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List available items
* List the items available in the collection accessible via a unique identifier
*
* collectionId String Identifier (id) of a specific collection
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth): * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional) The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`. For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge). If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box. If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* returns edrFeatureCollectionGeoJSON
* */
const listDataItems = (request, { collectionId, bbox, datetime }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In listDataItems....");
//      resolve(Service.successResponse({
//        collectionId,
//        bbox,
//        datetime,
//      }));
      console.log("First CollectionId=");
      console.log(collectionId);
      let retdata=await Modeler.getFeatures(request,{"collectionId":collectionId, "bbox":bbox, "datetime":datetime});
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);


//====Extra=======
const negotiateMediaType=(request)=>{
  let availableMediaTypes=["application/json","text/html"];
  let negotiator = new Negotiator(request);

  let preferMediaType=negotiator.mediaType(availableMediaTypes);
  return preferMediaType;
}


module.exports = {
  getCollectionInstances,
  getQueries,
  listCollectionDataLocations,
  listDataItems,
};
