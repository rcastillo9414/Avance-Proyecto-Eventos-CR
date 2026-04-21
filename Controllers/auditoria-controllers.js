const AuditLog = require("../Models/Auditoria");

exports.getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, limit } = req.query;

    const filters = {
      zone: req.user.zone
    };

    if (action) {
      filters.action = action;
    }

    if (entityType) {
      filters.entityType = entityType;
    }

    const maxResults = Math.min(Number(limit) || 50, 200);

    const logs = await AuditLog.find(filters)
      .populate("performedBy", "name email role zone")
      .sort({ createdAt: -1 })
      .limit(maxResults);

    return res.status(200).json({
      total: logs.length,
      logs
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener la auditoría",
      error: error.message
    });
  }
};