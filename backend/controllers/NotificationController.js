import notificationService from '../services/NotificationService.js';

export const listAlerts = async (req, res, next) => {
  try {
    const alerts = notificationService.listAlerts();
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};
