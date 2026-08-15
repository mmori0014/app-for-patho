// patch-content-fix.cjs
// 内容面の修正：重複・ダミーへの正解混入・不正確な設問・表記の不統一
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// ============ 1. 重複削除 ============
const deleteQ = [
  '結核の際にみられる特異な凝固壊死を何というか',        // 「結核感染時に認める凝固壊死〜」と重複
  '結核でみられる特徴的な肉芽腫中心部の壊死を何というか', // 同上（炎症カテゴリ側）
  '偽痛風が好発するのは膝関節か、足の親指の付け根(第一中足趾節関節)か', // 「偽痛風の好発部位はどこか」と重複
];

let delCount = 0;
data.questions = data.questions.filter(q => {
  if (deleteQ.includes(q.question)) {
    console.log(`削除: [${q.category}] ${q.question.slice(0, 40)}`);
    delCount++;
    return false;
  }
  return true;
});
console.log(`→ ${delCount}問削除\n`);

// ============ 2. 内容修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {

  // 乾酪壊死: ダミーから「凝固壊死」を除去（乾酪壊死は凝固壊死の一種）
  if (q.question === '結核感染時に認める凝固壊死を何というか') {
    q.dummyPool = [
      '融解壊死', '脂肪壊死', '線維素様壊死', '壊疽',
      '湿性壊疽', '乾性壊疽', '出血性壊死'
    ];
    console.log('修正: 乾酪壊死のダミー（凝固壊死は上位概念のため除去）');
    fixCount++;
  }

  // Ⅳ型アレルギー: 「自己免疫性疾患」は型が多岐にわたるため講義準拠に
  if (q.question === 'ツベルクリン反応や自己免疫性疾患は何型のアレルギー性疾患か') {
    q.question = 'ツベルクリン反応や接触性皮膚炎は何型のアレルギー性疾患か';
    console.log('修正: Ⅳ型アレルギーの設問（自己免疫性疾患→接触性皮膚炎）');
    fixCount++;
  }

  // 急性糸球体腎炎とループス腎炎は別疾患。括弧表記が誤解を招く
  if (q.question === '急性糸球体（ループス）腎炎は何型のアレルギー性疾患か') {
    q.question = '急性糸球体腎炎や全身性エリテマトーデスは何型のアレルギー性疾患か';
    console.log('修正: Ⅲ型アレルギーの設問（括弧表記を解消）');
    fixCount++;
  }

  // BMI: 正解だけ表記が異なり判別できてしまう
  if (q.question === 'BMIを求める計算式とはどのような計算式か') {
    q.answerPool = ['体重(kg)÷身長(m)÷身長(m)'];
    q.dummyPool = [
      '体重(kg)÷身長(m)',
      '体重(kg)×身長(m)×身長(m)',
      '身長(m)÷体重(kg)÷体重(kg)',
      '体重(kg)÷身長(cm)÷身長(cm)',
      '体重(g)÷身長(m)÷身長(m)',
      '体重(kg)×2÷身長(m)',
      '体重(kg)÷身長(m)÷身長(m)×10'
    ];
    console.log('修正: BMIの計算式（正解とダミーの表記を統一）');
    fixCount++;
  }

  // 染色体構造異常: 講義の略語表にある「挿入(ins)」を正解候補に追加
  if (q.question === '次のうち、染色体の構造異常に分類されるものはどれか。') {
    q.answerPool = ['欠失', '重複', '逆位', '相互転座', '挿入'];
    console.log('修正: 染色体構造異常の正解候補に「挿入」を追加');
    fixCount++;
  }

  // 異数性: ダミーの「倍数性」と「倍数化」が実質同義で冗長
  if (q.question === '染色体数が正常の整数倍以外になる異常を何というか') {
    q.dummyPool = [
      '倍数性', '構造異常', '点突然変異', 'モザイク',
      '不分離', '染色体転座', 'ダイソミー'
    ];
    console.log('修正: 異数性のダミー（倍数性/倍数化の重複を解消）');
    fixCount++;
  }

  return q;
});

// ============ 3. 保存 ============
data.exportVersion = (data.exportVersion || 0) + 1;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✔ 削除: ${delCount}問`);
console.log(`✔ 修正: ${fixCount}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
