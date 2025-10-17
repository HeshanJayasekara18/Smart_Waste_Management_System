const { collectionRouteService } = require('../services/CollectionRouteService');

//  SOLID (Controller SRP + DIP): keeps HTTP layer thin while delegating rules to service abstraction.

exports.createCollectionRoute = async (req, res, next) => {
  try {
    const route = await collectionRouteService.createCollectionRoute(req.body);
    res.status(201).json(route);
  } catch (error) {
    next(error);
  }
};

exports.listCollectionRoutes = async (req, res, next) => {
  try {
    const filters = ['zone', 'vehicleId', 'driverId'].reduce((acc, key) => {
      if (req.query[key]) acc[key] = req.query[key];
      return acc;
    }, {});
    const routes = await collectionRouteService.listCollectionRoutes(filters);
    res.json(routes);
  } catch (error) {
    next(error);
  }
};

exports.getCollectionRoute = async (req, res, next) => {
  try {
    const route = await collectionRouteService.getCollectionRoute(req.params.id);
    res.json(route);
  } catch (error) {
    next(error);
  }
};

exports.updateCollectionRoute = async (req, res, next) => {
  try {
    const route = await collectionRouteService.updateCollectionRoute(req.params.id, req.body);
    res.json(route);
  } catch (error) {
    next(error);
  }
};

exports.deleteCollectionRoute = async (req, res, next) => {
  try {
    await collectionRouteService.deleteCollectionRoute(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
