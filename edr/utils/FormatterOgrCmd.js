const { execSync } = require('child_process');
const uuid = require('uuid');
const fs = require('fs');

const gmlToGeoJSONOgrCmd = async (gmlstr) => {
  let fstr="f"+uuid.v4()+".gml";
  let foutstr="f"+uuid.v4()+".json";
  try{
    await writeStringToFile(gmlstr,fstr);
//    var data= await ogr2ogr(fstr).format("GeoJSON").promises();
//    console.log(data);
    await deleteFile(fstr);
    return "data";
  }catch(error){
    throw(new Error("Error-processing:"+error.message));
  }finally{

  }
  return {"Error":true};
}
/*
// stderr is sent to stdout of parent process
// you can set options.stdio if you want it to go elsewhere
const stdout = execSync('ls');
const { spawnSync} = require('child_process');
const child = spawnSync('ls', );
console.error('error', child.error);
console.log('stdout ', child.stdout);
console.error('stderr ', child.stderr);
*/
const writeStringToFile=async(gmlstr,filename) => {
  try{
    await fs.promises.writeFile(filename, gmlstr, "utf8");
//    fs.writeFileSync(filename,gmlstr,"utf8");
  }catch(error){
    throw(new Error("Error-writing:"+error.message));
  }finally{

  }
}

const deleteFile = async(fstr) => {
  try{
    await fs.promises.unlink(fstr);
  }catch(error){
    throw(new Error("Error-deleting file"));
  }finally{

  }
}

module.exports={
  gmlToGeoJSONOgrCmd
}
