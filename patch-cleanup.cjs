// patch-cleanup.cjs
// 重複削除・表記統一・問題文とダミーの整合・dummyPool補充
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ============ 1. 重複問題の削除 ============
const deleteUids = [
  '37iuvilmt1ei', // 充血の定義（重複）
  'dpf4l6frjj0q', // メタボHDL（改行入り旧版）
  'mptloh6wgf2l', // メタボ内臓脂肪（改行入り旧版）
  'llh1bynlh8el', // 「VHLがん遺伝子か」助詞抜けtypo
  'c015unfyw790', // VHL（重複）
  'xomk70ouvf00', // APC（重複）
  'i3yhpr88i1i0', // EGFR（重複）
  'pc9x7tkjxyi0', // HBOC（重複）
  '6g79pjv9huld', // 化生（重複）
  'u6jblmopr47z', // 化生（重複）
  'yp46cpa55u5x', // 一次止血（重複）
  'qg2x839whdsj', // 物理的因子（重複・内容が少ない方）
  '0s89nhb4hqnk', // HIV感染経路（「日本における〜」を残す）
  'sbmk1iaxbw3b', // 虚血（重複）
  '7obgyi83t8ak', // 生理的萎縮（重複）
  'id3vmyf51972', // 門脈圧亢進（tndn40y41x00に統合）
];

const before = data.questions.length;
const deleted = data.questions.filter(q => deleteUids.includes(q.uid));
data.questions = data.questions.filter(q => !deleteUids.includes(q.uid));
deleted.forEach(q => console.log(`削除: [${q.category}] ${q.question.slice(0, 42)}`));
console.log(`→ ${before - data.questions.length}問削除\n`);

// ============ 2. 表記統一（講義資料の表記「癌遺伝子/癌抑制遺伝子」に揃える） ============
let notationCount = 0;
const unify = s => s.replace(/がん抑制遺伝子/g, '癌抑制遺伝子').replace(/がん遺伝子/g, '癌遺伝子');
data.questions = data.questions.map(q => {
  const before = JSON.stringify([q.question, q.answerPool, q.dummyPool]);
  q.question = unify(q.question);
  q.answerPool = q.answerPool.map(unify);
  q.dummyPool = q.dummyPool.map(unify);
  if (JSON.stringify([q.question, q.answerPool, q.dummyPool]) !== before) notationCount++;
  return q;
});
console.log(`表記統一（がん→癌）: ${notationCount}問\n`);

// ============ 3. 問題文とダミーの整合／dummyPool補充 ============
let fixCount = 0;
data.questions = data.questions.map(q => {

  // 病原体5分類: 問題文の列挙とダミーが不整合 → 列挙を外して一般化
  const pathogens = {
    '風疹の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか': '風疹の病原体は何に分類されるか',
    '結核の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか': '結核の病原体は何に分類されるか',
    'クリプトコッカス症の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか': 'クリプトコッカス症の病原体は何に分類されるか',
    'ニューモシスチス肺炎の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか': 'ニューモシスチス肺炎の病原体は何に分類されるか',
  };
  if (pathogens[q.question]) {
    q.question = pathogens[q.question];
    q.dummyPool = ['細菌', '真菌', 'ウイルス', '寄生虫', 'プリオン', '原虫', '蠕虫', 'リケッチア', 'マイコプラズマ']
      .filter(d => !q.answerPool.includes(d));
    console.log(`修正: ${q.question}（問題文の列挙を外しダミーと整合）`);
    fixCount++;
  }

  // dummyPool 7個未満の補充
  if (q.question === '膠芽腫・子宮体がんで異常を認める癌抑制遺伝子は何か') {
    q.dummyPool = ['APC', 'VHL', 'WT1', 'p53', 'BRCA1', 'MLH1', 'RB1'];
    console.log('補充: PTENの問題（dummyPool 7個に）');
    fixCount++;
  }
  if (q.question.includes('組織が硬く・もろく・灰白色を呈する壊死')) {
    q.dummyPool = ['融解壊死', '壊疽', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '出血性壊死', '湿性壊疽'];
    console.log('補充: 凝固壊死の問題（dummyPool 7個に）');
    fixCount++;
  }
  if (q.question.includes('組織が軟化・融解・液化する壊死')) {
    q.dummyPool = ['凝固壊死', '壊疽', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '出血性壊死', '湿性壊疽'];
    console.log('補充: 融解壊死の問題（dummyPool 7個に）');
    fixCount++;
  }
  if (q.question.includes('腐敗菌や乾燥の影響を受けたもの')) {
    q.dummyPool = ['凝固壊死', '融解壊死', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '出血性壊死', '膿瘍'];
    console.log('補充: 壊疽の問題（dummyPool 7個に）');
    fixCount++;
  }

  // 門脈圧亢進: 正解候補を統合
  if (q.uid === 'tndn40y41x00') {
    q.answerPool = ['食道静脈瘤', 'メズサの頭', '脾腫', '痔静脈瘤', '腹水貯留', '肝性脳症'];
    console.log('統合: 門脈圧亢進症の症状（正解候補をまとめる）');
    fixCount++;
  }

  return q;
});

// ============ 4. 保存 ============
data.exportVersion = (data.exportVersion || 0) + 1;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✔ 修正: ${fixCount}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
