const jwt = require("jsonwebtoken");
const token = jwt.sign({user_id: 1, user_role: "admin"}, "my-super-secret-key-change-in-prod");
console.log(token);
