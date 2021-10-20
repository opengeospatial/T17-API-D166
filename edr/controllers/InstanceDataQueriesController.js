/**
 * The InstanceDataQueriesController file is a very simple one,
 * which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/InstanceDataQueriesService');

const getInstanceDataForArea = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForArea);
};

const getInstanceDataForCorridor = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForCorridor);
};

const getInstanceDataForCube = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForCube);
};

const getInstanceDataForLocation = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForLocation);
};

const getInstanceDataForPoint = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForPoint);
};

const getInstanceDataForRadius = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForRadius);
};

const getInstanceDataForTrajectory = async (request, response) => {
  await Controller.handleRequest(request, response, service.getInstanceDataForTrajectory);
};

module.exports = {
  getInstanceDataForArea,
  getInstanceDataForCorridor,
  getInstanceDataForCube,
  getInstanceDataForLocation,
  getInstanceDataForPoint,
  getInstanceDataForRadius,
  getInstanceDataForTrajectory,
};
