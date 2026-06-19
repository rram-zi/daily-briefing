// ✅ Sun To-Do — 액션 스크립트 (scriptable-action.js)
// Scriptable 앱에서 이 스크립트 이름을 정확히 "SunToDo" 로 저장하세요.
const BASE_URL = "https://sun-to-do.vercel.app";
const USERNAME = "YOUR_USERNAME";
const PASSWORD = "YOUR_PASSWORD";

// ───────────────────────────────────────────
const AUTH = btoa(`${USERNAME}:${PASSWORD}`);
const action = args.queryParameters.action || "add";
const taskId = args.queryParameters.id || "";
const taskTitle = decodeURIComponent(args.queryParameters.title || "");

async function apiRequest(method, body) {
  const req = new Request(`${BASE_URL}/api/today`);
  req.method = method;
  req.headers = {
    Authorization: `Basic ${AUTH}`,
    "Content-Type": "application/json",
  };
  req.body = JSON.stringify(body);
  req.timeoutInterval = 10;
  try { return await req.loadJSON(); }
  catch { return null; }
}

// ── 완료 처리 ──
if (action === "complete" && taskId) {
  await apiRequest("PATCH", { id: taskId });

  const alert = new Alert();
  alert.title = "✅ 완료!";
  alert.message = taskTitle || "할 일이 완료 처리됐어요.";
  alert.addAction("확인");
  await alert.present();

// ── 할 일 추가 ──
} else if (action === "add") {
  const alert = new Alert();
  alert.title = "오늘 할 일 추가";
  alert.addTextField("할 일 이름을 입력하세요");
  alert.addAction("추가");
  alert.addCancelAction("취소");

  const idx = await alert.present();
  if (idx === 0) {
    const title = alert.textFieldValue(0).trim();
    if (title) {
      await apiRequest("POST", { title });
    }
  }
}

Script.complete();
