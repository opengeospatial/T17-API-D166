const { Client } = require('pg');
const Cursor = require('pg-cursor');
const { promisify } = require('util');
const moment = require('moment');
const Terraformer = require('@terraformer/wkt');
const config = require('../config');
const StringUtils = require('../utils/StringUtils');

const getCurrentUTCTimeStr = () => {
  const now = new Date();
  /*  var utc_timestamp = Date.UTC(now.getFullYear(),now.getMonth(), now.getDate() ,
        now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  */
  const strtime = now.toISOString();
  return strtime;
};

const createSelectFieldList = (idfield, columns) => {
  const retcolumns = [];
  try {
    for (let i = 0; i < columns.length; i += 1) {
      const cell = columns[i];
      if (cell === idfield) { retcolumns.push(`${cell} as id`); } else retcolumns.push(cell);
    }
  } catch (exceptVar) {
    console.log(exceptVar.message);
  }
  return retcolumns;
};

const getDatabaseBaseInfo = async (dbclient, table) => {
  const retData = {
    status_code: 200,
    message: 'success',
    columns: [],
    fields: [],
  };
  const query = {
    // give the query a unique name
    name: 'fetch-dbinfo',
    text: "SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = $1 and udt_name != 'geometry'",
    values: [table],
  };
  try {
    const res = await dbclient.query(query);
    for (let i = 0; i < res.rowCount; i += 1) {
      retData.columns.push(res.rows[i].column_name);
      const arow = { name: res.rows[i].column_name, type: res.rows[i].udt_name };
      retData.fields.push(arow);
    }
    return retData;
  } catch (err) {
    retData.message = err.message;
    retData.status_code = 500;
    return retData;
  }
};

/* eslint-disable no-param-reassign */
const formResponseFeature = (rowdata, providers) => {
  if (!rowdata) return {};
  const feature = {
    type: 'Feature',
    geometry: null,
    properties: {},
    id: null,
  };
  if (rowdata.geometry === undefined) {
    feature.geometry = null;
  } else {
    feature.geometry = JSON.parse(rowdata.geometry);
    delete rowdata.geometry;
  }
  feature.properties = rowdata;
  if (feature.properties[providers[0].title_field]
     || (feature.properties[providers[0].title_field] !== undefined)) {
    feature.properties.title = feature.properties[providers[0].title_field];
  }
  feature.id = String(feature.properties[providers[0].id_field]);
  return feature;
};
/* eslint-enable no-param-reassign */

/**
* fetch a single feature
* Fetch the feature with id `featureId` in the feature collection with id
 `collectionId`. Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* featureId String local identifier of a feature
* returns featureGeoJSON
* */
// const getFeature = async ({ providers, collectionId, featureId }) => {
const getFeature = async ({ providers, collectionId, featureId }) => {
  const retdata = {
    payload: {
      links: [],
      properties: {},
    },
    status_code: 500,
    message: 'Not implemented - fff',
  };
  let client;
  const connectionString = providers[0].data;
  const thetable = providers[0].table;
  const geomfield = providers[0].geometry.geom_field;
  const idfield = providers[0].id_field;
  let geomformat = providers[0].geometry.geom_format;
  if (geomformat === undefined || !geomformat) { geomformat = 'wkt'; } // default to wkt. Other formats: ewkt, wkb, ewkb
  try {
    client = new Client({
      connectionString,
    });
    client.connect();
    const dbinfo = await getDatabaseBaseInfo(client, thetable);
    let queryText = `SELECT ${dbinfo.columns.join()}`;// ;createSelectFieldList(idfield,dbinfo.columns).join();
    queryText += ', ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat, 'wkt')) {
      queryText += 'ST_GeomFromText';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'ewkt')) {
      queryText += 'ST_GeomFromEWKT';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'wkb')) {
      queryText += 'ST_GeomFromWKB';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'ewkb')) {
      queryText += 'ST_GeomFromEWKB';
    } else {
      // collectionId,
      retdata.status_code = 500;
      retdata.message = `Unknow geometry format - ${geomformat}`;
      return retdata;
    }
    queryText += `(${geomfield})) AS geometry`;
    queryText += ` FROM ${thetable}`;
    queryText += ` WHERE ${idfield} = $1 LIMIT 10`;

    const queryValues = [featureId];
    const query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    };
    const res = await client.query(query);
    if (res.rowCount < 1) {
      retdata.status_code = 404;
      retdata.message = `No feature found for id=${featureId}`;
      return retdata;
    }
    if (res.rowCount > 1) {
      retdata.status_code = 500;
      retdata.message = `More than one feature is found for id=${featureId}`;
      return retdata;
    }
    const feature = formResponseFeature(res.rows[0], providers);
    retdata.payload = feature;
    retdata.status_code = 200;
    retdata.message = 'success';
    return retdata;
  } catch (excepVar) {
    retdata.status_code = 500;
    retdata.message = excepVar.message;
  } finally {
    if (client !== undefined) { try { client.end(); } catch (err) { console.log(err.message); } }
  }

  return retdata;
};

