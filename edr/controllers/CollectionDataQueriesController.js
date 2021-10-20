/**
 * The CollectionDataQueriesController file is a very simple one,
 * which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/CollectionDataQueriesService');

const getCollectionDataForLocation = async (request, response) => {
  await Controller.handleRequest(request, response, service.getCollectionDataForLocation);
};

const getDataForArea = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForArea);
};

const getDataForCorridor = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForCorridor);
};

const getDataForCube = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForCube);
};

const getDataForItem = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForItem);
};

const getDataForPoint = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForPoint);
};

const getDataForRadius = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForRadius);
};

const getDataForTrajectory = async (request, response) => {
  await Controller.handleRequest(request, response, service.getDataForTrajectory);
};

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
