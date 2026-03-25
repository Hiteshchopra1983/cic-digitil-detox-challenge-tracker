const { pool } = require("../lib/db");

module.exports = async (req, res) => {

  try {

    const participant_id = req.params.id;

    const result = await pool.query(
      "SELECT id,name,email,country,city,cohort,created_at FROM participants WHERE id=$1",
      [participant_id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Profile fetch failed"
    });

  }

};