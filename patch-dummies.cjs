// patch-dummies.js
// 1. 全問題のdummyPoolから括弧説明を削除
// 2. 炎症カテゴリに追加ダミーを補充（括弧なし）
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 括弧（全角・半角）以降を削除する関数
function strip(s) {
  return s.replace(/\s*[（(].+$/, '').trim();
}

// 炎症カテゴリへの追加ダミー（括弧なし）
const additions = {
  "急性炎症において組織損傷部位に最初に遊走し、侵入物を貪食・消化する細胞を何というか": [
    "好塩基球", "単球", "樹状細胞"
  ],
  "創傷治癒で瘢痕組織の形成に主にかかわる細胞を何というか": [
    "血管内皮細胞", "肥満細胞", "形質細胞"
  ],
  "好中球などの炎症細胞から分泌される生理活性物質を何というか": [
    "ヒスタミン", "ブラジキニン", "トロンボキサン"
  ],
  "白血球が血管から病変組織へと動員される現象を何というか": [
    "走化性", "オプソニン化", "ダイアペデシス"
  ],
  "炎症の5徴候とは何か": [
    "発赤・腫脹・疼痛・発熱・黄疸",
    "発赤・腫脹・硬結・疼痛・発熱",
    "疼痛・発熱・腫脹・機能障害・チアノーゼ"
  ],
  "化膿性炎症の炎症巣が限局せずにびまん性に拡大した場合を何というか": [
    "壊死性炎", "偽膜性炎", "出血性炎"
  ],
  "特異性炎の例を1つ挙げよ": [
    "大葉性肺炎", "アレルギー性鼻炎", "偽膜性炎"
  ],
  "肉芽腫の構成成分を3つ挙げよ": [
    "好中球・リンパ球・形質細胞",
    "類上皮細胞・好中球・線維芽細胞",
    "マクロファージ・樹状細胞・NK細胞"
  ],
  "急性炎症ではみられない、慢性炎症の組織学的特徴として何があるか": [
    "ヒスタミンによる血管拡張", "フィブリン析出", "好中球主体の滲出液形成"
  ],
  "抗体産生を担う細胞を何というか": [
    "樹状細胞", "ヘルパーT細胞", "肥満細胞"
  ],
  "肥満細胞が産生する炎症を惹起する生理活性物質を何というか": [
    "ブラジキニン", "セロトニン", "インターロイキン"
  ],
  "炎症の経過を表す順序として正しいものはどれか": [
    "滲出・変質・増殖",
    "充血・滲出・増殖",
    "変質・組織修復・滲出"
  ],
  "滲出性炎のうち、漿液成分が主体のものを何というか": [
    "肉芽腫性炎", "壊死性炎", "出血性炎"
  ],
  "滲出性炎のうち、好中球と融解した組織からなる膿を形成するものを何というか": [
    "出血性炎", "壊死性炎", "増殖性炎"
  ],
  "滲出性炎のうち、フィブリンの滲出が主体のものを何というか": [
    "肉芽腫性炎", "壊死性炎", "増殖性炎"
  ],
  "粘膜面に生じ、粘液分泌が亢進する炎症を何というか": [
    "肉芽腫性炎", "壊死性炎", "増殖性炎"
  ]
};

let strippedCount = 0;
let addedCount = 0;

data.questions = data.questions.map(q => {
  // 全問題のdummyPoolを括弧なしに
  const before = JSON.stringify(q.dummyPool);
  q.dummyPool = q.dummyPool.map(strip);
  if (JSON.stringify(q.dummyPool) !== before) strippedCount++;

  // 炎症カテゴリへの追加
  if (q.category === '炎症' && additions[q.question]) {
    q.dummyPool = [...q.dummyPool, ...additions[q.question]];
    addedCount++;
  }

  return q;
});

data.exportVersion = (data.exportVersion || 0) + 1;

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`✔ 括弧削除: ${strippedCount}問`);
console.log(`✔ 炎症ダミー追加: ${addedCount}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
