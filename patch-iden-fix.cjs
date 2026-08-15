// patch-iden-fix.cjs
// 遺伝子・染色体異常カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 既存問題の修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {
  if (q.category === '遺伝子・染色体異常' &&
      q.question === '正常な遺伝子の塩基配列が変化することを何というか') {
    // ダミーから無関係な「クローン病」を除去し、適切な用語に差し替え
    q.dummyPool = [
      '多型', '転座', '不分離', '倍数性',
      '異数性', 'エピジェネティック変化', '遺伝子増幅'
    ];
    console.log('修正: ' + q.question);
    fixCount++;
  }
  return q;
});

// ============ 2. 問題の追加 ============
const newQuestions = [
  // --- 先天異常の分類 ---
  {
    type: 'term',
    question: '出生までのいずれかの時期に原因があり、大多数の個体と著しく異なった形態や機能を示す疾患の総称を何というか',
    answerPool: ['先天異常'],
    dummyPool: ['後天異常', '単一遺伝子病', '染色体異常', '奇形', '胎児病', '遺伝性疾患', '代謝異常症']
  },
  {
    type: 'term',
    question: '先天異常は原因の存在する時期により4つに分類されるが、その分類をすべて挙げよ',
    answerPool: ['単一遺伝子病・染色体異常・奇形(胎芽病)・胎児病'],
    dummyPool: [
      '単一遺伝子病・染色体異常・多因子遺伝病・後天性疾患',
      '遺伝子病・代謝異常症・奇形・感染症',
      '数的異常・構造異常・点突然変異・フレームシフト',
      '染色体異常・奇形・胎児病・環境因子病',
      '単一遺伝子病・多因子遺伝病・奇形・胎児病',
      '遺伝因子病・環境因子病・代謝異常症・免疫異常症',
      '先天性代謝異常症・染色体異常・奇形・腫瘍'
    ]
  },
  {
    type: 'term',
    question: 'DNAの塩基配列の突然変異によるタンパク質の機能不全が原因となる疾患を何というか',
    answerPool: ['単一遺伝子病'],
    dummyPool: ['染色体異常', '奇形', '胎児病', '多因子遺伝病', '代謝異常症', 'エピジェネティック疾患', '後天性遺伝子疾患']
  },
  {
    type: 'term',
    question: '先天異常のうち、何らかの影響による器官形成不全が胎芽期に生じるものを何というか',
    answerPool: ['奇形', '胎芽病'],
    dummyPool: ['胎児病', '単一遺伝子病', '染色体異常', '多因子遺伝病', '代謝異常症', '周産期障害', '新生児疾患']
  },
  {
    type: 'binary',
    question: '単一遺伝子病の主な原因は遺伝因子か、環境因子か',
    answerPool: ['遺伝因子'],
    dummyPool: ['環境因子']
  },
  {
    type: 'binary',
    question: '奇形(胎芽病)の主な原因は遺伝因子か、環境因子か',
    answerPool: ['環境因子'],
    dummyPool: ['遺伝因子']
  },
  {
    type: 'binary',
    question: '染色体異常の主な原因は遺伝因子か、環境因子か',
    answerPool: ['遺伝因子'],
    dummyPool: ['環境因子']
  },

  // --- 染色体構造異常・略語 ---
  {
    type: 'term',
    question: '染色体の一部が別の位置に入り込む構造異常を何というか(ins)。',
    answerPool: ['挿入'],
    dummyPool: ['欠失', '重複', '逆位', '相互転座', 'ロバートソン転座', 'モノソミー', 'トリソミー']
  },
  {
    type: 'term',
    question: '染色体の動原体を表す略語は何か',
    answerPool: ['cen'],
    dummyPool: ['del', 'dup', 'ins', 'inv', 't', 'p', 'q']
  },
  {
    type: 'term',
    question: '染色体の短腕を表す略語は何か',
    answerPool: ['p'],
    dummyPool: ['q', 'cen', 'del', 'dup', 'ins', 'inv', 't']
  },
  {
    type: 'term',
    question: '染色体の長腕を表す略語は何か',
    answerPool: ['q'],
    dummyPool: ['p', 'cen', 'del', 'dup', 'ins', 'inv', 't']
  },

  // --- 部分欠失症候群 ---
  {
    type: 'term',
    question: '5番染色体短腕部分欠失によって生じる染色体異常症を何というか',
    answerPool: ['ネコ鳴き症候群'],
    dummyPool: ['骨髄異形成症候群', 'ダウン症候群', 'エドワーズ症候群', 'パトー症候群', 'ターナー症候群', 'クラインフェルター症候群', 'プラダー・ウィリ症候群']
  },
  {
    type: 'term',
    question: '5番染色体長腕部分欠失によって生じる疾患を何というか',
    answerPool: ['骨髄異形成症候群'],
    dummyPool: ['ネコ鳴き症候群', 'ダウン症候群', 'エドワーズ症候群', 'パトー症候群', 'ターナー症候群', 'クラインフェルター症候群', '慢性骨髄性白血病']
  },

  // --- 数的異常 ---
  {
    type: 'term',
    question: '異数性の危険因子として重要なものは何か',
    answerPool: ['母体の高齢'],
    dummyPool: ['父体の高齢', '母体の喫煙', '母体の飲酒', '放射線被曝', '妊娠中の感染', '栄養障害', '薬剤曝露']
  },
  {
    type: 'term',
    question: '本来2本が対となって存在している正常な染色体の状態を何というか',
    answerPool: ['ダイソミー'],
    dummyPool: ['トリソミー', 'モノソミー', '異数性', '倍数性', 'モザイク', 'ヘミ接合', '半数体']
  },
  {
    type: 'term',
    question: 'ダウン症候群の核型はどのように表記されるか',
    answerPool: ['47, +21'],
    dummyPool: ['47, +18', '47, +13', '47, XXY', '45, X', '46, XY', '46, XX', '47, XYY']
  },
  {
    type: 'term',
    question: 'ターナー症候群の核型はどのように表記されるか',
    answerPool: ['45, X'],
    dummyPool: ['47, XXY', '47, +21', '47, +18', '47, +13', '46, XX', '47, XYY', '46, XY']
  },
  {
    type: 'term',
    question: 'クラインフェルター症候群の核型はどのように表記されるか',
    answerPool: ['47, XXY'],
    dummyPool: ['45, X', '47, +21', '47, +18', '47, +13', '46, XY', '47, XYY', '46, XX']
  },
  {
    type: 'binary',
    question: 'ターナー症候群は常染色体異常か、性染色体異常か',
    answerPool: ['性染色体異常'],
    dummyPool: ['常染色体異常']
  },
  {
    type: 'binary',
    question: 'ダウン症候群は常染色体異常か、性染色体異常か',
    answerPool: ['常染色体異常'],
    dummyPool: ['性染色体異常']
  },
  {
    type: 'binary',
    question: 'ネコ鳴き症候群は染色体の数的異常か、構造異常か',
    answerPool: ['構造異常'],
    dummyPool: ['数的異常']
  },
  {
    type: 'binary',
    question: 'エドワーズ症候群は染色体の数的異常か、構造異常か',
    answerPool: ['数的異常'],
    dummyPool: ['構造異常']
  },

  // --- 遺伝形式 ---
  {
    type: 'term',
    question: '先天性代謝異常症の大半がとる遺伝様式は何か',
    answerPool: ['常染色体潜性遺伝'],
    dummyPool: ['常染色体顕性遺伝', '伴性潜性遺伝', '伴性顕性遺伝', 'ミトコンドリア遺伝', '多因子遺伝', 'ゲノム刷り込み', '三塩基繰り返し遺伝']
  },
  {
    type: 'term',
    question: '男性に多く発症する、X染色体上に遺伝子座をもつ遺伝様式を何というか',
    answerPool: ['伴性潜性遺伝'],
    dummyPool: ['常染色体顕性遺伝', '常染色体潜性遺伝', '伴性顕性遺伝', 'ミトコンドリア遺伝', '多因子遺伝', 'ゲノム刷り込み', '半数体遺伝']
  },
  {
    type: 'term',
    question: '常染色体潜性遺伝において、両親がともに保因者の場合の発症確率はいくらか',
    answerPool: ['25%'],
    dummyPool: ['0%', '12.5%', '50%', '75%', '100%', '33%', '66%']
  },
  {
    type: 'term',
    question: '常染色体顕性遺伝において、片親がヘテロの罹患者である場合の発症確率はいくらか',
    answerPool: ['50%'],
    dummyPool: ['0%', '25%', '75%', '100%', '12.5%', '33%', '66%']
  },
  {
    type: 'binary',
    question: '常染色体潜性遺伝に性差はあるか、ないか',
    answerPool: ['ない'],
    dummyPool: ['ある']
  },
  {
    type: 'binary',
    question: '常染色体顕性遺伝に性差はあるか、ないか',
    answerPool: ['ない'],
    dummyPool: ['ある']
  },

  // --- ハンチントン病 ---
  {
    type: 'term',
    question: 'ハンチントン病の好発年齢はどれくらいか',
    answerPool: ['30〜50歳'],
    dummyPool: ['0〜10歳', '10〜20歳', '20〜30歳', '50〜60歳', '60〜70歳', '70歳以上', '新生児期']
  },
  {
    type: 'term',
    question: 'ハンチントン病でみられる特徴的な不随意運動を何というか',
    answerPool: ['舞踏運動'],
    dummyPool: ['振戦', 'ミオクローヌス', 'ジストニア', 'アテトーゼ', 'バリズム', '固縮', '痙攣']
  },

  // --- 血友病 ---
  {
    type: 'term',
    question: '血友病AとBの頻度の比はおよそいくらか',
    answerPool: ['A：B＝5：1'],
    dummyPool: ['A：B＝1：1', 'A：B＝1：5', 'A：B＝2：1', 'A：B＝10：1', 'A：B＝1：2', 'A：B＝3：1', 'A：B＝1：10']
  },
  {
    type: 'term',
    question: '血友病で特徴的にみられる出血の部位はどこか',
    answerPool: ['関節や筋肉内などの深部'],
    dummyPool: ['皮膚や粘膜などの表層', '消化管粘膜', '鼻粘膜', '歯肉', '頭蓋内のみ', '皮下組織のみ', '眼底']
  },
  {
    type: 'term',
    question: '血友病の血液検査でみられる特徴的な所見は何か',
    answerPool: ['APTT延長、PT正常'],
    dummyPool: ['APTT正常、PT延長', 'APTT延長、PT延長', 'APTT正常、PT正常', '血小板減少', 'フィブリノゲン低下', 'D-ダイマー上昇', '出血時間延長']
  },
  {
    type: 'term',
    question: '血友病の治療として実施されるものは何か',
    answerPool: ['凝固因子の補充療法'],
    dummyPool: ['血小板輸血', '抗凝固療法', '線溶療法', 'ビタミンK投与', 'ステロイド療法', '免疫抑制療法', '骨髄移植']
  },
  {
    type: 'binary',
    question: '血友病では血小板数は正常か、減少するか',
    answerPool: ['正常'],
    dummyPool: ['減少する']
  },
  {
    type: 'binary',
    question: '血友病ではvWFは正常か、低下するか',
    answerPool: ['正常'],
    dummyPool: ['低下する']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '遺伝子・染色体異常',
    type: q.type,
    question: q.question,
    answerPool: q.answerPool,
    dummyPool: q.dummyPool
  });
});
console.log(`追加: ${newQuestions.length}問`);

// ============ 3. 保存 ============
data.exportVersion = (data.exportVersion || 0) + 1;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

const cnt = data.questions.filter(q => q.category === '遺伝子・染色体異常').length;
console.log(`\n✔ 修正: ${fixCount}問`);
console.log(`✔ 遺伝子・染色体異常カテゴリ: ${cnt}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
