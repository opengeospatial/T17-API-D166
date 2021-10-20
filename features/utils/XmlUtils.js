const xmldom = require('xmldom');

class XmlUtils{
  static mergeTwoDocument(adoc, elemida, destida, bdoc, elemidb){
    // create an empty document:
    let domimp=new xmldom.DOMImplementation();
    let doc = domimp.createDocument("", "", null);

    // Append desired element to the doc:
    doc.appendChild(adoc.getElementById(elemida));

    // Append fragment to desired element:
    doc.getElementById(destida).appendChild(bdoc.getElementById(elemidb));

    return doc;
  }

  static addFeatureCollectionWrap(xmlstr){

    // create an empty document:
    let domimp=new xmldom.DOMImplementation();
    let doc = domimp.createDocument("http://www.opengis.net/wfs","FeatureCollection",null);
    let member=doc.createElementNS("http://www.opengis.net/wfs","member");
    doc.documentElement.appendChild(member);


    // parse the document
    let domparser=new xmldom.DOMParser();
    let adoc = domparser.parseFromString(xmlstr);

    // Append desired element to the doc:
//    doc.appendChild(adoc.getElementById(elemida));

    // Append fragment to desired element:
//    doc.getElementById(destida).appendChild(bdoc.getElementById(elemidb));
    member.appendChild(adoc.documentElement);

    let docwriter=new xmldom.XMLSerializer();
    let retstr=docwriter.serializeToString(doc);


    return retstr;
  }
}
module.exports=XmlUtils;
