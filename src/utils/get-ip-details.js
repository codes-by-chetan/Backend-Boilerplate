const getIpDetails = (req) => ({
  ip: req.ip,
  forwardedFor: req.headers["x-forwarded-for"] || null,
  remoteAddress: req.socket?.remoteAddress || null,
  userAgent: req.get("user-agent") || null,
});

export default getIpDetails;
