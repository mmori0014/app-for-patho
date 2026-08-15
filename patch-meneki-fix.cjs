// patch-meneki-fix.cjs
// 免疫異常カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 削除（講義資料に記載なし） ============
let delCount = 0;
data.questions = data.questions.filter(q => {
  if (q.category === '免疫異常' &&
      q.question === '全身性エリテマトーデスの好発年齢はどれくらいか') {
    console.log('削除: ' + q.question);
    delCount++;
    return false;
  }
  return true;
});

// ============ 2. 既存問題の修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {
  if (q.category !== '免疫異常') return q;

  // ヒスタミンはサイトカインではない → 炎症メディエーターに訂正
  if (q.question === '気管支喘息で特徴的に認める主なサイトカインは何か') {
    q.question = '気管支喘息において、肥満細胞から分泌される主な炎症メディエーターは何か';
    q.answerPool = ['ヒスタミン'];
    q.dummyPool = [
      'インターフェロン-γ', 'IL-12', 'TNF-β', '補体C3',
      'ブラジキニン', 'フィブリン', 'プラスミン'
    ];
    console.log('修正: ' + q.question.slice(0, 40));
    fixCount++;
  }

  // MHC と HLA は同義 → ダミーから HLA を除去
  if (q.question === '移植片の生着はリンパ球と何の適合に依存するか') {
    q.dummyPool = [
      'ABO血液型の適合', '補体価の適合', '白血球数の適合',
      '血清タンパク質の適合', 'NK細胞活性の適合', 'T細胞数の適合', 'Rh血液型の適合'
    ];
    console.log('修正: ' + q.question.slice(0, 40) + '（ダミーからHLAを除去）');
    fixCount++;
  }

  // Ⅰ型アレルギー: 講義記載に合わせる
  if (q.question === '次のうち、Ⅰ型アレルギー(即時型)に分類される疾患はどれか。') {
    q.answerPool = ['蕁麻疹', 'アナフィラキシー', '食物アレルギー', 'アレルギー性結膜炎', 'アレルギー性鼻炎', '気管支喘息'];
    console.log('修正: Ⅰ型アレルギーの正解候補を講義準拠に');
    fixCount++;
  }

  // Ⅱ型アレルギー: 講義記載に合わせる
  if (q.question === '次のうち、Ⅱ型アレルギー(細胞傷害型)に分類される疾患はどれか。') {
    q.answerPool = ['自己免疫性溶血性貧血', '特発性血小板減少性紫斑病', '不適合輸血', 'グッドパスチャー症候群', '重症筋無力症', '天疱瘡'];
    console.log('修正: Ⅱ型アレルギーの正解候補を講義準拠に');
    fixCount++;
  }

  return q;
});

