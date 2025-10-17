import CollectionRoute from '../models/CollectionRoute.js';

//  SOLID (SRP + DIP): encapsulates route business rules so controllers depend on this abstraction.
class CollectionRouteService {
  async createCollectionRoute(payload) {
    const sanitized = sanitizeCreatePayload(payload);
    await assertRouteCodeUnique(sanitized.routeCode);
    const route = new CollectionRoute(sanitized);
    return route.save();
  }

  async listCollectionRoutes(filters = {}) {
    const query = {};
    if (filters.zone) query.zone = filters.zone.trim();
    if (filters.vehicleId) query['vehicle.id'] = filters.vehicleId.trim();
    if (filters.driverId) query['driver.id'] = filters.driverId.trim();
    return CollectionRoute.find(query).sort({ name: 1 });
  }

  async getCollectionRoute(id) {
    return findRouteOrThrow(id);
  }

  async updateCollectionRoute(id, payload) {
    const route = await findRouteOrThrow(id);
    const sanitized = sanitizeUpdatePayload(payload);

    if (sanitized.routeCode && sanitized.routeCode !== route.routeCode) {
      await assertRouteCodeUnique(sanitized.routeCode, id);
    }

    Object.assign(route, sanitized);
    return route.save();
  }

  async deleteCollectionRoute(id) {
    const route = await CollectionRoute.findByIdAndDelete(id);
    if (!route) {
      throw buildNotFoundError('Collection route not found');
    }
    return route;
  }
}

export default new CollectionRouteService();

//  Refactoring (Extract Function): centralizes creation validation to avoid Duplicated Code smell.
function sanitizeCreatePayload(payload = {}) {
  const routeCode = requireNonEmptyString(payload.routeCode, 'routeCode').toUpperCase();
  const name = requireNonEmptyString(payload.name, 'name');
  const vehicle = sanitizeVehicle(payload.vehicle);
  const driver = sanitizeDriver(payload.driver);
  const coordinates = sanitizeCoordinates(payload.coordinates);

  return {
    routeCode,
    name,
    zone: sanitizeOptionalString(payload.zone),
    coverage: sanitizeOptionalString(payload.coverage),
    scheduleSummary: sanitizeOptionalString(payload.scheduleSummary),
    vehicle,
    driver,
    defaultBins: sanitizeBinIds(payload.defaultBins),
    coordinates,
    timeWindows: sanitizeTimeWindows(payload.timeWindows),
    alerts: sanitizeAlerts(payload.alerts),
  };
}

//  Refactoring (Decompose Conditional): isolates update mutations to prevent Long Method smell.
function sanitizeUpdatePayload(payload = {}) {
  const sanitized = {};

  if (payload.routeCode) sanitized.routeCode = requireNonEmptyString(payload.routeCode, 'routeCode').toUpperCase();
  if (payload.name) sanitized.name = requireNonEmptyString(payload.name, 'name');
  if ('zone' in payload) sanitized.zone = sanitizeOptionalString(payload.zone);
  if ('coverage' in payload) sanitized.coverage = sanitizeOptionalString(payload.coverage);
  if ('scheduleSummary' in payload) sanitized.scheduleSummary = sanitizeOptionalString(payload.scheduleSummary);
  if (payload.vehicle) sanitized.vehicle = sanitizeVehicle(payload.vehicle);
  if (payload.driver) sanitized.driver = sanitizeDriver(payload.driver);
  if (payload.defaultBins) sanitized.defaultBins = sanitizeBinIds(payload.defaultBins);
  if (payload.coordinates) sanitized.coordinates = sanitizeCoordinates(payload.coordinates);
  if ('timeWindows' in payload) sanitized.timeWindows = sanitizeTimeWindows(payload.timeWindows);
  if ('alerts' in payload) sanitized.alerts = sanitizeAlerts(payload.alerts);

  return sanitized;
}

async function assertRouteCodeUnique(routeCode, excludeId) {
  const query = { routeCode };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await CollectionRoute.findOne(query).lean();
  if (existing) {
    throw buildConflictError('Collection route code already exists');
  }
}

