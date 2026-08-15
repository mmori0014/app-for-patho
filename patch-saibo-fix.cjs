// patch-saibo-fix.cjs
// 細胞・組織傷害カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 重複削除 ============
let delCount = 0;
data.questions = data.questions.filter(q => {
  if (q.category === '細胞・組織傷害' &&
      q.question === 'アポトーシスではDNAにどのような変化がみられるか') {
    console.log('削除（重複）: ' + q.question);
    delCount++;
    return false;
  }
  return true;
});

// ============ 2. 既存問題の修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {
  if (q.category !== '細胞・組織傷害') return q;

  // 核濃縮もアポトーシスの所見 → ダミーとして不成立
  if (q.question === 'アポトーシスでは核およびDNAにどのような変化がみられるか') {
    q.question = 'アポトーシスでみられるDNAの変化は何か';
    q.answerPool = ['断片化'];
    q.dummyPool = [
      '膨化', '融解', '石灰化', '変化なし',
      '架橋形成', '脱メチル化', '増幅'
    ];
    console.log('修正: アポトーシスのDNA変化（ダミーから核濃縮を除去）');
    fixCount++;
  }

  // 進行性病変は 再生・化生・創傷治癒・過形成・肥大 の5つ
  if (q.question === '進行性病変の例を1つ挙げよ') {
    q.answerPool = ['再生', '化生', '創傷治癒', '過形成', '肥大'];
    q.dummyPool = [
      '萎縮', '変性', '壊死', 'アポトーシス',
      '梗塞', '線維化', '石灰化'
    ];
    console.log('修正: 進行性病変（化生・創傷治癒を追加）');
    fixCount++;
  }

  // 細胞変性に糖原変性を追加
  if (q.question === '細胞変性の例を1つ挙げよ') {
    q.answerPool = ['空胞変性', '脂肪変性', '粘液変性', '糖原変性'];
    q.dummyPool = [
      '硝子変性', 'アミロイド変性', 'フィブリノイド変性', '線維化',
      '瘢痕化', '石灰化', '骨化'
    ];
    console.log('修正: 細胞変性（糖原変性を追加）');
    fixCount++;
  }

  // 組織変性にフィブリノイド変性を追加
  if (q.question === '組織変性の例を1つ挙げよ') {
    q.answerPool = ['硝子変性', 'アミロイド変性', 'フィブリノイド変性'];
    q.dummyPool = [
      '空胞変性', '脂肪変性', '粘液変性', '糖原変性',
      '線維化', '石灰化', '骨化'
    ];
    console.log('修正: 組織変性（フィブリノイド変性を追加）');
    fixCount++;
  }

  // 変性の定義を講義準拠に
  if (q.question === '「変性」とは何か') {
    q.answerPool = ['可逆的な非致死性の細胞・組織の構造および代謝障害で、細胞・組織内に異常沈着を認めるもの'];
    console.log('修正: 「変性」の定義を講義準拠に');
    fixCount++;
  }

  return q;
});

