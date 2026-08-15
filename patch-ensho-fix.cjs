// patch-ensho-fix.cjs
// 炎症カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 重複問題の削除 ============
const deleteUids = [
  'hnr63bski1za', // 「炎症時に血管透過性は亢進するか、否か」→ 4ebt6i8j00e9 と重複
  '2zl31zpvymzq', // 「獲得免疫が関与するのは〜」→ rpy9dt9rxl1n と重複
];

const before = data.questions.length;
data.questions = data.questions.filter(q => !deleteUids.includes(q.uid));
console.log(`削除: ${before - data.questions.length}問（重複）`);

// ============ 2. 既存問題の修正 ============
const fixes = {
  // 肉芽腫: 講義では「類上皮細胞および多核巨細胞」。リンパ球は明記なし
  'myjoke6lgrom': {
    question: '肉芽腫の主な構成細胞を2つ挙げよ',
    answerPool: ['類上皮細胞・多核巨細胞'],
    dummyPool: [
      '好中球・好酸球', '線維芽細胞・血管内皮細胞', '形質細胞・肥満細胞',
      '好中球・線維芽細胞', 'リンパ球・形質細胞', '樹状細胞・NK細胞', '好塩基球・単球'
    ]
  },
  // カタル性炎は漿液性炎の一種。講義の記述に合わせる
  'dnmqj2nnijq2': {
    question: '漿液性炎のうち、粘膜の表面から多量の漿液が滲出するものを何というか',
    answerPool: ['カタル性炎'],
    dummyPool: [
      '化膿性炎', '線維素性炎', '出血性炎', '偽膜性炎',
      '壊死性炎', '増殖性炎', '肉芽腫性炎'
    ]
  },
  // カタル性炎を除外（漿液性炎の一種のため）+ 出血性炎の重複を解消
  'fso964yi1utw': {
    dummyPool: [
      '化膿性炎', '線維素性炎', '出血性炎', '偽膜性炎',
      '壊死性炎', '増殖性炎', '肉芽腫性炎'
    ]
  },
  // 特異性炎: 講義にCrohn病・深在性真菌症も記載
  '3xgqj7cw3o6g': {
    answerPool: ['結核', 'サルコイドーシス', '梅毒', 'ハンセン病', 'Crohn病', '深在性真菌症'],
    dummyPool: [
      '蜂窩織炎', 'カタル性炎', '化膿性炎', '漿液性炎',
      '大葉性肺炎', 'アレルギー性鼻炎', '偽膜性炎'
    ]
  },
};

let fixCount = 0;
data.questions = data.questions.map(q => {
  if (fixes[q.uid]) {
    Object.assign(q, fixes[q.uid]);
    console.log(`修正: ${q.question.slice(0, 32)}`);
    fixCount++;
  }
  return q;
});

