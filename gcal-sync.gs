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
      var skipped = 0;
      for (var i = 0; i < events.length; i++) {
        if (events[i].getStartTime() < now) {
          synced[events[i].getId()] = true;
          skipped++;
        }
      }
      props.setProperty('synced_event_ids', JSON.stringify(synced));
      props.setProperty('initialized', 'true');
      Logger.log('initialized: skipped ' + skipped + ' past events, future events will sync below');
      // return 제거 — 이미 지나간 일정만 건너뛰고, 아직 오지 않은 일정은 바로 아래 루프에서 동기화
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
  var skipped = 0;
  for (var i = 0; i < events.length; i++) {
    if (events[i].getStartTime() < now) {
      synced[events[i].getId()] = true;
      skipped++;
    }
  }
  props.setProperty('synced_event_ids', JSON.stringify(synced));
  props.setProperty('initialized', 'true');
  Logger.log('reset done: skipped ' + skipped + ' past events, future events will sync on next run');
}

// 이전 버전 초기화 로직 때문에 '동기화됨'으로 잘못 표시된 미래 일정을 다시 동기화 대상으로 되돌림.
// 실행 후 syncNewGoogleCalendarEvents()가 (수동 실행 또는 다음 트리거 발화 시) 해당 일정들을 Notion에 생성함.
function resyncMissedFutureEvents() {
  var props = PropertiesService.getScriptProperties();
  props.setProperty('synced_event_ids', '{}');
  Logger.log('synced_event_ids 초기화 완료 — syncNewGoogleCalendarEvents()를 실행해 미래 일정을 다시 동기화하세요');
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
