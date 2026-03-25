const { pool } = require("../lib/db");

module.exports = function(requiredRole = "admin"){

return async (req,res,next)=>{

try{

const userId = req.user?.id;

if(!userId){
return res.status(401).json({error:"Unauthorized"});
}

/* GET USER ROLE */

const result = await pool.query(
"SELECT role FROM participants WHERE id=$1",
[userId]
);

const role = result.rows[0]?.role;

/* SUPER ADMIN HAS ALL ACCESS */

if(role === "super_admin"){
return next();
}

/* ADMIN ACCESS */

if(requiredRole === "admin" && role === "admin"){
return next();
}

/* OTHERWISE BLOCK */

return res.status(403).json({
error:"Access denied"
});

}catch(err){

console.error(err);
res.status(500).json({error:"Auth failed"});

}

};

};