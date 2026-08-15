// patch-tumor-fix.cjs
// 腫瘍カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 既存問題の修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {
  if (q.category !== '腫瘍') return q;

  // 【致命的】ダミーの乳がん・腎がん・前立腺がんはいずれも骨転移を来しやすい＝正解
  if (q.question === '骨への転移を起こしやすいのはどこの癌か') {
    q.answerPool = ['肺癌', '乳癌', '腎癌', '前立腺癌', '多発性骨髄腫'];
    q.dummyPool = [
      '胃がん', '大腸がん', '膵がん', '食道がん',
      '子宮頸がん', '卵巣がん', '悪性中皮腫'
    ];
    console.log('修正【重要】: 骨転移の問題（乳癌・腎癌・前立腺癌を正解に移動）');
    fixCount++;
  }

  return q;
});

// ============ 2. 問題の追加 ============
const newQuestions = [
  // --- 腫瘍の定義 ---
  {
    type: 'term',
    question: '「細胞の自律的不可逆的過剰増殖」を呈する病態を何というか',
    answerPool: ['腫瘍'],
    dummyPool: ['過形成', '化生', '異形成', '肥大', '再生', '肉芽組織', '炎症']
  },
  {
    type: 'binary',
    question: '組織修復に伴う細胞増殖は生理的制御を受けるか、受けないか',
    answerPool: ['受ける'],
    dummyPool: ['受けない']
  },
  {
    type: 'binary',
    question: '腫瘍の細胞増殖は可逆的か、不可逆的か',
    answerPool: ['不可逆的'],
    dummyPool: ['可逆的']
  },
  {
    type: 'term',
    question: '腫瘍は何によって分類されるか',
    answerPool: ['どの臓器のどのような組織の細胞から発生したか'],
    dummyPool: [
      '腫瘍の大きさ', '発見された年齢', '症状の重さ', '治療への反応性',
      '転移の有無のみ', '腫瘍マーカーの種類', '発生した部位の深さ'
    ]
  },
  {
    type: 'term',
    question: '生体に及ぼす影響が軽度にとどまる腫瘍を何というか',
    answerPool: ['良性腫瘍'],
    dummyPool: ['悪性腫瘍', '境界悪性腫瘍', '前癌病変', '異形成', '過形成', '肉腫', '癌腫']
  },
  {
    type: 'term',
    question: '生体に及ぼす影響が重篤になりえる腫瘍を何というか',
    answerPool: ['悪性腫瘍'],
    dummyPool: ['良性腫瘍', '境界悪性腫瘍', '前癌病変', '異形成', '過形成', '肉芽腫', '過誤腫']
  },

  // --- 異型・分化度 ---
  {
    type: 'term',
    question: '正常の細胞・組織から形態学的に逸脱している様を何というか',
    answerPool: ['異型'],
    dummyPool: ['分化度', '悪性度', '浸潤', '転移', '過形成', '化生', '変性']
  },
  {
    type: 'term',
    question: '正常細胞・組織からの逸脱の指標として設けられているものは何か',
    answerPool: ['分化度', 'Grade'],
    dummyPool: ['進行度', 'Stage', 'N/C比', '腫瘍マーカー値', '核分裂像数', '腫瘍径', '転移個数']
  },
  {
    type: 'binary',
    question: 'Gradeが上がると分化度は高くなるか、低くなるか',
    answerPool: ['低くなる'],
    dummyPool: ['高くなる']
  },
  {
    type: 'binary',
    question: 'Gradeが上がると異型は強くなるか、弱くなるか',
    answerPool: ['強くなる'],
    dummyPool: ['弱くなる']
  },
  {
    type: 'binary',
    question: 'Gradeが上がると悪性度は高くなるか、低くなるか',
    answerPool: ['高くなる'],
    dummyPool: ['低くなる']
  },
  {
    type: 'binary',
    question: 'Gradeが上がると予後は良くなるか、悪くなるか',
    answerPool: ['悪くなる'],
    dummyPool: ['良くなる']
  },
  {
    type: 'term',
    question: '悪性度が増すにつれて、細胞異型とともに増していくもう一つの異型は何か',
    answerPool: ['構造異型'],
    dummyPool: ['核異型', '細胞質異型', '間質異型', '分化度', '浸潤度', '転移能', 'N/C比']
  },
  {
    type: 'binary',
    question: '腫瘍の悪性度は形態観察から判定することが可能か、不可能か',
    answerPool: ['可能'],
    dummyPool: ['不可能']
  },

  // --- 浸潤・転移 ---
  {
    type: 'term',
    question: '悪性腫瘍が致死的となるのは、何によって多臓器の機能不全を起こすためか',
    answerPool: ['浸潤・転移'],
    dummyPool: ['炎症・発熱', '出血・貧血', '感染・敗血症', '疼痛・栄養障害', '免疫低下', '血栓形成', '代謝異常']
  },

  // --- がん診断 ---
  {
    type: 'term',
    question: 'がん細胞またはがんに反応した非がん細胞により産生され、血液や尿から検出されるタンパク質・ペプチド・糖鎖の総称を何というか',
    answerPool: ['腫瘍マーカー'],
    dummyPool: ['サイトカイン', '成長因子', '自己抗体', '炎症マーカー', '凝固マーカー', 'アディポサイトカイン', 'ホルモン']
  },
  {
    type: 'term',
    question: 'がんの早期発見に用いられる検査を1つ挙げよ',
    answerPool: ['画像検査', '血液検査'],
    dummyPool: ['細胞診', '病理組織検査', '遺伝子検査', '生検', '免疫染色', '培養検査', '髄液検査']
  },
  {
    type: 'term',
    question: 'がんの確定診断に用いられる検査を1つ挙げよ',
    answerPool: ['細胞診', '病理組織検査', '遺伝子検査'],
    dummyPool: ['CT', 'MRI', 'X線', '腫瘍マーカー', '超音波検査', 'PET検査', '血算']
  },
  {
    type: 'term',
    question: 'がんの早期発見に用いられる画像検査を1つ挙げよ',
    answerPool: ['CT', 'MRI', 'X線'],
    dummyPool: ['細胞診', '病理組織検査', '遺伝子検査', '生検', '免疫染色', '骨髄穿刺', '内視鏡下生検']
  },

  // --- がん遺伝子・癌抑制遺伝子 ---
  {
    type: 'term',
    question: '神経芽腫で異常を認めるがん遺伝子は何か',
    answerPool: ['MYCN'],
    dummyPool: ['EGFR', 'RAS', 'ERBB2', 'BCR-ABL融合遺伝子', 'ALK融合遺伝子', 'TP53', 'p16']
  },
  {
    type: 'term',
    question: '肺がん・悪性リンパ腫で異常を認めるがん遺伝子は何か',
    answerPool: ['ALK融合遺伝子'],
    dummyPool: ['EGFR', 'RAS', 'ERBB2', 'BCR-ABL融合遺伝子', 'MYCN', 'TP53', 'p16']
  },
  {
    type: 'term',
    question: '膵がん・食道がん・悪性黒色腫で異常を認める癌抑制遺伝子は何か',
    answerPool: ['p16', 'INK4A'],
    dummyPool: ['TP53', 'RB1', 'APC', 'PTEN', 'BRCA1/2', 'VHL', 'WT1']
  },
  {
    type: 'term',
    question: 'TP53の異常はがん全体のどれくらいで認められるか',
    answerPool: ['半数程度'],
    dummyPool: ['1割程度', '2割程度', '3割程度', '7割程度', '9割程度', 'ほぼ全て', '稀']
  },
  {
    type: 'binary',
    question: 'EGFRはがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['がん遺伝子'],
    dummyPool: ['癌抑制遺伝子']
  },
  {
    type: 'binary',
    question: 'RB1はがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['癌抑制遺伝子'],
    dummyPool: ['がん遺伝子']
  },
  {
    type: 'binary',
    question: 'BCR-ABL融合遺伝子はがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['がん遺伝子'],
    dummyPool: ['癌抑制遺伝子']
  },
  {
    type: 'binary',
    question: 'APCはがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['癌抑制遺伝子'],
    dummyPool: ['がん遺伝子']
  },
  {
    type: 'binary',
    question: 'MYCNはがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['がん遺伝子'],
    dummyPool: ['癌抑制遺伝子']
  },
  {
    type: 'binary',
    question: 'VHLはがん遺伝子か、癌抑制遺伝子か',
    answerPool: ['癌抑制遺伝子'],
    dummyPool: ['がん遺伝子']
  },

  // --- 分子標的治療 ---
  {
    type: 'term',
    question: 'がん細胞に特異的な細胞特性を規定する分子を標的とし、がん細胞を選択的に攻撃する薬剤による治療を何というか',
    answerPool: ['分子標的治療'],
    dummyPool: ['化学療法', 'ホルモン療法', '免疫療法', '放射線療法', '外科的治療', '緩和ケア', '支持療法']
  },
  {
    type: 'term',
    question: '分子標的薬が標的とするがん細胞の特性を1つ挙げよ',
    answerPool: ['増殖', '浸潤', '転移'],
    dummyPool: ['炎症', '壊死', '線維化', '石灰化', '萎縮', '化生', '変性']
  },
  {
    type: 'term',
    question: '1997年に初めて承認された抗体医薬品は何か',
    answerPool: ['リツキシマブ'],
    dummyPool: ['イマチニブ', 'トラスツズマブ', 'ゲフィチニブ', 'タモキシフェン', 'ベバシズマブ', 'セツキシマブ', 'ペルツズマブ']
  },
  {
    type: 'term',
    question: '2001年に承認され、慢性骨髄性白血病に対して大きな効果を発揮した分子標的薬は何か',
    answerPool: ['イマチニブ'],
    dummyPool: ['リツキシマブ', 'トラスツズマブ', 'ゲフィチニブ', 'タモキシフェン', 'ベバシズマブ', 'セツキシマブ', 'ダサチニブ']
  },

  // --- 乳癌（57.pdf） ---
  {
    type: 'term',
    question: '乳癌でのp53変異はどのような症例にみられることが多いか',
    answerPool: ['エストロゲン受容体陰性の高悪性例'],
    dummyPool: [
      'エストロゲン受容体陽性の低悪性例',
      'HER2陽性例',
      'triple negative以外の症例',
      '早期発見された症例',
      '高齢者の症例',
      '遺伝性乳癌の症例',
      'リンパ節転移陰性例'
    ]
  },
  {
    type: 'term',
    question: '乳癌でエストロゲン受容体陽性例に有効な治療は何か',
    answerPool: ['ホルモン療法'],
    dummyPool: ['分子標的治療', '化学療法', '放射線療法', '免疫療法', '外科的治療のみ', '緩和ケア', '経過観察']
  },
  {
    type: 'term',
    question: 'タモキシフェン治療中に必須となるフォローアップ検査は何か',
    answerPool: ['子宮内膜細胞診'],
    dummyPool: ['乳房超音波検査', '骨密度測定', '肝機能検査', '腎機能検査', '眼底検査', '心電図', '骨シンチグラフィ']
  },
  {
    type: 'term',
    question: '近年増加傾向にあり、有効な治療法がないことから問題となっている乳癌の型を何というか',
    answerPool: ['triple negative', 'ER・PgR・HER2陰性'],
    dummyPool: ['ER陽性型', 'HER2陽性型', 'luminal A型', 'luminal B型', 'PgR陽性型', '遺伝性乳癌', '炎症性乳癌']
  },
  {
    type: 'term',
    question: '遺伝性乳癌は全乳癌のどれくらいと推測されているか',
    answerPool: ['5％未満'],
    dummyPool: ['10％程度', '20％程度', '30％程度', '半数程度', '1％未満', '15％程度', '25％程度']
  },
  {
    type: 'term',
    question: '乳癌卵巣癌症候群(HBOC)はどのような遺伝形式をとるか',
    answerPool: ['常染色体顕性遺伝', '常染色体優性遺伝'],
    dummyPool: ['常染色体潜性遺伝', '伴性潜性遺伝', '伴性顕性遺伝', 'ミトコンドリア遺伝', '多因子遺伝', 'ゲノム刷り込み', '三塩基繰り返し遺伝']
  },
  {
    type: 'term',
    question: 'BRCA2の生涯発生リスクはどれくらいか',
    answerPool: ['20〜85%'],
    dummyPool: ['40〜80%', '56〜90%', '25〜50%', '32〜54%', '60%', '5%未満', '10〜20%']
  },
  {
    type: 'term',
    question: 'TP53の高度易罹患性遺伝子としての生涯発生リスクはどれくらいか',
    answerPool: ['56〜90%'],
    dummyPool: ['40〜80%', '20〜85%', '25〜50%', '32〜54%', '60%', '5%未満', '10〜20%']
  },
  {
    type: 'term',
    question: 'CDH1の生涯発生リスクはどれくらいか',
    answerPool: ['60%'],
    dummyPool: ['40〜80%', '20〜85%', '56〜90%', '25〜50%', '32〜54%', '5%未満', '10〜20%']
  },
  {
    type: 'term',
    question: 'HER2遺伝子増幅群の予後は非増幅群と比べてどうか',
    answerPool: ['悪い'],
    dummyPool: ['良い', '変わらない', 'やや良い', '判定できない', '症例による', '年齢による', '病期による']
  },
  {
    type: 'term',
    question: 'HER2はどのようなリスク因子となるか',
    answerPool: ['リンパ節転移や再発'],
    dummyPool: ['骨転移のみ', '脳転移のみ', '肝転移のみ', '術後感染', '化学療法の副作用', '放射線障害', '静脈血栓症']
  },
  {
    type: 'term',
    question: '過剰なエストロゲン刺激は乳癌のほか、どのがんの高危険率要因となるか',
    answerPool: ['子宮体癌'],
    dummyPool: ['子宮頸癌', '卵巣癌', '大腸癌', '胃癌', '肺癌', '甲状腺癌', '膀胱癌']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '腫瘍',
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

const cnt = data.questions.filter(q => q.category === '腫瘍').length;
console.log(`\n✔ 修正: ${fixCount}問`);
console.log(`✔ 腫瘍カテゴリ: ${cnt}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
