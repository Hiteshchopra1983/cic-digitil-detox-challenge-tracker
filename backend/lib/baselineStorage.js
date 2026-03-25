/**
 * Total reported storage footprint at baseline (GB), matching impactCalculator.calculateBaselineStorage.
 */
function baselineStorageGbFromRow(row) {
  if (!row) return 0;
  return (
    Number(row.phone_devices || 0) * Number(row.phone_storage_gb || 0) +
    Number(row.laptop_devices || 0) * Number(row.laptop_storage_gb || 0) +
    Number(row.tablet_devices || 0) * Number(row.tablet_storage_gb || 0) +
    Number(row.cloud_accounts || 0) * Number(row.cloud_storage_gb || 0)
  );
}

function storageReductionPercentOfBaseline(gbDeleted, baselineGb) {
  const deleted = Number(gbDeleted) || 0;
  const base = Number(baselineGb) || 0;
  if (base <= 0) return null;
  return Number(((deleted / base) * 100).toFixed(2));
}

module.exports = {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
};
