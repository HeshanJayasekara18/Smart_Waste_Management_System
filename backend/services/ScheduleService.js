import Schedule from '../models/Schedule.js';

//  SOLID (SRP): Service owns scheduling rules only — prevents controller/model "God classes".

const STATUS_TRANSITIONS = {
  PLANNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

class ScheduleService {
  async createSchedule(payload) {
    //  Refactoring (Replace Primitive Obsession): sanitizeCreationPayload bundles raw request data into domain-ready shape.
    const sanitized = sanitizeCreationPayload(payload);
    await ensureNoOverlap({
      routeId: sanitized.routeId,
      scheduledStart: sanitized.scheduledStart,
      scheduledEnd: sanitized.scheduledEnd,
      assignedCrew: sanitized.assignedCrew,
    });

    const schedule = new Schedule(sanitized);
    return schedule.save();
  }

  async listSchedules(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status.trim().toUpperCase();
    if (filters.zone) query.zone = filters.zone.trim();
    if (filters.routeId) query.routeId = filters.routeId.trim();
    return Schedule.find(query).sort({ scheduledStart: 1 });
  }

  async getSchedule(id) {
    return findScheduleOrThrow(id);
  }

  async updateSchedule(id, payload) {
    const schedule = await findScheduleOrThrow(id);
    const sanitized = sanitizeUpdatePayload(payload);

    // Build the final crew object by merging existing and new values
    let finalCrew = {
      driverId: schedule.assignedCrew?.driverId || schedule.driverId,
      vehicleId: schedule.assignedCrew?.vehicleId || schedule.vehicleId,
      supervisorId: schedule.assignedCrew?.supervisorId,
    };

    // Apply updates from assignedCrew object first
    if (sanitized.assignedCrew) {
      Object.keys(sanitized.assignedCrew).forEach(key => {
        if (sanitized.assignedCrew[key] !== undefined) {
          finalCrew[key] = sanitized.assignedCrew[key];
        }
      });
    }

    // Top-level driverId and vehicleId take precedence (backward compatibility)
    if (sanitized.driverId !== undefined) {
      finalCrew.driverId = sanitized.driverId;
      delete sanitized.driverId;
    }

    if (sanitized.vehicleId !== undefined) {
      finalCrew.vehicleId = sanitized.vehicleId;
      delete sanitized.vehicleId;
    }

    // Remove null, undefined, or empty string values
    finalCrew = Object.fromEntries(
      Object.entries(finalCrew).filter(([, value]) => value !== null && value !== undefined && value !== '')
    );

    // Set the final crew on sanitized payload
    if (Object.keys(finalCrew).length > 0) {
      sanitized.assignedCrew = finalCrew;
    } else {
      sanitized.assignedCrew = {};
    }

    // Prepare values for overlap check
    const nextStart = sanitized.scheduledStart ?? schedule.scheduledStart;
    const nextEnd = sanitized.scheduledEnd ?? schedule.scheduledEnd;
    const nextRoute = sanitized.routeId ?? schedule.routeId;

    await ensureNoOverlap({
      routeId: nextRoute,
      scheduledStart: nextStart,
      scheduledEnd: nextEnd,
      assignedCrew: finalCrew,
      excludeId: id,
    });

    // Apply all updates to schedule
    Object.assign(schedule, sanitized);
    
    // Always mark assignedCrew as modified for Mongoose to detect nested changes
    schedule.markModified('assignedCrew');
    
    return schedule.save();
  }

  async changeStatus(id, nextStatus) {
    const schedule = await findScheduleOrThrow(id);
    const normalized = normalizeEnum(nextStatus, 'Status');
    validateStatusTransition(schedule.status, normalized);

    schedule.status = normalized;
    schedule.lastValidatedAt = new Date();
    return schedule.save();
  }

  async deleteSchedule(id) {
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      throw buildNotFoundError('Schedule not found');
    }
    return schedule;
  }

  async recordAlert(scheduleId, alertPayload) {
    const schedule = await findScheduleOrThrow(scheduleId);
    const sanitizedAlert = sanitizeAlertPayload(alertPayload);
    schedule.alerts.push(sanitizedAlert);
    schedule.lastValidatedAt = new Date();
    return schedule.save();
  }

  async resolveAlert(scheduleId, alertId) {
    const schedule = await findScheduleOrThrow(scheduleId);
    const alert = schedule.alerts.id(alertId);
    if (!alert) {
      throw buildNotFoundError('Alert not found for schedule');
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    schedule.lastValidatedAt = new Date();
    return schedule.save();
  }
}

export default new ScheduleService();

function sanitizeCreationPayload(payload = {}) {
  const requiredFields = ['routeId', 'zone', 'scheduledStart', 'scheduledEnd', 'createdBy'];
  requiredFields.forEach((field) => {
    if (!payload[field] || typeof payload[field] !== 'string') {
      throw buildValidationError(`${field} is required`);
    }
  });

  const start = toDate(payload.scheduledStart, 'scheduledStart');
  const end = toDate(payload.scheduledEnd, 'scheduledEnd');
  if (start >= end) {
    throw buildValidationError('scheduledStart must be earlier than scheduledEnd');
  }

  if (!Array.isArray(payload.binIds) || payload.binIds.length === 0) {
    throw buildValidationError('At least one bin must be assigned');
  }

  const binIds = payload.binIds.map((id) => {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw buildValidationError('Bin identifiers must be non-empty strings');
    }
    return id.trim();
  });

  const crew = sanitizeCrew(payload.assignedCrew);

  return {
    routeId: payload.routeId.trim(),
    zone: payload.zone.trim(),
    scheduledStart: start,
    scheduledEnd: end,
    binIds,
    priority: sanitizePriority(payload.priority),
    assignedCrew: crew,
    notes: payload.notes?.trim() || '',
    status: 'PLANNED',
    alerts: [],
    createdBy: payload.createdBy.trim(),
  };
}