/**
 * parameters
 *   bbox - array of values either 4 or 6
 *   datetime - 'time/time' or 'time'
* */
const formWhereClause = (providers, bbox, datetime) => {
  const where_clause = [];

  const geomfield = providers[0].geometry.geom_field;

  if (bbox) {
    let bboxstr = bbox;
    if (Array.isArray(bbox)) {
      bboxstr = bbox.join(',');
    }
    where_clause.push(`${geomfield} && ST_MakeEnvelope(${bboxstr})`);
  }

  if (providers[0].time_field) {
    let time_format=providers[0].time_field.time_format;
    if (time_format === 'interval') {
      let fstarttime=providers[0].time_field.time_start;
      let fendtime=providers[0].time_field.time_end;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(fstarttime+" <= timestamp '"+ttime+"'");
          where_clause.push(fendtime+" >= timestamp '"+ttime+"'");
        }
      }
    }else {
      let ftime=providers[0].time_field.datetime;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(ftime+" <= timestamp '"+ttime+"'");
          where_clause.push(ftime+" >= timestamp '"+ttime+"'");
        }
      }
    }
  }
  if (where_clause.length>0) return "WHERE "+where_clause.join(' AND ');
  else return '';
}

/**
* fetch features
* Fetch features of the feature collection with id `collectionId`.
*  Every feature in a dataset belongs to a collection. A dataset may consist
 of multiple feature collections. A feature collection is often a collection
  of features of a similar type, based on a common schema.  Use content
   negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* limit Integer The optional limit parameter limits the number of items that
 are presented in the response document.  Only items are counted that are on
 the first level of the collection in the response document. Nested objects
 contained within the explicitly requested items shall not be counted.
   Minimum = 1. Maximum = 10000. Default = 10. (optional)
* bbox oneOf<object,object> Only features that have a geometry that intersects
 the bounding box are selected. The bounding box is provided as four or six
  numbers, depending on whether the coordinate reference system includes a
   vertical axis (height or depth):
   * Lower left corner, coordinate axis 1
   * Lower left corner, coordinate axis 2
   * Minimum value, coordinate axis 3 (optional)
   * Upper right corner, coordinate axis 1
   * Upper right corner, coordinate axis 2
   * Maximum value, coordinate axis 3 (optional)
  The coordinate reference system of the values is WGS 84 longitude/latitude
   (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate
   reference system is specified in the parameter `bbox-crs`.  For WGS 84
   longitude/latitude the values are in most cases the sequence of minimum
   longitude, minimum latitude, maximum longitude and maximum latitude.
   However, in cases where the box spans the antimeridian the first value
   (west-most box edge) is larger than the third value (east-most box edge).
    If the vertical axis is included, the third and the sixth number are the
    bottom and the top of the 3-dimensional bounding box.  If a feature has
    multiple spatial geometry properties, it is the decision of the server
    whether only a single spatial geometry property is used to determine the
    extent or all relevant geometries. (optional)
* datetime String Either a date-time or an interval, open or closed. Date and
  time expressions adhere to RFC 3339. Open intervals are expressed using
  double-dots.  Examples:
  * A date-time: \"2018-02-12T23:20:50Z\"
  * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\"
  * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\"
    Only features that have a temporal property that intersects the value of
    `datetime` are selected.  If a feature has multiple temporal properties,
    it is the decision of the server whether only a single temporal property
    is used to determine the extent or all relevant temporal properties. (optional)
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
/* startindex=0, limit=10, resulttype='results',
            bbox=[], datetime_=None, properties=[], sortby=[],
            select_properties=[], skip_geometry=False, q=None
            */
