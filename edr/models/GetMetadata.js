const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');

const getMetadata = async () => {
  let cfile=path.join(config.ROOT_DIR, 'data', 'collections.json');
  let rawdata=fs.readFileSync(cfile);
  let confjson=JSON.parse(rawdata);

  let retdata={
    'payload':{
        'metadata': {},
    },
    'status_code':200,
    'message':'success'
  };

  let metadata = confjson.metadata;
  if (metadata !== null && metadata !== "undefined"){
    retdata.payload.metadata=metadata;
  }else{
    retdata.status_code=500;
    retdata.message="error";
  }
  return retdata;
}


module.exports = {
  getMetadata,
};
