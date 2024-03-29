var log = BBLog.getLog({
  sheetId: null,
  level: BBLog.Level.INFO,
  useNativeLogger: true
})

String.prototype.addQuery = function (parameter) {
  log.finer(`adding parameter [${JSON.stringify(parameter)}] to [${this}]`)
  let queryPart = (parameter != undefined && Object.entries(parameter).length > 0) ? "?" + Object.entries(parameter).flatMap(([k, v]) => Array.isArray(v) ? v.map(e => `${k}=${encodeURIComponent(e)}`) : `${k}=${encodeURIComponent(v)}`).join("&") : ''
  return this + queryPart
}

/**
 * @param {String} endpoint - Endpoint to an API
 * @param {String} authToken - auth token
 * @returns {ApiConnector}
 */
function createBearer(endpoint, authToken) {
  return new ApiConnector(endpoint, new BearerAuthorizationProvider(authToken))
}

/**
 * @param {String} endpoint - Endpoint to an API
 * @param {String} username - user to act as
 * @param {String} authToken - auth token
 * @returns {ApiConnector}
 */
function createBasic(endpoint, username, authToken) {
  return new ApiConnector(endpoint, new BasicAuthorizationProvider(username, authToken))
}

var ApiConnector = class ApiConnector {

  /**
   * @param {String} endpoint - Endpoint to an API
   * @param {AuthorizationProvider} authorizationProvider - Method to provide auth token
   */
  constructor(endpoint, authorizationProvider) {
    this.endpoint = endpoint
    this.authorizationProvider = authorizationProvider
    log.fine(`connecting to ${this}`)
  }

  on(part) {
    log.fine(`on ${part}`)
    return new ApiConnector(((part == undefined) ? this.endpoint : (this.endpoint + '/' + part)), this.authorizationProvider)
  }

  withParams(params) {
    log.fine(`with ${JSON.stringify(params)}`)
    return new ApiConnector(this.endpoint.addQuery(params), this.authorizationProvider)
  }

  post(json_payload, expectedResponseCode = 200) {
    let options = {
      headers: this.authorizationProvider.authHeaders(),
      method: 'post',
      payload: JSON.stringify(json_payload),
      contentType: 'application/json;charset=UTF-8',
      muteHttpExceptions: true
    };

    return this.validatedFetch(this.endpoint, options, expectedResponseCode)
  }

  fetch(expectedResponseCode = 200) {
    let options = {
      headers: this.authorizationProvider.authHeaders(),
      method: 'get',
      contentType: 'application/json;charset=UTF-8',
      muteHttpExceptions: true
    };

    return this.validatedFetch(this.endpoint, options, expectedResponseCode)
  }

  fetchWithParams(params, expectedResponseCode = 200) {
    return this.withParams(params).fetch(expectedResponseCode)
  }

  validatedFetch(endpoint, options, expectedResponseCode) {
    log.fine(`about to [${options.method.toUpperCase()}] [${endpoint}] with ${JSON.stringify(options)}`)
    let response = UrlFetchApp.fetch(endpoint, options)
    return this.validate(response, expectedResponseCode)
  }

  validate(response, expectedResponseCode) {
    log.finest(`validating response ${response}`)
    let responseCode = response.getResponseCode()
    if (expectedResponseCode != responseCode) { throw new HttpError(responseCode, 'fetch', this.endpoint, response.getContentText()) }
    let jsonResponse = {}
    let responseText = response.getContentText()
    if (responseText) {
      log.finest(`parsing JSON from response: ${responseText}`)
      jsonResponse = JSON.parse(responseText)
    } else {
      log.finest('got empty response')
    }
    log.finest(`returning json response: ${JSON.stringify(jsonResponse)}`)
    return jsonResponse
  }

  remove() {
    let options = {
      headers: this.authorizationProvider.authHeaders(),
      method: 'delete',
      muteHttpExceptions: true
    };
    log.fine(`about to delete [${this.endpoint}] with ${JSON.stringify(options)}`)
    let response = UrlFetchApp.fetch(this.endpoint, options)
    if (204 != response.getResponseCode()) { throw new HttpError(response.getResponseCode(), 'delete', this.endpoint, response.getContentText()) }
  }

  toString() {
    return `${this.constructor.name}(endpoint=${this.endpoint})`
  }

}

var HttpError = class HttpError extends Error {
  constructor(responseCode, method, endpoint, message) {
    super()
    this.responseCode = responseCode
    this.method = method
    this.endpoint = endpoint
    this.message = message
  }
}