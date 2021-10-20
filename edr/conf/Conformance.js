const getConformanceJson = () => {
  const retdata = {
    conformsTo: [
      'http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core',
      'http://www.opengis.net/spec/ogcapi-common-2/1.0/conf/collections',
      'http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/oas30',
      'http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/html',
      'http://www.opengis.net/spec/ogcapi-edr-1/1.0/conf/geojson',
    ],
  };
  return retdata;
};
const getConformanceHtml = () => {
  const jsonData = getConformanceJson();
  let retdata = '<!DOCTYPE html><html><head><title>';
  retdata += 'Conformance';
  retdata += '</title></head><body><h1>';
  retdata += 'Conformance';
  retdata += '</h1>';
  retdata += '<br/><p>This service conforms to the following:</p>';
  retdata += '<p>';
  retdata += '<ul>';
  const links = jsonData.conformsTo;
  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    retdata += '<li>';
    retdata += link;
    retdata += '</li>';
    //    retdata+="<li><a href=\""+link.href"\">"+link.title+"</a><li>";
  }
  retdata += '</ul>';
  retdata += '</p></body></html>';
  return retdata;
};
module.exports = {
  getConformanceJson,
  getConformanceHtml,
};
