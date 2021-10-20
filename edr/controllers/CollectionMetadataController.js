/**
 * The CollectionMetadataController file is a very simple one,
 * which does not need to be changed manually,
 * unless there's a case where business logic reoutes the request to an entity which is not
 * the service.
 * The heavy lifting of the Controller item is done in Request.js - that is where request
 * parameters are extracted and sent to the service, and where response is handled.
 */

const Controller = require('./Controller');
const service = require('../services/CollectionMetadataService');

const getCollectionInstances = async (request, response) => {
  await Controller.handleRequest(request, response, service.getCollectionInstances);
};

const getQueries = async (request, response) => {
  await Controller.handleRequest(request, response, service.getQueries);
};

const listCollectionDataLocations = async (request, response) => {
  await Controller.handleRequest(request, response, service.listCollectionDataLocations);
};

const listDataItems = async (request, response) => {
  await Controller.handleRequest(request, response, service.listDataItems);
};

module.exports = {
  getCollectionInstances,
  getQueries,
  listCollectionDataLocations,
  listDataItems,
};
