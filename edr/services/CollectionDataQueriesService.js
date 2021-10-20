/* eslint-disable no-unused-vars */
const Service = require('./Service');
const Modeler = require('../models/Modeler');

/**
* Query end point for queries of collection {collectionId} defined by a location id
* Return data the for the location defined by locid
*
* collectionId String Identifier (id) of a specific collection
* locId String Retreive data for the location defined by locId (i.e. London_Heathrow, EGLL, 03772 etc)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getCollectionDataForLocation = (request,{ collectionId, locId, datetime, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getCollectionDataForLocation....");

//      resolve(Service.successResponse({
//        collectionId,
//        locId,
//        datetime,
//        crs,
//        f,
//      }));
      console.log("First CollectionId=");
      console.log(collectionId);
      console.log("locId=");
      console.log(locId);
      let retdata=await Modeler.getFeaturesByLocationId(request,{"collectionId":collectionId, "locId":locId, "datetime":datetime});
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }

    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for area queries  of collection {collectionId} defined by a polygon
* Return the data values for the data area defined by the query parameters
*
* collectionId String Identifier (id) of a specific collection
* coords String Only data that has a geometry that intersects the area defined by the polygon are selected.   The polygon is defined using a Well Known Text string following   coords=POLYGON((x y,x1 y1,x2 y2,...,xn yn x y))  which are values in the coordinate system defined by the crs query parameter  (if crs is not defined the values will be assumed to be WGS84 longitude/latitude coordinates).    For instance a polygon that roughly describes an area that contains  South West England in WGS84 would look like:   coords=POLYGON((-6.1 50.3,-4.35 51.4,-2.6 51.6,-2.8 50.6,-5.3 49.9,-6.1,50.3))  see http://portal.opengeospatial.org/files/?artifact_id=25355 and  https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry  The coords parameter will only support 2D POLYGON definitions
* z String Define the vertical level to return data from  i.e. z=level  for instance if the 850hPa pressure level is being queried  z=850  or a range to return data for all levels between and including 2 defined levels i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  finally a list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* resolutionX Object Defined it the user requires data at a different resolution from the native resolution of the data along the x-axis  If this is a single value it denotes the number of intervals to retrieve data for along the x-axis      i.e. resolution-x=10     would retrieve 10 values along the x-axis from the minimum x coordinate to maximum x coordinate (i.e. a value at both the minimum x and maximum x coordinates and 8 values between).  (optional)
* resolutionY Object Defined it the user requires data at a different resolution from the native resolution of the data along the y-axis  If this is a single value it denotes the number of intervals to retrieve data for along the y-axis      i.e. resolution-y=10     would retrieve 10 values along the y-axis from the minimum y coordinate to maximum y coordinate (i.e. a value at both the minimum y and maximum y coordinates and 8 values between).  (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForArea = (request, { collectionId, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataForArea....");

//      resolve(Service.successResponse({
//        collectionId,
//        coords,
//        z,
//        datetime,
//        parameterName,
//        crs,
//        resolutionX,
//        resolutionY,
//        f,
//      }));
        console.log("First CollectionId=");
        console.log(collectionId);
        let retdata=await Modeler.getFeaturesByArea(request,{collectionId, coords, z, datetime, parameterName, crs, resolutionX, resolutionY, f});
        console.log("status_code=");
        console.log(retdata.status_code);
        if (retdata.status_code == 200)
          resolve(Service.successResponse(retdata.payload,200));
        else {
          resolve(Service.rejectResponse(retdata.message,retdata.status_code));
        }

    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for Corridor queries  of collection {collectionId} defined by a polygon
* Return the data values for the Corridor defined by the query parameters
*
* collectionId String Identifier (id) of a specific collection
* coords String Only data that has a geometry that intersects the area defined by the linestring are selected.   The trajectory is defined using a Well Known Text string following   A 2D trajectory, on the surface of earth with no time or height dimensions:      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)  A 2D trajectory, on the surface of earth with all for the same time and no height dimension, time value defined in ISO8601 format by the `datetime` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&time=2018-02-12T23:00:00Z       A 2D trajectory, on the surface of earth with no time value but at a fixed height level, height defined in the collection height units by the `z` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&z=850   A 2D trajectory, on the surface of earth with all for the same time and at a fixed height level, time value defined in ISO8601 format by the `datetime` query parameter and height defined in the collection height units by the `z` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&time=2018-02-12T23:00:00Z&z=850   A 3D trajectory, on the surface of the earth but over a time range with no height values: coords=LINESTRINGM(51.14 -2.98 1560507000, 51.36 -2.87 1560507600, 51.03 -3.15 1560508200, 50.74 -3.48 1560508500, 50.9 -3.36 1560510240)  A 3D trajectory, on the surface of the earth but over a time range with a fixed height value, height defined in the collection height units by the `z` query parameter :  coords=LINESTRINGM(51.14 -2.98 1560507000, 51.36 -2.87 1560507600, 51.03 -3.15 1560508200, 50.74 -3.48 1560508500, 50.9 -3.36 1560510240)&z=200   A 3D trajectory, through a 3D volume with height or depth, but no defined time: coords=LINESTRINGZ(51.14 -2.98 0.1, 51.36 -2.87 0.2, 51.03 -3.15 0.3, 50.74 -3.48 0.4, 50.9 -3.36 0.5)  A 3D trajectory, through a 3D volume with height or depth, but a fixed time time value defined in ISO8601 format by the `datetime` query parameter: coords=LINESTRINGZ(51.14 -2.98 0.1, 51.36 -2.87 0.2, 51.03 -3.15 0.3, 50.74 -3.48 0.4, 50.9 -3.36 0.5)&time=2018-02-12T23:00:00Z  A 4D trajectory, through a 3D volume but over a time range: coords=LINESTRINGZM(51.14 -2.98 0.1 1560507000,51.36 -2.87 0.2 1560507600, 51.03 -3.15 0.3 1560508200, 50.74 -3.48 0.4 1560508500, 50.9 -3.36 0.5 1560510240) (using either the `time` or `z` parameters with a 4D trajectory wil generate an error response)  where Z in `LINESTRINGZ` and `LINESTRINGZM` refers to the height value.   `If the specified CRS does not define the height units, the heights units will default to metres above mean sea level`  and the M in `LINESTRINGM` and `LINESTRINGZM` refers to the number of seconds that have elapsed since the Unix epoch, that is the time 00:00:00 UTC on 1 January 1970. See https://en.wikipedia.org/wiki/Unix_time
* corridorWidth String width of the corridor  The width value represents the whole width of the corridor where the trajectory supplied in the `coords` query parameter is the centre point of the corridor  `corridor-width={width}`  e.g.  corridor-width=100  Would be a request for a corridor 100 units wide with the coords parameter values being the centre point of the requested corridor,  the request would be for data values 50 units either side of the trajectory coordinates defined in the coords parameter.   The width units supported by the collection will be provided in the API metadata responses
* widthUnits String Distance units for the corridor-width parameter
* corridorHeight String height of the corridor  The height value represents the whole height of the corridor where the trajectory supplied in the `coords` query parameter is the centre point of the corridor  `corridor-height={height}`  e.g.  corridor-height=100  Would be a request for a corridor 100 units high with the coords parameter values being the centre point of the requested corridor,  the request would be for data values 50 units either side of the trajectory coordinates defined in the coords parameter.   The height units supported by the collection will be provided in the API metadata responses
* heightUnits String Distance units for the corridor-height parameter
* z String Define the vertical level to return data from  i.e. z=level  for instance if the 850hPa pressure level is being queried  z=850  or a range to return data for all levels between and including 2 defined levels i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  finally a list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* resolutionX Object Defined it the user requires data at a different resolution from the native resolution of the data along the x-axis  If this is a single value it denotes the number of intervals to retrieve data for along the x-axis      i.e. resolution-x=10     would retrieve 10 values along the x-axis from the minimum x coordinate to maximum x coordinate (i.e. a value at both the minimum x and maximum x coordinates and 8 values between).  (optional)
* resolutionZ Object Defined it the user requires data at a different resolution from the native resolution of the data along the z-axis  If this is a single value it denotes the number of intervals to retrieve data for along the z-axis      i.e. resolution-z=10     would retrieve 10 values along the z-axis from the minimum z coordinate to maximum z  coordinate (i.e. a value at both the minimum z and maximum z coordinates and 8 values between).  (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForCorridor = ({ collectionId, coords, corridorWidth, widthUnits, corridorHeight, heightUnits, z, datetime, parameterName, resolutionX, resolutionZ, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataForCorridor....");

      resolve(Service.successResponse({
        collectionId,
        coords,
        corridorWidth,
        widthUnits,
        corridorHeight,
        heightUnits,
        z,
        datetime,
        parameterName,
        resolutionX,
        resolutionZ,
        crs,
        f,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for Cube queries  of collection {collectionId} defined by a cube
* Return the data values for the data Cube defined by the query parameters
*
* collectionId String Identifier (id) of a specific collection
* bbox oneOf<object,object> Only features that have a geometry that intersects the bounding box are selected. The bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth): * Lower left corner, coordinate axis 1 * Lower left corner, coordinate axis 2 * Minimum value, coordinate axis 3 (optional) * Upper right corner, coordinate axis 1 * Upper right corner, coordinate axis 2 * Maximum value, coordinate axis 3 (optional) The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in the parameter `bbox-crs`. For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge). If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box. If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries. (optional)
* z String Define the vertical levels to return data from   A range to return data for all levels between and including 2 defined levels  i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  A list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForCube = ({ collectionId, bbox, z, datetime, parameterName, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataForCube....");

      resolve(Service.successResponse({
        collectionId,
        bbox,
        z,
        datetime,
        parameterName,
        crs,
        f,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Return item {itemId} from collection {collectionId}
* Query end point to retrieve data from collection {collectionId} using a unique identifier
*
* collectionId String Identifier (id) of a specific collection
* itemId String Retrieve data from the collection using a unique identifier.
* no response value expected for this operation
* */
const getDataForItem = (request, { collectionId, itemId }) => new Promise(
  async (resolve, reject) => {
    try {

      console.log("In getDataForItem....");

      let retdata=await Modeler.getFeature({"collectionId":collectionId, "featureId":itemId});
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }

//      resolve(Service.successResponse({
//        collectionId,
//        itemId,
//      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for position queries  of collection {collectionId}
* Query end point for position queries
*
* collectionId String Identifier (id) of a specific collection
* coords String location(s) to return data for, the coordinates are defined by a Well Known Text (wkt) string. to retrieve a single location :  POINT(x y) i.e. POINT(0 51.48) for Greenwich, London  And for a list of locations  MULTIPOINT((x y),(x1 y1),(x2 y2),(x3 y3))  i.e. MULTIPOINT((38.9 -77),(48.85 2.35),(39.92 116.38),(-35.29 149.1),(51.5 -0.1))  see http://portal.opengeospatial.org/files/?artifact_id=25355 and  https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry  the coordinate values will depend on the CRS parameter, if this is not defined the values will be assumed to WGS84 values (i.e x=longitude and y=latitude)
* z String Define the vertical level to return data from  i.e. z=level  for instance if the 850hPa pressure level is being queried  z=850  or a range to return data for all levels between and including 2 defined levels i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  finally a list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForPoint = (request,{ collectionId, coords, z, datetime, parameterName, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataForPoint....");

      let retdata=await Modeler.getFeaturesByPosition(request,{ collectionId, coords, z, datetime, parameterName, crs, f });
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }

//      resolve(Service.successResponse({
//        collectionId,
//        coords,
//        z,
//        datetime,
//        parameterName,
//        crs,
//        f,
//      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for radius queries  of collection {collectionId}
* Query end point for to return values within a defined radius of a point queries
*
* collectionId String Identifier (id) of a specific collection
* coords String location(s) to return data for, the coordinates are defined by a Well Known Text (wkt) string. to retrieve a single location :  POINT(x y) i.e. POINT(0 51.48) for Greenwich, London  see http://portal.opengeospatial.org/files/?artifact_id=25355 and  https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry  the coordinate values will depend on the CRS parameter, if this is not defined the values will be assumed to WGS84 values (i.e x=longitude and y=latitude)
* within BigDecimal Defines radius of area around defined coordinates to include in the data selection
* withinUnits String Distance units for the within parameter
* z String Define the vertical level to return data from  i.e. z=level  for instance if the 850hPa pressure level is being queried  z=850  or a range to return data for all levels between and including 2 defined levels i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  finally a list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForRadius = (request,{ collectionId, coords, within, withinUnits, z, datetime, parameterName, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataaForRadius....");
      console.log("In getD withinUnits=");
      console.log(withinUnits);

      let retdata=await Modeler.getFeaturesByRadius(request,{ collectionId, coords, within, withinUnits, z, datetime, parameterName, crs, f });
      console.log("status_code=");
      console.log(retdata.status_code);
      if (retdata.status_code == 200)
        resolve(Service.successResponse(retdata.payload,200));
      else {
        resolve(Service.rejectResponse(retdata.message,retdata.status_code));
      }


//      resolve(Service.successResponse({
//        collectionId,
//        coords,
//        within,
//        withinUnits,
//        z,
//        datetime,
//        parameterName,
//        crs,
//        f,
//      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);
/**
* Query end point for trajectory queries  of collection {collectionId} defined by a wkt linestring and a iso8601 time period
* Return the data values for the data Polygon defined by the query parameters
*
* collectionId String Identifier (id) of a specific collection
* coords String Only data that has a geometry that intersects the area defined by the linestring are selected.   The trajectory is defined using a Well Known Text string following   A 2D trajectory, on the surface of earth with no time or height dimensions:      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)  A 2D trajectory, on the surface of earth with all for the same time and no height dimension, time value defined in ISO8601 format by the `datetime` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&time=2018-02-12T23:00:00Z       A 2D trajectory, on the surface of earth with no time value but at a fixed height level, height defined in the collection height units by the `z` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&z=850   A 2D trajectory, on the surface of earth with all for the same time and at a fixed height level, time value defined in ISO8601 format by the `datetime` query parameter and height defined in the collection height units by the `z` query parameter :      coords=LINESTRING(51.14 -2.98, 51.36 -2.87, 51.03 -3.15, 50.74 -3.48, 50.9 -3.36)&time=2018-02-12T23:00:00Z&z=850   A 3D trajectory, on the surface of the earth but over a time range with no height values: coords=LINESTRINGM(51.14 -2.98 1560507000, 51.36 -2.87 1560507600, 51.03 -3.15 1560508200, 50.74 -3.48 1560508500, 50.9 -3.36 1560510240)  A 3D trajectory, on the surface of the earth but over a time range with a fixed height value, height defined in the collection height units by the `z` query parameter :  coords=LINESTRINGM(51.14 -2.98 1560507000, 51.36 -2.87 1560507600, 51.03 -3.15 1560508200, 50.74 -3.48 1560508500, 50.9 -3.36 1560510240)&z=200   A 3D trajectory, through a 3D volume with height or depth, but no defined time: coords=LINESTRINGZ(51.14 -2.98 0.1, 51.36 -2.87 0.2, 51.03 -3.15 0.3, 50.74 -3.48 0.4, 50.9 -3.36 0.5)  A 3D trajectory, through a 3D volume with height or depth, but a fixed time time value defined in ISO8601 format by the `datetime` query parameter: coords=LINESTRINGZ(51.14 -2.98 0.1, 51.36 -2.87 0.2, 51.03 -3.15 0.3, 50.74 -3.48 0.4, 50.9 -3.36 0.5)&time=2018-02-12T23:00:00Z  A 4D trajectory, through a 3D volume but over a time range: coords=LINESTRINGZM(51.14 -2.98 0.1 1560507000,51.36 -2.87 0.2 1560507600, 51.03 -3.15 0.3 1560508200, 50.74 -3.48 0.4 1560508500, 50.9 -3.36 0.5 1560510240) (using either the `time` or `z` parameters with a 4D trajectory wil generate an error response)  where Z in `LINESTRINGZ` and `LINESTRINGZM` refers to the height value.   `If the specified CRS does not define the height units, the heights units will default to metres above mean sea level`  and the M in `LINESTRINGM` and `LINESTRINGZM` refers to the number of seconds that have elapsed since the Unix epoch, that is the time 00:00:00 UTC on 1 January 1970. See https://en.wikipedia.org/wiki/Unix_time
* z String Define the vertical level to return data from  i.e. z=level  for instance if the 850hPa pressure level is being queried  z=850  or a range to return data for all levels between and including 2 defined levels i.e. z=minimum value/maximum value  for instance if all values between and including 10m and 100m  z=10/100  finally a list of height values can be specified i.e. z=value1,value2,value3  for instance if values at 2m, 10m and 80m are required  z=2,10,80  An Arithmetic sequence using Recurring height intervals, the difference is the number of recurrences is defined at the start  and the amount to increment the height by is defined at the end  i.e. z=Rn/min height/height interval  so if the request was for 20 height levels 50m apart starting at 100m:  z=R20/100/50  When not specified data from all available heights SHOULD be returned  (optional)
* datetime String Either a date-time or an interval, open or closed. Date and time expressions adhere to RFC 3339. Open intervals are expressed using double-dots. Examples: * A date-time: \"2018-02-12T23:20:50Z\" * A closed interval: \"2018-02-12T00:00:00Z/2018-03-18T12:31:12Z\" * Open intervals: \"2018-02-12T00:00:00Z/..\" or \"../2018-03-18T12:31:12Z\" Only features that have a temporal property that intersects the value of `datetime` are selected. If a feature has multiple temporal properties, it is the decision of the server whether only a single temporal property is used to determine the extent or all relevant temporal properties. (optional)
* parameterName String comma delimited list of parameters to retrieve data for.  Valid parameters are listed in the collections metadata (optional)
* crs String identifier (id) of the coordinate system to return data in list of valid crs identifiers for the chosen collection are defined in the metadata responses.  If not supplied the coordinate reference system will default to WGS84. (optional)
* f String format to return the data response in (optional)
* returns coverageJSON
* */
const getDataForTrajectory = ({ collectionId, coords, z, datetime, parameterName, crs, f }) => new Promise(
  async (resolve, reject) => {
    try {
      console.log("In getDataForTrajectory....");

      resolve(Service.successResponse({
        collectionId,
        coords,
        z,
        datetime,
        parameterName,
        crs,
        f,
      }));
    } catch (e) {
      reject(Service.rejectResponse(
        e.message || 'Invalid input',
        e.status || 405,
      ));
    }
  },
);

module.exports = {
  getCollectionDataForLocation,
  getDataForArea,
  getDataForCorridor,
  getDataForCube,
  getDataForItem,
  getDataForPoint,
  getDataForRadius,
  getDataForTrajectory,
};
