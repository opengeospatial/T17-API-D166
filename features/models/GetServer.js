const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');

const getServer = async () => {
  let cfile=path.join(config.ROOT_DIR, 'data', 'collections.json');
  let rawdata=fs.readFileSync(cfile);
  let confjson=JSON.parse(rawdata);

  let retdata={
    'payload':{
        'server': {},
    },
    'status_code':200,
    'message':'success'
  };

  let server = confjson.server;
  if (server !== null && server !== "undefined"){
    retdata.payload.server=server;
  }else{
    retdata.status_code=500;
    retdata.message="error";
  }
  return retdata;
}


module.exports = {
  getServer,
};
