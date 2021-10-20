const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const models = require('../models');

const getCollectionAsProvider = async ({ resource, dataset }) => {
  let retproviders=[];
  try{
    let providers=resource.providers;
    if (!providers || (typeof providers === "undefined") || (!Array.isArray(providers)) || (providers.length<1)){
      logger.log('warn','No provider for resource = '+resource.title);
      return retproviders;
    }
    let provider=providers[0];
    if (provider.type !== "collection"){
      logger.log('warn','The first provider is not for collection for resource = '+resource.title);
      return retproviders;
    }

    let providerName=provider.name;
    if ((!providerName || providerName === undefined)){
      logger.log('warn','The first provider has no provider name for resource = '+resource.title);
      return retproviders;
    }
    let mls=models[providerName];
    if ((!mls || mls === undefined)){
      logger.log('warn','There is no model for provider = '+providerName);
      return retproviders;
    }

    return await mls.getCollectionAsProvider({provider, dataset});
//    return {status,retdata};
  }catch(excep_var){
    logger.log('warn','Internal Server Error for resource='+resource.title+'. Error-message: '+excep_var.message);
    return retproviders;
  }

}


module.exports = {
  getCollectionAsProvider
};
