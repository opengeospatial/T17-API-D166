/* eslint-disable no-unused-vars */
const Service = require('./Service');
const LandingPage = require('../conf/LandingPage');
const Conformance = require('../conf/Conformance');
const GetCollectionsData = require('../models/GetCollectionsData.js');
const Negotiator = require('negotiator');


/**
* describe the feature collection with id `collectionId`
*
* collectionId String local identifier of a collection
* returns collection
* */
const describeCollection = (request, { collectionId }) => new Promise(
  async (resolve, reject) => {
    try {
      var retdata=undefined;
      var preferMediaType=negotiateMediaType(request);
      let f=request.query["f"];
      if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
        preferMediaType=f;
      }
      if (preferMediaType==="text/html"){
        retdata=await GetCollectionsData.getCollectionsDataHtml(collectionId);
      }else{
        retdata=await GetCollectionsData.getCollectionsDataJson(collectionId);
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
* the feature collections in the dataset
*
* returns collections
* */
const getCollections = (request) => new Promise(
  async (resolve, reject) => {
    try {
      var retdata=undefined;
      var preferMediaType=negotiateMediaType(request);
      let f=request.query["f"];
      if ((f!==undefined) && ((f==="application/json")||(f==="text/html"))){
        preferMediaType=f;
      }
      if (preferMediaType==="text/html"){
        retdata=await GetCollectionsData.getCollectionsDataHtml();
      }else{
        retdata=await GetCollectionsData.getCollectionsDataJson();
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
* information about specifications that this API conforms to
* A list of all conformance classes specified in a standard that the server conforms to.
*
* returns confClasses
* */
const getConformanceDeclaration = () => new Promise(
  async (resolve, reject) => {
    var payload=Conformance.getConformanceJson();
/*    if (f=='text/html'){
      payload=ConformanceHtml;
    }
    */
    try {
      resolve(Service.successResponse(payload,200));
/*      resolve(Service.successResponse({
      }));
      */
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* landing page
* The landing page provides links to the API definition, the conformance statements and to the feature collections in this dataset.
*
* returns landingPage
* */
const getLandingPage = (request) => new Promise(
  async (resolve, reject) => {
    var payload=LandingPage.getLandingPageJson();
    var preferMediaType=negotiateMediaType(request);
    if (preferMediaType==="text/html"){
      payload=LandingPage.getLandingPageHtml();
    }
/*    if (f=='text/html'){
      payload=LandingPageHtml;
    }
    */
    try {
      resolve(Service.successResponse(payload,200));
/*      resolve(Service.successResponse({
      }));
*/
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
  describeCollection,
  getCollections,
  getConformanceDeclaration,
  getLandingPage,
};
