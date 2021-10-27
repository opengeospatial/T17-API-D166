# T17-API-D166
This is a set of JavaScript implementations of [OGC](https://www.ogc.org/) [API-Features](https://ogcapi.ogc.org/features/) and [API-Environmental Data Retrieval (EDR)](https://ogcapi.ogc.org/edr/). This is part of the implementation experiments completed in the OGC Testbed 17 in 2021.

## Deployment Through Source Code
This section contains information on how to deploy the JavaScript server implementation through cloning the source code with configuration.

### Requirements of Virtual Machine
The following are tested and recommended system configuration.

- Ubuntu 18.04 or higher or Debian 10 (Buster) or higher
- NodeJS (>= 10.6) and NPM (>= 6.10.0)
- git
- GDAL 2 or higher
- PM2 Process Management
- HTTP server (e.g. Apache or nginx) for proxy

### Cloning of Source
Use git to clone the source into a local work directory.
```
git clone https://github.com/opengeospatial/T17-API-D166.git
```
### API-features
Change working directory to "T17-API-D166/features". You may run the following command to pre-install all required libraries.
```
npm install
```
#### Start the Service
Run the following command to start the server as a service.
```
sudo pm2 start index.js
```
Run the following command to stop the server.
```
sudo pm2 stop index.js
```
#### Configurations

##### Service Endpoints
Edit config.js to configure the running port and the external service endpoint. The external service endpoint can be different from local server endpoint with port if the proxy is set up to redirect the service. If both services (API-Features and EDR) run on the same virtual machine, different ports should be configured.

##### Configuring Back-end PostGIS Database
Edit the file 'data/collections.json' to add new back-end PostGIS database. The new element should be added under node 'resources'. The following is one example -
```
"tl_2020_us_county": {
  "type": "collection",
  "title": "Tiger Line US Counties",
  "description": "Counties, US Census, TIGER/Line",
  "keywords": [
    "counties",
    "US",
    "TIGER/Line"
  ],
  "links": [
    {
      "type": "text/html",
      "rel": "canonical",
      "title": "information",
      "href": "https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html",
      "hreflang": "en-US"
    }
  ],
  "extents": {
    "spatial": {
      "bbox": [
        -179.231086,
        -14.601813,
        179.859681,
        71.439786
      ],
      "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
    }
  },
  "providers": [
    {
      "type": "feature",
      "name": "PostGIS",
      "data": "postgresql://tluser:tl2020@localhost:5432/tl",
      "id_field": "ogc_fid",
      "title_field": "name",
      "table": "tl_2020_us_county",
      "geometry":{
        "geom_field":"wkb_geometry",
        "geom_format":"ewkb"
      }
    }
  ]
},

```
##### Configuring Back-end WFS Service Endpoints
Edit the file 'data/collections.json' to add new back-end WFS Service Endpoints. The new element should be added under node 'resources'. The following is one example to add one single feature collection -
```
"DC_Building_Footprints": {
  "type": "collection",
  "title": "DC Building Footprints",
  "description": "DC building footprints.",
  "keywords": [
    "DC",
    "US",
    "building",
    "footprint"
  ],
  "links": [
    {
      "type": "text/html",
      "rel": "canonical",
      "title": "information",
      "href": "https://cubewerx.pvretano.com/cubewerx/cubeserv/default/ogcapi/usbuildingfootprints/collections/DC_Building_Footprints",
      "hreflang": "en-US"
    }
  ],
  "extents": {
    "spatial": {
      "bbox": [
        -77.115085,
        38.810444,
        -76.909707,
        38.99561
      ],
      "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
    }
  },
  "providers": [
    {
      "type": "feature",
      "name": "WFS202",
      "id_field": "gml_id",
      "typename": "DC_Building_Footprints",
      "data": "https://www.pvretano.com/cubewerx/cubeserv?datastore=usbuildingfootprints&"
    }
  ]
},

```
All feature collections may be added as the back-end service. The following resource configuration shows an example to use the capabilities of WFS.
```
"daraa": {
  "type": "collections",
  "title": "CubeSERV WFS - Daraa",
  "description": "CubeSERV WFS - Daraa service, support version 2.0.2.",
  "keywords": [
    "WFS",
    "feature",
    "capabilities"
  ],
  "links": [
    {
      "type": "text/html",
      "rel": "canonical",
      "title": "information",
      "href": "https://www.pvretano.com/cubewerx/cubeserv?DATASTORE=daraa&SERVICE=WFS",
      "hreflang": "en-US"
    }
  ],
  "providers": [
    {
      "type": "collection",
      "name": "WFS202Capabilities",
      "data": "https://test.cubewerx.com/cubewerx/cubeserv/demo?DATASTORE=Daraa&SERVICE=WFS&REQUEST=GetCapabilities&AcceptVersions=2.0.2&AcceptFormats=text/xml",
      "removeprefix":"cw"
    }
  ]
},

```
### API-Environmental Data Retrieval

Change working directory to "T17-API-D166/edr". You may run the following command to pre-install all required libraries.
```
npm install
```
#### Start the Service
Run the following command to start the server as a service.
```
sudo pm2 start index.js
```
Run the following command to stop the server.
```
sudo pm2 stop index.js
```

#### Configurations

##### Service Endpoints
Edit config.js to configure the running port and the external service endpoint. The external service endpoint can be different from local server endpoint with port if the proxy is set up to redirect the service.

##### Configuring Back-end PostGIS Database
Edit the file 'data/collections.json' to add new back-end PostGIS database. The new element should be added under node 'resources'. The following is one example -
```
"noaa_global_hourly_surface": {
  "type": "collection",
  "title": "The Integrated Surface Dataset (global, hourly)",
  "description": "The Integrated Surface Dataset (ISD) is composed of worldwide surface weather observations from over 35,000 stations, though the best spatial coverage is evident in North America, Europe, Australia, and parts of Asia. Parameters included are: air quality, atmospheric pressure, atmospheric temperature/dew point, atmospheric winds, clouds, precipitation, ocean waves, tides and more. ISD refers to the data contained within the digital database as well as the format in which the hourly, synoptic (3-hourly), and daily weather observations are stored. The format conforms to Federal Information Processing Standards (FIPS). ISD provides hourly data that can be used in a wide range of climatological applications. For some stations, data may go as far back as 1901, though most data show a substantial increase in volume in the 1940s and again in the early 1970s. Currently, there are over 14,000 'active' stations updated daily in the database. For user convenience, a subset of just the hourly data is available to users for download. It is referred to as Integrated Surface Global Hourly data, see associated download links for access to this subset.",
  "keywords": [
    "Integrated Surface Dataset",
    "Global",
    "NOAA"
  ],
  "links": [
      {
        "type": "text/html",
        "rel": "canonical",
        "title": "information",
        "href": "https://www.ncdc.noaa.gov/isd",
        "hreflang": "en-US"
      }
  ],
  "extents": {
    "spatial": {
      "bbox": [
        -180.00,
        -90.00,
        180.00,
        90.00
      ],
      "crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
    },
    "temporal": {
      "interval": [{
          "begin":"1972-01-01T00:00:00Z",
          "end":"1972-12-31T23:59:59Z"
      }],
      "trs": "TIMECRS[\"DateTime\",TDATUM[\"Gregorian Calendar\"],CS[TemporalDateTime,1],AXIS[\"Time (T)\",future]"
    }
  },
  "data_queries" : {
      "position": {
          "link": {
              "href": "/collections/noaa_global_hourly_surface/position?coords={coords}",
              "hreflang": "en",
              "rel": "data",
              "templated": true,
              "variables": {
                  "title": "Position query",
                  "description": "Position query",
                  "query_type": "position",
                  "coords" :{
                      "description": "Well Known Text POINT value i.e. POINT(-120, 55)"
                  },
                  "output_formats": [
                      "CoverageJSON",
                      "GeoJSON",
                      "IWXXM"
                  ],
                  "default_output_format": "IWXXM",
                  "crs_details": [
                      {
                          "crs": "CRS84",
                          "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]"
                      }
                  ]
              }
          },
          "linkrel":"relative"
      },
      "radius": {
          "link": {
              "href": "/collections/noaa_global_hourly_surface/radius?coords={coords}",
              "hreflang": "en",
              "rel": "data",
              "templated": true,
              "variables": {
                  "title": "Radius query",
                  "description": "Radius query",
                  "query_type": "radius",
                  "coords" :{
                      "description": "Well Known Text POINT value i.e. POINT(-120, 55)"
                  },
                  "output_formats": [
                      "CoverageJSON",
                      "GeoJSON",
                      "IWXXM"
                  ],
                  "default_output_format": "GeoJSON",
                  "within_units": [
                      "km",
                      "miles"
                  ],
                  "crs_details": [
                      {
                          "crs": "CRS84",
                          "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]"
                      }
                  ]
              }
          },
          "linkrel":"relative"
      },
      "area": {
          "link":                 {
              "href": "http://www.example.org/edr/collections/hrly_obs/area?coords={coords}",
              "hreflang": "en",
              "rel": "data",
              "templated": true,
              "variables": {
                  "title": "Area query",
                  "description": "Area query",
                  "query_type": "area",
                  "coords" :{
                      "description": "Well Known Text POLYGON value i.e. POLYGON((-79 40,-79 38,-75 38,-75 41,-79 40))"
                  },
                  "output_formats": [
                      "CoverageJSON",
                      "GeoJSON",
                      "BUFR",
                      "IWXXM"
                  ],
                  "default_output_format": "CoverageJSON",
                  "crs_details": [
                      {
                          "crs": "CRS84",
                          "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]"
                      }
                  ]
              }
          }
      },
      "locations": {
          "link": {
              "href": "/collections/noaa_global_hourly_surface/locations",
              "hreflang": "en",
              "rel": "data",
              "templated": false,
              "variables": {
                  "title": "Location query",
                  "description": "Location query",
                  "query_type": "locations",
                  "output_formats": [
                      "application%2Fgeo%2Bjson",
                      "text%2Fhtml"
                  ],
                  "default_output_format": "application%2Fgeo%2Bjson",
                  "crs_details": [
                      {
                          "crs": "CRS84",
                          "wkt": "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.01745329251994328,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]"
                      }
                  ]
              }
          },
          "linkrel":"relative"
      }
  },
  "crs": [
      "CRS84"
  ],
  "output_formats": [
      "CoverageJSON",
      "GeoJSON",
      "IWXXM"
  ],
  "parameter_names": {
  },
  "providers": [
    {
      "type": "feature",
      "name": "PostGIS",
      "data": "postgresql://noaauser:noaa2020@localhost:5432/noaa",
      "id_field": "ogc_id",
      "locid_field": "station",
      "title_field": "station",
      "table": "noaa_global_surface",
      "geometry":{
        "geom_field":"the_geom",
        "geom_format":"ewkb"
      },
      "time_field":{
        "time_format":"datetime",
        "datetime":"date"
      }
    }
  ]
},

```
##### Configuring Back-end WFS Service Endpoints
To be added.

## Running Through Docker

### Run OGC API-Features
The following command run the service directly using docker:
```
docker run -p 8080:8080 -d eugenegmu/ogc-api-features-javascript
```
To test the server, you may browse to http://localhost:8080 to test the results. This image does not have the PostGIS set up locally. The first three collections do not work properly. Configuration needs to be done if a proper postgis database set up with populated data. If a port is redirected to a different port other than 8080, the configuration needs to be updated. To get into the image, the following command may be used.
```
docker exec -it <container id or name> /bin/bash
```
The container ID or name can be found by run "docker container ls".

### Run OGC API-Environmental Data Retrieval
The following command run the service directly using docker:
```
docker run -p 8080:8080 -d eugenegmu/ogc-api-edr-javascript
```
To test the server, you may browse to http://localhost:8080/edr/ to test the results. This image does not have the PostGIS set up locally. Configuration needs to be done with a proper postgis database set up with populated data. If a port is redirected to a different port other than 8080, the configuration needs to be updated. To get into the image, the following command may be used.
```
docker exec -it <container id or name> /bin/bash
```
The container ID or name can be found by run "docker container ls".

## Demonstration Deployment
The demonstration deployments can be found at [Demonstration Services for OGC Testbed 17](https://aws4ogc17.webmapengine.com/). Direct links to specific landing page are [API-Features](https://aws4ogc17.webmapengine.com/wfs3/) and [API-EDR](https://aws4ogc17.webmapengine.com/edr/) respectively.
