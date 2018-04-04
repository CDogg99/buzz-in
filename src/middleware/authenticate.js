const jwt = require("jsonwebtoken");

const config = require("../../config/config");

const authenticate = (req, res, next)=>{
    const token = req.header("token");
    if(token){
        jwt.verify(token, config.jwt.secret, (err, payload)=>{
            if(err){
                req.user = null;
                next();
            }
            else{
                req.user = payload;
                next();
            }
        });
    }
    else{
        req.user = null;
        next();
    }
};

module.exports = authenticate;