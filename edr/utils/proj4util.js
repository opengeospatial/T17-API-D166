var vm = require("vm");
var fs = require("fs");

class Proj4jsUtils{
  static loadProj4jsDef(namedproj){
    idx=namedproj.lastIndexOf(':');
    if (idx>=0){
      projsys=namedproj.substring(0,idx);
      projcode=namedproj.substring(idx+1,namedproj.length);
      srurl="https://spatialreference.org/ref/"+projsys.toLowerCase()+"/"+projcode+"/proj4js/";
      var data = fs.readFileSync('./externalfile.js');
      const script = new vm.Script(data);
      script.runInThisContext();
    }
  }
}

module.exports=Proj4jsUtils;
