// const fs = require('fs');
// const path = require('path');
// const logger = require('../logger');
const config = require('../config');

const getLandingPageJson = () => {
  let retdata=
{
  "keywords": [
    "Temperature",
    "Wind",
    "Point",
    "Trajectory"
  ],
  "provider": {
    "name": "name",
    "url": "url"
  },
  "contact": {
    "stateorprovince": "stateorprovince",
    "instructions": "instructions",
    "country": "country",
    "hours": "hours",
    "address": "address",
    "phone": "phone",
    "city": "city",
    "postalCode": "postalCode",
    "fax": "fax",
    "email": "email"
  },
  "title": "GMU OGC API-EDR for Meteorological data",
  "description": "Access to Meteorological data via a Web API that conforms to the OGC API Environmental Data Retrieval specification.",
  "links": [
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/",
      "rel": "self",
      "type": "application/json",
      "title": "this document"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/?f=text%2Fhtml",
      "rel": "alternate",
      "type": "text/html",
      "title": "this document in text/html"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/?f=application%2Fjson",
      "rel": "alternate",
      "type": "applicaton/json",
      "title": "this document in application/json"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/api",
      "rel": "service-desc",
      "type": "application/openapi+json;version=3.0",
      "title": "the API definition"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/api-docs",
      "rel": "service-doc",
      "type": "text/html",
      "title": "the API documentation"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/conformance",
      "rel": "conformance",
      "type": "application/json",
      "title": "OGC API conformance classes implemented by this server"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/conformance?f=text%2Fhtml",
      "rel": "conformance",
      "type": "text/html",
      "title": "OGC API conformance classes implemented by this server in text/html"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/conformance?f=application%2Fjson",
      "rel": "conformance",
      "type": "application/json",
      "title": "OGC API conformance classes implemented by this server in application/json"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/groups",
      "rel": "data",
      "type": "application/json",
      "title": "Information about the EDR groups"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/groups?f=text%2Fhtml",
      "rel": "data",
      "type": "text/html",
      "title": "Information about the EDR groups in text/html"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/groups?f=application%2Fjson",
      "rel": "data",
      "type": "application/json",
      "title": "Information about the EDR groups in application/json"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/collections",
      "rel": "data",
      "type": "application/json",
      "title": "Information about the EDR collections"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/collections?f=text%2Fhtml",
      "rel": "data",
      "type": "text/html",
      "title": "Information about the EDR collections in text/html"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/collections?f=application%2Fjson",
      "rel": "data",
      "type": "application/json",
      "title": "Information about the EDR collections in application/json"
    },
  ]
};
return retdata;
}
const getLandingPageHtml=()=>{
  let jsonData=getLandingPageJson();
  let retdata="<!DOCTYPE html><html><head><title>";
  retdata+=jsonData.title;
  retdata+="</title></head><body><h1>";
  retdata+=jsonData.title;
  retdata+="</h1>";
  retdata+="<br/><p>"+jsonData.description+"</p>";
  retdata+="<p>";
  retdata+="<ul>";
  let links=jsonData.links;
  for (var i=0;i<links.length;i++){
    let link=links[i];
    retdata+="<li>"
    retdata+="<a href=\"";
    retdata+=link.href;
    retdata+="\">"
    retdata+=link.title;
    retdata+="</a>";
    retdata+="</li>";
//    retdata+="<li><a href=\""+link.href"\">"+link.title+"</a><li>";
  }
  retdata+="</ul>";
  retdata+="</p></body></html>";
  return retdata;
}
module.exports = {
  getLandingPageJson,
  getLandingPageHtml
}
