var SnapshotMaker = class SnapshotMaker {
  constructor() {
    this.sheetName = SnapshotsSheetSetup.name
    this.sheetWrapper = sw.SpreadsheetWrapper.fromActive()
  }

  get sheet() {
    return this.sheetWrapper.getSheet(this.sheetName)
  }

  perform() {
    logger.info(`creating snapshot in [${this.sheet}]...`)
    this.sheet.on('A:D').appendValues(mapSnapshotToValues(this.snapshotTeam()))
  }


  /**
   * @param {Array.<String>} jiraIds
   * @return {Object} - Object containing {'name' : {'assigned' : <num>, 'wip' : <num>}}
   */
  snapshotTeam() {
    let jiraIds = this.sheetWrapper.multiCellValues(MemberSheetSetup.named_range_ids)
    return jiraIds.reduce((obj, jiraId) => Object.assign(obj, { [jiraId]: { assigned: assignedFor(jiraId), wip: wipFor(jiraId) } }), {});
  }
}
/**
 * @param {Array.<Object>} snapshots
 * @return {Array.<Array>} Array with time, name, assigned and wip
 */
function mapSnapshotToValues(snapshots) {
  let snapshotTime = new Date()
  return Object.keys(snapshots).map((name) => [snapshotTime, name, snapshots[name].assigned, snapshots[name].wip])
}

function test_makeSnapshot() {
  new SnapshotMaker().perform()
}
