// Notification service - extendable for push notifications, emails, or in-app alerts

exports.sendNotification = async (userId, message, type = "info") => {
  // TODO: integrate with Socket.IO or Firebase Cloud Messaging for real-time notifications
  // For now this is a placeholder that can be extended
  return { userId, message, type, sentAt: new Date() };
};

exports.notifyProjectApproved = async (userId, projectTitle) => {
  return exports.sendNotification(
    userId,
    `Your project "${projectTitle}" has been approved and is now live.`,
    "success"
  );
};

exports.notifyProjectRejected = async (userId, projectTitle) => {
  return exports.sendNotification(
    userId,
    `Your project "${projectTitle}" was not approved. Please review and resubmit.`,
    "warning"
  );
};

exports.notifyNewMessage = async (userId, senderName) => {
  return exports.sendNotification(
    userId,
    `You have a new message from ${senderName}.`,
    "info"
  );
};
