export const adminMiddleware = (req, res, next) => {
  // authMiddleware MUST run before this
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admins only" });
  }

  next(); // user is admin → allow access
};
