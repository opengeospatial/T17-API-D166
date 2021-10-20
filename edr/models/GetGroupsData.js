const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const Modeler = require('./Modeler');


function ciEquals(a, b) {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
}
const getGroupsDataJsonFromInline = async (confjson,groupid) =>{
  let retdata={
    'payload':{
        'members': [],
        'links': []
    },
    'status_code':200,
    'message':'success'
  };
  console.log("In getGroupsDataJsonFromInline...");
  let resourcelinks = confjson.resourcelinks;
  let sgroupid="";
  if (typeof groupid !== 'undefined') sgroupid=groupid;
  for (var i in resourcelinks){
    let r=resourcelinks[i];
    if (ciEquals(r.ingroup,sgroupid)){
      let alink={};
      if (r.linkrel==="relative")
        alink.href=config.EXTERNALROOTURL+config.BASE_VERSION+"/"+r.link.href;
      else
        alink.href=r.link.href;
      alink.rel=r.link.rel;
      alink.type=r.link.type;
      alink.title=r.link.title;
      retdata.payload.members.push(alink);
    }
    if (ciEquals(r.id,sgroupid) && (r.type=="group")){
      let alink={};
      if (r.linkrel==="relative")
        alink.href=config.EXTERNALROOTURL+config.BASE_VERSION+"/"+r.link.href;
      else
        alink.href=r.link.href;
      alink.rel=r.link.rel;
      alink.type=r.link.type;
      alink.title=r.link.title;
      retdata.payload.links.push(alink);
    }
  }
  if (sgroupid === ""){
    let alink={};
    alink.href=config.EXTERNALROOTURL+config.BASE_VERSION+"/groups?f=application%2Fjson";
    alink.rel="self";
    alink.type="application/json";
    alink.title="EDR Group List";
    retdata.payload.links.push(alink);
  }
  if ((typeof groupid !== 'undefined') && (retdata.payload.members.length==0))
    {
    retdata.status_code=404;
    retdata.message="Group "+groupid+" does not exist!";
  }
  return retdata;
}
const getGroupsDataJson = async (groupid) => {
  let cfile=path.join(config.ROOT_DIR, 'confdata', 'groups.json');
  let rawdata=fs.readFileSync(cfile);
  let confjson=JSON.parse(rawdata);

  if (ciEquals(confjson.type,"inline")) return getGroupsDataJsonFromInline(confjson, groupid);
  else {
    // To-Be-Implemented for database search
    let retdata={
      'payload':{
          'members': [],
          'links': []
      },
      'status_code':500,
      'message':'To be implemented.'
    };
    return retdata;
  }
}


const formHtmlForGroup=(jsondata)=>{
  let retdata="<!DOCTYPE html><html><head><title>";
  retdata+="Group - "+jsondata.payload.links[0].title;
  retdata+="</title></head><body><h1>";
  retdata+="Group - "+jsondata.payload.links[0].title;
  retdata+="</h1>";
  retdata+="<br/><p>The <a href=";
  retdata+='"'+jsondata.payload.links[0].href+'"'+">group</a> has the following members: </p>";
  retdata+="<p>";
  retdata+="<ul>";
  let links=jsondata.payload.members;
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

const getGroupsDataHtml = async (groupid) => {
  let mretdata={
    'payload':"",
    'status_code':200,
    'message':'success'
  };
  try {
    let retdata="";
    let jsondata=await getGroupsDataJson(groupid);
    retdata=formHtmlForGroup(jsondata);
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
  getGroupsDataJson,
  getGroupsDataHtml
};
