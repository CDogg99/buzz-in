let f = require("util").format;

const config = {
    database: {
        url: f("mongodb://%s:%s@localhost:27017/buzzIn?authMechanism=%s", encodeURIComponent("root"), encodeURIComponent("root"), "DEFAULT"),
        username: "root",
        password: "root"
    },
    jwt: {
        secret: "FTRIWZEaqxUr3cja"
    }
};

module.exports = config;