function sanitizeVehicle(vehicle = {}) {
  if (typeof vehicle !== 'object') {
    throw buildValidationError('vehicle must be provided');
  }
  return {
    id: requireNonEmptyString(vehicle.id, 'vehicle.id'),
    label: requireNonEmptyString(vehicle.label, 'vehicle.label'),
  };
}

function sanitizeDriver(driver = {}) {
  if (typeof driver !== 'object') {
    throw buildValidationError('driver must be provided');
  }
  return {
    id: requireNonEmptyString(driver.id, 'driver.id'),
    name: requireNonEmptyString(driver.name, 'driver.name'),
  };
}

function sanitizeCoordinates(coordinates = {}) {
  if (typeof coordinates !== 'object') {
    throw buildValidationError('coordinates must be provided');
  }
  const lat = Number(coordinates.lat);
  const lng = Number(coordinates.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw buildValidationError('coordinates.lat and coordinates.lng must be valid numbers');
  }
  return { lat, lng };
}

function sanitizeBinIds(binIds) {
  if (!binIds) return [];
  if (!Array.isArray(binIds)) {
    throw buildValidationError('defaultBins must be an array');
  }
  return binIds.map((binId) => requireNonEmptyString(binId, 'defaultBins item'));
}

function sanitizeTimeWindows(timeWindows) {
  if (!timeWindows) return [];
  if (!Array.isArray(timeWindows)) {
    throw buildValidationError('timeWindows must be an array');
  }
  return timeWindows.map((window, index) => {
    if (typeof window !== 'object') {
      throw buildValidationError(`timeWindows[${index}] must be an object`);
    }
    const start = toDate(window.start, `timeWindows[${index}].start`);
    const end = toDate(window.end, `timeWindows[${index}].end`);
    if (start >= end) {
      throw buildValidationError(`timeWindows[${index}] start must be before end`);
    }
    return {
      label: sanitizeOptionalString(window.label),
      start,
      end,
    };
  });
}

function sanitizeAlerts(alerts) {
  if (!alerts) return [];
  if (!Array.isArray(alerts)) {
    throw buildValidationError('alerts must be an array');
  }
  return alerts.map((alert, index) => {
    if (typeof alert !== 'object') {
      throw buildValidationError(`alerts[${index}] must be an object`);
    }
    return {
      alertCode: sanitizeOptionalString(alert.alertCode),
      type: normalizeEnum(alert.type, 'alert type', ['IOT_WARNING', 'UPDATE_REQUIRED', 'DELETE_REQUEST']),
      severity: normalizeEnum(alert.severity, 'alert severity', ['LOW', 'MEDIUM', 'HIGH']),
      message: requireNonEmptyString(alert.message, `alerts[${index}].message`),
      reportedAt: alert.reportedAt ? toDate(alert.reportedAt, `alerts[${index}].reportedAt`) : new Date(),
    };
  });
}

async function findRouteOrThrow(id) {
  const route = await CollectionRoute.findById(id);
  if (!route) {
    throw buildNotFoundError('Collection route not found');
  }
  return route;
}

function sanitizeOptionalString(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw buildValidationError(`${fieldName} must be a non-empty string`);
  }
  return value.trim();
}

function normalizeEnum(value, fieldName, allowedValues) {
  if (typeof value !== 'string') {
    throw buildValidationError(`${fieldName} must be a string`);
  }
  const normalized = value.trim().toUpperCase();
  if (!allowedValues.includes(normalized)) {
    throw buildValidationError(`${fieldName} is invalid`);
  }
  return normalized;
}

function toDate(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw buildValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}

function buildValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.errorCode = 'VALIDATION_ERROR';
  return error;
}

function buildConflictError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  error.errorCode = 'COLLECTION_ROUTE_CONFLICT';
  return error;
}

function buildNotFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  error.errorCode = 'COLLECTION_ROUTE_NOT_FOUND';
  return error;
}