function sanitizeUpdatePayload(payload = {}) {
  const sanitized = {};
  
  if (payload.routeId) sanitized.routeId = requireNonEmptyString(payload.routeId, 'routeId');
  if (payload.zone) sanitized.zone = requireNonEmptyString(payload.zone, 'zone');
  
  if (payload.binIds) {
    if (!Array.isArray(payload.binIds) || payload.binIds.length === 0) {
      throw buildValidationError('binIds must include at least one bin');
    }
    sanitized.binIds = payload.binIds.map((id) => requireNonEmptyString(id, 'binIds')); 
  }
  
  if (payload.scheduledStart) {
    sanitized.scheduledStart = toDate(payload.scheduledStart, 'scheduledStart');
  }
  
  if (payload.scheduledEnd) {
    sanitized.scheduledEnd = toDate(payload.scheduledEnd, 'scheduledEnd');
  }
  
  if (sanitized.scheduledStart && sanitized.scheduledEnd && sanitized.scheduledStart >= sanitized.scheduledEnd) {
    throw buildValidationError('scheduledStart must be earlier than scheduledEnd');
  }

  if (payload.priority) sanitized.priority = sanitizePriority(payload.priority);
  
  // Handle assignedCrew object
  if (payload.assignedCrew) {
    sanitized.assignedCrew = sanitizeCrew(payload.assignedCrew);
  }
  
  // Handle top-level driver and vehicle IDs (for backward compatibility)
  if (payload.driverId !== undefined) {
    sanitized.driverId = payload.driverId ? requireNonEmptyString(payload.driverId, 'driverId') : '';
  }
  
  if (payload.vehicleId !== undefined) {
    sanitized.vehicleId = payload.vehicleId ? requireNonEmptyString(payload.vehicleId, 'vehicleId') : '';
  }
  
  if (payload.notes !== undefined) {
    sanitized.notes = payload.notes ? requireNonEmptyString(payload.notes, 'notes') : '';
  }
  
  if (payload.createdBy) {
    sanitized.createdBy = requireNonEmptyString(payload.createdBy, 'createdBy');
  }
  
  if (payload.status) {
    const status = normalizeEnum(payload.status, 'status');
    sanitized.status = status;
  }

  return sanitized;
}