/* , resulttype, properties, sortby, select_properties,skip_geometry, q */
const getFeatures = async ({
  providers, collectionId, limit, bbox, datetime,
  startindex,
}) => {
  console.log('In getFeatures of PostGIS....');
  const retdata = {
    payload: {
      features: [],
      links: [],
    },
    status_code: 500,
    message: 'PostGIS Not implemented',
  };
  let client;
  const connectionString = providers[0].data;
  const thetable = providers[0].table;
  const geomfield = providers[0].geometry.geom_field;
  const idfield = providers[0].id_field;
  let geomformat = providers[0].geometry.geom_format;
  if (geomformat === undefined || !geomformat) {
    geomformat = 'wkt';
  } // default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit = 10;
  if ((limit !== undefined) && !!limit) alimit = parseInt(limit, 10);
  if (!alimit) alimit = 10; // not valid integer
  if (alimit < 0) alimit = 10;
  if (alimit > 1000) alimit = 1000;

  let astartindex = 0;
  if ((startindex !== undefined) && !!startindex) astartindex = parseInt(startindex, 10);
  if (!astartindex) astartindex = 0; // not valid integer
  if (astartindex < 0) astartindex = 0;

  try {
    client = new Client({
      connectionString,
    });
    client.connect();
    const dbinfo = await getDatabaseBaseInfo(client, thetable);
    let queryText = `SELECT ${dbinfo.columns.join()}`;// createSelectFieldList(idfield,dbinfo.columns).join();
    queryText += ', ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat, 'wkt')) {
      queryText += 'ST_GeomFromText';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'ewkt')) {
      queryText += 'ST_GeomFromEWKT';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'wkb')) {
      queryText += 'ST_GeomFromWKB';
    } else if (StringUtils.equalIgnoreCase(geomformat, 'ewkb')) {
      queryText += 'ST_GeomFromEWKB';
    } else {
      retdata.status_code = 500;
      retdata.message = `Unknow geometry format - ${geomformat}`;
      return retdata;
    }
    queryText += `(${geomfield})) AS geometry`;
    queryText += ` FROM ${thetable}`;
    queryText += ` ${formWhereClause(providers, bbox, datetime)}`;
    queryText += ' LIMIT $1 OFFSET $2';
    const queryValues = [alimit, astartindex];
    const query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    };
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
    //    let res=await client.query(query);
    const cursor = client.query(new Cursor(queryText, queryValues));
    const featureCollection = {
      type: 'FeatureCollection',
      links: [],
      features: [],
    };
    let rows = await cursor.readAsync(1);

    let numberret = 0;
    while (rows.length) {
      const feature = formResponseFeature(rows[0], providers);
      featureCollection.features.push(feature);
      rows = await cursor.readAsync(1);
      numberret += 1;
    }
    featureCollection.numberReturned = numberret;
    featureCollection.timeStamp = getCurrentUTCTimeStr();
    /*    for (var i=0; i<res.rowCount; i++){
      let feature=formResponseFeature(res.rows[i],providers);
      feature_collection.features.push(feature);
    }
    */

    // form Links
    featureCollection.links.push({
      type: 'application/geo+json',
      rel: 'self',
      title: 'This document as GeoJSON',
      href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=application%2Fgeo%2Bjson`,
    });
    featureCollection.links.push({
      type: 'text/html',
      rel: 'alternate',
      title: 'This document as HTML',
      href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=text%2Fhtml`,
    });
    if (astartindex > 0) {
      let poffset = astartindex - alimit;
      let plimit = alimit;
      if (poffset < 0) {
        plimit = alimit + poffset;
        poffset = 0;
      }
      featureCollection.links.push({
        type: 'text/html',
        rel: 'prev',
        title: 'Previous Page as HTML',
        href: `${config.EXTERNALROOTURL + config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=text%2Fhtml&limit=${plimit}&offset=${poffset}`,
      });
      featureCollection.links.push({
        type: 'application/geo+json',
        rel: 'prev',
        title: 'Previous Page as GeoJSON',
        href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=application%2Fgeo%2Bjson&limit=${plimit}&offset=${poffset}`,
      });
    }
    if (numberret === alimit) {
      const poffset = astartindex + alimit;
      featureCollection.links.push({
        type: 'text/html',
        rel: 'next',
        title: 'Next Page as HTML',
        href: `${config.EXTERNALROOTURL + config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=text%2Fhtml&limit=${alimit}&offset=${poffset}`,
      });
      featureCollection.links.push({
        type: 'application/geo+json',
        rel: 'next',
        title: 'Next Page as GeoJSON',
        href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections/${encodeURIComponent(collectionId)}/items?f=application%2Fgeo%2Bjson&limit=${alimit}&offset=${poffset}`,
      });
    }

    retdata.payload = featureCollection;
    retdata.status_code = 200;
    retdata.message = 'success';
    cursor.close(() => {
      client.end();
      client = undefined;
    });
    return retdata;
  } catch (exceptVar) {
    retdata.status_code = 500;
    retdata.message = `${exceptVar.message} HERE`;
  } finally {
    if (client !== undefined) { try { client.end(); } catch (err) { console.log(err.message); } }
  }

  return retdata;
};
const getSridFromPostGIS = async (client, stable, geomfield) => {
  try {
    const sqlstr = `SELECT Find_SRID('public', '${stable}', '${geomfield}') as srid;`;
    const res = await client.query(sqlstr);
    return res.rows[0].srid;
  } catch (exceptVar) {
    console.log(`error: ${exceptVar.message}`);
    return '';
  }
};

const formWhereClauseForFeaturesByLocationId = (providers, locId, datetime) => {
  let where_clause = [];

  const geomfield = providers[0].geometry.geom_field;
  const locidfield = providers[0].locid_field;

  if (locId){
    where_clause.push(locidfield+" = '"+locId+"'");
  }

  if (providers[0].time_field){
    let time_format=providers[0].time_field.time_format;
    if (time_format === 'interval') {
      let fstarttime=providers[0].time_field.time_start;
      let fendtime=providers[0].time_field.time_end;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(fstarttime+" <= timestamp '"+ttime+"'");
          where_clause.push(fendtime+" >= timestamp '"+ttime+"'");
        }
      }
    }else {
      let ftime=providers[0].time_field.datetime;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(ftime+" <= timestamp '"+ttime+"'");
          where_clause.push(ftime+" >= timestamp '"+ttime+"'");
        }
      }
    }
  }
  if (where_clause.length>0) return "WHERE "+where_clause.join(' AND ');
  else return '';
}

