const mongoose = require('mongoose');
exports.connectMonggose =()=>{
    mongoose.set("strictQuery", false);
    mongoose.connect(process.env.DATABASE_URL,)
    .then((e)=>console.log("Connected to Mongodb =>> hospital_managementDB Project"))
    .catch((e)=>console.log("Not Connect Mongodb"))
}
