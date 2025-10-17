const scheduleService = require('../services/ScheduleService');

//  SOLID (Controller SRP + DIP): delegates business logic to service, avoiding God Controller smell.
exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.listSchedules = async (req, res, next) => {
  try {
    //  Refactoring (Introduce Parameter Object): filters object prevents Long Parameter List smell.
    const filters = ['status', 'zone', 'routeId'].reduce((acc, key) => {
      if (req.query[key]) acc[key] = req.query[key];
      return acc;
    }, {});
    const schedules = await scheduleService.listSchedules(filters);
    res.json(schedules);
  } catch (error) {
    next(error);
  }
};

exports.getSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getSchedule(req.params.id);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(req.params.id, req.body);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.changeScheduleStatus = async (req, res, next) => {
  try {
    //  SOLID (Command-Query Separation): controller triggers state change while service controls validation.
    const schedule = await scheduleService.changeStatus(req.params.id, req.body.status);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.recordScheduleAlert = async (req, res, next) => {
  try {
    //  Avoids Shotgun Surgery: alert handling centralized in service.
    const schedule = await scheduleService.recordAlert(req.params.id, req.body);
    res.status(201).json(schedule);
  } catch (error) {
    next(error);
  }
};

exports.resolveScheduleAlert = async (req, res, next) => {
  try {
    const schedule = await scheduleService.resolveAlert(req.params.id, req.params.alertId);
    res.json(schedule);
  } catch (error) {
    next(error);
  }
};

//  Referential comments highlight SOLID adherence — controller remains lean following SRP