const formWhereClauseForFeaturesByRadius=({srid, providers, coords, within, withinUnits, z, datetime, parameterName, crs, f })=>{
  console.log("In formWhereClauseForFeaturesByPosition");
  let where_clause=[];

  let geomfield=providers[0].geometry.geom_field;

  let radius=within;
  //metric system may be used to determine the withinUnits
  //temporarily handles "KM", "M", "MI"
  if (StringUtils.equalIgnoreCase(withinUnits,"KM") || StringUtils.equalIgnoreCase(withinUnits,"kilometers")){
    radius=within*1000;
  }else if (StringUtils.equalIgnoreCase(withinUnits,"M") || StringUtils.equalIgnoreCase(withinUnits,"meters")){
    radius=within;
  }else if (StringUtils.equalIgnoreCase(withinUnits,"MI") || StringUtils.equalIgnoreCase(withinUnits,"miles")){
    radius=within*1609.34;
  }
  if (!crs || StringUtils.equalIgnoreCase(crs,"native")){
    let gCoords=Terraformer.wktToGeoJSON(coords);
    if (gCoords.type==='Point'){
      where_clause.push("ST_Within("+geomfield+", ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint("+gCoords.coordinates[0]+", "+gCoords.coordinates[1]+"), 4326), 3857), "+radius+"), "+srid+"))");
    }
  }else{
    console.log("Error ---- CRS not handled yet!!!");
  }
//  sqlstr=`SELECT * FROM noaa_global_surface_daily
//    WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 1), 4326));
//  `;

  //Terraformer.geojsonToWKT(/* ... */);
  //Terraformer.wktToGeoJSON(/* ... */);

/*  if (bbox){
    let bboxstr=bbox;
    if (Array.isArray(bbox)){
    bboxstr=bbox.join(',');
    }
    where_clause.push(geomfield+' && ST_MakeEnvelope('+bboxstr+')');
  }
*/
  if (providers[0].time_field){
    let time_format=providers[0].time_field.time_format;
    if (time_format === 'interval') {
      let fstarttime=providers[0].time_field.time_start;
      let fendtime=providers[0].time_field.time_end;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(fstarttime+" <= timestamp '"+ttime+"'");
          where_clause.push(fendtime+" >= timestamp '"+ttime+"'");
        }
      }
    }else {
      let ftime=providers[0].time_field.datetime;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(ftime+" <= timestamp '"+ttime+"'");
          where_clause.push(ftime+" >= timestamp '"+ttime+"'");
        }
      }
    }
  }
  if (where_clause.length>0) return "WHERE "+where_clause.join(' AND ');
  else return '';
}
const formWhereClauseForFeaturesByArea=({srid, providers, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f })=>{
  console.log("In formWhereClauseForFeaturesByArea");
  let where_clause=[];

  let geomfield=providers[0].geometry.geom_field;

  if (!crs || StringUtils.equalIgnoreCase(crs,"native")){
    let gCoords=Terraformer.wktToGeoJSON(coords);
    if (gCoords.type==='Polygon'){
      where_clause.push("ST_Intersects("+geomfield+", ST_GeomFromText('"+coords+"', "+srid+"))");
    }
  }else{
    console.log("Error ---- CRS not handled yet!!!");
  }
//  sqlstr=`SELECT * FROM noaa_global_surface_daily
//    WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 1), 4326));
//  `;

  //Terraformer.geojsonToWKT(/* ... */);
  //Terraformer.wktToGeoJSON(/* ... */);

/*  if (bbox){
    let bboxstr=bbox;
    if (Array.isArray(bbox)){
    bboxstr=bbox.join(',');
    }
    where_clause.push(geomfield+' && ST_MakeEnvelope('+bboxstr+')');
  }
*/
  if (providers[0].time_field){
    let time_format=providers[0].time_field.time_format;
    if (time_format === 'interval') {
      let fstarttime=providers[0].time_field.time_start;
      let fendtime=providers[0].time_field.time_end;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(fstarttime+" <= timestamp '"+ttime+"'");
          where_clause.push(fendtime+" >= timestamp '"+ttime+"'");
        }
      }
    }else {
      let ftime=providers[0].time_field.datetime;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(ftime+" <= timestamp '"+ttime+"'");
          where_clause.push(ftime+" >= timestamp '"+ttime+"'");
        }
      }
    }
  }
  if (where_clause.length>0) return "WHERE "+where_clause.join(' AND ');
  else return '';
}

