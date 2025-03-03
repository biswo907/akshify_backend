import jwt from "jsonwebtoken";
import "dotenv/config";

export const auth = (req, res, next) => {
  const SECRET_KEY = process.env.SECRET_KEY;

  try {
    let token = req.headers.authorization;
    if (token) {
      token = token.split(" ")[1];
      let user = jwt.verify(token, SECRET_KEY);
      req.userId = user.id;
      next();
    } else {
      return res.status(401).json({ message: "Unauthorised User" });
    }
  } catch (error) {
    console.log("ERROR", error);
    res.status(401).json({ message: "Unauthorised User" });
  }
};
