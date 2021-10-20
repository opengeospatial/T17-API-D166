/* eslint-disable no-unused-vars */
const Service = require('./Service');
const logger = require('../logger');

const Negotiator = require('negotiator');


/*const ConformanceJson = require('../conf/ConformanceJson');
const ConformanceHtml = require('../conf/ConformanceHtml');
*/
const Conformance = require('../conf/Conformance');
/*const LandingPageJson = require('../conf/LandingPageJson');
const LandingPageHtml = require('../conf/LandingPageHtml');
*/
const LandingPage = require('../conf/LandingPage');
//const TestCollectionsJson = require('../conf/TestCollectionsJson');
const GetGroupsData = require('../models/GetGroupsData.js');
const GetCollectionsData = require('../models/GetCollectionsData.js');
/**
const TestGroupsJson = require('../conf/TestGroupsJson');
* landing page of this API
* The landing page provides links to the API definition, the Conformance statements and the metadata about the feature data in this dataset.
*
* f String format to return the data response in (optional)
* returns landingPage
* */
const getLandingPage = (request, { f }) => new Promise(
  async (resolve, reject) => {
/*    var payload=LandingPageJson;
    if (f=='text/html'){
      payload=LandingPageHtml;
    }
    */
    var payload=LandingPage.getLandingPageJson();
    if (f==='text/html'){
      payload=LandingPage.getLandingPageHtml();
    }else if ((f!=='application/json')){
      var preferMediaType=negotiateMediaType(request);
      if (preferMediaType==="text/html"){
        payload=LandingPage.getLandingPageHtml();
      }
    }
/*    if (f=='text/html'){
      payload=LandingPageHtml;
    }
    */

    try {
      console.log("In service Capabilities.getLandingPage");
      logger.info("Reach here for getLandingPage...");
      resolve(Service.successResponse(payload,200));
//      resolve(Service.successResponse({
//        f,
//      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* information about standards that this API conforms to
* list all requirements classes specified in a standard that the server conforms to
*
* f String format to return the data response in (optional)
* returns confClasses
* */
const getRequirementsClasses = (request, { f }) => new Promise(
  async (resolve, reject) => {
/*    var payload=ConformanceJson;
    if (f=='text/html'){
      payload=ConformanceHtml;
    }
    */
    var payload=Conformance.getConformanceJson();
    if (f==='text/html'){
      payload=Conformance.getConformanceHtml();
    }else if ((f!=='application/json')){
      var preferMediaType=negotiateMediaType(request);
      if (preferMediaType==="text/html"){
        payload=Conformance.getConformanceHtml();
      }
    }

    try {
      resolve(Service.successResponse(payload,200));
//      resolve(Service.successResponse({
//        f,
//      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* List of links to information available in the group
*
* groupId String Identifier (name) of a specific group
* f String format to return the data response in (optional)
* returns groups
* */
const groupInfomation = (request,{ groupId, f }) => new Promise(
  async (resolve, reject) => {
    try {
//      resolve(Service.successResponse({
//        groupId,
//        f,
//      }));
        var retdata=undefined;
        var preferMediaType=negotiateMediaType(request);
        let f=request.query["f"];
        if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
          preferMediaType=f;
        }
        if (preferMediaType==="text/html"){
          retdata=await GetGroupsData.getGroupsDataHtml(groupId);
        }else{
          retdata=await GetGroupsData.getGroupsDataJson(groupId);
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
* List the avialable collections from the service
*
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth): * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional) The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`. For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge). If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box. If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* f String format to return the data response in (optional)
* returns collections
* */
const listCollections = (request, { bbox, datetime, f }) => new Promise(
  async (resolve, reject) => {
//    var payload=TestCollectionsJson;
//    if (f=='text/html'){
//      payload="<!DOCTYPE html><html><head><title>EDR Service - Collections</title></head><body><h1>EDR Service - Collections</h1><ul><p>Groups</p></body></html>";
//    }
    try {
//      resolve(Service.successResponse(payload,200));
//      resolve(Service.successResponse({
//        bbox,
//        datetime,
//        f,
//      }));
      var retdata=undefined;
      var preferMediaType=negotiateMediaType(request);
      let f=request.query["f"];
      if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
        preferMediaType=f;
      }
      if (preferMediaType==="text/html"){
        retdata=await GetCollectionsData.getCollectionsDataHtml({bbox, datetime});
      }else{
        retdata=await GetCollectionsData.getCollectionsDataJson({bbox, datetime});
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
* Provide a list of avialable data groups
*
* f String format to return the data response in (optional)
* returns groups
* */
const listGroups = (request,{ f }) => new Promise(
  async (resolve, reject) => {
    try {
      var retdata=undefined;
      var preferMediaType=negotiateMediaType(request);
      let f=request.query["f"];
      if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
        preferMediaType=f;
      }
      if (preferMediaType==="text/html"){
        retdata=await GetGroupsData.getGroupsDataHtml();
      }else{
        retdata=await GetGroupsData.getGroupsDataJson();
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

const negotiateMediaType=(request)=>{
  let availableMediaTypes=["application/json","text/html"];
  let negotiator = new Negotiator(request);

  let preferMediaType=negotiator.mediaType(availableMediaTypes);
  return preferMediaType;
}

module.exports = {
  getLandingPage,
  getRequirementsClasses,
  groupInfomation,
  listCollections,
  listGroups,
};
