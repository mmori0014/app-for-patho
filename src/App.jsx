import React, { useEffect, useMemo, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";
import QUESTIONS_EXPORT from "./questions.export.json";

/** ========================= Storage keys ========================= */
const ADMIN_KEY = "0014";
const QUESTIONS_KEY = "patho-questions-v1";
const SEEDED_KEY = "patho-seeded-v1";
const WRONG_KEY = "patho-wrong-v1";
const ATTEMPT_KEY = "patho-attempt-v1";
const CORRECT_KEY = "patho-correct-v1";
const SCORE_KEY = "patho-score-v1";
const ROUND_KEY = "patho-round-v1";
const EXPORT_VERSION_KEY = "patho-export-version-v1";

const EXPORT_VERSION = String(QUESTIONS_EXPORT?.exportVersion ?? "0");

/** ========================= Helpers ========================= */
function genUid() {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const shuffle = (arr) => {
  const a = [...(Array.isArray(arr) ? arr : [])];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const linesToText = (arr) => (Array.isArray(arr) ? arr : []).join("\n");
const textToLines = (text) =>
  String(text ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

/** ========================= Normalization ========================= */
function normalizeQuestions(input) {
  const arr = Array.isArray(input) ? input : [];
  const out = arr.map((q, idx) => {
    const base = q && typeof q === "object" ? q : {};
    const uid = String(base.uid || "").trim() || genUid();
    const type = ["term", "binary"].includes(base.type) ? base.type : "term";
    const answerPool = (Array.isArray(base.answerPool) ? base.answerPool : [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean);
    const dummyPool = (Array.isArray(base.dummyPool) ? base.dummyPool : [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean);
    return {
      uid,
      id: base.id ?? idx + 1,
      category: String(base.category ?? "未分類").trim() || "未分類",
      type,
      question: String(base.question ?? ""),
      answerPool: answerPool.length ? answerPool : [""],
      dummyPool,
    };
  });
  const seen = new Set();
  for (const q of out) {
    if (seen.has(q.uid)) q.uid = genUid();
    seen.add(q.uid);
  }
  return out;
}

function loadFromStorage() {
  return loadJSON(QUESTIONS_KEY, null);
}
function saveToStorage(list) {
  saveJSON(QUESTIONS_KEY, list);
}

/** ========================= Presented choices =========================
 * term: 正解1(answerPoolからランダム)+ ダミー4(dummyPoolからランダム抽出)を毎回シャッフル
 * binary: answerPool[0] と dummyPool[0] の2択をシャッフル
 */
function makePresentedSet(q) {
  if (!q) throw new Error("makePresentedSet: q is null");

  if (q.type === "binary") {
    const answer = q.answerPool[0] ?? "";
    const other = q.dummyPool[0] ?? "";
    const choices = shuffle([answer, other].filter(Boolean));
    return { choices, answer };
  }

  // term
  const pool = q.answerPool.filter(Boolean);
  const answer = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : "";

  const dPool = shuffle(q.dummyPool.filter((d) => d !== answer));
  const dummies = dPool.slice(0, 4);
  while (dummies.length < 4 && dPool.length) {
    dummies.push(dPool[dummies.length % dPool.length]);
  }

  const choices = shuffle([answer, ...dummies].filter(Boolean));
  return { choices, answer };
}

/** ========================= App ========================= */
export default function App() {

  useEffect(() => {
    try {
      registerSW({ immediate: true });
    } catch {}
  }, []);

  const [adminPass, setAdminPass] = useState(
    () => localStorage.getItem("patho-admin-pass") || ""
  );
  const isAdmin = adminPass === ADMIN_KEY;

  useEffect(() => {
    try {
      localStorage.setItem("patho-admin-pass", adminPass);
    } catch {}
  }, [adminPass]);

  const [mode, setMode] = useState("practice");
  const [backupMsg, setBackupMsg] = useState("");
  const [backupText, setBackupText] = useState("");
  const [needsExport, setNeedsExport] = useState(false);

  const [questions, setQuestions] = useState(() => {
    const stored = loadFromStorage();
    if (Array.isArray(stored) && stored.length > 0) {
      return normalizeQuestions(stored);
    }
    const exp = QUESTIONS_EXPORT?.questions || [];
    const normalized = normalizeQuestions(exp);
    saveToStorage(normalized);
    localStorage.setItem(SEEDED_KEY, "1");
    return normalized;
  });

  const persistQuestions = (updaterOrNext) => {
    setQuestions((prev) => {
      const rawNext =
        typeof updaterOrNext === "function" ? updaterOrNext(prev) : updaterOrNext;
      const next = normalizeQuestions(rawNext);
      saveToStorage(next);
      setNeedsExport(true);
      return next;
    });
  };

  /** progress maps */
  const [wrongMap, setWrongMap] = useState(() => loadJSON(WRONG_KEY, {}));
  const [attemptMap, setAttemptMap] = useState(() => loadJSON(ATTEMPT_KEY, {}));
  const [correctMap, setCorrectMap] = useState(() => loadJSON(CORRECT_KEY, {}));
  const [score, setScore] = useState(() => Number(localStorage.getItem(SCORE_KEY) || 0));
  const [round, setRound] = useState(() => Number(localStorage.getItem(ROUND_KEY) || 1));

  useEffect(() => {
    saveJSON(WRONG_KEY, wrongMap);
    saveJSON(ATTEMPT_KEY, attemptMap);
    saveJSON(CORRECT_KEY, correctMap);
    localStorage.setItem(SCORE_KEY, JSON.stringify(score));
    localStorage.setItem(ROUND_KEY, String(round));
  }, [wrongMap, attemptMap, correctMap, score, round]);

  /** export version auto-sync(questions.export.jsonを更新したら自動反映) */
  useEffect(() => {
    try {
      const prevVer = String(localStorage.getItem(EXPORT_VERSION_KEY) ?? "0");
      const nextVer = String(EXPORT_VERSION ?? "0");
      if (!nextVer || nextVer === "0" || nextVer === prevVer) return;
      const exp = QUESTIONS_EXPORT?.questions || [];
      const normalized = normalizeQuestions(exp);
      setQuestions(normalized);
      saveToStorage(normalized);
      localStorage.setItem(EXPORT_VERSION_KEY, nextVer);
    } catch (e) {
      console.error("export auto-sync failed:", e);
    }
  }, []);

  /** categories: データから自動収集 */
  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.category));
    return Array.from(set).sort();
  }, [questions]);

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [randomMode, setRandomMode] = useState(true);

  const filteredQuestions = useMemo(() => {
    let list = questions;
    if (selectedCategory !== "ALL") {
      list = list.filter((q) => q.category === selectedCategory);
    }
    if (onlyWeak) {
      list = list.filter((q) => {
        const uid = String(q.uid);
        const w = Number(wrongMap?.[uid] || 0);
        const c = Number(correctMap?.[uid] || 0);
        return w > c;
      });
    }
    return list;
  }, [questions, selectedCategory, onlyWeak, wrongMap, correctMap]);

  const [questionOrder, setQuestionOrder] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const n = filteredQuestions.length;
    const order = Array.from({ length: n }, (_, i) => i);
    setQuestionOrder(randomMode ? shuffle(order) : order);
    setCurrentIndex(0);
    setSelectedChoice("");
    setShowResult(false);
  }, [filteredQuestions.length, randomMode, selectedCategory, onlyWeak]);

  const activeQuestion = useMemo(() => {
    const idx = questionOrder[currentIndex] ?? currentIndex;
    return filteredQuestions[idx] || null;
  }, [filteredQuestions, questionOrder, currentIndex]);

  const [presentedChoices, setPresentedChoices] = useState([]);
  const [presentedAnswer, setPresentedAnswer] = useState("");

  const rebuildPresented = (q) => {
    if (!q) {
      setPresentedChoices([]);
      setPresentedAnswer("");
      return;
    }
    try {
      const { choices, answer } = makePresentedSet(q);
      setPresentedChoices(choices);
      setPresentedAnswer(answer);
    } catch (e) {
      console.error(e);
      setPresentedChoices([]);
      setPresentedAnswer("");
    }
  };

  useEffect(() => {
    rebuildPresented(activeQuestion);
    setSelectedChoice("");
    setShowResult(false);
  }, [activeQuestion?.uid, currentIndex]);

  const checkAnswer = () => {
    if (!activeQuestion || !selectedChoice) return;
    const isCorrect = selectedChoice === presentedAnswer;
    const uid = String(activeQuestion.uid);
    setAttemptMap((m) => ({ ...m, [uid]: Number(m?.[uid] || 0) + 1 }));
    if (isCorrect) {
      setCorrectMap((m) => ({ ...m, [uid]: Number(m?.[uid] || 0) + 1 }));
      setScore((s) => s + 1);
    } else {
      setWrongMap((m) => ({ ...m, [uid]: Number(m?.[uid] || 0) + 1 }));
    }
    setShowResult(true);
  };

  const nextQuestion = () => {
    const len = filteredQuestions.length;
    if (!len) return;
    setSelectedChoice("");
    setShowResult(false);
    setCurrentIndex((i) => {
      const next = i + 1;
      if (next >= len) {
        setRound((r) => r + 1);
        return 0;
      }
      return next;
    });
  };

  const resetScoreOnly = () => {
    setScore(0);
    setRound(1);
    setBackupMsg("✅ スコアをリセットしました");
    setTimeout(() => setBackupMsg(""), 1200);
  };

  /** ===== Admin edit ===== */
  const NEW_UID = "__new__";
  const [editingUid, setEditingUid] = useState(null);

  const editingQuestion = useMemo(() => {
    if (!editingUid) return null;
    if (editingUid === NEW_UID) {
      return {
        uid: NEW_UID,
        category: categories[0] || "未分類",
        type: "term",
        question: "",
        answerPool: [],
        dummyPool: [],
      };
    }
    return questions.find((q) => q.uid === editingUid) || null;
  }, [editingUid, questions, categories]);

  const [draft, setDraft] = useState(null);
  useEffect(() => {
    if (!editingQuestion) {
      setDraft(null);
      return;
    }
    setDraft(JSON.parse(JSON.stringify(editingQuestion)));
  }, [editingQuestion?.uid]);

  const saveDraft = () => {
    if (!draft) return;
    const cleaned = normalizeQuestions([draft])[0];
    if (editingUid === NEW_UID) {
      cleaned.uid = genUid();
      persistQuestions((prev) => [...prev, cleaned]);
    } else {
      persistQuestions((prev) => prev.map((q) => (q.uid === cleaned.uid ? cleaned : q)));
    }
    setEditingUid(null);
    setBackupMsg("✅ 保存しました");
    setTimeout(() => setBackupMsg(""), 1200);
  };

  const deleteQuestion = (uid) => {
    if (!uid) return;
    if (!confirm("この問題を削除しますか?")) return;
    persistQuestions((prev) => prev.filter((q) => q.uid !== uid));
    setBackupMsg("✅ 削除しました");
    setTimeout(() => setBackupMsg(""), 1200);
  };

  /** export / import */
  const doExport = () => {
    try {
      const payload = {
        exportVersion: Date.now(),
        questions,
        wrongMap,
        attemptMap,
        correctMap,
        score,
        round,
      };
      const json = JSON.stringify(payload, null, 2);
      setBackupText(json);

      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const name = `patho_backup_${ts.getFullYear()}-${pad(ts.getMonth() + 1)}-${pad(
        ts.getDate()
      )}_${pad(ts.getHours())}${pad(ts.getMinutes())}.json`;
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);

      setNeedsExport(false);
      setBackupMsg("✅ Exportしました(Downloadsに保存)");
      setTimeout(() => setBackupMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setBackupMsg("❌ Export失敗");
      setTimeout(() => setBackupMsg(""), 1500);
    }
  };

  const doImport = () => {
    try {
      const obj = JSON.parse(String(backupText || ""));
      const qs = normalizeQuestions(obj.questions || []);
      persistQuestions(qs);
      setWrongMap(obj.wrongMap || {});
      setAttemptMap(obj.attemptMap || {});
      setCorrectMap(obj.correctMap || {});
      setScore(Number(obj.score || 0));
      setRound(Number(obj.round || 1));
      localStorage.setItem(SEEDED_KEY, "1");
      setBackupMsg("✅ Import完了(上書き)");
      setTimeout(() => setBackupMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setBackupMsg("❌ Import失敗(JSONを確認)");
      setTimeout(() => setBackupMsg(""), 2000);
    }
  };

  /** ===== styles ===== */
  const layoutStyles = `
    .app-grid { display: block; }
    @media (min-width: 1000px) {
      .app-grid { display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 16px; align-items: start; }
      .right-col { position: sticky; top: 12px; }
    }
  `;
  const cardStyle = {
    border: "1px solid #22314a",
    borderRadius: 16,
    background: "#0b1220",
    padding: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  };
  const btn = (primary) => ({
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: primary ? "#2563eb" : "transparent",
    color: "#f8fafc",
    fontWeight: 900,
    cursor: "pointer",
  });
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#0b1220",
    color: "#f8fafc",
    fontWeight: 700,
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", padding: 16, fontFamily: "system-ui", background: "#050914", color: "#f9fafb" }}>
      <style>{layoutStyles}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>病理学マスター</h1>
          <div style={{ color: "#cbd5e1", fontSize: 13 }}>
            {mode === "practice" ? "Practice" : "Edit"} / Questions: {filteredQuestions.length} / Round: {round}
          </div>
        </header>

        <div className="app-grid">
          <main style={{ display: "grid", gap: 16 }}>
            <section style={cardStyle}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={btn(mode === "practice")} onClick={() => setMode("practice")}>練習</button>
                  <button style={btn(mode === "edit")} onClick={() => setMode("edit")}>編集</button>
                  <button style={btn(false)} onClick={resetScoreOnly}>スコアリセット</button>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="管理者パス"
                    style={{ width: 180, ...inputStyle }}
                  />
                  <div style={{ fontSize: 12, color: isAdmin ? "#34d399" : "#94a3b8" }}>
                    {isAdmin ? "ADMIN" : "USER"}
                  </div>
                </div>
              </div>
              {needsExport && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#fbbf24", fontWeight: 900 }}>
                  ⚠ 編集内容が未Exportです(バックアップ推奨)
                </div>
              )}
              {backupMsg && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#cbd5e1", fontWeight: 900 }}>{backupMsg}</div>
              )}
            </section>

            {mode === "practice" && (
              <section style={cardStyle}>
                {!activeQuestion ? (
                  <div style={{ color: "#cbd5e1" }}>問題がありません(フィルタ条件を確認)</div>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>
                        問題 {Math.min(currentIndex + 1, filteredQuestions.length)} / {filteredQuestions.length}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>{activeQuestion.category}</div>
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16, whiteSpace: "pre-wrap" }}>
                      {activeQuestion.question}
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {presentedChoices.map((c, i) => (
                        <label
                          key={c + "_" + i}
                          style={{
                            border: "1px solid #22314a",
                            borderRadius: 12,
                            padding: 12,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            cursor: showResult ? "default" : "pointer",
                            opacity: showResult ? 0.92 : 1,
                            background:
                              showResult && selectedChoice === c
                                ? c === presentedAnswer
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.12)"
                                : "transparent",
                          }}
                        >
                          <input
                            type="radio"
                            checked={selectedChoice === c}
                            onChange={() => !showResult && setSelectedChoice(c)}
                            disabled={showResult}
                          />
                          <span style={{ fontWeight: 800 }}>{c}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                      <button style={btn(true)} onClick={checkAnswer} disabled={!selectedChoice || showResult}>
                        判定
                      </button>
                      <button style={btn(false)} onClick={nextQuestion} disabled={!showResult}>
                        次へ
                      </button>
                      <div style={{ marginLeft: "auto", color: "#cbd5e1", fontWeight: 900 }}>Score: {score}</div>
                    </div>

                    {showResult && (
                      <div
                        style={{
                          marginTop: 12,
                          fontWeight: 900,
                          color: selectedChoice === presentedAnswer ? "#34d399" : "#fb7185",
                        }}
                      >
                        {selectedChoice === presentedAnswer
                          ? "✅ 正解！"
                          : `❌ 不正解(正解:${presentedAnswer})`}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {mode === "edit" && (
              <section style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>問題編集</div>
                  {isAdmin && (
                    <button style={btn(true)} onClick={() => setEditingUid(NEW_UID)} type="button">
                      ＋追加
                    </button>
                  )}
                </div>

                {!isAdmin && <div style={{ marginTop: 10, color: "#cbd5e1" }}>編集は管理者のみです(管理者パスを入力)</div>}

                {isAdmin && (
                  <div style={{ marginTop: 12, display: "grid", gap: 10, maxHeight: 520, overflow: "auto", paddingRight: 6 }}>
                    {filteredQuestions.map((q, idx) => (
                      <div
                        key={q.uid}
                        style={{
                          border: "1px solid #22314a",
                          borderRadius: 12,
                          padding: 10,
                          display: "grid",
                          gridTemplateColumns: "1fr auto auto",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 900 }}>#{idx + 1} {q.question}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            {q.category} / type: {q.type} / 正解候補: {q.answerPool.length} / ダミー: {q.dummyPool.length}
                          </div>
                        </div>
                        <button style={btn(false)} onClick={() => setEditingUid(q.uid)} type="button">編集</button>
                        <button style={{ ...btn(false), borderColor: "#7f1d1d" }} onClick={() => deleteQuestion(q.uid)} type="button">削除</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>

          <aside className="right-col" style={{ display: "grid", gap: 16 }}>
            <section style={cardStyle}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>フィルタ</div>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>カテゴリ</div>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={inputStyle}>
                    <option value="ALL">すべて</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
                  <input type="checkbox" checked={randomMode} onChange={(e) => setRandomMode(e.target.checked)} />
                  問題順をランダム
                </label>
                <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
                  <input type="checkbox" checked={onlyWeak} onChange={(e) => setOnlyWeak(e.target.checked)} />
                  苦手のみ(wrong &gt; correct)
                </label>
              </div>
            </section>

            {isAdmin && (
              <section style={cardStyle}>
                <div style={{ fontWeight: 900, marginBottom: 10 }}>バックアップ</div>
                <div style={{ display: "grid", gap: 10 }}>
                  <button style={btn(true)} onClick={doExport} type="button">Export</button>
                  <textarea
                    value={backupText}
                    onChange={(e) => setBackupText(e.target.value)}
                    placeholder="ここにExport JSONが出ます / ImportするJSONを貼る"
                    style={{ ...inputStyle, minHeight: 160, fontFamily: "monospace", fontSize: 12 }}
                  />
                  <button style={btn(false)} onClick={doImport} type="button">Import(上書き)</button>
                </div>
              </section>
            )}
          </aside>
        </div>

        {isAdmin && draft && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", padding: 12, zIndex: 50 }}
            onMouseDown={() => setEditingUid(null)}
          >
            <div
              style={{ width: "min(900px, 98vw)", maxHeight: "90vh", overflow: "auto", borderRadius: 18, border: "1px solid #22314a", background: "#0b1220", padding: 14 }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 900 }}>編集</div>
                <button style={btn(false)} onClick={() => setEditingUid(null)} type="button">閉じる</button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>カテゴリ</div>
                  <input
                    value={draft.category}
                    onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={btn(draft.type === "term")} onClick={() => setDraft((d) => ({ ...d, type: "term" }))} type="button">term(5択)</button>
                  <button style={btn(draft.type === "binary")} onClick={() => setDraft((d) => ({ ...d, type: "binary" }))} type="button">binary(2択)</button>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>問題文</div>
                  <textarea
                    value={draft.question}
                    onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 80 }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                    正解候補(1行1つ。複数可。毎回ランダム抽出)
                  </div>
                  <textarea
                    value={linesToText(draft.answerPool)}
                    onChange={(e) => setDraft((d) => ({ ...d, answerPool: textToLines(e.target.value) }))}
                    style={{ ...inputStyle, minHeight: 90, fontFamily: "monospace" }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                    ダミー候補(1行1つ。term型は毎回4つ抽出/binary型は1つ目のみ使用)
                  </div>
                  <textarea
                    value={linesToText(draft.dummyPool)}
                    onChange={(e) => setDraft((d) => ({ ...d, dummyPool: textToLines(e.target.value) }))}
                    style={{ ...inputStyle, minHeight: 110, fontFamily: "monospace" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button style={btn(true)} onClick={saveDraft} type="button">保存</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}