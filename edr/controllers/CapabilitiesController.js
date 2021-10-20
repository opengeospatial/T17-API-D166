/**
 * The CapabilitiesController file is a very simple one, which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/CapabilitiesService');

const getLandingPage = async (request, response) => {
  console.log('CapabilitiesController-getLandingPage');
  await Controller.handleRequest(request, response, service.getLandingPage);
};

const getRequirementsClasses = async (request, response) => {
  await Controller.handleRequest(request, response, service.getRequirementsClasses);
};

const groupInfomation = async (request, response) => {
  await Controller.handleRequest(request, response, service.groupInfomation);
};

const listCollections = async (request, response) => {
  console.log('CapabilitiesController-listCollections');
  await Controller.handleRequest(request, response, service.listCollections);
};

const listGroups = async (request, response) => {
  console.log('CapabilitiesController-listGroups');
  await Controller.handleRequest(request, response, service.listGroups);
};

module.exports = {
  getLandingPage,
  getRequirementsClasses,
  groupInfomation,
  listCollections,
  listGroups,
};