const formWhereClauseForFeaturesByPosition=({srid, providers,coords, z, datetime, parameterName, crs})=>{
  console.log("In formWhereClauseForFeaturesByPosition");
  let where_clause=[];

  let geomfield=providers[0].geometry.geom_field;

  if (!crs || StringUtils.equalIgnoreCase(crs,"native")){
    let gCoords=Terraformer.wktToGeoJSON(coords);
    if (gCoords.type==='Point'){
      where_clause.push("ST_Within("+geomfield+", ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint("+gCoords.coordinates[0]+", "+gCoords.coordinates[1]+"), 4326), 3857), 1), "+srid+"))");
    }
    else if (gCoords.type==='MultiPoint'){
      let qstrs=[];
      for (var acoord in gCoords.coordinates){
        let coord=gCoords.coordinates[acoord];
        qstrs.push("ST_Within("+geomfield+", ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint("+coord[0]+", "+coord[1]+"), 4326), 3857), 1), "+srid+"))");
      }
      if (qstrs.length>0)
        where_clause.push("("+qstrs.join(" OR ")+")");
    }
  }else{
    console.log("Error ---- CRS not handled yet!!!");
  }
//  sqlstr=`SELECT * FROM noaa_global_surface_daily
//    WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 1), 4326));
//  `;

  //Terraformer.geojsonToWKT(/* ... */);
  //Terraformer.wktToGeoJSON(/* ... */);

/*  if (bbox){
    let bboxstr=bbox;
    if (Array.isArray(bbox)){
    bboxstr=bbox.join(',');
    }
    where_clause.push(geomfield+' && ST_MakeEnvelope('+bboxstr+')');
  }
*/
  if (providers[0].time_field){
    let time_format=providers[0].time_field.time_format;
    if (time_format === 'interval') {
      let fstarttime=providers[0].time_field.time_start;
      let fendtime=providers[0].time_field.time_end;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(fstarttime+" <= timestamp '"+tendtime+"'");
            where_clause.push(fendtime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(fstarttime+" <= timestamp '"+ttime+"'");
          where_clause.push(fendtime+" >= timestamp '"+ttime+"'");
        }
      }
    }else {
      let ftime=providers[0].time_field.datetime;
      if (datetime){
        if (datetime.includes('/')){//intervals
          let strs=datetime.split('/');
          if (strs[0] === '..'){
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
          }else if (strs[1] === '..'){
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }else{
            let tbegintime=moment(strs[0]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            let tendtime=moment(strs[1]).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
            where_clause.push(ftime+" <= timestamp '"+tendtime+"'");
            where_clause.push(ftime+" >= timestamp '"+tbegintime+"'");
          }
        }else{//datetime
          let ttime=moment(datetime).format('YYYY-MM-DD HH:mm:ss.SSSSSS');
          where_clause.push(ftime+" <= timestamp '"+ttime+"'");
          where_clause.push(ftime+" >= timestamp '"+ttime+"'");
        }
      }
    }
  }
  if (where_clause.length>0) return "WHERE "+where_clause.join(' AND ');
  else return '';
}


