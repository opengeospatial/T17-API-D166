const LandingPageJson={
  "keywords": [
    "Temperature",
    "Wind",
    "Point",
    "Trajectory"
  ],
  "provider": {
    "name": "name",
    "url": "url"
  },
  "contact": {
    "stateorprovince": "stateorprovince",
    "instructions": "instructions",
    "country": "country",
    "hours": "hours",
    "address": "address",
    "phone": "phone",
    "city": "city",
    "postalCode": "postalCode",
    "fax": "fax",
    "email": "email"
  },
  "description": "Access to Meteorological data via a Web API that conforms to the OGC API Environmental Data Retrieval specification.",
  "links": [
    {
      "href": "http://localhost:8080/edr/api",
      "hreflang": "en",
      "rel": "service",
      "type": "application/openapi+json;version=3.0",
      "title": ""
    },
    {
      "href": "http://localhost:8080/edr/conformance",
      "hreflang": "en",
      "rel": "data",
      "type": "application/json",
      "title": ""
    },
    {
      "href": "http://localhost:8080/edr/collections",
      "hreflang": "en",
      "rel": "data",
      "type": "application/json",
      "title": ""
    }
  ],
  "title": "Meteorological data server"
};
module.exports = LandingPageJson;