// ============ 3. 問題の追加 ============
const newQuestions = [
  // --- 免疫の基本 ---
  {
    type: 'term',
    question: '人体(自己)にとっての異物(非自己)を認識し排除するためのシステムを何というか',
    answerPool: ['免疫'],
    dummyPool: ['炎症', 'アレルギー', '恒常性', '代謝', '自己寛容', '生体防御反応', '創傷治癒']
  },
  {
    type: 'term',
    question: 'Bリンパ球(形質細胞)が分泌する免疫グロブリンを主体とした免疫反応を何というか',
    answerPool: ['体液性免疫', '液性免疫'],
    dummyPool: ['細胞性免疫', '自然免疫', '獲得免疫', '受動免疫', '能動免疫', '粘膜免疫', '補体系']
  },
  {
    type: 'term',
    question: '貪食細胞の活性化やウイルス感染細胞の直接的な除去を担う免疫反応を何というか',
    answerPool: ['細胞性免疫'],
    dummyPool: ['体液性免疫', '液性免疫', '自然免疫', '受動免疫', '能動免疫', '粘膜免疫', '補体系']
  },
  {
    type: 'term',
    question: '抗体の機能を1つ挙げよ',
    answerPool: ['オプソニン化', '補体の活性化', 'ウイルスや細菌毒素の中和'],
    dummyPool: ['抗原提示', '貪食', 'サイトカイン産生', '細胞傷害', '血液凝固', '線溶', '血管新生']
  },
  {
    type: 'term',
    question: '抗体が異物を覆うことで貪食細胞の貪食を促進する作用を何というか',
    answerPool: ['オプソニン化'],
    dummyPool: ['中和', '補体活性化', '抗原提示', 'ADCC', '走化性', '架橋反応', '脱顆粒']
  },

  // --- MHC / HLA ---
  {
    type: 'term',
    question: '主要組織適合性遺伝子複合体(MHC)はヒトでは何と呼ばれるか',
    answerPool: ['HLA', 'ヒト白血球抗原'],
    dummyPool: ['CD分子', 'TCR', 'BCR', 'β2-ミクログロブリン', '補体', '免疫グロブリン', 'サイトカイン']
  },
  {
    type: 'term',
    question: 'MHC(HLA)の遺伝子は何番染色体にコードされるか',
    answerPool: ['6番染色体短腕'],
    dummyPool: ['15番染色体', '17番染色体短腕', '9番染色体', '22番染色体', '21番染色体', 'X染色体', '11番染色体']
  },
  {
    type: 'term',
    question: 'MHC classⅠが発現しているのはどの細胞か',
    answerPool: ['ほとんど全ての有核細胞と血小板'],
    dummyPool: ['抗原提示細胞のみ', '樹状細胞・マクロファージ・B細胞', 'T細胞のみ', 'B細胞のみ', '赤血球のみ', '好中球のみ', '上皮細胞のみ']
  },
  {
    type: 'term',
    question: 'MHC classⅡが発現しているのはどの細胞か',
    answerPool: ['抗原提示細胞(樹状細胞・マクロファージ・B細胞)'],
    dummyPool: ['全ての有核細胞と血小板', 'T細胞のみ', '赤血球', '好中球のみ', '線維芽細胞', '血管内皮細胞のみ', '上皮細胞のみ']
  },
  {
    type: 'term',
    question: 'MHC classⅠと結合性を有するCD分子は何か',
    answerPool: ['CD8'],
    dummyPool: ['CD4', 'CD3', 'CD19', 'CD20', 'CD28', 'CD56', 'CD34']
  },
  {
    type: 'term',
    question: 'MHC classⅡと結合性を有するCD分子は何か',
    answerPool: ['CD4'],
    dummyPool: ['CD8', 'CD3', 'CD19', 'CD20', 'CD28', 'CD56', 'CD34']
  },
  {
    type: 'term',
    question: 'HLA-classⅠに細分類されるものを挙げよ',
    answerPool: ['HLA-A・HLA-B・HLA-C'],
    dummyPool: ['HLA-DR・HLA-DQ・HLA-DP', 'HLA-A・HLA-DR・HLA-DQ', 'HLA-B・HLA-DP・HLA-C', 'CD4・CD8・CD3', 'IgG・IgA・IgM', 'C3・C4・C5', 'TCR・BCR・FcR']
  },
  {
    type: 'term',
    question: 'HLA-classⅡに細分類されるものを挙げよ',
    answerPool: ['HLA-DR・HLA-DQ・HLA-DP'],
    dummyPool: ['HLA-A・HLA-B・HLA-C', 'HLA-A・HLA-DR・HLA-DQ', 'HLA-B・HLA-DP・HLA-C', 'CD4・CD8・CD3', 'IgG・IgA・IgM', 'C3・C4・C5', 'TCR・BCR・FcR']
  },
  {
    type: 'binary',
    question: 'MHC classⅠが提示するのは細胞内(自己)の抗原か、貪食された細胞外(非自己)の抗原か',
    answerPool: ['細胞内(自己)の抗原'],
    dummyPool: ['貪食された細胞外(非自己)の抗原']
  },
  {
    type: 'binary',
    question: 'MHC classⅡが提示するのは細胞内(自己)の抗原か、貪食された細胞外(非自己)の抗原か',
    answerPool: ['貪食された細胞外(非自己)の抗原'],
    dummyPool: ['細胞内(自己)の抗原']
  },

  // --- 移植 ---
  {
    type: 'term',
    question: '移植において、移植される臓器・組織を何というか',
    answerPool: ['移植片', 'グラフト'],
    dummyPool: ['ドナー', 'レシピエント', '宿主', '抗原提示細胞', 'キメラ', '再生組織', '培養組織']
  },
  {
    type: 'term',
    question: '移植片を提供する個体を何というか',
    answerPool: ['ドナー'],
    dummyPool: ['レシピエント', '宿主', '移植片', 'キャリア', '保因者', 'ホスト', 'グラフト']
  },
  {
    type: 'term',
    question: '移植片を受け取る個体を何というか',
    answerPool: ['レシピエント', '宿主'],
    dummyPool: ['ドナー', '移植片', 'グラフト', 'キャリア', '保因者', '提供者', '供与体']
  },
  {
    type: 'term',
    question: '同じ個体間で行われる移植を何というか',
    answerPool: ['自家移植'],
    dummyPool: ['同系移植', '同種移植', '異種移植', '骨髄移植', '臓器移植', '組織移植', '細胞移植']
  },
  {
    type: 'term',
    question: '一卵性双生児間など遺伝的に同系の個体間で行われる移植を何というか',
    answerPool: ['同系移植'],
    dummyPool: ['自家移植', '同種移植', '異種移植', '骨髄移植', '臓器移植', '組織移植', '細胞移植']
  },
  {
    type: 'term',
    question: '同種の動物間で行われ、拒絶反応が起こる移植を何というか',
    answerPool: ['同種移植'],
    dummyPool: ['自家移植', '同系移植', '異種移植', '骨髄移植', '臓器移植', '組織移植', '細胞移植']
  },
  {
    type: 'term',
    question: '異なる動物間で行われ、超急性の拒絶反応が起こることが多い移植を何というか',
    answerPool: ['異種移植'],
    dummyPool: ['自家移植', '同系移植', '同種移植', '骨髄移植', '臓器移植', '組織移植', '細胞移植']
  },
  {
    type: 'binary',
    question: '同系移植では通常拒絶反応は起こるか、起こらないか',
    answerPool: ['起こらない'],
    dummyPool: ['起こる']
  },
  {
    type: 'term',
    question: 'レシピエントの免疫反応により移植片が傷害される現象を何というか',
    answerPool: ['移植片拒絶反応', '宿主対移植片反応'],
    dummyPool: ['移植片対宿主病', '免疫寛容', 'アナフィラキシー', 'サイトカインストーム', '自己免疫現象', '過敏反応', '同種免疫']
  },
  {
    type: 'term',
    question: '移植後、数分〜数時間で発生する拒絶反応を何というか',
    answerPool: ['超急性拒絶反応'],
    dummyPool: ['急性拒絶反応', '慢性拒絶反応', '移植片対宿主病', '遅発性拒絶反応', '亜急性拒絶反応', '一過性拒絶反応', '免疫寛容']
  },
  {
    type: 'term',
    question: '移植後、数週間〜数か月以内に起こる拒絶反応を何というか',
    answerPool: ['急性拒絶反応'],
    dummyPool: ['超急性拒絶反応', '慢性拒絶反応', '移植片対宿主病', '遅発性拒絶反応', '亜急性拒絶反応', '一過性拒絶反応', '免疫寛容']
  },
  {
    type: 'term',
    question: '移植後、数年にわたって起こる拒絶反応を何というか',
    answerPool: ['慢性拒絶反応'],
    dummyPool: ['超急性拒絶反応', '急性拒絶反応', '移植片対宿主病', '遅発性拒絶反応', '亜急性拒絶反応', '一過性拒絶反応', '免疫寛容']
  },
  {
    type: 'term',
    question: '移植片のMHCにヘルパーT細胞が直接反応し、細胞傷害性T細胞が反応する認識経路を何というか',
    answerPool: ['直接認識'],
    dummyPool: ['間接認識', '交差反応', '自己寛容', '中枢性寛容', '末梢性寛容', 'クローン除去', 'アネルギー']
  },
  {
    type: 'term',
    question: 'GVHDでみられる皮膚症状を1つ挙げよ',
    answerPool: ['壊死', '浮腫', '紅皮症'],
    dummyPool: ['蝶形紅斑', 'ヘリオトロープ疹', 'ゴットロン徴候', '結節性紅斑', '乾癬', '色素沈着', '白斑']
  },
  {
    type: 'binary',
    question: 'GVHDが問題となるのはレシピエント側に免疫抑制がかかっている場合か、かかっていない場合か',
    answerPool: ['かかっている場合'],
    dummyPool: ['かかっていない場合']
  },

  // --- アレルギー各論 ---
  {
    type: 'term',
    question: 'Ⅱ型アレルギーにおいて、IgG受容体を発現するマクロファージや好中球の結合による細胞傷害を何というか',
    answerPool: ['抗体依存性細胞介在性細胞傷害', 'ADCC'],
    dummyPool: ['補体依存性細胞傷害', 'オプソニン化', '中和', '免疫複合体形成', '脱顆粒反応', '抗原提示', 'アポトーシス']
  },
  {
    type: 'term',
    question: '次のうち、Ⅲ型アレルギー(免疫複合型)に分類される疾患はどれか。',
    answerPool: ['血清病', '皮膚アレルギー性血管炎', '急性糸球体腎炎', '全身性エリテマトーデス', '関節リウマチ'],
    dummyPool: ['気管支喘息', 'バセドウ病', '重症筋無力症', '接触性皮膚炎', '天疱瘡', '不適合輸血', '多発性硬化症']
  },
  {
    type: 'term',
    question: '次のうち、Ⅳ型アレルギー(遅延型)に分類される疾患・反応はどれか。',
    answerPool: ['接触性皮膚炎', '多発性硬化症', 'ツベルクリン反応', '移植片対宿主病', 'サルコイドーシス'],
    dummyPool: ['気管支喘息', 'バセドウ病', '重症筋無力症', '血清病', '天疱瘡', '不適合輸血', '蕁麻疹']
  },
  {
    type: 'term',
    question: 'Ⅰ型アレルギーで肥満細胞からヒスタミンが放出されると、どの白血球が動員されるか',
    answerPool: ['好酸球'],
    dummyPool: ['好中球', '好塩基球', 'リンパ球', '単球', '形質細胞', 'NK細胞', '樹状細胞']
  },
  {
    type: 'term',
    question: 'Ⅴ型アレルギーがⅡ型と異なる点は何か',
    answerPool: ['炎症などによる細胞傷害を伴わない'],
    dummyPool: [
      '自己抗体が関与しない', '補体が関与しない', 'T細胞が中心となる',
      '免疫複合体が形成される', 'IgEが中心となる', '遅延型の反応を示す', '好酸球が動員される'
    ]
  },
  {
    type: 'binary',
    question: 'Ⅰ型アレルギーで中心となる免疫グロブリンはIgEか、IgGか',
    answerPool: ['IgE'],
    dummyPool: ['IgG']
  },
  {
    type: 'binary',
    question: 'Ⅲ型アレルギーで組織を傷害するのは免疫複合体か、細胞傷害性T細胞か',
    answerPool: ['免疫複合体'],
    dummyPool: ['細胞傷害性T細胞']
  },

  // --- 自己免疫疾患 ---
  {
    type: 'term',
    question: '正常自己の体成分に対して液性または細胞性抗体がつくられることを何というか',
    answerPool: ['自己免疫現象'],
    dummyPool: ['アレルギー', '免疫寛容', '過敏反応', '交差反応', '拒絶反応', '免疫不全', '炎症反応']
  },
  {
    type: 'term',
    question: '自己免疫疾患は自己抗原の局在や障害臓器によって2つに大別されるが、それは何か',
    answerPool: ['全身性自己免疫疾患と臓器特異的自己免疫疾患'],
    dummyPool: [
      '急性自己免疫疾患と慢性自己免疫疾患',
      '先天性自己免疫疾患と後天性自己免疫疾患',
      '液性自己免疫疾患と細胞性自己免疫疾患',
      '原発性自己免疫疾患と続発性自己免疫疾患',
      '軽症自己免疫疾患と重症自己免疫疾患',
      '遺伝性自己免疫疾患と環境性自己免疫疾患',
      '限局性自己免疫疾患とびまん性自己免疫疾患'
    ]
  },
  {
    type: 'term',
    question: '全身性エリテマトーデスで特に重要とされる自己抗体は何か',
    answerPool: ['抗DNA抗体'],
    dummyPool: ['リウマトイド因子', '抗TSH受容体抗体', '抗アセチルコリン受容体抗体', '抗ミトコンドリア抗体', '抗糸球体基底膜抗体', '抗デスモグレイン抗体', '抗CCP抗体']
  },
  {
    type: 'term',
    question: '全身性エリテマトーデスで腎・糸球体が傷害される病態を何というか',
    answerPool: ['ループス腎炎'],
    dummyPool: ['IgA腎症', '糖尿病性腎症', '微小変化型ネフローゼ症候群', '腎硬化症', '間質性腎炎', '急性尿細管壊死', '多発性嚢胞腎']
  },
  {
    type: 'term',
    question: '急速進行性糸球体腎炎のうち、抗糸球体基底膜抗体が陽性となる疾患を何というか',
    answerPool: ['グッドパスチャー症候群'],
    dummyPool: ['全身性エリテマトーデス', 'IgA腎症', 'ループス腎炎', '関節リウマチ', '重症筋無力症', '天疱瘡', 'バセドウ病']
  },
  {
    type: 'term',
    question: 'グッドパスチャー症候群において、ボウマン嚢上皮細胞を主体とした細胞増殖により形成されるものを何というか',
    answerPool: ['細胞性半月体'],
    dummyPool: ['パンヌス', '肉芽腫', '疣腫', '硝子円柱', '線維性半月体', 'メサンギウム増殖', '基底膜肥厚']
  },
  {
    type: 'term',
    question: '関節リウマチで滑膜細胞が増殖して形成され、軟骨や骨を破壊する肉芽性組織を何というか',
    answerPool: ['パンヌス'],
    dummyPool: ['肉芽腫', '瘢痕組織', '疣腫', '細胞性半月体', '骨棘', '滑液嚢腫', '線維性強直']
  },
  {
    type: 'term',
    question: 'バセドウ病でみられる甲状腺ホルモン過剰による症状を1つ挙げよ',
    answerPool: ['動悸', '息切れ', '全身倦怠感', '食欲亢進', '体重減少'],
    dummyPool: ['体重増加', '徐脈', '便秘', '寒がり', '嗄声', '浮腫', '無気力']
  },

  // --- 気管支喘息 ---
  {
    type: 'term',
    question: '気管支喘息できたす換気障害の型は何か',
    answerPool: ['閉塞性換気障害'],
    dummyPool: ['拘束性換気障害', '混合性換気障害', '中枢性換気障害', '肺胞低換気', '過換気', 'シャント', '拡散障害']
  },
  {
    type: 'term',
    question: '気管支喘息の主徴を1つ挙げよ',
    answerPool: ['発作性で反復性の咳嗽', '喘鳴', '呼吸困難'],
    dummyPool: ['膿性喀痰', '血痰', '胸痛', '発熱', 'ばち指', 'チアノーゼ', '起坐呼吸']
  },
  {
    type: 'term',
    question: '気管支喘息において、ヒスタミンなどの炎症メディエーターを分泌する細胞は何か',
    answerPool: ['肥満細胞'],
    dummyPool: ['好酸球', '好中球', '好塩基球', 'リンパ球', 'マクロファージ', '形質細胞', '樹状細胞']
  },
  {
    type: 'term',
    question: '気管支喘息において気道過敏性の亢進をもたらす所見は何か',
    answerPool: ['気道上皮の破壊・剥離'],
    dummyPool: ['気道平滑筋の弛緩', '粘液分泌の低下', '肺胞の破壊', '肺線維化', '胸膜肥厚', '気管軟化', '肺過膨張']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '免疫異常',
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

const cnt = data.questions.filter(q => q.category === '免疫異常').length;
console.log(`\n✔ 削除: ${delCount}問`);
console.log(`✔ 修正: ${fixCount}問`);
console.log(`✔ 免疫異常カテゴリ: ${cnt}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
