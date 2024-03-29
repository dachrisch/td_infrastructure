if ((typeof URI) === 'undefined') {
  eval(UrlFetchApp.fetch('https://rawgit.com/medialize/URI.js/gh-pages/src/URI.js').getContentText());
}

/**
 * @param {String} ticketUrl - ticket to retrieve bookings from (e.g.: https://jira.tdservice.cloud/browse/ABC-123)
 * @param {String} userEmail - Email of user to obtain bookings from
 * @param {String} dateInMonth - some date in month (DD.MM.YYYY)
 * @return {Number} - sum of hours of all tickets in given month
 */
function hoursBilledInTicketMonth(ticketUrl, userEmail, dateInMonth) {
  let tempoToken = new TempoTokenService().getToken()
  if (!ticketUrl) {
    throw new InvalidParameterError('ticketUrl', 'missing')
  }
  if (!userEmail) {
    throw new InvalidParameterError('userEmail', 'missing')
  }
  if (!dateInMonth) {
    throw new InvalidParameterError('dateInMonth', 'missing')
  }

  try {
    var taskKey = new URI(ticketUrl).filename()
  } catch (e) {
    if (e instanceof TypeError) {
      throw new InvalidParameterError('ticketUrl', 'invalid')
    } else {
      throw e
    }
  }
  return SummableBillingsService.connect(tempoToken, userEmail).getTasksInMonth(taskKey, moment(dateInMonth, 'DD.MM.YYYY')).duration().as('hours')
}

function test_SumServiceConnect(_test) {
  if ((typeof GasTap) === 'undefined') { // GasT Initialization. (only if not initialized yet.)
    eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/huan/gast/master/src/gas-tap-lib.js').getContentText())
  }
  var test = _test || new GasTap()

  let userProperties = { getProperty: function (t) { return '12345' } }

  test('all parameter missing', function (t) {
    try {
      hoursBilledInTicketMonth(undefined, undefined, undefined, 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'ticketUrl', 'parameter reporting')
        t.equal(e.reason, 'missing', 'parameter message')
      }
    }
  })


  test('ticketUrl parameter missing', function (t) {
    try {
      hoursBilledInTicketMonth(undefined, 'valid', 'valid', 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'ticketUrl', 'parameter reporting')
        t.equal(e.reason, 'missing', 'parameter message')
      }
    }
  })

  test('userEmail parameter missing', function (t) {
    try {
      hoursBilledInTicketMonth('valid', undefined, 'valid', 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'userEmail', 'parameter reporting')
        t.equal(e.reason, 'missing', 'parameter message')
      }
    }

    try {
      hoursBilledInTicketMonth('valid', '', 'valid', 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'userEmail', 'parameter reporting')
        t.equal(e.reason, 'missing', 'parameter message')
      } else {
        throw e
      }
    }
  })

  test('dateInMonth parameter missing', function (t) {
    try {
      hoursBilledInTicketMonth('valid', 'valid', undefined, 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'dateInMonth', 'parameter reporting')
        t.equal(e.reason, 'missing', 'parameter message')
      }
    }
  })

  test('ticketUrl parameter valid', function (t) {
    try {
      hoursBilledInTicketMonth(1, 'valid', 'valid', 'test.token')
      t.fail('expected exception')
    } catch (e) {
      if ('parameter' in e) {
        t.equal(e.parameter, 'ticketUrl', 'parameter reporting')
        t.equal(e.reason, 'invalid', 'parameter message')
      }
    }
  })

  test('calculate duration of two billings', function (t) {
    SingleTaskOtherUserBillingsService.connect = function (token, email) {
      return new class T {
        getInRangeForTask(fromDate, toDate, taskKey) {
          return [new Billing(moment('01.01.2022 13:00', 'DD.MM.YYYY HH:mm'), moment('01.01.2022 14:00', 'DD.MM.YYYY HH:mm'), 'description', 0, 'billing-key'),
          new Billing(moment('01.01.2022 15:00', 'DD.MM.YYYY HH:mm'), moment('01.01.2022 16:00', 'DD.MM.YYYY HH:mm'), 'description 2', 0, 'billing-key')]
        }
      }
    }
    t.equal(2, hoursBilledInTicketMonth('billing-key', 'valid', 'valid', 'test.token'))
  })

  test.finish()
}
