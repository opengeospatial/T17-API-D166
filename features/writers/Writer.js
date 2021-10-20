const fs=require('fs');
const path = require('path');
const logger = require('../logger');
const config = require('../config');
const writers = require('../writers');
const writerList = require('./WriterList');
const Negotiator = require('negotiator');


class Writer {
  getMediaWriterByValue(val){
    for (const [key, value] of Object.entries(writerList)) {
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

      let availableMediaTypes=[];
      for (const [key, value] of Object.entries(writerList)) {
        availableMediaTypes.push(value);
      }


      let negotiator = new Negotiator(request);

      let preferMediaType=negotiator.mediaType(availableMediaTypes);
      let reqMediaType=request.query["f"];
      if (reqMediaType!==undefined){
        preferMediaType=reqMediaType;
      }

      let mediaWriter=this.getMediaWriterByValue(preferMediaType);


      let wr=writers[mediaWriter];

      if ((!wr || wr === undefined)){
        console.log('There is no model named as "'+mediaWriter+'" under "writers".');
  //      retdata.status=500;
  //      retdata.message='There is no model named as "'+providerName+'" under "modelers".';
  //      return retdata;
        return;
      }

      wr.sendResponse(response,payload,serverConfig, reqparams);


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
