/**
 * @typedef {{endpoint:string,authorizationProvider:{authHeaders:()=>string},on:(part:string)=>ApiConnector}} ApiConnector
 * @typedef {{issueKey:string,billable:boolean,hourFactor:number,bookingLink:string}} BookingInfo
 * @typedef {{startMoment:moment,endMoment:moment,title:string,bookingInfo:BookingInfo,eventId:string}} EventWrapper
 */
var JiraIssueService = class JiraIssueService extends JiraService {
  /**
   * @param jiraApi {ApiConnector}
   * @see @link https://script.google.com/home/projects/1TN1IOkW4-cvQfrmcqedSaQblG-ekjeB7-ghmpIfdp_R0N6I6cBHDH9H-
   */
  constructor(jiraApi) {
    super(jiraApi.on('issue'))
    this._cache = new Cache()
  }

  /**
   * 
   */
  getIssue(issueKey, fields = []) {
    log.fine(` getting ${issueKey} with fields [${fields}]`)
    if (!(this._cache.has(issueKey))) {
      log.finest(` ${issueKey} not in cache...getting`)
      this._cache.set(issueKey, this.jiraApi.on(issueKey).fetchWithParams({
        fields: fields,
        properties: 'key'
      }))
    }
    log.finest(`issue for ${issueKey}: ${JSON.stringify(this._cache.get(issueKey))}`)
    return this._cache.get(issueKey)
  }

  /**
   * @param event {EventWrapper}
   * @returns {Boolean} if event has a valid event.bookingInfo.issueKey
   * 
   */
  hasValidKey(event) {
    log.finest(`check ${event} has valid key`)
    let result = false
    try {
      result = this.getIssue(event.bookingInfo.issueKey) != undefined
    } catch (e) {
      if (e instanceof api.HttpError && e.responseCode == 404) {
        result = false
      } else {
        throw e
      }
    }
    log.finest(`found that ${event} has ${result ? '' : 'no '}valid key`)
    return result
  }
}

var JiraIssuePickerService = class JiraIssuePickerService extends JiraService {
  /**
   * @param {ApiConnector} jiraApi
   * @see @link https://script.google.com/home/projects/1TN1IOkW4-cvQfrmcqedSaQblG-ekjeB7-ghmpIfdp_R0N6I6cBHDH9H-
   */
  constructor(jiraApi) {
    super(jiraApi.on('issue').on('picker'))
    //api.log.setLevel(logger.Level.FINE)
  }

  workOnIssues(query) {
    let params = {
      'currentJQL': 'project in projectsWhereUserHasPermission("Work on issues")',
      'query': query,
      'showSubTaskParent': true,
      'showSubTasks': true
    }
    return this.jiraApi.fetchWithParams(params)
  }
}
