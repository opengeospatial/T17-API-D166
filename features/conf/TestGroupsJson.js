const TestGroupsJson={
  "members": [
    {
      "variables": {
        "within_units": [
          "km",
          "miles"
        ],
        "output_formats": [
          "CoverageJSON",
          "GeoJSON",
          "IWXXM",
          "GRIB"
        ],
        "description": "Query to return data for a defined well known text point",
        "query_type": "trajectory",
        "title": "Position query",
        "width_units": [
          "km",
          "miles"
        ],
        "height_units": [
          "m",
          "hPa"
        ],
        "default_output_format": "default_output_format",
        "crs_details": [
          {
            "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
            "crs": "native"
          },
          {
            "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
            "crs": "native"
          }
        ],
        "coords": {
          "tag": "Well Known Text POINT definition i.e. POINT(-120 55)"
        }
      },
      "hreflang": "en",
      "templated": true,
      "rel": "alternate",
      "length": 0,
      "href": "http://data.example.com/collections/monitoringsites/locations/1234",
      "type": "application/geo+json",
      "title": "Monitoring site name"
    },
    {
      "variables": {
        "within_units": [
          "km",
          "miles"
        ],
        "output_formats": [
          "CoverageJSON",
          "GeoJSON",
          "IWXXM",
          "GRIB"
        ],
        "description": "Query to return data for a defined well known text point",
        "query_type": "trajectory",
        "title": "Position query",
        "width_units": [
          "km",
          "miles"
        ],
        "height_units": [
          "m",
          "hPa"
        ],
        "default_output_format": "default_output_format",
        "crs_details": [
          {
            "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
            "crs": "native"
          },
          {
            "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]",
            "crs": "native"
          }
        ],
        "coords": {
          "tag": "Well Known Text POINT definition i.e. POINT(-120 55)"
        }
      },
      "hreflang": "en",
      "templated": true,
      "rel": "alternate",
      "length": 0,
      "href": "http://data.example.com/collections/monitoringsites/locations/1234",
      "type": "application/geo+json",
      "title": "Monitoring site name"
    }
  ],
  "links": [
    {
      "href": "http://data.example.org/collections.json",
      "rel": "self",
      "type": "application/json",
      "title": "this document"
    },
    {
      "href": "http://data.example.org/collections.html",
      "rel": "alternate",
      "type": "text/html",
      "title": "this document as HTML"
    },
    {
      "href": "http://schemas.example.org/1.0/foobar.xsd",
      "rel": "describedby",
      "type": "application/xml",
      "title": "XML schema for Acme Corporation data"
    }
  ]
};
module.exports = TestGroupsJson;
