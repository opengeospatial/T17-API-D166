const logger = require('../logger');
const {Pool, Client}=require('pg');
const StringUtils=require('../utils/StringUtils');
const XmlUtils=require('../utils/XmlUtils');
const Cursor=require('pg-cursor');
const {promisify}=require('util');
const moment=require('moment');
const fetch=require('node-fetch');
//const gml2json = require('gml2json');
//const gmlToGeoJSON=require("../utils/Formatter");
const formatter2=require("../utils/FormatterOgr2Ogr");
const formatter3=require("../utils/FormatterOgrCmd");
//var Geojson = require('ol/format/geojson');
//var geoJson = new Geojson();
const config = require('../config');

const formTableFeatureCollection=(responsePayload, serverConfig, reqparams, lastPathPart) => {
  let features=responsePayload["features"];
  let retstr='';
  if (features!==undefined && Array.isArray(features) && features.length>0){
    let afeature=features[0];
    let properties=afeature["properties"];
    if (properties!==undefined && Object.entries(properties).length>0){
      let keys=[];
      for (const [key, value] of Object.entries(properties)){
        keys.push(key);
      }

      retstr+='<table id="CustomTable" class="CustomTable FeatureCollection">';
      retstr+="<tr>";
      retstr+="<th>"+"id"+"</th>";
      for (let i=0;i<keys.length;i++){
        retstr+="<th>"+keys[i]+"</th>"
      }
      retstr+="</tr>";
      for (let i=0;i<features.length;i++){
        retstr+=formTableRows4Feature(keys,features[i],serverConfig, reqparams, lastPathPart);
      }
      retstr+='</table>'
    }
  }
  return retstr;
}
const formTableRows4Feature=(keys,afeature,serverConfig, reqparams, lastPathPart) => {
  let fid=afeature.id;
  let retstr="<tr id='"+fid+"'>";
  let collectionId=reqparams["collectionId"];
  let properties=afeature["properties"];
  let hrefstr=config.EXTERNALROOTURL+config.BASE_VERSION+"/collections/"+encodeURIComponent(collectionId)+"/items/"+fid;
  if (lastPathPart === 'locations')
    hrefstr=config.EXTERNALROOTURL+config.BASE_VERSION+"/collections/"+encodeURIComponent(collectionId)+"/locations/"+fid;
  retstr+="<td><a href='"+hrefstr+"'>"+fid+"</a></td>";
  for (let i=0;i<keys.length;i++){
    let key=keys[i];
    let val=properties[key];
    if (val === undefined){
      retstr+="<td></td>";
    }else{
      retstr+="<td>";
      retstr+=val;
      retstr+="</td>";
    }
  }
  retstr+="</tr>";
  return retstr;
}
const formFeaturePropertiesList=(responsePayload,serverConfig, reqparams, lastPathPart)=> {
  let retstr='';
  let fid=responsePayload.id;
  let collectionId=reqparams["collectionId"];
  let properties=responsePayload["properties"];
  retstr+='<table id="CustomTable" class="CustomTable Feature">';
  retstr+="<tr>";
  retstr+="<th>property</th><th>value</th>";
  retstr+="</tr>";
  retstr+="<tr id='"+fid+"'>";
  retstr+="<td>id</td>";
  let hrefstr=config.EXTERNALROOTURL+config.BASE_VERSION+"/collections/"+encodeURIComponent(collectionId)+"/items/"+fid;
  if (lastPathPart === 'locations')
    hrefstr=config.EXTERNALROOTURL+config.BASE_VERSION+"/collections/"+encodeURIComponent(collectionId)+"/locations/"+fid;
  retstr+="<td><a href='"+hrefstr+"'>"+fid+"</a></td>";
  retstr+="</tr>";
  if (properties!==undefined && Object.entries(properties).length>0){
    for (const [key, value] of Object.entries(properties)){
      retstr+="<tr id='"+key+"'>";
      retstr+="<td><b>"+key+"</b></td>";
      retstr+="<td>"+value+"</td>";
      retstr+="</tr>";
    }
  }
  retstr+='</table>'
  return retstr;
}
const insertLinks=(responsePayload)=>{
  let retdata='';
  let clinks=responsePayload["links"];
  if (clinks!==undefined && Array.isArray(clinks)){
    retdata+='<h2>Links</h2>';
    retdata+='<ul>';
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
  }
  return retdata;
}
//const ogc-schemas=require("ogc-schemas");
//const w3c-schemas=require("w3c-schemas");
//const GeoJSON=require('ol/format/GeoJSON');
/**
* fetch a single feature
* Fetch the feature with id `featureId` in the feature collection with id `collectionId`.  Use content negotiation to request HTML or GeoJSON.
*
* collectionId String local identifier of a collection
* featureId String local identifier of a feature
* returns featureGeoJSON
* */
const sendResponse=(response, payload, serverConfig, reqparams, lastPathPart)=> {
    /**
    * The default response-code is 200. We want to allow to change that. in That case,
    * payload will be an object consisting of a code and a payload. If not customized
    * send 200 and the payload as received in this method.
    */


    response.status(payload.code || 200);
    const responsePayload = payload.payload !== undefined ? payload.payload : payload;
    let mtype=responsePayload["type"];

    let responseHtml='<!doctype html>'
      +'<html lang="en">'
      +'  <head>'
      +'    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.6.0/css/ol.css" type="text/css">'
      +'    <style>'
      +'      .map {'
      +'        height: 200px;'
      +'        width: 100%;'
      +'      }'
      +'#CustomTable {'
      +'  font-family: Arial, Helvetica, sans-serif;'
      +'  border-collapse: collapse;'
      +'  width: 100%;'
      +'}'
      +' '
      +'#CustomTable td, #CustomTable th {'
      +'  border: 1px solid #ddd;'
      +'  padding: 8px;'
      +'}'
      +' '
      +'#CustomTable tr:nth-child(even){background-color: #f2f2f2;}'
      +' '
      +'#CustomTable tr:hover {background-color: #ddd;}'
      +' '
      +'#CustomTable th {'
      +'  padding-top: 12px;'
      +'  padding-bottom: 12px;'
      +'  text-align: left;'
      +'  background-color: #04AA6D;'
      +'  color: white;'
      +'}'
      +'.CustomTable .selected, .CustomTable tbody .selected, .CustomTable tbody tr.selected:nth-child(even) td'
      +'{'
      +'    background-color: #6ccbfb;'
      +'    color: #fff;'
      +'}'
      +'    </style>'
      +'    <script src="https://cdn.jsdelivr.net/gh/openlayers/openlayers.github.io@master/en/v6.6.0/build/ol.js"></script>'
      +'    <title>OpenLayers example</title>';
      responseHtml+=
      '  </head>'
      +'  <body>'
      +'    <h2>';
      if (mtype!==undefined && mtype==="FeatureCollection"){
        responseHtml+=reqparams["collectionId"];
      }else if (mtype!==undefined && mtype==="Feature"){
        responseHtml+='Feature Collection: '+reqparams["collectionId"];
        responseHtml+=', Feature: '+reqparams["featureId"];
      }

      responseHtml+='</h2>'
      +'    <div id="map" class="map"></div>';
      responseHtml+='    <script type="text/javascript">';
      responseHtml+='const geojsonobj='+JSON.stringify(responsePayload)+';';
      responseHtml+='const image = new ol.style.Circle({'
      +'  radius: 5,'
      +'  fill: null,'
      +'  stroke: new ol.style.Stroke({color: "red", width: 1}),'
      +'});';

      responseHtml+='const styles = {'
      +'  "Point": new ol.style.Style({'
      +'    image: image,'
      +'  }),'
      +'  "LineString": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "green",'
      +'      width: 1,'
      +'    }),'
      +'  }),'
      +'  "MultiLineString": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "green",'
      +'      width: 1,'
      +'    }),'
      +'  }),'
      +'  "MultiPoint": new ol.style.Style({'
      +'    image: image,'
      +'  }),'
      +'  "MultiPolygon": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "yellow",'
      +'      width: 1,'
      +'    }),'
      +'    fill: new ol.style.Fill({'
      +'      color: "rgba(255, 255, 0, 0.1)",'
      +'    }),'
      +'  }),'
      +'  "Polygon": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "blue",'
      +'      lineDash: [4],'
      +'      width: 3,'
      +'    }),'
      +'    fill: new ol.style.Fill({'
      +'      color: "rgba(0, 0, 255, 0.1)",'
      +'    }),'
      +'  }),'
      +'  "GeometryCollection": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "magenta",'
      +'      width: 2,'
      +'    }),'
      +'    fill: new ol.style.Fill({'
      +'      color: "magenta",'
      +'    }),'
      +'    image: new ol.geom.Circle({'
      +'      radius: 10,'
      +'      fill: null,'
      +'      stroke: new ol.style.Stroke({'
      +'        color: "magenta",'
      +'      }),'
      +'    }),'
      +'  }),'
      +'  "Circle": new ol.style.Style({'
      +'    stroke: new ol.style.Stroke({'
      +'      color: "red",'
      +'      width: 2,'
      +'    }),'
      +'    fill: new ol.style.Fill({'
      +'      color: "rgba(255,0,0,0.2)",'
      +'    }),'
      +'  }),'
      +'};';


      responseHtml+='const styleFunction = function (feature) {'
      +'  return styles[feature.getGeometry().getType()];'
      +'};'

      responseHtml+='const vectorSource = new ol.source.Vector({'
      +'  features: new ol.format.GeoJSON().readFeatures(geojsonobj),'
      +'});';

      responseHtml+='const vectorLayer = new ol.layer.Vector({'
      +'  source: vectorSource,'
//      +'  style: styleFunction,'
      +'});'
      +'';


      responseHtml+='      var map = new ol.Map({'
      +'        target: "map",'
      +'        layers: ['
      +'          new ol.layer.Tile({'
      +'            source: new ol.source.OSM()'
      +'          })'
      +'          ,'
      +'          vectorLayer'
      +'        ],'
      +'        view: new ol.View({'
      +'          projection: "EPSG:4326",'
      +'          center: ol.proj.fromLonLat([37.41, 8.82]),'
      +'          zoom: 4'
      +'        })'
      +'      });';
      responseHtml+='map.getView().fit(vectorSource.getExtent());';

      responseHtml+='    </script>';
      responseHtml+=insertLinks(responsePayload);
      if (mtype!==undefined && mtype==="FeatureCollection"){
        responseHtml+=formTableFeatureCollection(responsePayload,serverConfig, reqparams, lastPathPart);
      }else if (mtype!==undefined && mtype==="Feature"){
        responseHtml+=formFeaturePropertiesList(responsePayload,serverConfig, reqparams, lastPathPart);
      }
      responseHtml+='    <script>';
      responseHtml+='function findFeature(id){  '
      +'  var features = vectorSource.getFeatures();'
      +'  for (var i = 0; i < features.length; i++) {'
      +'    if (features[i].getId() === id) {'
      +'	return features[i];'
      +'    }'
      +'  }'
      +'  return null;'
      +'}';
      if (mtype!==undefined && mtype==="FeatureCollection")
      responseHtml+='	var selectControl = new ol.interaction.Select();'
            +'	map.addInteraction(selectControl);';

      if (mtype!==undefined && mtype==="FeatureCollection")
      responseHtml+='function singleSelect(feature){'
      +'	var selected_collection = selectControl.getFeatures();'
      +'	selected_collection.clear();'
      +'	selected_collection.push(feature);'
      +'}';
      responseHtml+='function hightLightRow(row) {'
      +'var table = document.getElementById("CustomTable");'
      +'var rows = table.getElementsByTagName("tr");'
      +'for (i = 0; i < rows.length; i++) {'
      +'    var currentRow = table.rows[i];'
      +'    currentRow.className = "";'
      +'  }'
      +'row.className="selected";'
      +'}';
      responseHtml+='function hightLightRowById(id) {'
      +'var table = document.getElementById("CustomTable");'
      +'var rows = table.getElementsByTagName("tr");'
      +'for (i = 0; i < rows.length; i++) {'
      +'    var currentRow = table.rows[i];'
      +'    if (currentRow.id === id)'
      +'       currentRow.className = "selected";'
      +'    else'
      +'       currentRow.className = "";'
      +'  }'
      +'}';
      if (mtype!==undefined && mtype==="FeatureCollection")
      responseHtml+='if (selectControl !== undefined && selectControl !== null){'
+'    selectControl.on("select", function (e) {'
+'      let nsel=e.selected.length;'
+'      if (nsel !==undefined && nsel>0){'
+'         let feature=e.selected[0];'
+'         let id=feature.getId();'
+'         hightLightRowById(id);'
+'      }'
+'    });'
+'  }';
      responseHtml+='function addRowHandlers() {'
      +'var table = document.getElementById("CustomTable");'
      +'var rows = table.getElementsByTagName("tr");'
      +'for (i = 0; i < rows.length; i++) {'
      +'    var currentRow = table.rows[i];'
      +'    var createClickHandler = '
      +'        function(row) '
      +'        {'
      +'            return function() { '
//      +'                                    var cell = row.getElementsByTagName("td")[0];'
//      +'                                    var id = cell.innerHTML;'
      +'                                    var id = row.id;'
//      +'                                    alert("id:" + id);'
      +'                                    var feature=findFeature(id);'
      +'                                    singleSelect(feature);'
      +'                                    hightLightRow(row);'
      +'                             };'
      +'        };'
      +' '
      +'    currentRow.onclick = createClickHandler(currentRow);'
      +'  }'
      +'}';
      if (mtype!==undefined && mtype==="FeatureCollection")
      responseHtml+='window.onload = addRowHandlers();';
      responseHtml+='    </script>';

      responseHtml+=
      '  </body>'
      +'</html>';
    if (responsePayload instanceof Object) {
      response.type("text/html");
      response.send(responseHtml);
    } else {
      response.end(responsePayload);
    }
}

module.exports = {
  sendResponse,
};
