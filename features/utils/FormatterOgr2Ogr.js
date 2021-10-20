const ogr2ogr = require('ogr2ogr');
const uuid = require('uuid');
const fs = require('fs');

const gmlToGeoJSON = async (gmlstr) => {
  let fstr="tmp/f"+uuid.v4()+".gml";
  let foutstr="tmp/f"+uuid.v4()+".json";
  let tempfilewrite=false;
  try{
    await writeStringToFile(gmlstr,fstr);
    tempfilewrite=true;
    var data= await ogr2ogr(fstr).format("GeoJSON").promise();
    await deleteFile(fstr);
    tempfilewrite=false;
    return data;
  }catch(error){
    throw(new Error("Error-processing:"+error.message));
  }finally{
    if (tempfilewrite) deleteFile(fstr);
  }
  return {"status":false,"message":"Failed"}
}

const geoJSONToGML = async (jsonstr) => {
  let fstr="f"+uuid.v4()+".json";
  let foutstr="f"+uuid.v4()+".gml";
  try{
    writeStringToFile(gmlstr,fstr);
    var data= await ogr2ogr(fstr).format("GML").promise();
    deleteFile(fstr);

  }catch(error){
    throw(new Error("Error-processing"));
  }finally{

  }

}

const writeStringToFile=async(gmlstr,filename) => {
  try{
    await fs.promises.writeFile(filename, gmlstr, "utf8");
//    fs.writeFileSync(filename,gmlstr,"utf8");
    return {"status":true,"message":"Write to: '"+filename+"'"}
  }catch(error){
    throw(new Error("Error-writing: "+error.message));
  }finally{

  }
  return {"status":false,"message":"Failed"}
}

const readFileAsString=async(filename) => {
  try{
    const data = await fs.promises.readFile(filename, "utf8");
    return data;
  }catch(error){
    throw(new Error("Error-reading: "+error.message));
  }finally{

  }
  return {"status":false,"message":"Failed"}
}


const deleteFile = async(fstr) => {
  try{
    await fs.promises.unlink(fstr);
  }catch(error){
    throw(new Error("Error-deleting file: "+error.message));
  }finally{

  }
}


module.exports = {
  gmlToGeoJSON,
  geoJSONToGML
}
