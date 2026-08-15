// patch-kansen-fix.cjs
// 感染症カテゴリの修正 + 問題追加
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions.export.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const uid = () => Math.random().toString(36).slice(2, 14).padEnd(12, '0');

// ============ 1. 既存問題の修正 ============
let fixCount = 0;
data.questions = data.questions.map(q => {
  if (q.category !== '感染症') return q;

  // リケッチアは細胞壁を持つ細菌 → ダミーとして不成立
  if (q.question === '病原体のうち細胞壁を有するのは何か') {
    q.dummyPool = [
      'ウイルス', '原虫', 'マイコプラズマ', 'プリオン',
      'ウイルスとプリオン', '蠕虫', 'エンベロープをもつウイルス'
    ];
    console.log('修正: 細胞壁の問題（ダミーからリケッチアを除去）');
    fixCount++;
  }

  // リケッチアは原核生物 → ダミーとして不成立
  if (q.question === '病原体のうち原核生物なのは何か') {
    q.dummyPool = [
      'ウイルス', '真菌', '原虫', 'プリオン',
      '寄生虫', '蠕虫', '真菌と寄生虫'
    ];
    console.log('修正: 原核生物の問題（ダミーからリケッチアを除去）');
    fixCount++;
  }

  // 病原体は5分類（プリオンを含む）
  const gogun = {
    '風疹の病原体は細菌、真菌、ウイルス、寄生虫のうちどれか':
      '風疹の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか',
    '結核の病原体は細菌、真菌、ウイルス、寄生虫のうちどれか':
      '結核の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか',
    'クリプトコッカス症の病原体は細菌、真菌、ウイルス、寄生虫のうちどれか':
      'クリプトコッカス症の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか',
    'ニューモシスチス肺炎の病原体は細菌、真菌、ウイルス、寄生虫のうちどれか':
      'ニューモシスチス肺炎の病原体は寄生虫、真菌、細菌、ウイルス、プリオンのうちどれか',
  };
  if (gogun[q.question]) {
    q.question = gogun[q.question];
    q.dummyPool = ['細菌', '真菌', 'ウイルス', '寄生虫', 'プリオン', '原虫', '蠕虫']
      .filter(d => !q.answerPool.includes(d));
    console.log('修正: ' + q.question.slice(0, 30));
    fixCount++;
  }

  // 問題文が不自然なため整理
  if (q.question.includes('神経系を侵すウイルスでないが、異常プリオン蛋白')) {
    q.question = '異常プリオン蛋白の蓄積によって発症する伝達性海綿状脳症を何というか';
    q.dummyPool = [
      '進行性多巣性白質脳症', '亜急性硬化性全脳炎', '髄膜炎', '脳炎',
      'アルツハイマー病', '多発性硬化症', '日本脳炎'
    ];
    console.log('修正: プリオン病の問題文を整理');
    fixCount++;
  }

  return q;
});

