const logger = require('../logger');
const {Pool, Client}=require('pg');
const StringUtils=require('../utils/StringUtils');
const Cursor=require('pg-cursor');
const {promisify}=require('util');
const moment=require('moment');
const fetch=require('node-fetch');
//const gml2json = require('gml2json');
//const gmlToGeoJSON=require("../utils/Formatter");
const formatter2=require("../utils/FormatterOgr2Ogr");
const formatter3=require("../utils/FormatterOgrCmd");
const config = require('../config');
const xmldom = require('xmldom');


function ciEquals(a, b) {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
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

* extra parameters
* startindex - starting record to return (default 0)
* resulttype - return results or hit limit (default results)
* properties - list of tuples (name, value)
* sortby - list of dicts (property, order)
* select_properties - list of property names
* skip_geometry - bool of whether to skip geometry (default False)
* q - full-text search term(s)
* */
/*startindex=0, limit=10, resulttype='results',
            bbox=[], datetime_=None, properties=[], sortby=[],
            select_properties=[], skip_geometry=False, q=None
            */
const getCollections = async ({ provider, retdata, dataset }) => {
  let status=0;
  try{
    let connectionString=provider.data;
    if ((!connectionString || connectionString === undefined)){
      logger.log('error','There is no data for provider = '+provider.name);
      return {status,retdata};
    }
    if ((!provider.type || provider.type !== "collection")){
      logger.log('error','Wrong type ('+provider.type+') from the provider = '+provider.name);
      return {status,retdata};
    }
    let strcap= await getCapabilitiesFromURLAsString(connectionString);
    let parser=new xmldom.DOMParser();
    const doc=parser.parseFromString(strcap);
    const elem=doc.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','FeatureTypeList');
    const elem1=elem[0];
    const fts=elem1.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','FeatureType');
    let nft=fts.length;
    for (var i = 0; i < nft; i++){
      const ft = fts[i];
      const ftname=ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Name');
      const ftnameval=ftname[0].childNodes[0].nodeValue;

      const ftitle=ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Title');
      const ftitleval=ftitle[0].childNodes[0].nodeValue;

      const fbbox=ft.getElementsByTagNameNS('http://www.opengis.net/ows/1.1','WGS84BoundingBox');
      const fbboxll=fbbox[0].getElementsByTagNameNS('http://www.opengis.net/ows/1.1','LowerCorner');
      const fbboxllval=fbboxll[0].childNodes[0].nodeValue;

      const fbboxur=fbbox[0].getElementsByTagNameNS('http://www.opengis.net/ows/1.1','UpperCorner');
      const fbboxurval=fbboxur[0].childNodes[0].nodeValue;

      let acollection = {'links': []};
      acollection['id'] = ftnameval;
      acollection['title'] = ftitleval;
      acollection['description'] = ftitleval;
      acollection['keywords'] = "";

      let bboxstr = fbboxllval.replace(" ",",")+","+fbboxurval.replace(" ",",");
      let bboxstrarr=bboxstr.split(',');
      let bboxarr=[];
      for (var j=0; j<bboxstrarr.length;j++){
        bboxarr.push(parseFloat(bboxstrarr[j].trim()));
      }
      acollection['extent'] = {
          'spatial': {
              'bbox': [bboxarr]
          }
      }
      acollection['extent']['spatial']['crs'] = "http://www.opengis.net/def/crs/OGC/1.3/CRS84";

      acollection['links'].push({
          'type': 'application/json',
          'rel': 'self',
          'title': 'This document as JSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(ftnameval)+'?f=application%2Fjson'
      });

      acollection['links'].push({
          'type': 'text/html',
          'rel': 'alternate',
          'title': 'This document as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(ftnameval)+'?f=text%2Fhtml'
      });

      acollection['links'].push({
          'type': 'application/geo+json',
          'rel': 'items',
          'title': 'This resource - '+ftnameval+' in application/geo+json',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(ftnameval)+'/items?f=application%2Fgeo%2Bjson'
      });
      acollection['links'].push({
          'type': 'text/html',
          'rel': 'items',
          'title': 'This resource - '+ftnameval+' in HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(ftnameval)+'/items?f=text%2Fhtml'
      });

      if (typeof dataset !== 'undefined'){
        if (ciEquals(dataset,ftnameval)) {
          retdata.payload=acollection;
          status=1;
          return {status,retdata};
        }
      }
      else retdata.payload.collections.push(acollection);

//      console.log(ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Name')[0].ndeValue);
//      console.log(ft);
    }
  }catch(excep_var){
    logger.log('error','Internal Server Error for provider='+provider.name+'. Error-message: '+excep_var.message);
    return {status,retdata};
  }
  return {status,retdata};
}

const getCollectionAsProvider = async ({ provider, dataset }) => {
  let retproviders=[];
  if (typeof dataset === 'undefined'){
    logger.log('error','collection id is required');
    return retproviders;
  }
  try{
    let connectionString=provider.data;
    if ((!connectionString || connectionString === undefined)){
      logger.log('error','There is no data for provider = '+provider.name);
      return retproviders;
    }
    if ((!provider.type || provider.type !== "collection")){
      logger.log('error','Wrong type ('+provider.type+') from the provider = '+provider.name);
      return retproviders;
    }
    let strcap= await getCapabilitiesFromURLAsString(connectionString);
    let parser=new xmldom.DOMParser();
    const doc=parser.parseFromString(strcap);

    const fop=getOperationFromCapDoc(doc,"GetFeature");

    if (typeof fop === 'undefined') {
      logger.log('error','no operation found');
      return retproviders;
    }

    const fhttp=fop.getElementsByTagNameNS('http://www.opengis.net/ows/1.1','Get');
    if (typeof fhttp === 'undefined') {
      logger.log('error','no HTTP GET operation found');
      return retproviders;
    }
    const fhttpurl=fhttp[0].getAttributeNS('http://www.w3.org/1999/xlink','href');


    const elem=doc.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','FeatureTypeList');
    const elem1=elem[0];
    const fts=elem1.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','FeatureType');
    let nft=fts.length;
    for (var i = 0; i < nft; i++){
      const ft = fts[i];
      const ftname=ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Name');
      const ftnameval=ftname[0].childNodes[0].nodeValue;

      const ftitle=ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Title');
      const ftitleval=ftitle[0].childNodes[0].nodeValue;

      if (ciEquals(dataset,ftnameval)) {
        let aprovider=
        {
          "type": "feature",
          "name": "WFS202",
          "typename": ftnameval,
          "data": fhttpurl,
          "id_field":"gml_id"
        }
        if (provider.removeprefix !== undefined){
          aprovider["removeprefix"]=provider.removeprefix;
        }
        retproviders.push(aprovider);
        return retproviders;
      }

//      console.log(ft.getElementsByTagNameNS('http://www.opengis.net/wfs/2.0','Name')[0].ndeValue);
//      console.log(ft);
    }
  }catch(excep_var){
    logger.log('error','Internal Server Error for provider='+provider.name+'. Error-message: '+excep_var.message);
    return {status,retdata};
  }
  return {status,retdata};
}

const getOperationFromCapDoc =(doc,name)=>{
  let retnode=undefined;
  try{
    const fmeta=doc.getElementsByTagNameNS('http://www.opengis.net/ows/1.1','OperationsMetadata');
    const fops=fmeta[0].getElementsByTagNameNS('http://www.opengis.net/ows/1.1','Operation');
    let nops=fops.length;
    for (var i = 0; i < nops; i++){
      let op=fops[i];
      const nsatt=op.getAttribute('name');
      if (nsatt === name){
        return op;
      }
    }

  }catch(excep_var){
    logger.log('error','Internal Server Error when finding '+name+'. Error-message: '+excep_var.message);
    return retnode;
  }
  return retnode;
}
const getCapabilitiesFromURLAsString = async (aurl) =>{
  let response = await fetch(aurl);

  if (!response.ok){
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  let text = await response.text(); // await ensures variable has fulfilled Promise
//  console.log(text)
  return text;
}


module.exports = {
  getCollections,
  getCollectionAsProvider
};
