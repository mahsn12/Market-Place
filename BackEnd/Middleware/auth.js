 import jwt from "jsonwebtoken"
 import dot from "dotenv"
 dot.config();
 
 export const authMiddleware = (req,res,next)=>{
    try{
        const authorize = req.headers.authorization;
        if(!authorize){
           return res.status(401).json({ message: "No token provided" });
        }
        const token = (authorize.split(" "))[1];
        const coded = jwt.verify(token,process.env.JWT_secret_key);
        req.user = coded;

        next();
    } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

