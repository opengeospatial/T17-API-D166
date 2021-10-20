const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const Provider = require('./Provider');

function ciEquals(a, b) {
    return typeof a === 'string' && typeof b === 'string'
        ? a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
        : a === b;
}

const getProviders = async ({collectionId}) => {
  console.log('dataset=');
  console.log(collectionId);
  let cfile=path.join(config.ROOT_DIR, 'data', 'collections.json');
  let rawdata=fs.readFileSync(cfile);
  let confjson=JSON.parse(rawdata);

  let retdata={
    'payload':{
        'providers': [],
    },
    'status_code':200,
    'message':'success'
  };

  if (typeof collectionId === 'undefined'){
    retdata.status_code=404;
    retdata.message="Invalid parameter. Parameter 'collectionId' is required.";
    return retdata;
  }

  let resources = confjson.resources;
  for (var i in resources){
    if (ciEquals(resources[i].type,"collections")) {
      let resource=resources[i];
      let dataset=collectionId;
      let rrdata = await Provider.getCollectionAsProvider({resource, dataset}); //{status1,retdata1}
      if (rrdata.length>0){
        retdata.payload.providers=rrdata;
        return retdata;
      }
/*      if (rrdata.status === 1) {
        console.log("returned with one collection");
        return rrdata.retdata;
      }
      retdata=rrdata.retdata;
*/
    }
    if (!ciEquals(resources[i].type,"collection")) continue;

    if (ciEquals(collectionId,i)) {
      if (resources[i].providers)
        retdata.payload.providers=resources[i].providers;
      else{
        retdata.status_code=500;
        retdata.message="Dataset '"+collectionId+"' does not specify any provider.";
      }
      return retdata;
    }
  }

  retdata.status_code=404;
  retdata.message="Resource '"+collectionId+"' does not exist!";

  return retdata;
}


module.exports = {
  getProviders,
};