const getFeaturesByRadius=async({ providers, collectionId, coords, within, withinUnits, z, datetime, parameterName, crs, f, startindex })=>{
  console.log("In getFeaturesByRadius - PostGIS");
//  sqlstr="SELECT * FROM noaa_global_surface_daily WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 30000), 4326));";
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'getFeaturesByPosition for PostGIS Not implemented'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit=10;
  //Uncommit the following if limit is passed through as a parameter
//  if ((limit !== undefined) && !!limit ) alimit=parseInt(limit);
  if (!alimit) alimit=10; //not valid integer
  if (alimit < 0) alimit=10;
  if (alimit > 1000) alimit=1000;

  let astartindex=0;
  //Uncommit the following if
  if ((startindex !== undefined) && !startindex ) {
    astartindex=parseInt(startindex,10);
  }
  if (!astartindex) astartindex=0; //not valid integer
  if (astartindex < 0) astartindex=0;
  try {
    client=new Client({
      connectionString
    });
    client.connect();
    const thesrid=await getSridFromPostGIS(client,providers[0].table,geomfield);
    let whereclause=formWhereClauseForFeaturesByRadius({"srid":thesrid, providers, coords, within, withinUnits, z, datetime, parameterName, crs, f});

    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT '+dbinfo.columns.join();//createSelectFieldList(idfield,dbinfo.columns).join();
    queryText+=','+'ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat,'wkt'))
      queryText+='ST_GeomFromText';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkt'))
      queryText+='ST_GeomFromEWKT';
    else if (StringUtils.equalIgnoreCase(geomformat,'wkb'))
      queryText+='ST_GeomFromWKB';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkb'))
      queryText+='ST_GeomFromEWKB';
    else {
      retdata.status_code=500;
      retdata.message='Unknow geometry format - '+geomformat;
      return retdata;
    }
    queryText+='('+geomfield+')) AS geometry';
    queryText+=' FROM '+thetable;
    queryText+=' '+whereclause;
    queryText+= ' LIMIT $1 OFFSET $2';
    let queryValues=[alimit,astartindex];

    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
//    let res=await client.query(query);
    let cursor=client.query(new Cursor(queryText,queryValues));
    let feature_collection = {
        'type': 'FeatureCollection',
        'links':[],
        'features': []
    }
    let rows=await cursor.readAsync(1);

    let numberret=0;
    while (rows.length){
      let feature=formResponseFeature(rows[0],providers);
      feature_collection.features.push(feature);
      rows=await cursor.readAsync(1);
      numberret+=1;
    }
    feature_collection["numberReturned"]=numberret;
    feature_collection["timeStamp"]=getCurrentUTCTimeStr();

    //form Links
    feature_collection['links'].push({
        'type': 'application/geo+json',
        'rel': 'self',
        'title': 'This document as GeoJSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson'
    });
    feature_collection['links'].push({
        'type': 'text/html',
        'rel': 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml'
    });
    if (astartindex>0){
      let poffset=astartindex-alimit;
      let plimit=alimit;
      if (poffset<0){
        plimit=alimit+poffset;
        poffset=0;
      }
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'prev',
          'title': 'Previous Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+plimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'prev',
          'title': 'Previous Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+plimit+'&offset='+poffset
      });
    }
    if (numberret===alimit){
      let poffset=astartindex+alimit;
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'next',
          'title': 'Next Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+alimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'next',
          'title': 'Next Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+alimit+'&offset='+poffset
      });
    }


    retdata.payload=feature_collection;
    retdata.status_code=200;
    retdata.message='success';
    cursor.close(()=>{
      client.end();
      client=undefined;
    });
    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message+" HERE";
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
  }
  return retdata;
}
const getFeaturesByPosition=async ({ providers, collectionId, coords, z, datetime, parameterName, crs, f, startindex})=>{
  console.log("In getFeaturesByPosition - PostGIS");
//  sqlstr="SELECT * FROM noaa_global_surface_daily WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 1), 4326));";

  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'getFeaturesByPosition for PostGIS Not implemented'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit=10;
  //Uncommit the following if limit is passed through as a parameter
//  if ((limit !== undefined) && !!limit ) alimit=parseInt(limit);
  if (!alimit) alimit=10; //not valid integer
  if (alimit < 0) alimit=10;
  if (alimit > 1000) alimit=1000;

  let astartindex=0;
  //Uncommit the following if
  if ((startindex !== undefined) && !startindex ) astartindex=parseInt(startindex,10);
  if (!astartindex) astartindex=0; //not valid integer
  if (astartindex < 0) astartindex=0;

  try {
    client=new Client({
      connectionString
    });
    client.connect();
    const thesrid=await getSridFromPostGIS(client,providers[0].table,geomfield);
    let whereclause=formWhereClauseForFeaturesByPosition({"srid":thesrid, providers,coords, z, datetime, parameterName, crs});

    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT '+dbinfo.columns.join();//createSelectFieldList(idfield,dbinfo.columns).join();
    queryText+=','+'ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat,'wkt'))
      queryText+='ST_GeomFromText';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkt'))
      queryText+='ST_GeomFromEWKT';
    else if (StringUtils.equalIgnoreCase(geomformat,'wkb'))
      queryText+='ST_GeomFromWKB';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkb'))
      queryText+='ST_GeomFromEWKB';
    else {
      retdata.status_code=500;
      retdata.message='Unknow geometry format - '+geomformat;
      return retdata;
    }
    queryText+='('+geomfield+')) AS geometry';
    queryText+=' FROM '+thetable;
    queryText+=' '+whereclause;
    queryText+= ' LIMIT $1 OFFSET $2';
    let queryValues=[alimit,astartindex];

    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
//    let res=await client.query(query);
    let cursor=client.query(new Cursor(queryText,queryValues));
    let feature_collection = {
        'type': 'FeatureCollection',
        'links':[],
        'features': []
    }
    let rows=await cursor.readAsync(1);

    let numberret=0;
    while (rows.length){
      let feature=formResponseFeature(rows[0],providers);
      feature_collection.features.push(feature);
      rows=await cursor.readAsync(1);
      numberret+=1;
    }
    feature_collection["numberReturned"]=numberret;
    feature_collection["timeStamp"]=getCurrentUTCTimeStr();

    //form Links
    feature_collection['links'].push({
        'type': 'application/geo+json',
        'rel': 'self',
        'title': 'This document as GeoJSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson'
    });
    feature_collection['links'].push({
        'type': 'text/html',
        'rel': 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml'
    });
    if (astartindex>0){
      let poffset=astartindex-alimit;
      let plimit=alimit;
      if (poffset<0){
        plimit=alimit+poffset;
        poffset=0;
      }
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'prev',
          'title': 'Previous Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+plimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'prev',
          'title': 'Previous Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+plimit+'&offset='+poffset
      });
    }
    if (numberret===alimit){
      let poffset=astartindex+alimit;
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'next',
          'title': 'Next Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+alimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'next',
          'title': 'Next Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+alimit+'&offset='+poffset
      });
    }


    retdata.payload=feature_collection;
    retdata.status_code=200;
    retdata.message='success';
    cursor.close(()=>{
      client.end();
      client=undefined;
    });

    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message+" HERE";
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
  }

  return retdata;

}
//--------------------------------------
const getLocations = async ({ providers, collectionId, limit, bbox, datetime, startindex, resulttype,properties,sortby,select_properties,skip_geometry,q }) => {
  console.log("In getLocations of PostGIS....");
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'PostGIS Not implemented'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let locidfield=providers[0].locid_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit=10;
  if ((limit !== undefined) && !!limit ) alimit=parseInt(limit);
  if (!alimit) alimit=10; //not valid integer
  if (alimit < 0) alimit=10;
  if (alimit > 1000) alimit=1000;

  let astartindex=0;
  if ((startindex !== undefined) && !!startindex ) astartindex=parseInt(startindex,10);
  if (!astartindex) astartindex=0; //not valid integer
  if (astartindex < 0) astartindex=0;

  try {
    client=new Client({
      connectionString
    });
    client.connect();
    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT DISTINCT '+locidfield;//createSelectFieldList(idfield,dbinfo.columns).join();
    queryText+=' AS locid,';
    queryText+=locidfield+' AS '+idfield+',';
    queryText+='ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat,'wkt'))
      queryText+='ST_GeomFromText';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkt'))
      queryText+='ST_GeomFromEWKT';
    else if (StringUtils.equalIgnoreCase(geomformat,'wkb'))
      queryText+='ST_GeomFromWKB';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkb'))
      queryText+='ST_GeomFromEWKB';
    else {
      retdata.status_code=500;
      retdata.message='Unknow geometry format - '+geomformat;
      return retdata;
    }
    queryText+='('+geomfield+')) AS geometry';
    queryText+=' FROM '+thetable;
    queryText+=' '+formWhereClause(providers,bbox,datetime);
    queryText+= ' LIMIT $1 OFFSET $2';
    let queryValues=[alimit,astartindex];
    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
//    let res=await client.query(query);
    let cursor=client.query(new Cursor(queryText,queryValues));
    let feature_collection = {
        'type': 'FeatureCollection',
        'links':[],
        'features': []
    }
    let rows=await cursor.readAsync(1);

    let numberret=0;
    while (rows.length){
      let feature=formResponseFeature(rows[0],providers);
      feature_collection.features.push(feature);
      rows=await cursor.readAsync(1);
      numberret+=1;
    }
    feature_collection["numberReturned"]=numberret;
    feature_collection["timeStamp"]=getCurrentUTCTimeStr();
/*    for (var i=0; i<res.rowCount; i++){
      let feature=formResponseFeature(res.rows[i],providers);
      feature_collection.features.push(feature);
    }
    */

    //form Links
    feature_collection['links'].push({
        'type': 'application/geo+json',
        'rel': 'self',
        'title': 'This document as GeoJSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson'
    });
    feature_collection['links'].push({
        'type': 'text/html',
        'rel': 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml'
    });
    if (astartindex>0){
      let poffset=astartindex-alimit;
      let plimit=alimit;
      if (poffset<0){
        plimit=alimit+poffset;
        poffset=0;
      }
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'prev',
          'title': 'Previous Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+plimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'prev',
          'title': 'Previous Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+plimit+'&offset='+poffset
      });
    }
    if (numberret===alimit){
      let poffset=astartindex+alimit;
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'next',
          'title': 'Next Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+alimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'next',
          'title': 'Next Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+alimit+'&offset='+poffset
      });
    }


    retdata.payload=feature_collection;
    retdata.status_code=200;
    retdata.message='success';
    cursor.close(()=>{
      client.end();
      client=undefined;
    });
    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message+" HERE";
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
  }

  return retdata;

}

