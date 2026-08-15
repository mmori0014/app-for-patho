// patch-format-fix.cjs
// 「形式だけで正解が判別できる」欠陥の修正
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ============ 1. 臓器がん名の表記統一（「〜がん」に揃える） ============
// 「癌腫」「癌抑制遺伝子」「発癌」などは対象外。臓器名+癌 のみを置換
const cancerMap = {
  '肺癌': '肺がん', '乳癌': '乳がん', '腎癌': '腎がん', '前立腺癌': '前立腺がん',
  '大腸癌': '大腸がん', '皮膚癌': '皮膚がん', '膀胱癌': '膀胱がん', '胃癌': '胃がん',
  '肝癌': '肝がん', '膵癌': '膵がん', '食道癌': '食道がん', '子宮頸癌': '子宮頸がん',
  '子宮体癌': '子宮体がん', '卵巣癌': '卵巣がん', '甲状腺癌': '甲状腺がん',
  '頭頚部癌': '頭頚部がん', '胆管癌': '胆管がん', '精巣癌': '精巣がん', '腹膜癌': '腹膜がん',
};

const normalize = s => {
  // 完全一致のみ置換（複合語への巻き込みを防ぐ）
  if (cancerMap[s]) return cancerMap[s];
  return s;
};

let notationCount = 0;
data.questions = data.questions.map(q => {
  const before = JSON.stringify([q.answerPool, q.dummyPool]);
  q.answerPool = q.answerPool.map(normalize);
  q.dummyPool = q.dummyPool.map(normalize);
  if (JSON.stringify([q.answerPool, q.dummyPool]) !== before) notationCount++;
  return q;
});
console.log(`臓器がん名の表記統一: ${notationCount}問\n`);

// ============ 2. 個別修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {

  // 【重大】正解が臓器名のみでダミーは「〜がん」→ 粒度を揃える
  if (q.question === '脳への転移を起こしやすいのはどこの癌か') {
    q.answerPool = ['肺がん'];
    q.dummyPool = ['乳がん', '大腸がん', '胃がん', '膵がん', '前立腺がん', '子宮頸がん', '食道がん'];
    console.log('修正【重大】: 脳転移（正解「肺」→「肺がん」に粒度を統一）');
    fixCount++;
  }

  // 【重大】正解が複合列挙でないためダミーと形式が食い違う
  if (q.question === '細菌のうち非定型細菌と呼ばれるものを3つ挙げよ') {
    q.answerPool = ['リケッチア・クラミジア・マイコプラズマ'];
    console.log('修正【重大】: 非定型細菌（正解を複合表記に統一）');
    fixCount++;
  }
  if (q.question === '脂質異常症の評価となる3つの項目を挙げよ') {
    q.answerPool = ['LDL・HDL・トリグリセライド'];
    console.log('修正【重大】: 脂質異常症の評価項目（正解を複合表記に統一）');
    fixCount++;
  }
  if (q.question === '癌細胞の転移様式を3つ挙げよ') {
    q.answerPool = ['リンパ行性・血行性・播種'];
    q.dummyPool = [
      'リンパ行性・血行性・直接浸潤',
      '血行性・播種・直接浸潤',
      'リンパ行性・播種・直接浸潤',
      '飛沫感染・空気感染・接触感染',
      '経胎盤感染・産道感染・母乳感染',
      '菌血症・毒素血症・ウイルス血症',
      '浸潤・増殖・転移'
    ];
    console.log('修正【重大】: 転移様式（正解を複合表記に統一し、ダミーも同形式に）');
    fixCount++;
  }

  // 括弧の全角/半角不一致
  if (q.answerPool.includes('白血病（ATL)')) {
    q.answerPool = q.answerPool.map(a => a === '白血病（ATL)' ? '白血病（ATL）' : a);
    console.log('修正: 白血病（ATL）の括弧表記');
    fixCount++;
  }

  // MHC classⅠ: ダミー7個中6個が「〜のみ」で消去法が働く
  if (q.question === 'MHC classⅠが発現しているのはどの細胞か') {
    q.dummyPool = [
      '抗原提示細胞', '樹状細胞・マクロファージ・B細胞', 'T細胞とB細胞',
      '赤血球と血小板', '好中球と単球', '上皮細胞と線維芽細胞', 'リンパ球全般'
    ];
    console.log('修正: MHC classⅠのダミー（「のみ」偏重を解消）');
    fixCount++;
  }
  if (q.question === 'MHC classⅡが発現しているのはどの細胞か') {
    q.dummyPool = [
      '全ての有核細胞と血小板', 'T細胞と赤血球', '赤血球と血小板',
      '好中球と単球', '線維芽細胞と血管内皮細胞', '上皮細胞と筋細胞', 'リンパ球全般'
    ];
    console.log('修正: MHC classⅡのダミー（「のみ」偏重を解消）');
    fixCount++;
  }

  // 多段階発癌説: ダミー4個中3個が「〜のみ」
  if (q.question === '遺伝子変異が段階的に蓄積することでがん化が進行するという説を何というか') {
    q.dummyPool = [
      '一段階発癌説', 'ウイルス発癌説', '体細胞突然変異説', '化学発癌説',
      'エピジェネティック発癌説', '幹細胞発癌説', 'フィールドキャンサー理論'
    ];
    console.log('修正: 多段階発癌説のダミー（「のみ」偏重を解消）');
    fixCount++;
  }

  // 出血性素因: ダミーに「〜のみを指す用語」が3個
  if (q.question === '止血機構の障害によって出血傾向が持続する疾患群を何というか') {
    q.dummyPool = [
      '血栓性素因', '播種性血管内凝固症候群', '血小板減少症', '紫斑病',
      '血管炎', '凝固因子欠乏症', '線溶亢進症'
    ];
    console.log('修正: 出血性素因のダミー（「のみを指す用語」を解消）');
    fixCount++;
  }

  // HER2のリスク因子: ダミー3個が「〜転移のみ」
  if (q.question === 'HER2はどのようなリスク因子となるか') {
    q.dummyPool = [
      '骨転移と病的骨折', '脳転移と神経症状', '肝転移と肝不全', '術後感染',
      '化学療法の副作用', '放射線障害', '静脈血栓症'
    ];
    console.log('修正: HER2のリスク因子のダミー（「のみ」偏重を解消）');
    fixCount++;
  }

  return q;
});

// ============ 3. 保存 ============
data.exportVersion = (data.exportVersion || 0) + 1;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✔ 表記統一: ${notationCount}問`);
console.log(`✔ 個別修正: ${fixCount}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
