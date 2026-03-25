const { pool } = require("../lib/db");

module.exports = async (req, res) => {

  try {

    const { id,name,city,cohort } = req.body;

    await pool.query(

      `UPDATE participants
       SET name=$1, city=$2, cohort=$3
       WHERE id=$4`,

      [name,city,cohort,id]

    );

    res.json({
      success:true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error:"Profile update failed"
    });

  }

};