const xml2js = require('xml2js');

const gmlToGeoJSON = async (gmlstr) => {
  let feature_collection = {
      'type': 'FeatureCollection',
      'features': []
  }
  try {
    const result = await xml2js.parseStringPromise(gmlstr, { mergeAttrs: true });

    // convert it to a JSON string
    const json = JSON.stringify(result, null, 4);

    // save JSON in a file
    //fs.writeFileSync('user.json', json);

//    console.dir(result['wfs:FeatureCollection']['wfs:member'][0]);
    let skeys = Object.keys(result);
    if (Array.isArray(skeys) && skeys.length == 1 && skeys[0].endsWith("FeatureCollection")){
      let members=getMember(result[skeys[0]]);
      if (Array.isArray(members)){
        for (let im=0;im<members.length;im++){
          let feature=formFeature(members[im]);
        }
      }
    }


  } catch (err) {
      console.log(err);
  }
}
const formFeature =(rowdata)=>{
  if (!rowdata) return {};
  let feature = {
    'type': 'Feature'
  }
  feature['id']=rowdata["gml:id"];
  if (rowdata.geometry === undefined){
    feature['geometry']=null;
  }else{
    feature['geometry'] = JSON.parse(rowdata.geometry);
    delete rowdata.geometry;
  }
  feature['properties']=rowdata;
  if (feature['properties'][providers[0].title_field] || (feature['properties'][providers[0].title_field] !== undefined))
    feature['properties']['title']=feature['properties'][providers[0].title_field];
  feature['id']=String(feature['properties'][providers[0].id_field]);
  return feature;
}
const getGmlIdFromMember(rowdata){
  let skeys = Object.keys(rowdata);
  if (Array.isArray(skeys) && skeys.length == 1){
    let members=getMember(result[skeys[0]]);
    if (Array.isArray(members)){
      for (let im=0;im<members.length;im++){
        let feature=formFeature(members[im]);
      }
    }
  }
}
const getMember = (xjson) => {
  let skeys=Object.keys(xjson);
  if (Array.isArray(skeys)){
    for (let idx=0; idx<skeys.length; idx++){
      let skey=skeys[idx];
      if (skey.endsWith("member")){
        let xx=xjson[skey];
        return xx;
      }
    }
  }
  return null;
}
module.exports={
  gmlToGeoJSON
}
