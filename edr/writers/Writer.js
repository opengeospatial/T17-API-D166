const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const writers = require('../writers');
const writerList = require('./WriterList');
const Negotiator = require('negotiator');
const url = require('url');

class Writer {
  getMediaWriterByValue(val){
    for (const [key, value] of Object.entries(writerList)) {
      console.log(`${key}: ${value}`);
      if (value === val)
        return key;
    }
    return "undefined";
  }
  sendResponse(request, response, payload, serverConfig, reqparams) {
    try{
      /**
      * The default response-code is 200. We want to allow to change that. in That case,
      * payload will be an object consisting of a code and a payload. If not customized
      * send 200 and the payload as received in this method.
      */
      console.log('In writer.......');
      console.log(Object.entries(writers).length);
      console.log(writers);
      const originUrl = request.originalUrl;
      console.log(originUrl);

       const url_parts = url.parse(originUrl);
       const originPath=url_parts.pathname;
       const lastPathPart=originPath.substring(originPath.lastIndexOf('/') + 1);

      let availableMediaTypes=[];
      for (const [key, value] of Object.entries(writerList)) {
        console.log(`${key}: ${value}`);
        availableMediaTypes.push(value);
      }

      console.log("availableMediaTypes=");
      console.log(availableMediaTypes);

      let negotiator = new Negotiator(request);
      console.log("requested mediatype=");
      console.log(negotiator.mediaTypes());
      console.log("Negotiated=");
      console.log(negotiator.mediaType(availableMediaTypes));

      let preferMediaType=negotiator.mediaType(availableMediaTypes);
      let reqMediaType=request.query["f"];
      if (reqMediaType!==undefined){
        preferMediaType=reqMediaType;
      }

      let mediaWriter=this.getMediaWriterByValue(preferMediaType);

      console.log("mediaWriter=");
      console.log(mediaWriter);

      let wr=writers[mediaWriter];
      console.log("wr=");
      console.log(wr);

      if ((!wr || wr === undefined)){
        console.log('There is no model named as "'+mediaWriter+'" under "writers".');
  //      retdata.status=500;
  //      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
  //      return retdata;
        return;
      }

      wr.sendResponse(response,payload,serverConfig, reqparams, lastPathPart);


/*      response.status(payload.code || 200);
      const responsePayload = payload.payload !== undefined ? payload.payload : payload;
      if (responsePayload instanceof Object) {
        response.json(responsePayload);
      } else {
        response.end(responsePayload);
      }
*/
    }catch(excep_var){
      console.log(excep_var);
    }
  }
}

module.exports = Writer;
