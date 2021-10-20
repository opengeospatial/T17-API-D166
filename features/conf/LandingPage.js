// const fs = require('fs');
// const path = require('path');
// const logger = require('../logger');
const config = require('../config');

const getLandingPageJson = () => {
  const retdata = {
    "title": "GMU OGC API-Features",
    "description": "Testbed 17 API-Feature service via a Web API that conforms to the OGC API Features specification.",
  "links": [
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/",
      "rel": "self",
      "type": "application/json",
      "title": "this document"
    },
    {
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/openapi",
      "rel": "service-desc",
      "type": "application/vnd.oai.openapi+json;version=3.0",
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
      "href": config.EXTERNALROOTURL+config.BASE_VERSION+"/collections",
      "rel": "data",
      "type": "application/json",
      "title": "Information about the feature collections"
      },
    ],
  };
  return retdata;
};
const getLandingPageHtml = () => {
  const jsonData = getLandingPageJson();
  let retdata = '<!DOCTYPE html><html><head><title>';
  retdata += jsonData.title;
  retdata += '</title></head><body><h1>';
  retdata += jsonData.title;
  retdata += '</h1>';
  retdata += `<br/><p>${jsonData.description}</p>`;
  retdata += '<p>';
  retdata += '<ul>';
  const { links } = jsonData;
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    retdata += '<li>';
    retdata += '<a href="';
    retdata += link.href;
    retdata += '">';
    retdata += link.title;
    retdata += '</a>';
    retdata += '</li>';
    //    retdata+="<li><a href=\""+link.href"\">"+link.title+"</a><li>";
  }
  retdata += '</ul>';
  retdata += '</p></body></html>';
  return retdata;
};
module.exports = {
  getLandingPageJson,
  getLandingPageHtml,
};
