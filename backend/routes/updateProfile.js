const { pool } = require("../lib/db");
const { sameParticipantId } = require("../lib/participantAuth");

module.exports = async (req, res) => {

  try {

    const { id,name,city,cohort } = req.body;

    if (!id || !sameParticipantId(req.user && req.user.id, id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

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