const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");

module.exports = async (req, res) => {
  try {
    const payload = weeklyPayloadFromRequestBody(req.body);
    const co2_saved = await calculateWeeklyCO2Savings(payload);
    const rounded = Number(Number(co2_saved).toFixed(4));
    res.json({ co2_saved: rounded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Preview failed" });
  }
};
