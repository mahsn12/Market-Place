const express = require("express");

const app = express();
app.get("/api/first",(req , res)=>{
    res.send("hey thats an API");
});
app.listen(5200,()=>{
    console.log('App Running on Port 5200');
})