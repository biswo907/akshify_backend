// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET_KEY = process.env.SECRET_KEY;

const auth = (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token) {
      token = token.split(" ")[1]; // Remove "Bearer"

      const decoded = jwt.verify(token, SECRET_KEY);

      req.user = {
        id: decoded.id,
        type: decoded.type // "company" or "employee"
      };

      next();
    } else {
      return res.status(401).json({ message: "Unauthorized User: No token" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(401).json({ message: "Unauthorized User: Invalid token" });
  }
};

export default auth;
