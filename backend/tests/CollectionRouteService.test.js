jest.mock('../models/CollectionRoute', () => {
  const CollectionRouteMock = jest.fn(function (payload) {
    this.payload = payload;
    this.save = jest.fn().mockResolvedValue({ id: 'route-123', ...this.payload });
    return this;
  });

  CollectionRouteMock.find = jest.fn().mockResolvedValue([]);
  CollectionRouteMock.findById = jest.fn().mockResolvedValue(null);
  CollectionRouteMock.findByIdAndDelete = jest.fn();
  CollectionRouteMock.findOne = jest.fn();

  return CollectionRouteMock;
});

const CollectionRoute = require('../models/CollectionRoute');
const { collectionRouteService } = require('../services/CollectionRouteService');

const baseStart = '2025-01-01T09:00:00.000Z';
const baseEnd = '2025-01-01T10:00:00.000Z';

function buildPayload(overrides = {}) {
  return {
    routeCode: 'R1',
    name: 'Route One',
    zone: ' Zone A ',
    coverage: ' Coverage ',
    scheduleSummary: ' Summary ',
    vehicle: { id: 'veh-1', label: 'Truck 1' },
    driver: { id: 'drv-1', name: 'Driver One' },
    defaultBins: ['BIN-1'],
    coordinates: { lat: 12.345, lng: 67.89 },
    timeWindows: [{ label: 'Morning', start: baseStart, end: baseEnd }],
    alerts: [{ type: 'IOT_WARNING', severity: 'LOW', message: 'Alert message', reportedAt: '2025-01-01T08:00:00.000Z' }],
    ...overrides,
  };
}

function buildRouteDoc(overrides = {}) {
  const doc = {
    _id: 'route-123',
    routeCode: 'R1',
    name: 'Route One',
    zone: 'Zone A',
    coverage: 'Coverage',
    scheduleSummary: 'Summary',
    vehicle: { id: 'veh-1', label: 'Truck 1' },
    driver: { id: 'drv-1', name: 'Driver One' },
    defaultBins: ['BIN-1'],
    coordinates: { lat: 12.345, lng: 67.89 },
    timeWindows: [],
    alerts: [],
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve({ ...this });
    }),
  };
  Object.assign(doc, overrides);
  return doc;
}

