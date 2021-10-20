const fs = require('fs');
const path = require('path');
// const logger = require('../logger');
const config = require('../config');
const Modeler = require('./Modeler');

function ciEquals(a, b) {
  return typeof a === 'string' && typeof b === 'string'
    ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
    : a === b;
}
const getCollectionsDataJsonFromInline = async (confjson, { dataset, bbox, datetime }) => {
  const retdata = {
    payload: {
      collections: [],
      links: [],
    },
    status_code: 200,
    message: 'success',
  };
  const { resources } = confjson;
  for (const i in resources) {
    if (!ciEquals(resources[i].type, 'collection')) continue;
    const acollection = { links: [] };
    acollection.id = i;
    acollection.title = resources[i].title;
    acollection.description = resources[i].description;
    acollection['keywords'] = resources[i].keywords;

    let bbox = resources[i]['extents']['spatial']['bbox']
//    # The output should be an array of bbox, so if the user only
//    # provided a single bbox, wrap it in a array.
    if (!Array.isArray(bbox[0])){
      bbox = [bbox]
    }
    acollection['extent'] = {
        'spatial': {
            'bbox': bbox
        }
    }

    if ('crs' in resources[i]['extents']['spatial'])
        acollection['extent']['spatial']['crs'] = resources[i]['extents']['spatial']['crs'];

    let t_ext = resources[i]['extents']['temporal'];
    if (t_ext){
      acollection['extent']['temporal']={};
      let t_interval=t_ext["interval"];
      if (t_interval){
        acollection['extent']['temporal']['interval']=[];
        for (var st in t_interval){
          let begin = t_interval[st]['begin'];//dategetter('begin', t_ext)
          let end = t_interval[st]['end'];//dategetter('end', t_ext)
          acollection['extent']['temporal']['interval'].push([begin,end]);
        }
      }
      if ('trs' in t_ext)
          acollection['extent']['temporal']['trs'] = t_ext['trs'];
    }

    for (var alnk in resources[i]['links']){
      let link=resources[i]['links'][alnk];
      let lnk = {
          'type': link['type'],
          'rel': link['rel'],
          'title': link['title'],
          'href': link['href']
      };
      if ('hreflang' in link)
          lnk['hreflang'] = link['hreflang'];

      acollection['links'].push(lnk);
    }

    let thequeries=resources[i]['data_queries'];
    if (thequeries){
      acollection["data_queries"]={};
      for (var aqlnk in thequeries){
        let theaq=thequeries[aqlnk];
        let theaqlnkrel=theaq["linkrel"];
        let theaqlnk=theaq["link"];
        if (theaqlnkrel === "relative"){
          theaqlnk.href=config.EXTERNALROOTURL+config.BASE_VERSION+theaqlnk.href;
        }
        acollection["data_queries"][aqlnk]={"link":theaqlnk};
      }
    }

    acollection.links.push({
      type: 'application/json',
      rel: 'self',
      title: 'This document as JSON',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+i+'?f=application%2Fjson',
    });
    acollection['links'].push({
      'type': 'text/html',
        rel: 'alternate',
        'title': 'This document as HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+i+'?f=text%2Fhtml'
    });
    acollection['links'].push({
        'type': 'application/geo+json',
        'rel': 'items',
        'title': 'This resource - '+i+' in application/geo+json',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+i+'/items?f=application%2Fgeo%2Bjson'
    });
    acollection['links'].push({
        'type': 'text/html',
        'rel': 'items',
        'title': 'This resource - '+i+' in HTML',
        'href': config.EXTERNALROOTURL+config.BASE_VERSION+'/collections/'+i+'/items?f=text%2Fhtml',
    });

    if (typeof dataset !== 'undefined') {
      if (ciEquals(dataset, i)) {
        retdata.payload = acollection;
        return retdata;
      }
    } else retdata.payload.collections.push(acollection);
  }

  if (typeof dataset !== 'undefined') {
    retdata.status_code = 404;
    retdata.message = `Resource ${dataset} does not exist!`;
  } else {
    retdata.payload.links.push({
      type: 'application/json',
      rel: 'self',
      title: 'This document as JSON',
      href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections?f=application%2Fjson`,
    });
    retdata.payload.links.push({
      type: 'text/html',
      rel: 'alternate',
      title: 'This document as HTML',
      href: `${config.EXTERNALROOTURL}${config.BASE_VERSION}/collections?f=text%2Fhtml`,
    });
  }

  return retdata;
}
const getCollectionsDataJson = async ({dataset, bbox, datetime}) => {
  let cfile=path.join(config.ROOT_DIR, 'confdata', 'collections.json');
  let rawdata=fs.readFileSync(cfile);
  let confjson=JSON.parse(rawdata);

  if (ciEquals(confjson.type,"inline")) return getCollectionsDataJsonFromInline(confjson, {dataset, bbox, datetime});
  else {
    // To-Be-Implemented for database search
    let retdata={
      'payload':{
          'collections': [],
          'links': []
      },
      'status_code':500,
      'message':'To be implemented for collections from alternative configuration.'
    };
    return retdata;
  }
}
const addCollectionsFromResource = async ({resource, retdata, dataset}) => {
  return await Modeler.getCollections({resource, retdata, dataset});
}

const formHtmlForCollections=(jsondata)=>{
  let retdata="<!DOCTYPE html><html><head><title>";
  retdata+="Collections";
  retdata+="</title></head><body><h1>";
  retdata+="Available Collections";
  retdata+="</h1>";
  retdata+="<br/><p>The following collections are available: </p>";
  retdata+="<p>";
  retdata+="<ol>";
  let collections=jsondata.payload.collections;
  for (var i=0;i<collections.length;i++){
    let col=collections[i];
    retdata+="<li><h2>"+col.id+"</h2><ul>"
    retdata+="<li><b>Title: </b>";
    retdata+=col.title;
    retdata+="</li>";
    retdata+="<li><b>Description: </b>";
    retdata+=col.description;
    retdata+="</li>";
    retdata+="<li><b>Keywords: </b>";
    retdata+=col.keywords;
    retdata+="</li>";
    retdata+="<li><b>Links: </b><ul>";
    let clinks=col.links;
    for (var j=0;j<clinks.length;j++){
      let clink=clinks[j];
      retdata+="<li>";
      retdata+="<a href=\"";
      retdata+=clink.href;
      retdata+="\">";
      retdata+=clink.title;
      retdata+="</a>";
      retdata+="</li>";
    }
    retdata+="</ul></li>";
    retdata+="<li><b>Data Queries: </b><ul>";
    let cqlinks=col.data_queries
    console.log(cqlinks);
    for (var j in cqlinks){
      let cqlink=cqlinks[j]["link"];
      retdata+="<li>";
      retdata+="<a href=\"";
      retdata+=cqlink.href;
      retdata+="\">";
      retdata+=cqlink["variables"].title;
      retdata+="</a>";
      retdata+="</li>";
    }
    retdata+="</ul>";
    retdata+="</li>";
    retdata+="</ul>";
    retdata+="</li>";
//    retdata+="<li><a href=\""+link.href"\">"+link.title+"</a><li>";
  }
  retdata+="</ul>";
  retdata+="</p>";
  retdata+="<h1>";
  retdata+="Links";
  retdata+="</h1>";
  retdata+="<br/><p>The following resources are available for this set of collections: </p>";
  retdata+="<p>";
  retdata+="<ul>";
  let links=jsondata.payload.links;
  for (var i=0;i<links.length;i++){
    let link=links[i];
    retdata+="<li>";
    retdata+="<a href=\"";
    retdata+=link.href;
    retdata+="\">";
    retdata+=link.title;
    retdata+="</a>";
    retdata+="</li>";
//    retdata+="<li><a href=\""+link.href"\">"+link.title+"</a><li>";
  }
  retdata+="</ul>";
  retdata+="</p></body></html>";
  return retdata;
}
const formHtmlForCollection=(jsondata)=>{
  console.log("In colllection....");
  let col=jsondata.payload;
  let retdata="<!DOCTYPE html><html><head><title>";
  retdata+=col.id;
  retdata+="</title></head><body><h1>";
  retdata+=col.id;
  retdata+="</h1>";
  retdata+="<p>";
    retdata+="<ul>"
    retdata+="<li><b>Title: </b>";
    retdata+=col.title;
    retdata+="</li>";
    retdata+="<li><b>Description: </b>";
    retdata+=col.description;
    retdata+="</li>";
    retdata+="<li><b>Keywords: </b>";
    retdata+=col.keywords;
    retdata+="</li>";
    retdata+="<li><b>Links: </b><ul>";
    let clinks=col.links;
    for (var j=0;j<clinks.length;j++){
      let clink=clinks[j];
      retdata+="<li>";
      retdata+="<a href=\"";
      retdata+=clink.href;
      retdata+="\">";
      retdata+=clink.title;
      retdata+="</a>";
      retdata+="</li>";
    }
    retdata+="</ul>";
    retdata+="</li>";
    retdata+="<li><b>Data Queries: </b><ul>";
    let cqlinks=col.data_queries;
    for (var j=0;j<cqlinks.length;j++){
      let cqlink=cqlinks[j];
      retdata+="<li>";
      retdata+="<a href=\"";
      retdata+=cqlink.href;
      retdata+="\">";
      retdata+=cqlink.title;
      retdata+="</a>";
      retdata+="</li>";
    }
    retdata+="</ul>";
    retdata+="</li>";
    retdata+="</ul>";
  retdata+="</p></body></html>";
  return retdata;
}
const getCollectionsDataHtml = async ({dataset, bbox, datetime}) => {
  let mretdata={
    'payload':"",
    'status_code':200,
    'message':'success'
  };
  try {
    let retdata="";
    let jsondata=await getCollectionsDataJson({dataset, bbox, datetime});
    if (typeof dataset === 'undefined'){
      retdata=formHtmlForCollections(jsondata);
    }else{
      retdata=formHtmlForCollection(jsondata);
    }
    if (jsondata.status_code===200){
      mretdata.payload=retdata;
    }else{
      mretdata.status_code=jsondata.status_code;
      mretdata.message=jsondata.message;
    }
  }catch(excep_var){
    mretdata.status_code=500;
    mretdata.message="Internal Error: "+excep_var.message;
  }
  return mretdata;
}
module.exports = {
  getCollectionsDataJson,
  getCollectionsDataHtml
};