const getFeaturesByLocationId = async ({ providers, collectionId, locId, limit, bbox, datetime, startindex, resulttype,properties,sortby,select_properties,skip_geometry,q }) => {
  console.log("In getFeaturesByLocationId of PostGIS....");
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'PostGIS Not implemented'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let locidfield=providers[0].locid_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit=10;
  if ((limit !== undefined) && !!limit ) alimit=parseInt(limit);
  if (!alimit) alimit=10; //not valid integer
  if (alimit < 0) alimit=10;
  if (alimit > 1000) alimit=1000;

  let astartindex=0;
  if ((startindex !== undefined) && !!startindex ) astartindex=parseInt(startindex,10);
  if (!astartindex) astartindex=0; //not valid integer
  if (astartindex < 0) astartindex=0;

  try {
    client=new Client({
      connectionString
    });
    client.connect();
    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT '+dbinfo.columns.join();//createSelectFieldList(idfield,dbinfo.columns).join();
    queryText+=','+locidfield+' AS locid,'+'ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat,'wkt'))
      queryText+='ST_GeomFromText';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkt'))
      queryText+='ST_GeomFromEWKT';
    else if (StringUtils.equalIgnoreCase(geomformat,'wkb'))
      queryText+='ST_GeomFromWKB';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkb'))
      queryText+='ST_GeomFromEWKB';
    else {
      retdata.status_code=500;
      retdata.message='Unknow geometry format - '+geomformat;
      return retdata;
    }
    queryText+='('+geomfield+')) AS geometry';
    queryText+=' FROM '+thetable;
    queryText+=' '+formWhereClauseForFeaturesByLocationId(providers,locId,datetime);
    queryText+= ' LIMIT $1 OFFSET $2';
    let queryValues=[alimit,astartindex];
    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
//    let res=await client.query(query);
    let cursor=client.query(new Cursor(queryText,queryValues));
    let feature_collection = {
        'type': 'FeatureCollection',
        'links':[],
        'features': []
    }
    let rows=await cursor.readAsync(1);

    let numberret=0;
    while (rows.length){
      let feature=formResponseFeature(rows[0],providers);
      feature_collection.features.push(feature);
      rows=await cursor.readAsync(1);
      numberret+=1;
    }
    feature_collection["numberReturned"]=numberret;
    feature_collection["timeStamp"]=getCurrentUTCTimeStr();
/*    for (var i=0; i<res.rowCount; i++){
      let feature=formResponseFeature(res.rows[i],providers);
      feature_collection.features.push(feature);
    }
    */

    //form Links
    feature_collection['links'].push({
        'type': 'application/geo+json',
        'rel': 'self',
        'title': 'This document as GeoJSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson'
    });
    feature_collection['links'].push({
        'type': 'text/html',
        'rel': 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml'
    });
    if (astartindex>0){
      let poffset=astartindex-alimit;
      let plimit=alimit;
      if (poffset<0){
        plimit=alimit+poffset;
        poffset=0;
      }
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'prev',
          'title': 'Previous Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+plimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'prev',
          'title': 'Previous Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+plimit+'&offset='+poffset
      });
    }
    if (numberret===alimit){
      let poffset=astartindex+alimit;
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'next',
          'title': 'Next Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+alimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'next',
          'title': 'Next Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+alimit+'&offset='+poffset
      });
    }


    retdata.payload=feature_collection;
    retdata.status_code=200;
    retdata.message='success';
    cursor.close(()=>{
      client.end();
      client=undefined;
    });
    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message+" HERE";
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
  }

  return retdata;

}

