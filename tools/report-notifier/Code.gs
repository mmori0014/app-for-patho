/**
 * 学習アプリ(病理学・内科学)問題報告の通知(1日1回まとめてメール)
 *
 * 初回だけ:setup() を実行 → 権限を承認。
 * 以後は毎朝8時台に、前回以降の新しい報告があればメールが届く(なければ送らない)。
 * 手動確認は checkReports() を実行。
 */
const PROJECT_ID = 'apprication-pathology';
const NOTIFY_HOUR = 8; // 通知する時刻(時)
const MAIL_TO = 'm.mori@kio.ac.jp'; // 送信先(空欄なら実行アカウント宛て)

const PROP_LAST = 'lastCheckedAt';
const APP_NAMES = { patho: '病理学', internal: '内科学', anatomy: '解剖学' };
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function setup() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'checkReports')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkReports').timeBased().everyDays(1).atHour(NOTIFY_HOUR).create();

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP_LAST)) {
    props.setProperty(PROP_LAST, new Date(0).toISOString()); // 初回は既存の報告もすべて対象
  }
  checkReports();
}

function checkReports() {
  const props = PropertiesService.getScriptProperties();
  const since = props.getProperty(PROP_LAST) || new Date(0).toISOString();
  const now = new Date().toISOString();

  const reports = fetchReportsSince_(since);
  if (reports.length) {
    const to = MAIL_TO || Session.getEffectiveUser().getEmail();
    MailApp.sendEmail({
      to,
      subject: `【学習アプリ】問題報告 ${reports.length}件（${summarizeApps_(reports)}）`,
      htmlBody: buildHtml_(reports),
    });
  }
  props.setProperty(PROP_LAST, now);
}

function fetchReportsSince_(sinceIso) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: 'reports' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'createdAt' },
          op: 'GREATER_THAN',
          value: { timestampValue: sinceIso },
        },
      },
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
      limit: 500,
    },
  };
  const res = UrlFetchApp.fetch(`${BASE}:runQuery`, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${ScriptApp.getOAuthToken()}`,
      'x-goog-user-project': PROJECT_ID,
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`Firestore query failed (${res.getResponseCode()}): ${res.getContentText()}`);
  }
  return JSON.parse(res.getContentText())
    .filter((r) => r.document)
    .map((r) => {
      const f = r.document.fields || {};
      const s = (k) => (f[k] && f[k].stringValue) || '';
      return {
        app: APP_NAMES[s('app') || 'patho'] || s('app'),
        docId: r.document.name.split('/').pop(),
        uid: s('uid'),
        version: s('exportVersion'),
        category: s('category'),
        question: s('question'),
        choices: ((f.choices && f.choices.arrayValue && f.choices.arrayValue.values) || []).map((v) => v.stringValue || ''),
        answer: s('answer'),
        selected: s('selected'),
        isCorrect: !!(f.isCorrect && f.isCorrect.booleanValue),
        comment: s('comment'),
        createdAt: f.createdAt ? f.createdAt.timestampValue : '',
      };
    });
}

function summarizeApps_(reports) {
  const n = {};
  reports.forEach((r) => (n[r.app] = (n[r.app] || 0) + 1));
  return Object.keys(n).map((k) => `${k}${n[k]}`).join('・');
}

function buildHtml_(reports) {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (iso) => (iso ? Utilities.formatDate(new Date(iso), 'Asia/Tokyo', 'M/d HH:mm') : '');
  const link = (id) =>
    `https://console.firebase.google.com/project/${PROJECT_ID}/firestore/databases/-default-/data/~2Freports~2F${id}`;

  const items = reports.map((r) => {
    const choices = r.choices
      .map((c) => {
        let mark = '';
        if (c === r.answer) mark += ' <b style="color:#15803d">(正解)</b>';
        if (c === r.selected) mark += ' <span style="color:#b45309">← 学生の回答</span>';
        return `<li>${esc(c)}${mark}</li>`;
      })
      .join('');
    const comment = r.comment
      ? `<div style="background:#fef9c3;padding:8px;border-radius:6px;margin-top:6px">💬 ${esc(r.comment)}</div>`
      : '<div style="color:#64748b;margin-top:6px">(コメントなし)</div>';
    return `
      <div style="border:1px solid #cbd5e1;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;color:#64748b"><b>${esc(r.app)}</b> / ${fmt(r.createdAt)} / ${esc(r.category)} / 問題ID: ${esc(r.uid)} / v${esc(r.version)} / ${r.isCorrect ? '正解した上で報告' : '不正解'}</div>
        <div style="font-weight:bold;margin:6px 0">${esc(r.question)}</div>
        <ul style="margin:0;padding-left:20px">${choices}</ul>
        ${comment}
        <div style="font-size:12px;margin-top:6px"><a href="${link(r.docId)}">コンソールで開く</a></div>
      </div>`;
  });
  return `<div style="font-family:sans-serif">${items.join('')}</div>`;
}