// ============ 3. 問題の追加 ============
const newQuestions = [
  {
    type: 'term',
    question: '線維芽細胞・内皮細胞の増殖と膠原線維の増生を特徴とする慢性炎症を何というか',
    answerPool: ['増殖性炎'],
    dummyPool: ['特異性炎', '化膿性炎', '漿液性炎', '線維素性炎', '出血性炎', '壊死性炎', 'カタル性炎']
  },
  {
    type: 'term',
    question: '増殖性炎がみられる疾患を1つ挙げよ',
    answerPool: ['肝硬変', '肺線維症'],
    dummyPool: ['大葉性肺炎', 'アレルギー性鼻炎', 'ジフテリア', '赤痢', '蜂窩織炎', '帯状疱疹', 'ペスト']
  },
  {
    type: 'term',
    question: '滲出したフィブリンが壊死とともに膜状に析出・沈着した炎症を何というか',
    answerPool: ['偽膜性炎'],
    dummyPool: ['化膿性炎', '漿液性炎', 'カタル性炎', '出血性炎', '壊死性炎', '増殖性炎', '肉芽腫性炎']
  },
  {
    type: 'term',
    question: '偽膜性炎がみられる疾患を1つ挙げよ',
    answerPool: ['ジフテリア', '赤痢'],
    dummyPool: ['大葉性肺炎', 'アレルギー性鼻炎', '肝硬変', '肺線維症', '蜂窩織炎', '帯状疱疹', 'ペスト']
  },
  {
    type: 'term',
    question: '出血により滲出液や組織全体が血性を帯びる炎症を何というか',
    answerPool: ['出血性炎'],
    dummyPool: ['化膿性炎', '漿液性炎', 'カタル性炎', '線維素性炎', '壊死性炎', '増殖性炎', '偽膜性炎']
  },
  {
    type: 'term',
    question: '出血性炎がみられる疾患を1つ挙げよ',
    answerPool: ['インフルエンザ肺炎', 'ペスト菌感染'],
    dummyPool: ['大葉性肺炎', 'アレルギー性鼻炎', 'ジフテリア', '赤痢', '肝硬変', '肺線維症', '帯状疱疹']
  },
  {
    type: 'term',
    question: '血液循環不全や腐敗菌感染などにより組織の壊死が著しい炎症を何というか',
    answerPool: ['壊死性炎'],
    dummyPool: ['化膿性炎', '漿液性炎', 'カタル性炎', '線維素性炎', '出血性炎', '増殖性炎', '偽膜性炎']
  },
  {
    type: 'term',
    question: '化膿性炎で組織が融解し、中に膿が貯留したものを何というか',
    answerPool: ['膿瘍'],
    dummyPool: ['蜂窩織炎', '肉芽腫', '肉芽組織', '瘢痕組織', '浮腫', '偽膜', '滲出液']
  },
  {
    type: 'term',
    question: '漿液性炎がみられる疾患を1つ挙げよ',
    answerPool: ['アレルギー性鼻炎', '単純ヘルペス感染', '帯状疱疹'],
    dummyPool: ['大葉性肺炎', 'ジフテリア', '赤痢', '肝硬変', '肺線維症', 'ペスト菌感染', '結核']
  },
  {
    type: 'term',
    question: '線維素性炎がみられる疾患を1つ挙げよ',
    answerPool: ['大葉性肺炎', '線維素性胸膜炎'],
    dummyPool: ['アレルギー性鼻炎', 'ジフテリア', '赤痢', '肝硬変', '肺線維症', 'ペスト菌感染', '帯状疱疹']
  },
  {
    type: 'term',
    question: '化膿性炎を引き起こす代表的な化膿菌を1つ挙げよ',
    answerPool: ['ブドウ球菌', '連鎖球菌'],
    dummyPool: ['結核菌', '梅毒トレポネーマ', 'らい菌', 'インフルエンザ菌', 'ペスト菌', '大腸菌', '緑膿菌']
  },
  {
    type: 'term',
    question: '間質に滲出液が貯留した状態を何というか',
    answerPool: ['浮腫'],
    dummyPool: ['膿瘍', '肉芽腫', '瘢痕', '充血', 'うっ血', '線維化', '肉芽組織']
  },
  {
    type: 'term',
    question: '肉芽腫が形成される目的は何か',
    answerPool: ['排除できない異物を組織内で隔離するため'],
    dummyPool: [
      '損傷組織を速やかに再生させるため',
      '血流を増加させ栄養を供給するため',
      '好中球を集積させ膿を形成するため',
      '血管透過性を亢進させ滲出液を産生するため',
      '線維芽細胞を増殖させ瘢痕を形成するため',
      '抗体産生を促進するため',
      '血管新生を促進するため'
    ]
  },
  {
    type: 'term',
    question: '肉芽腫において、集簇したマクロファージが上皮細胞様の形態を呈したものを何というか',
    answerPool: ['類上皮細胞'],
    dummyPool: ['多核巨細胞', '形質細胞', '線維芽細胞', '樹状細胞', '肥満細胞', '単球', '好中球']
  },
  {
    type: 'term',
    question: '肉芽腫において、多数のマクロファージが融合して形成される細胞を何というか',
    answerPool: ['多核巨細胞'],
    dummyPool: ['類上皮細胞', '形質細胞', '線維芽細胞', '樹状細胞', '肥満細胞', '単球', '好中球']
  },
  {
    type: 'term',
    question: '炎症の結末として起こり得るものを1つ挙げよ',
    answerPool: ['完全治癒', '瘢痕治癒', '膿瘍形成', '肉芽組織形成', '慢性炎症化'],
    dummyPool: ['腫瘍化', '化生', '異形成', '過形成', '萎縮', 'アポトーシス', '石灰化']
  },
  {
    type: 'term',
    question: '結核でみられる特徴的な肉芽腫中心部の壊死を何というか',
    answerPool: ['乾酪壊死'],
    dummyPool: ['融解壊死', '脂肪壊死', '線維素様壊死', '凝固壊死', '出血性壊死', '壊疽性壊死', '虚血性壊死']
  },
  {
    type: 'binary',
    question: '増殖性炎は急性炎症か、慢性炎症か',
    answerPool: ['慢性炎症'],
    dummyPool: ['急性炎症']
  },
  {
    type: 'binary',
    question: '漿液性炎は急性炎症か、慢性炎症か',
    answerPool: ['急性炎症'],
    dummyPool: ['慢性炎症']
  },
  {
    type: 'binary',
    question: '線維素性炎は急性炎症か、慢性炎症か',
    answerPool: ['急性炎症'],
    dummyPool: ['慢性炎症']
  },
  {
    type: 'binary',
    question: 'サルコイドーシスが分類されるのは急性炎症か、慢性炎症か',
    answerPool: ['慢性炎症'],
    dummyPool: ['急性炎症']
  },
  {
    type: 'binary',
    question: '主に自然免疫が関与するのは急性炎症か、慢性炎症か',
    answerPool: ['急性炎症'],
    dummyPool: ['慢性炎症']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '炎症',
    type: q.type,
    question: q.question,
    answerPool: q.answerPool,
    dummyPool: q.dummyPool
  });
});
console.log(`追加: ${newQuestions.length}問`);

// ============ 4. 保存 ============
data.exportVersion = (data.exportVersion || 0) + 1;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

const ensho = data.questions.filter(q => q.category === '炎症').length;
console.log(`\n✔ 修正: ${fixCount}問`);
console.log(`✔ 炎症カテゴリ: ${ensho}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