// ============ 2. 問題の追加 ============
const newQuestions = [
  // --- 感染の基本概念 ---
  {
    type: 'term',
    question: '病原体が宿主に侵入・定着し、増殖することを何というか',
    answerPool: ['感染'],
    dummyPool: ['感染症', '発症', '定着', '保菌', '汚染', '伝播', '流行']
  },
  {
    type: 'term',
    question: '感染は病原体の感染力が何を上回ったときに成立するか',
    answerPool: ['宿主の抵抗力'],
    dummyPool: ['宿主の栄養状態', '病原体の増殖速度', '常在細菌叢の量', '宿主の年齢', '病原体の毒素量', '宿主の体温', '環境温度']
  },
  {
    type: 'term',
    question: '病原体の病原性を決める3つの要因は何か',
    answerPool: ['侵襲性・毒力・増殖性'],
    dummyPool: [
      '感染力・潜伏期間・致死率',
      '侵襲性・耐性・伝播性',
      '毒力・増殖性・耐熱性',
      '感染経路・宿主域・変異性',
      '侵襲性・毒力・耐性',
      '増殖性・伝播性・潜伏性',
      '毒力・免疫回避能・薬剤耐性'
    ]
  },
  {
    type: 'term',
    question: '感染の原因となる微生物・構造物である病原体を大きく5つに分類せよ',
    answerPool: ['寄生虫・真菌・細菌・ウイルス・プリオン'],
    dummyPool: [
      '寄生虫・真菌・細菌・ウイルス・リケッチア',
      '真菌・細菌・ウイルス・原虫・蠕虫',
      '細菌・ウイルス・真菌・マイコプラズマ・クラミジア',
      '寄生虫・細菌・ウイルス・プリオン・毒素',
      '原虫・蠕虫・真菌・細菌・ウイルス',
      '細菌・真菌・ウイルス・プリオン・毒素',
      '寄生虫・真菌・細菌・プリオン・リケッチア'
    ]
  },

  // --- 感染経路 ---
  {
    type: 'term',
    question: '病原体を含む、または病原体に汚染されたものを何というか',
    answerPool: ['感染源'],
    dummyPool: ['感染経路', '病原巣', '媒介物', '宿主', 'ベクター', '保菌者', '汚染源']
  },
  {
    type: 'term',
    question: '外界からの病原体の伝播による感染を何というか',
    answerPool: ['外因性感染'],
    dummyPool: ['内因性感染', '日和見感染', '院内感染', '市中感染', '二次感染', '不顕性感染', '持続感染']
  },
  {
    type: 'term',
    question: '宿主に常在する菌が原因となる感染を何というか',
    answerPool: ['内因性感染'],
    dummyPool: ['外因性感染', '水平感染', '垂直感染', '院内感染', '市中感染', '二次感染', '媒介物感染']
  },
  {
    type: 'term',
    question: '外因性感染は2つに大別されるが、それは何か',
    answerPool: ['水平感染と垂直(母子)感染'],
    dummyPool: [
      '内因性感染と外因性感染',
      '飛沫感染と空気感染',
      '接触感染と媒介物感染',
      '市中感染と院内感染',
      '顕性感染と不顕性感染',
      '急性感染と持続感染',
      '直接感染と間接感染'
    ]
  },
  {
    type: 'binary',
    question: '水平感染は外因性感染か、内因性感染か',
    answerPool: ['外因性感染'],
    dummyPool: ['内因性感染']
  },
  {
    type: 'binary',
    question: '垂直感染は外因性感染か、内因性感染か',
    answerPool: ['外因性感染'],
    dummyPool: ['内因性感染']
  },

  // --- 日和見感染・院内感染 ---
  {
    type: 'term',
    question: '感染に対して抵抗力が低下している人を何というか',
    answerPool: ['易感染性宿主'],
    dummyPool: ['保菌者', 'キャリア', '無症候性感染者', '日和見病原体', '感染源', '媒介者', '不顕性感染者']
  },
  {
    type: 'term',
    question: '日和見病原体として多い常在菌を1つ挙げよ',
    answerPool: ['表皮ブドウ球菌', '腸球菌'],
    dummyPool: ['結核菌', '梅毒トレポネーマ', '髄膜炎菌', '淋菌', 'ボツリヌス菌', '破傷風菌', 'コレラ菌']
  },
  {
    type: 'term',
    question: '一般社会での感染を何というか',
    answerPool: ['市中感染'],
    dummyPool: ['院内感染', '日和見感染', '内因性感染', '外因性感染', '二次感染', '水平感染', '垂直感染']
  },
  {
    type: 'term',
    question: '病院内で起こる感染を何というか',
    answerPool: ['院内感染'],
    dummyPool: ['市中感染', '日和見感染', '内因性感染', '外因性感染', '二次感染', '水平感染', '垂直感染']
  },
  {
    type: 'term',
    question: '菌交代現象の原因となるのは何の長期使用か',
    answerPool: ['化学療法薬', '抗菌薬'],
    dummyPool: ['ステロイド薬', '免疫抑制薬', '抗がん薬', '抗ウイルス薬', '解熱鎮痛薬', '降圧薬', '利尿薬']
  },

  // --- 薬剤耐性菌 ---
  {
    type: 'term',
    question: 'VREとはどのような細菌か',
    answerPool: ['バンコマイシン耐性腸球菌'],
    dummyPool: ['メチシリン耐性黄色ブドウ球菌', '多剤耐性緑膿菌', 'ESBL産生菌', 'カルバペネム耐性腸内細菌目細菌', 'ペニシリン耐性肺炎球菌', '多剤耐性アシネトバクター', 'バンコマイシン耐性黄色ブドウ球菌']
  },
  {
    type: 'term',
    question: 'MDRPとはどのような細菌か',
    answerPool: ['多剤耐性緑膿菌'],
    dummyPool: ['メチシリン耐性黄色ブドウ球菌', 'バンコマイシン耐性腸球菌', 'ESBL産生菌', 'カルバペネム耐性腸内細菌目細菌', 'ペニシリン耐性肺炎球菌', '多剤耐性アシネトバクター', 'バンコマイシン耐性黄色ブドウ球菌']
  },
  {
    type: 'term',
    question: '薬剤耐性菌が出現する原因は何か',
    answerPool: ['抗菌薬の不適切な使用方法や使用期間'],
    dummyPool: [
      '宿主の免疫低下', '病原体の自然突然変異のみ', '院内の消毒不足',
      '手指衛生の不徹底', '抗ウイルス薬の使用', 'ワクチン接種率の低下', '栄養状態の悪化'
    ]
  },
  {
    type: 'term',
    question: 'MRSA・VRE・MDRPの主な感染経路は何か',
    answerPool: ['接触感染'],
    dummyPool: ['飛沫感染', '空気感染', '媒介物感染', '血液感染', '経口感染', '垂直感染', '性行為感染']
  },

  // --- 感染症の種類 ---
  {
    type: 'term',
    question: '1970年代以降に新たに認識された、あるいは急速に感染拡大しつつある感染症を何というか',
    answerPool: ['新興感染症'],
    dummyPool: ['再興感染症', '輸入感染症', '人獣共通感染症', '日和見感染症', '院内感染症', '市中感染症', '持続感染症']
  },
  {
    type: 'term',
    question: '以前から知られていたが、近年に再び感染拡大が問題となっている感染症を何というか',
    answerPool: ['再興感染症'],
    dummyPool: ['新興感染症', '輸入感染症', '人獣共通感染症', '日和見感染症', '院内感染症', '市中感染症', '持続感染症']
  },
  {
    type: 'term',
    question: '再興感染症の主なものを1つ挙げよ',
    answerPool: ['結核', 'ジフテリア', 'コレラ'],
    dummyPool: ['HIV感染症', 'SARS', 'エボラ出血熱', '新型インフルエンザ', 'マラリア', 'デング熱', '狂犬病']
  },
  {
    type: 'term',
    question: '輸入食品や輸入動物、海外渡航者などによって国外からもちこまれた感染症を何というか',
    answerPool: ['輸入感染症'],
    dummyPool: ['新興感染症', '再興感染症', '人獣共通感染症', '日和見感染症', '院内感染症', '市中感染症', '持続感染症']
  },
  {
    type: 'term',
    question: '輸入感染症のうち頻度が高いものは何か',
    answerPool: ['旅行者下痢症'],
    dummyPool: ['マラリア', 'デング熱', '狂犬病', '腸チフス', 'コレラ', '黄熱', 'ジカ熱']
  },
  {
    type: 'term',
    question: 'ヒトとヒト以外の脊椎動物との間で移行する感染症を何というか',
    answerPool: ['人獣共通感染症', '動物由来感染症'],
    dummyPool: ['新興感染症', '再興感染症', '輸入感染症', '日和見感染症', '院内感染症', '市中感染症', '媒介物感染症']
  },

  // --- 病原体各論 ---
  {
    type: 'term',
    question: 'ウイルスの基本構造を構成するものは何か',
    answerPool: ['ゲノムとカプシド'],
    dummyPool: [
      '細胞壁と細胞膜', 'ゲノムとリボソーム', '核とミトコンドリア',
      'カプシドとエンベロープ', '細胞膜と鞭毛', 'ゲノムと細胞壁', 'リボソームとカプシド'
    ]
  },
  {
    type: 'term',
    question: 'ウイルスが種によって有する、細胞膜に由来する構造を何というか',
    answerPool: ['エンベロープ'],
    dummyPool: ['カプシド', '細胞壁', '莢膜', '鞭毛', '線毛', '芽胞', 'リボソーム']
  },
  {
    type: 'binary',
    question: 'ウイルスは単独で自己複製できるか、他の生物の細胞内でしか複製できないか',
    answerPool: ['他の生物の細胞内でしか複製できない'],
    dummyPool: ['単独で自己複製できる']
  },
  {
    type: 'term',
    question: '寄生虫のうち、単細胞のものを何というか',
    answerPool: ['原虫'],
    dummyPool: ['蠕虫', '線虫', '吸虫', '条虫', '鞭毛虫', '胞子虫', 'アメーバ']
  },
  {
    type: 'term',
    question: '寄生虫のうち、多細胞のものを何というか',
    answerPool: ['蠕虫'],
    dummyPool: ['原虫', 'アメーバ', '鞭毛虫', '胞子虫', '真菌', '細菌', 'リケッチア']
  },
  {
    type: 'term',
    question: '蠕虫に含まれるものを1つ挙げよ',
    answerPool: ['線虫類', '吸虫類', '条虫類'],
    dummyPool: ['アメーバ', '鞭毛虫類', '胞子虫類', 'マラリア原虫', 'トリコモナス', 'トキソプラズマ', 'ランブル鞭毛虫']
  },
  {
    type: 'binary',
    question: '寄生虫は原核生物か、真核生物か',
    answerPool: ['真核生物'],
    dummyPool: ['原核生物']
  },

  // --- 潜伏期間 ---
  {
    type: 'term',
    question: 'インフルエンザウイルス感染症の潜伏期間はどれくらいか',
    answerPool: ['24〜48時間'],
    dummyPool: ['数時間以内', '3〜5日', '1週間程度', '2週間程度', '1か月程度', '数か月', '数年']
  },
  {
    type: 'term',
    question: '麻疹や風疹の潜伏期間はどれくらいか',
    answerPool: ['数日〜2週間前後'],
    dummyPool: ['24〜48時間', '数時間以内', '1か月程度', '3か月程度', '半年程度', '数年', '数十年']
  },
  {
    type: 'term',
    question: '通常の細菌感染症の潜伏期間はどれくらいのことが多いか',
    answerPool: ['数日以内'],
    dummyPool: ['数時間以内', '2週間程度', '1か月程度', '3か月程度', '半年程度', '数年', '数十年']
  },

  // --- 予防接種 ---
  {
    type: 'term',
    question: '人工的につくった病原体の抗原を生体に接種し、獲得免疫反応を促して感染予防を図るものを何というか',
    answerPool: ['予防接種', 'ワクチン'],
    dummyPool: ['免疫グロブリン製剤', '抗菌薬予防投与', '血清療法', '免疫抑制療法', '化学予防', '受動免疫', '消毒']
  },
  {
    type: 'term',
    question: 'ワクチンの種類を3つ挙げよ',
    answerPool: ['弱毒生ワクチン・不活化ワクチン・トキソイド'],
    dummyPool: [
      '生ワクチン・死菌ワクチン・血清',
      '弱毒生ワクチン・不活化ワクチン・免疫グロブリン',
      'mRNAワクチン・DNAワクチン・トキソイド',
      '不活化ワクチン・トキソイド・抗毒素',
      '生ワクチン・組換えワクチン・抗血清',
      '弱毒生ワクチン・トキソイド・抗菌薬',
      '不活化ワクチン・血清・免疫抑制薬'
    ]
  },

  // --- 肺真菌症 ---
  {
    type: 'term',
    question: '肺クリプトコッカス症の原因菌の学名は何か',
    answerPool: ['Cryptococcus neoformans'],
    dummyPool: ['Aspergillus fumigatus', 'Candida albicans', 'Pneumocystis jirovetti', 'Mycobacterium tuberculosis', 'Treponema pallidum', 'Rhizopus', 'Actinomyces']
  },
  {
    type: 'term',
    question: 'ニューモシスチス肺炎の原因菌の学名は何か',
    answerPool: ['Pneumocystis jirovetti'],
    dummyPool: ['Aspergillus fumigatus', 'Candida albicans', 'Cryptococcus neoformans', 'Mycobacterium tuberculosis', 'Treponema pallidum', 'Rhizopus', 'Actinomyces']
  },
  {
    type: 'term',
    question: '肺カンジダ症の原因菌の学名は何か',
    answerPool: ['Candida albicans'],
    dummyPool: ['Aspergillus fumigatus', 'Cryptococcus neoformans', 'Pneumocystis jirovetti', 'Mycobacterium tuberculosis', 'Treponema pallidum', 'Rhizopus', 'Actinomyces']
  },
  {
    type: 'term',
    question: 'ケカビ目に属する菌種によって引き起こされる肺真菌症を何というか',
    answerPool: ['肺ムーコル症', '肺接合菌症'],
    dummyPool: ['肺アスペルギルス症', '肺クリプトコッカス症', 'ニューモシスチス肺炎', '肺カンジダ症', '肺放線菌症', '肺結核', '肺ノカルジア症']
  },
  {
    type: 'term',
    question: '肺真菌症のうち、日和見感染症として多いものを1つ挙げよ',
    answerPool: ['ニューモシスチス肺炎', '肺カンジダ症'],
    dummyPool: ['細菌性肺炎', '間質性肺炎', '大葉性肺炎', 'サルコイドーシス', '肺結核', '誤嚥性肺炎', '好酸球性肺炎']
  },

  // --- 結核・梅毒・HIV ---
  {
    type: 'term',
    question: '結核の原因菌の学名は何か',
    answerPool: ['Mycobacterium tuberculosis'],
    dummyPool: ['Mycobacterium leprae', 'Treponema pallidum', 'Candida albicans', 'Cryptococcus neoformans', 'Aspergillus fumigatus', 'Actinomyces', 'Rhizopus']
  },
  {
    type: 'term',
    question: '梅毒の原因菌の学名は何か',
    answerPool: ['Treponema pallidum'],
    dummyPool: ['Mycobacterium tuberculosis', 'Mycobacterium leprae', 'Candida albicans', 'Cryptococcus neoformans', 'Aspergillus fumigatus', 'Actinomyces', 'Rhizopus']
  },
  {
    type: 'term',
    question: 'ハンセン病の原因菌の学名は何か',
    answerPool: ['Mycobacterium leprae'],
    dummyPool: ['Mycobacterium tuberculosis', 'Treponema pallidum', 'Candida albicans', 'Cryptococcus neoformans', 'Aspergillus fumigatus', 'Actinomyces', 'Rhizopus']
  },
  {
    type: 'term',
    question: '日本におけるHIVの主な感染経路は何か',
    answerPool: ['性感染', '性行為感染'],
    dummyPool: ['血液感染', '垂直感染', '飛沫感染', '空気感染', '経口感染', '媒介物感染', '接触感染']
  },
  {
    type: 'term',
    question: 'HIV感染直後にみられる一過性の症状を何というか',
    answerPool: ['感冒様急性症状'],
    dummyPool: ['無症候期', 'AIDS発症期', '日和見感染症', '悪性腫瘍の発症', '神経症状', '発疹のみ', '無症状']
  },
  {
    type: 'term',
    question: 'HIV感染後の無症候期はどれくらい続くか',
    answerPool: ['数年〜10数年'],
    dummyPool: ['数日', '数週間', '数か月', '半年程度', '1年程度', '数十年以上', '生涯無症状']
  },
  {
    type: 'binary',
    question: 'HIVの無症候期には感染力は維持されているか、失われているか',
    answerPool: ['維持されている'],
    dummyPool: ['失われている']
  },
  {
    type: 'binary',
    question: 'HIVのワクチンは開発されているか、いないか',
    answerPool: ['開発されていない'],
    dummyPool: ['開発されている']
  },

  // --- 感染性心内膜炎 ---
  {
    type: 'term',
    question: '感染性心内膜炎で最も多い病原菌は何か',
    answerPool: ['溶血性連鎖球菌'],
    dummyPool: ['黄色ブドウ球菌', '表皮ブドウ球菌', '腸球菌', '緑膿菌', '肺炎球菌', '大腸菌', 'クラミジア']
  },
  {
    type: 'term',
    question: '感染性心内膜炎において、急激に敗血症症状が進みやすい原因菌は何か',
    answerPool: ['黄色ブドウ球菌'],
    dummyPool: ['溶血性連鎖球菌', '表皮ブドウ球菌', '腸球菌', '緑膿菌', '肺炎球菌', '大腸菌', 'クラミジア']
  },
  {
    type: 'term',
    question: '感染症をきっかけに全身の様々な臓器の機能不全を引き起こす病態を何というか',
    answerPool: ['敗血症'],
    dummyPool: ['菌血症', '毒素血症', 'ウイルス血症', '播種性血管内凝固症候群', '多臓器不全', 'ショック', '全身性炎症反応症候群']
  },
];

newQuestions.forEach(q => {
  data.questions.push({
    uid: uid(),
    category: '感染症',
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

const cnt = data.questions.filter(q => q.category === '感染症').length;
console.log(`\n✔ 修正: ${fixCount}問`);
console.log(`✔ 感染症カテゴリ: ${cnt}問`);
console.log(`✔ 総問題数: ${data.questions.length}問`);
console.log(`✔ exportVersion: ${data.exportVersion}`);
