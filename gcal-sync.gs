var VERCEL_URL = 'https://sun-to-do.vercel.app';

function getAuth() {
  var props = PropertiesService.getScriptProperties();
  var u = props.getProperty('app_username') || '';
  var p = props.getProperty('app_password') || '';
  return Utilities.base64Encode(u + ':' + p);
}

function syncNewGoogleCalendarEvents() {
  // 동시 실행 방지 — 트리거가 연속으로 발화해도 하나만 처리
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    Logger.log('다른 실행이 진행 중 — 건너뜀');
    return;
  }

  try {
    var props = PropertiesService.getScriptProperties();
    var synced = JSON.parse(props.getProperty('synced_event_ids') || '{}');
    var now = new Date();
    var future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    var events = CalendarApp.getDefaultCalendar().getEvents(now, future);

    if (!props.getProperty('initialized')) {
      for (var i = 0; i < events.length; i++) {
        synced[events[i].getId()] = true;
      }
      props.setProperty('synced_event_ids', JSON.stringify(synced));
      props.setProperty('initialized', 'true');
      Logger.log('initialized: skipped ' + events.length + ' existing events');
      return;
    }

    var auth = getAuth();
    var changed = false;

    for (var j = 0; j < events.length; j++) {
      var event = events[j];
      var eventId = event.getId();
      if (synced[eventId]) continue;

      var title = event.getTitle();
      if (!title) continue;

      var date = Utilities.formatDate(event.getStartTime(), 'Asia/Seoul', 'yyyy-MM-dd');
      var body = JSON.stringify({
        eventId: eventId,
        title: title,
        date: date,
        description: event.getDescription() || ''
      });

      var res = UrlFetchApp.fetch(VERCEL_URL + '/api/gcal-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + auth
        },
        payload: body,
        muteHttpExceptions: true
      });

      Logger.log('[' + title + '] ' + res.getResponseCode() + ': ' + res.getContentText());

      if (res.getResponseCode() === 200) {
        synced[eventId] = true;
        changed = true;
      }
    }

    if (changed) {
      props.setProperty('synced_event_ids', JSON.stringify(synced));
    }
  } finally {
    lock.releaseLock();
  }
}

function resetAndInit() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('synced_event_ids');
  props.deleteProperty('initialized');
  var now = new Date();
  var future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  var events = CalendarApp.getDefaultCalendar().getEvents(now, future);
  var synced = {};
  for (var i = 0; i < events.length; i++) {
    synced[events[i].getId()] = true;
  }
  props.setProperty('synced_event_ids', JSON.stringify(synced));
  props.setProperty('initialized', 'true');
  Logger.log('reset done: skipped ' + events.length + ' existing events');
}

function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('syncNewGoogleCalendarEvents')
    .forUserCalendar(Session.getActiveUser().getEmail())
    .onEventUpdated()
    .create();
  Logger.log('trigger created');
}