describe('CollectionRouteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CollectionRoute.find.mockResolvedValue([]);
    CollectionRoute.findById.mockResolvedValue(null);
    CollectionRoute.findByIdAndDelete.mockResolvedValue(null);
    CollectionRoute.findOne.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(null) }));
  });

  describe('createCollectionRoute', () => {
    it('persists sanitized route and ensures uniqueness', async () => {
      const payload = buildPayload();

      const result = await collectionRouteService.createCollectionRoute(payload);

      expect(CollectionRoute.findOne).toHaveBeenCalledWith({ routeCode: 'R1' });
      const findOneResult = CollectionRoute.findOne.mock.results[0].value;
      expect(findOneResult.lean).toHaveBeenCalled();
      const savedPayload = CollectionRoute.mock.calls[0][0];
      expect(savedPayload).toMatchObject({
        routeCode: 'R1',
        name: 'Route One',
        zone: 'Zone A',
        defaultBins: ['BIN-1'],
        alerts: expect.any(Array),
      });
      expect(savedPayload.timeWindows[0].start).toBeInstanceOf(Date);
      expect(result).toMatchObject({ id: 'route-123', routeCode: 'R1', zone: 'Zone A' });
    });

    it('rejects duplicate route codes', async () => {
      const payload = buildPayload();
      const leanMock = jest.fn().mockResolvedValue({ _id: 'existing' });
      CollectionRoute.findOne.mockReturnValueOnce({ lean: leanMock });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('Collection route code already exists');
      expect(leanMock).toHaveBeenCalled();
    });

    it('validates structural constraints', async () => {
      const payload = buildPayload({
        timeWindows: [{ label: 'Invalid', start: baseEnd, end: baseStart }],
      });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('timeWindows[0] start must be before end');
    });

    it('rejects invalid vehicle shape', async () => {
      const payload = buildPayload({ vehicle: 'truck' });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('vehicle must be provided');
    });

    it('rejects invalid driver shape', async () => {
      const payload = buildPayload({ driver: 123 });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('driver must be provided');
    });

    it('rejects invalid coordinate type', async () => {
      const payload = buildPayload({ coordinates: 'not-object' });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('coordinates must be provided');
    });

    it('rejects invalid coordinate values', async () => {
      const payload = buildPayload({ coordinates: { lat: 'abc', lng: 70 } });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('coordinates.lat and coordinates.lng must be valid numbers');
    });

    it('rejects non-array bins', async () => {
      const payload = buildPayload({ defaultBins: 'BIN-1' });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('defaultBins must be an array');
    });

    it('rejects malformed time windows input', async () => {
      const payload = buildPayload({ timeWindows: 'not-an-array' });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('timeWindows must be an array');
    });

    it('rejects malformed alerts input', async () => {
      const payload = buildPayload({ alerts: 'oops' });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alerts must be an array');
    });

    it('rejects alert with invalid enum', async () => {
      const payload = buildPayload({ alerts: [{ type: 'BAD', severity: 'LOW', message: 'Alert' }] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alert type is invalid');
    });

    it('rejects time window entries that are not objects', async () => {
      const payload = buildPayload({ timeWindows: [123] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('timeWindows[0] must be an object');
    });

    it('rejects alert entries that are not objects', async () => {
      const payload = buildPayload({ alerts: [42] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alerts[0] must be an object');
    });

    it('rejects alert missing severity', async () => {
      const payload = buildPayload({ alerts: [{ type: 'IOT_WARNING', message: 'Alert' }] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alert severity must be a string');
    });

    it('rejects alert missing required message', async () => {
      const payload = buildPayload({ alerts: [{ type: 'IOT_WARNING', severity: 'LOW' }] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alerts[0].message must be a non-empty string');
    });

    it('rejects time window with invalid date strings', async () => {
      const payload = buildPayload({ timeWindows: [{ label: 'T', start: 'bad-date', end: baseEnd }] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('timeWindows[0].start must be a valid date');
    });

    it('rejects alert with invalid reportedAt', async () => {
      const payload = buildPayload({ alerts: [{ type: 'IOT_WARNING', severity: 'LOW', message: 'A', reportedAt: 'bad-date' }] });

      await expect(collectionRouteService.createCollectionRoute(payload)).rejects.toThrow('alerts[0].reportedAt must be a valid date');
    });
  });

  describe('listCollectionRoutes', () => {
    it('normalizes filters and sorts by name', async () => {
      const sort = jest.fn().mockResolvedValue(['route']);
      CollectionRoute.find.mockReturnValueOnce({ sort });

      const result = await collectionRouteService.listCollectionRoutes({ zone: ' Central ', vehicleId: ' veh-9 ', driverId: ' drv-9 ' });

      expect(CollectionRoute.find).toHaveBeenCalledWith({ zone: 'Central', 'vehicle.id': 'veh-9', 'driver.id': 'drv-9' });
      expect(sort).toHaveBeenCalledWith({ name: 1 });
      expect(result).toEqual(['route']);
    });
  });

  describe('getCollectionRoute', () => {
    it('returns document when found', async () => {
      const doc = buildRouteDoc();
      CollectionRoute.findById.mockResolvedValueOnce(doc);

      const result = await collectionRouteService.getCollectionRoute(doc._id);

      expect(result).toBe(doc);
    });

    it('throws when route is missing', async () => {
      await expect(collectionRouteService.getCollectionRoute('missing')).rejects.toThrow('Collection route not found');
    });
  });

  describe('updateCollectionRoute', () => {
    it('applies sanitized updates and enforces unique route code', async () => {
      const doc = buildRouteDoc({ routeCode: 'R1' });
      CollectionRoute.findById.mockResolvedValueOnce(doc);
      const leanMock = jest.fn().mockResolvedValue(null);
      CollectionRoute.findOne.mockReturnValueOnce({ lean: leanMock });

      const updates = {
        routeCode: 'R2',
        defaultBins: ['BIN-9'],
        timeWindows: [{ label: 'Evening', start: baseStart, end: '2025-01-01T11:00:00.000Z' }],
      };

      const result = await collectionRouteService.updateCollectionRoute(doc._id, updates);

      expect(CollectionRoute.findOne).toHaveBeenCalledWith({ routeCode: 'R2', _id: { $ne: doc._id } });
      expect(leanMock).toHaveBeenCalled();
      expect(doc.routeCode).toBe('R2');
      expect(doc.defaultBins).toEqual(['BIN-9']);
      expect(doc.timeWindows[0].start).toBeInstanceOf(Date);
      expect(doc.save).toHaveBeenCalled();
      expect(result.routeCode).toBe('R2');
    });

    it('throws when route to update is missing', async () => {
      await expect(collectionRouteService.updateCollectionRoute('missing', { name: 'New' })).rejects.toThrow('Collection route not found');
    });
  });

  describe('deleteCollectionRoute', () => {
    it('removes existing route', async () => {
      const doc = buildRouteDoc();
      CollectionRoute.findByIdAndDelete.mockResolvedValueOnce(doc);

      const result = await collectionRouteService.deleteCollectionRoute(doc._id);

      expect(CollectionRoute.findByIdAndDelete).toHaveBeenCalledWith(doc._id);
      expect(result).toBe(doc);
    });

    it('throws when route does not exist', async () => {
      await expect(collectionRouteService.deleteCollectionRoute('missing')).rejects.toThrow('Collection route not found');
    });
  });
});
