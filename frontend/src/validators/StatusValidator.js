// frontend/src/validators/StatusValidator.js

// Allowed transitions based on current status
// - pending -> approved | rejected | in-progress | completed
// - approved -> in-progress | completed
// - in-progress -> completed
// - rejected -> (no further transitions)
export function getAllowedNextStatuses(currentStatus) {
  switch (currentStatus) {
    case 'pending':
      return ['approved', 'rejected', 'in-progress', 'completed']
    case 'approved':
      return ['in-progress', 'completed']
    case 'in-progress':
      return ['completed']
    case 'rejected':
      return []
    case 'completed':
      return []
    default:
      return ['approved', 'rejected', 'in-progress', 'completed']
  }
}

export function canTransition(currentStatus, nextStatus) {
  const allowed = getAllowedNextStatuses(currentStatus)
  return allowed.includes(nextStatus)
}

export function getDisallowMessage(currentStatus, nextStatus) {
  if (currentStatus === 'rejected') {
    return 'Cannot change status once it is rejected.'
  }
   if (currentStatus === 'completed') {
    return 'Cannot change status once it is completed.'
  }
  if (currentStatus === 'approved') {
    return 'From approved, you can only change to In Progress or Completed.'
  }
  if (currentStatus === 'in-progress') {
    return 'From in-progress, you can only change to Completed.'
  }
  if (currentStatus === 'pending' && nextStatus === 'rejected') {
    // Explicit guidance for reject rule
    return '' // allowed, no message needed
  }
  return 'This status change is not allowed.'
}
