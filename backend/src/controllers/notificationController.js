const Notification = require('../models/Notification');

// @desc   Get notifications for logged in user
// @route  GET /api/notifications
// @access Private
const getNotifications = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    const query = {
      $or: [
        { recipient: userId },
        { recipientRole: role },
        { recipientRole: 'all' },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Mark notification as read
// @route  PUT /api/notifications/:id/read
// @access Private
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read-all
// @access Private
const markAllAsRead = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipientRole: role },
          { recipientRole: 'all' },
        ],
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