// ============ 3. 問題の追加 ============
const newQuestions = [
  // --- 進行性病変・退行性病変 ---
  {
    type: 'term',
    question: '代謝異常を起こした組織で機能低下をきたす際に現れる形態学的変化を総称して何というか',
    answerPool: ['退行性病変'],
    dummyPool: ['進行性病変', '炎症性病変', '腫瘍性病変', '循環障害', '適応反応', '可逆性変化', '修復過程']
  },
  {
    type: 'term',
    question: '組織や臓器の傷害・破壊・部分的欠損に対し、新生組織で補修・代償する際の形態学的変化を総称して何というか',
    answerPool: ['進行性病変'],
    dummyPool: ['退行性病変', '炎症性病変', '腫瘍性病変', '循環障害', '変性', '壊死', '不可逆性変化']
  },
  {
    type: 'term',
    question: '退行性病変に該当するものを1つ挙げよ',
    answerPool: ['萎縮', '変性', '壊死', 'アポトーシス'],
    dummyPool: ['再生', '化生', '創傷治癒', '過形成', '肥大', '血管新生', '肉芽形成']
  },

  // --- 壊死の分類 ---
  {
    type: 'term',
    question: '局所の循環障害によって起こりやすく、組織が硬く・もろく・灰白色を呈する壊死を何というか',
    answerPool: ['凝固壊死'],
    dummyPool: ['融解壊死', '壊疽', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '出血性壊死']
  },
  {
    type: 'term',
    question: '凝固壊死がみられる代表的な病態を1つ挙げよ',
    answerPool: ['心筋梗塞', '腎梗塞'],
    dummyPool: ['脳梗塞', '結核', '急性膵炎', '壊疽性虫垂炎', '肝硬変', '肺線維症', '動脈硬化']
  },
  {
    type: 'term',
    question: '脳などのタンパク成分の少ない組織でみられ、組織が軟化・融解・液化する壊死を何というか',
    answerPool: ['融解壊死'],
    dummyPool: ['凝固壊死', '壊疽', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '出血性壊死']
  },
  {
    type: 'term',
    question: '壊死組織が二次的に腐敗菌や乾燥の影響を受けたものを何というか',
    answerPool: ['壊疽'],
    dummyPool: ['凝固壊死', '融解壊死', '乾酪壊死', '脂肪壊死', 'フィブリノイド壊死', '膿瘍']
  },
  {
    type: 'term',
    question: '乾酪壊死は何が含有される特殊な凝固壊死か',
    answerPool: ['脂質'],
    dummyPool: ['タンパク質', '糖質', 'カルシウム', '鉄', 'アミロイド', 'コラーゲン', 'フィブリン']
  },

  // --- アポトーシス ---
  {
    type: 'term',
    question: '断片化した核を少量の細胞質で取り囲んだ構造を何というか',
    answerPool: ['アポトーシス小体'],
    dummyPool: ['封入体', 'リポフスチン顆粒', 'アミロイド沈着', '空胞', 'ミエリン様小体', '多核巨細胞', '核濃縮体']
  },
  {
    type: 'term',
    question: 'アポトーシスに陥った細胞はどのように処理されるか',
    answerPool: ['周囲の細胞や食細胞に取り込まれる'],
    dummyPool: [
      '細胞内酵素が遊出し周囲に炎症を起こす',
      '線維化して瘢痕となる',
      '石灰化して残存する',
      '融解して液化する',
      '腐敗菌の影響を受ける',
      '肉芽組織に置換される',
      '血流によって除去される'
    ]
  },
  {
    type: 'term',
    question: 'アポトーシスの例を1つ挙げよ',
    answerPool: ['発生過程の水かき', '成人の胸腺', 'Tリンパ球の分化・成熟', '消化管上皮の恒常性'],
    dummyPool: ['心筋梗塞', '脳梗塞', '結核の乾酪壊死', '壊疽', '肝硬変', '動脈硬化', '肺線維症']
  },
  {
    type: 'term',
    question: 'アポトーシスで細胞表面に露出する物質は何か',
    answerPool: ['ホスファチジルセリン', 'PS'],
    dummyPool: ['コレステロール', 'スフィンゴミエリン', 'アミロイド', 'リポフスチン', 'MHC分子', 'フィブリン', 'コラーゲン']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、遺伝子支配を受けるのはどちらか',
    answerPool: ['アポトーシス'],
    dummyPool: ['壊死']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、細胞膜が破壊されるのはどちらか',
    answerPool: ['壊死'],
    dummyPool: ['アポトーシス']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、ATPの減少・消失を伴うのはどちらか',
    answerPool: ['壊死'],
    dummyPool: ['アポトーシス']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、カスパーゼの活性化を伴うのはどちらか',
    answerPool: ['アポトーシス'],
    dummyPool: ['壊死']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、細胞質が膨化するのはどちらか',
    answerPool: ['壊死'],
    dummyPool: ['アポトーシス']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、細胞群単位で同時に発生するのはどちらか',
    answerPool: ['壊死'],
    dummyPool: ['アポトーシス']
  },
  {
    type: 'binary',
    question: '壊死とアポトーシスのうち、ミトコンドリアが膨張するのはどちらか',
    answerPool: ['壊死'],
    dummyPool: ['アポトーシス']
  },
  {
    type: 'binary',
    question: 'アポトーシスの転帰は貪食か、線維化・融解か',
    answerPool: ['貪食'],
    dummyPool: ['線維化・融解']
  },

  // --- 萎縮 ---
  {
    type: 'term',
    question: '加齢や消耗性疾患による萎縮で細胞内に沈着する褐色の物質を何というか',
    answerPool: ['リポフスチン'],
    dummyPool: ['ヘモジデリン', 'メラニン', 'アミロイド', 'ビリルビン', 'カルシウム', '尿酸塩', 'コラーゲン']
  },
  {
    type: 'term',
    question: 'リポフスチンとはどのような物質か',
    answerPool: ['リソソーム酵素によって消化されない脂質酸化物'],
    dummyPool: [
      '鉄を含むヘモグロビン代謝産物',
      'βシート構造を有する異常タンパク質',
      'メラノサイトが産生する色素',
      'ヘム代謝により生じる黄色色素',
      '骨基質に沈着するカルシウム塩',
      'プリン体代謝の最終産物',
      '線維芽細胞が産生する膠原線維'
    ]
  },
  {
    type: 'term',
    question: '萎縮の例を1つ挙げよ',
    answerPool: ['成人以後の胸腺', '閉経後の子宮内膜や卵巣', '認知症における大脳萎縮', '低栄養時の心筋や骨格筋', '長期臥床時の骨格筋'],
    dummyPool: ['アスリートの心筋', '妊娠子宮の平滑筋', '片腎摘出後の対側腎', '子宮内膜増殖症', '過形成性ポリープ', '皮膚のケロイド', '気管支の扁平上皮化生']
  },

  // --- 肥大 ---
  {
    type: 'term',
    question: 'アスリートの心筋や骨格筋にみられる肥大を何というか',
    answerPool: ['作業性肥大'],
    dummyPool: ['内分泌性肥大', '機能性肥大', '代償性肥大', '生理的萎縮', '過形成', '化生', '再生']
  },
  {
    type: 'term',
    question: '妊娠子宮における平滑筋の肥大を何というか',
    answerPool: ['内分泌性肥大'],
    dummyPool: ['作業性肥大', '機能性肥大', '代償性肥大', '生理的萎縮', '過形成', '化生', '再生']
  },
  {
    type: 'term',
    question: '高血圧や心疾患でみられる心筋の肥大を何というか',
    answerPool: ['機能性肥大'],
    dummyPool: ['作業性肥大', '内分泌性肥大', '代償性肥大', '生理的萎縮', '過形成', '化生', '再生']
  },
  {
    type: 'term',
    question: '片腎摘出後に対側腎にみられる肥大を何というか',
    answerPool: ['代償性肥大'],
    dummyPool: ['作業性肥大', '内分泌性肥大', '機能性肥大', '生理的萎縮', '過形成', '化生', '再生']
  },

  // --- 過形成 ---
  {
    type: 'term',
    question: '過形成の例を1つ挙げよ',
    answerPool: ['エストロゲン刺激による乳腺や子宮内膜の成熟', '消化管における過形成性ポリープ', '皮膚のケロイド'],
    dummyPool: ['アスリートの心筋', '妊娠子宮の平滑筋', '片腎摘出後の対側腎', '成人以後の胸腺', '閉経後の卵巣', '気管支の扁平上皮化生', 'バレット食道']
  },

  // --- 再生 ---
  {
    type: 'term',
    question: '欠損した組織が傷害前と同様な組織によって修復されることを何というか',
    answerPool: ['再生'],
    dummyPool: ['化生', '瘢痕治癒', '過形成', '肥大', '創傷治癒', '線維化', '異形成']
  },
  {
    type: 'term',
    question: '再生能力の高い組織の例を1つ挙げよ',
    answerPool: ['結合組織', '神経膠細胞', '末梢神経', '血液', '表皮', '粘膜上皮'],
    dummyPool: ['中枢神経', '水晶体', '心筋', '骨格筋', '汗腺', '腺上皮', '軟骨']
  },
  {
    type: 'term',
    question: '再生能力の低い組織の例を1つ挙げよ',
    answerPool: ['骨格筋', '汗腺などの腺上皮'],
    dummyPool: ['中枢神経', '水晶体', '心筋', '結合組織', '表皮', '粘膜上皮', '血液']
  },
  {
    type: 'binary',
    question: '心筋は再生するか、再生しないか',
    answerPool: ['再生しない'],
    dummyPool: ['再生する']
  },
  {
    type: 'binary',
    question: '末梢神経は再生能力が高いか、再生しないか',
    answerPool: ['再生能力が高い'],
    dummyPool: ['再生しない']
  },

  // --- 化生 ---
  {
    type: 'term',
    question: '子宮頚部の円柱上皮が重層扁平上皮に置換する化生を何というか',
    answerPool: ['扁平上皮化生'],
    dummyPool: ['腸上皮化生', 'バレット食道', '骨化生', '軟骨化生', '異形成', '過形成', '再生']
  },
  {
    type: 'term',
    question: '胃粘膜の上皮が腸上皮に置換する化生を何というか',
    answerPool: ['腸上皮化生'],
    dummyPool: ['扁平上皮化生', 'バレット食道', '骨化生', '軟骨化生', '異形成', '過形成', '再生']
  },
  {
    type: 'term',
    question: '食道下部粘膜が胃から連続的に腺上皮に置換したものを何というか',
    answerPool: ['バレット食道'],
    dummyPool: ['扁平上皮化生', '腸上皮化生', '食道静脈瘤', '逆流性食道炎', '食道アカラシア', '異形成', 'マロリー・ワイス症候群']
  },
  {
    type: 'term',
    question: '化生を引き起こす主な要因は何か',
    answerPool: ['慢性刺激'],
    dummyPool: ['急性炎症', '遺伝子変異', '虚血', '低栄養', '加齢', '免疫異常', '内分泌異常']
  },

  // --- 変性・アミロイド ---
  {
    type: 'term',
    question: 'アミロイドとはどのような物質か',
    answerPool: ['細胞外基質に沈着した異常タンパク質のうちβシート構造を有する物質の総称'],
    dummyPool: [
      'リソソーム酵素で消化されない脂質酸化物',
      '鉄を含むヘモグロビン代謝産物',
      '線維芽細胞が産生する膠原線維',
      'プリン体代謝の最終産物',
      'メラノサイトが産生する色素',
      '血漿タンパクが析出した凝固塊',
      '骨基質に沈着するカルシウム塩'
    ]
  },
  {
    type: 'binary',
    question: '変性は可逆的変化か、不可逆的変化か',
    answerPool: ['可逆的変化'],
    dummyPool: ['不可逆的変化']
  },
  {
    type: 'binary',
    question: '変性は致死性の変化か、非致死性の変化か',
    answerPool: ['非致死性の変化'],
    dummyPool: ['致死性の変化']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '細胞・組織傷害',
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

const cnt = data.questions.filter(q => q.category === '細胞・組織傷害').length;
console.log(`\n✔ 削除: ${delCount}問`);
console.log(`✔ 修正: ${fixCount}問`);
console.log(`✔ 細胞・組織傷害カテゴリ: ${cnt}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
