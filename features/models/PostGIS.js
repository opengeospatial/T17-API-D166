const {Pool, Client}=require('pg');
const StringUtils=require('../utils/StringUtils');
const Cursor=require('pg-cursor');
const {promisify}=require('util');
const moment=require('moment');
const config = require('../config');

const getCurrentUTCTimeStr=()=>{
  var now = new Date;
/*  var utc_timestamp = Date.UTC(now.getFullYear(),now.getMonth(), now.getDate() ,
        now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
*/
  var strtime=now.toISOString();
  return strtime;
}

const createSelectFieldList=(idfield,columns)=>{
  let retcolumns=[];
  try{
    for (var i=0;i<columns.length;i++){
      let cell=columns[i];
      if (cell===idfield)
        retcolumns.push(cell+" as id");
      else
        retcolumns.push(cell);
      }
  }catch(excep_var){

  }
  return retcolumns;
}
/**
* fetch a single feature
* Fetch the feature with id `featureId` in the feature collection with id `collectionId`.  Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* featureId String local identifier of a feature
* returns featureGeoJSON
* */
const getFeature = async ({ providers, collectionId, featureId }) => {
  let retdata={
    'payload':{
        'links': [],
        'properties': {}
    },
    'status_code':500,
    'message':'Not implemented - fff'
  };
  let client=undefined;
  let connectionString=providers[0].data;
  let thetable=providers[0].table;
  let geomfield=providers[0].geometry.geom_field;
  let idfield=providers[0].id_field;
  let geomformat=providers[0].geometry.geom_format;
  if (geomformat == undefined || !geomformat)
    geomformat='wkt'; //default to wkt. Other formats: ewkt, wkb, ewkb
  try {
    client=new Client({
      connectionString
    });
    client.connect();
    let dbinfo=await getDatabaseBaseInfo(client,thetable);
    let queryText='SELECT '+dbinfo.columns.join();//;createSelectFieldList(idfield,dbinfo.columns).join();
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
    queryText+=' WHERE '+idfield+' = $1 LIMIT 10';

    queryValues=[featureId];
    let query = {
      // give the query a unique name
      name: 'fetch-features',
      text: queryText,
      values: queryValues,
    }
    let res=await client.query(query);
    if (res.rowCount < 1){
      retdata.status_code=404;
      retdata.message='No feature found for id='+featureId;
      return retdata;
    }
    if (res.rowCount > 1){
      retdata.status_code=500;
      retdata.message='More than one feature is found for id='+featureId;
      return retdata;
    }
    let feature=formResponseFeature(res.rows[0],providers);
    retdata.payload=feature;
    retdata.status_code=200;
    retdata.message='success';
    return retdata;
  }catch(excep_var){
    retdata.status_code=500;
    retdata.message=excep_var.message;
  }finally{
    if (client !==undefined)
    try{client.end;}catch(e1){}
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
const getFeatures = async ({ providers, collectionId, limit, bbox, datetime, startindex, resulttype,properties,sortby,select_properties,skip_geometry,q }) => {
  console.log("In getFeatures of PostGIS....");
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

const getDatabaseBaseInfo = async (dbclient,table) =>{
  let retData = {
    status_code:200,
    message: 'success',
    columns:[],
    fields:[],
  }
  let query = {
    // give the query a unique name
    name: 'fetch-dbinfo',
    text: "SELECT column_name, udt_name FROM information_schema.columns WHERE table_name = $1 and udt_name != 'geometry'",
    values: [table],
  }
  try {
    let res=await dbclient.query(query);
    for (var i=0; i<res.rowCount; i++){
      retData.columns.push(res.rows[i]['column_name']);
      let arow={'name':res.rows[i]['column_name'],'type':res.rows[i]['udt_name']};
      retData.fields.push(arow);
    }
    return retData;
  }catch (err){
    retData.message=err.message;
    retData.status_code=500;
    return retData;
  }
}

const formResponseFeature =(rowdata,providers)=>{
  if (!rowdata) return {};
  let feature = {
    'type': 'Feature'
  }
  if (rowdata.geometry === undefined){
    feature['geometry']=null;
  }else{
    feature['geometry'] = JSON.parse(rowdata.geometry);
    delete rowdata.geometry;
  }
  feature['properties']=rowdata;
  if (feature['properties'][providers[0].title_field] || (feature['properties'][providers[0].title_field] !== undefined))
    feature['properties']['title']=feature['properties'][providers[0].title_field];
  feature['id']=String(feature['properties'][providers[0].id_field]);
  return feature;
}
/**
 * parameters
 *   bbox - array of values either 4 or 6
 *   datetime - 'time/time' or 'time'
**/
const formWhereClause =(providers,bbox,datetime)=>{
  let where_clause=[];

  let geomfield=providers[0].geometry.geom_field;

  if (bbox){
    let bboxstr=bbox;
    if (Array.isArray(bbox)){
    bboxstr=bbox.join(',');
    }
    where_clause.push(geomfield+' && ST_MakeEnvelope('+bboxstr+')');
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

module.exports = {
  getFeature,
  getFeatures,
};