const getFeaturesByArea=async({ providers, collectionId, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f, startindex})=>{
  console.log("In getFeaturesByArea - PostGIS");
  console.log("collectionId=");
  console.log(collectionId);
//  sqlstr="SELECT * FROM noaa_global_surface_daily WHERE ST_Within(the_geom, ST_Transform(ST_Buffer(ST_Transform(ST_SetSRID(ST_MakePoint(6.9333, 46.8167), 4326), 3857), 30000), 4326));";
  let retdata={
    'payload':{
        'features': [],
        'links': []
    },
    'status_code':500,
    'message':'getFeaturesByArea for PostGIS Not implemented'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb

  let alimit=10;
  //Uncommit the following if limit is passed through as a parameter
//  if ((limit !== undefined) && !!limit ) alimit=parseInt(limit);
  if (!alimit) alimit=10; //not valid integer
  if (alimit < 0) alimit=10;
  if (alimit > 1000) alimit=1000;

  let astartindex=0;
  //Uncommit the following if
  if ((startindex !== undefined) && !startindex ) {
    astartindex=parseInt(startindex,10);
  }
  if (!astartindex) astartindex=0; //not valid integer
  if (astartindex < 0) astartindex=0;
  try {
    client=new Client({
      connectionString
    });
    client.connect();
    const thesrid=await getSridFromPostGIS(client,providers[0].table,geomfield);
    let whereclause=formWhereClauseForFeaturesByArea({"srid":thesrid, providers, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f});

    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT '+dbinfo.columns.join();//createSelectFieldList(idfield,dbinfo.columns).join();
    queryText+=','+'ST_AsGeoJSON(';
    if (StringUtils.equalIgnoreCase(geomformat,'wkt'))
      queryText+='ST_GeomFromText';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkt'))
      queryText+='ST_GeomFromEWKT';
    else if (StringUtils.equalIgnoreCase(geomformat,'wkb'))
      queryText+='ST_GeomFromWKB';
    else if (StringUtils.equalIgnoreCase(geomformat,'ewkb'))
      queryText+='ST_GeomFromEWKB';
    else {
      retdata.status_code=500;
      retdata.message='Unknow geometry format - '+geomformat;
      return retdata;
    }
    queryText+='('+geomfield+')) AS geometry';
    queryText+=' FROM '+thetable;
    queryText+=' '+whereclause;
    queryText+= ' LIMIT $1 OFFSET $2';
    let queryValues=[alimit,astartindex];

    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    Cursor.prototype.readAsync = promisify(Cursor.prototype.read);
//    let res=await client.query(query);
    let cursor=client.query(new Cursor(queryText,queryValues));
    let feature_collection = {
        'type': 'FeatureCollection',
        'links':[],
        'features': []
    }
    let rows=await cursor.readAsync(1);

    let numberret=0;
    while (rows.length){
      let feature=formResponseFeature(rows[0],providers);
      feature_collection.features.push(feature);
      rows=await cursor.readAsync(1);
      numberret+=1;
    }
    feature_collection["numberReturned"]=numberret;
    feature_collection["timeStamp"]=getCurrentUTCTimeStr();

    //form Links
    feature_collection['links'].push({
        'type': 'application/geo+json',
        'rel': 'self',
        'title': 'This document as GeoJSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson'
    });
    feature_collection['links'].push({
        'type': 'text/html',
        'rel': 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml'
    });
    if (astartindex>0){
      let poffset=astartindex-alimit;
      let plimit=alimit;
      if (poffset<0){
        plimit=alimit+poffset;
        poffset=0;
      }
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'prev',
          'title': 'Previous Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+plimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'prev',
          'title': 'Previous Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+plimit+'&offset='+poffset
      });
    }
    if (numberret===alimit){
      let poffset=astartindex+alimit;
      feature_collection['links'].push({
          'type': 'text/html',
          'rel': 'next',
          'title': 'Next Page as HTML',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=text%2Fhtml&limit='+alimit+'&offset='+poffset
      });
      feature_collection['links'].push({
          'type': 'application/geo+json',
          'rel': 'next',
          'title': 'Next Page as GeoJSON',
          'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+encodeURIComponent(collectionId)+'/items?f=application%2Fgeo%2Bjson&limit='+alimit+'&offset='+poffset
      });
    }


    retdata.payload=feature_collection;
    retdata.status_code=200;
    retdata.message='success';
    cursor.close(()=>{
      client.end();
      client=undefined;
    });
    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message+" HERE";
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
  }
  return retdata;
}



module.exports = {
  getFeature,
  getFeatures,
  getFeaturesByPosition,
  getFeaturesByRadius,
  getLocations,
  getFeaturesByLocationId,
  getFeaturesByArea
};