function sanitizeAlertPayload(payload = {}) {
  const type = normalizeEnum(payload.type, 'alert type', ['IOT_WARNING', 'UPDATE_REQUIRED', 'DELETE_REQUEST']);
  const message = requireNonEmptyString(payload.message, 'alert message');

  const alert = {
    type,
    message,
    triggeredAt: payload.triggeredAt ? toDate(payload.triggeredAt, 'triggeredAt') : new Date(),
    resolved: Boolean(payload.resolved),
  };

  if (payload.resolvedAt) {
    alert.resolvedAt = toDate(payload.resolvedAt, 'resolvedAt');
  }

  return alert;
}

async function ensureNoOverlap({ routeId, scheduledStart, scheduledEnd, excludeId, assignedCrew = {} }) {
  //  Refactoring (Extract Method): consolidated overlap logic to avoid Duplicate Code smell across create/update flows.
  if (!scheduledStart || !scheduledEnd) {
    throw buildValidationError('Both scheduledStart and scheduledEnd are required for overlap detection');
  }

  const overlapClause = {
    $or: [
      { scheduledStart: { $lt: scheduledEnd }, scheduledEnd: { $gt: scheduledStart } },
      { scheduledStart: { $gte: scheduledStart, $lt: scheduledEnd } },
      { scheduledEnd: { $gt: scheduledStart, $lte: scheduledEnd } },
    ],
  };

  const resourceClauses = [];
  if (routeId) {
    resourceClauses.push({ routeId });
  }

  if (assignedCrew?.vehicleId) {
    resourceClauses.push({
      $or: [
        { 'assignedCrew.vehicleId': assignedCrew.vehicleId },
        { vehicleId: assignedCrew.vehicleId },
      ],
    });
  }

  if (assignedCrew?.driverId) {
    resourceClauses.push({
      $or: [
        { 'assignedCrew.driverId': assignedCrew.driverId },
        { driverId: assignedCrew.driverId },
      ],
    });
  }

  if (resourceClauses.length === 0) {
    resourceClauses.push({});
  }

  const query = {
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    $and: [overlapClause, { $or: resourceClauses }],
  };

  const overlapping = await Schedule.find(query);
  if (overlapping.length > 0) {
    throw buildConflictError('Schedule overlaps with an existing allocation', {
      conflictIds: overlapping.map((s) => s.id),
    });
  }
}

async function findScheduleOrThrow(id) {
  const schedule = await Schedule.findById(id);
  if (!schedule) {
    throw buildNotFoundError('Schedule not found');
  }
  return schedule;
}

function sanitizePriority(value) {
  if (!value) return 'MEDIUM';
  const normalized = normalizeEnum(value, 'priority', PRIORITIES);
  if (!PRIORITIES.includes(normalized)) {
    throw buildValidationError('priority must be one of LOW, MEDIUM, or HIGH');
  }
  return normalized;
}

function sanitizeCrew(crew = {}) {
  //  SOLID (ISP): crew sanitization layer prevents service from knowing presentation-specific structures.
  if (typeof crew !== 'object' || crew === null) {
    return {};
  }
  
  const sanitized = {};
  ['driverId', 'vehicleId', 'supervisorId'].forEach((field) => {
    if (crew[field] && typeof crew[field] === 'string' && crew[field].trim()) {
      sanitized[field] = crew[field].trim();
    }
  });
  
  return sanitized;
}

function validateStatusTransition(currentStatus, nextStatus) {
  const allowed = STATUS_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw buildValidationError(`Cannot transition schedule from ${currentStatus} to ${nextStatus}`);
  }
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
  if (allowedValues && !allowedValues.includes(normalized)) {
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
  //  Eliminates Magic Numbers smell by tagging errors with explicit status metadata.
  const error = new Error(message);
  error.statusCode = 400;
  error.errorCode = 'VALIDATION_ERROR';
  return error;
}

function buildConflictError(message, context) {
  const error = new Error(message);
  error.statusCode = 409;
  error.errorCode = 'SCHEDULE_CONFLICT';
  error.context = context;
  return error;
}

function buildNotFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  error.errorCode = 'RESOURCE_NOT_FOUND';
  return error;
}