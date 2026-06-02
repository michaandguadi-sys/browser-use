// dictionary.js
// All learning content lives here so the app logic stays dumb and the data stays editable.
//
// LANGUAGES: the target languages you can learn. `tts` is the BCP-47 tag handed to
// the Web Speech API so pronunciation uses a native voice when the device has one.
//
// VOCAB: keyed by the 80 COCO-SSD object classes the in-browser detector can emit.
// Each entry maps language-code -> word. Japanese carries romaji in parens so a
// beginner can actually say it.
//
// CONVERSATIONS: scenario -> ordered exchanges. Each exchange is one thing the other
// person might say plus a few responses you could fire back.

const BASE_LANG = 'en'; // the language you already speak; everything is glossed back to this

const LANGUAGES = {
	es: { name: 'Spanish', native: 'Español', tts: 'es-ES', flag: '🇪🇸' },
	fr: { name: 'French', native: 'Français', tts: 'fr-FR', flag: '🇫🇷' },
	de: { name: 'German', native: 'Deutsch', tts: 'de-DE', flag: '🇩🇪' },
	it: { name: 'Italian', native: 'Italiano', tts: 'it-IT', flag: '🇮🇹' },
	ja: { name: 'Japanese', native: '日本語', tts: 'ja-JP', flag: '🇯🇵' },
};

// 80 COCO-SSD classes. Keys MUST match the detector's label strings exactly.
const VOCAB = {
	person:           { en: 'person',          es: 'persona',          fr: 'personne',       de: 'Person',          it: 'persona',          ja: '人 (hito)' },
	bicycle:          { en: 'bicycle',         es: 'bicicleta',        fr: 'vélo',           de: 'Fahrrad',         it: 'bicicletta',       ja: '自転車 (jitensha)' },
	car:              { en: 'car',             es: 'coche',            fr: 'voiture',        de: 'Auto',            it: 'automobile',       ja: '車 (kuruma)' },
	motorcycle:       { en: 'motorcycle',      es: 'motocicleta',      fr: 'moto',           de: 'Motorrad',        it: 'motocicletta',     ja: 'オートバイ (ōtobai)' },
	airplane:         { en: 'airplane',        es: 'avión',            fr: 'avion',          de: 'Flugzeug',        it: 'aeroplano',        ja: '飛行機 (hikōki)' },
	bus:              { en: 'bus',             es: 'autobús',          fr: 'bus',            de: 'Bus',             it: 'autobus',          ja: 'バス (basu)' },
	train:            { en: 'train',           es: 'tren',             fr: 'train',          de: 'Zug',             it: 'treno',            ja: '電車 (densha)' },
	truck:            { en: 'truck',           es: 'camión',           fr: 'camion',         de: 'Lastwagen',       it: 'camion',           ja: 'トラック (torakku)' },
	boat:             { en: 'boat',            es: 'barco',            fr: 'bateau',         de: 'Boot',            it: 'barca',            ja: 'ボート (bōto)' },
	'traffic light':  { en: 'traffic light',   es: 'semáforo',         fr: 'feu tricolore',  de: 'Ampel',           it: 'semaforo',         ja: '信号 (shingō)' },
	'fire hydrant':   { en: 'fire hydrant',    es: 'boca de incendios', fr: "bouche d'incendie", de: 'Hydrant',     it: 'idrante',          ja: '消火栓 (shōkasen)' },
	'stop sign':      { en: 'stop sign',       es: 'señal de stop',    fr: "panneau stop",   de: 'Stoppschild',     it: 'segnale di stop',  ja: '一時停止標識 (ichiji teishi hyōshiki)' },
	'parking meter':  { en: 'parking meter',   es: 'parquímetro',      fr: 'parcmètre',      de: 'Parkuhr',         it: 'parchimetro',      ja: 'パーキングメーター (pākingu mētā)' },
	bench:            { en: 'bench',           es: 'banco',            fr: 'banc',           de: 'Bank',            it: 'panchina',         ja: 'ベンチ (benchi)' },
	bird:             { en: 'bird',            es: 'pájaro',           fr: 'oiseau',         de: 'Vogel',           it: 'uccello',          ja: '鳥 (tori)' },
	cat:              { en: 'cat',             es: 'gato',             fr: 'chat',           de: 'Katze',           it: 'gatto',            ja: '猫 (neko)' },
	dog:              { en: 'dog',             es: 'perro',            fr: 'chien',          de: 'Hund',            it: 'cane',             ja: '犬 (inu)' },
	horse:            { en: 'horse',           es: 'caballo',          fr: 'cheval',         de: 'Pferd',           it: 'cavallo',          ja: '馬 (uma)' },
	sheep:            { en: 'sheep',           es: 'oveja',            fr: 'mouton',         de: 'Schaf',           it: 'pecora',           ja: '羊 (hitsuji)' },
	cow:              { en: 'cow',             es: 'vaca',             fr: 'vache',          de: 'Kuh',             it: 'mucca',            ja: '牛 (ushi)' },
	elephant:         { en: 'elephant',        es: 'elefante',         fr: 'éléphant',       de: 'Elefant',         it: 'elefante',         ja: '象 (zō)' },
	bear:             { en: 'bear',            es: 'oso',              fr: 'ours',           de: 'Bär',             it: 'orso',             ja: '熊 (kuma)' },
	zebra:            { en: 'zebra',           es: 'cebra',            fr: 'zèbre',          de: 'Zebra',           it: 'zebra',            ja: 'シマウマ (shimauma)' },
	giraffe:          { en: 'giraffe',         es: 'jirafa',           fr: 'girafe',         de: 'Giraffe',         it: 'giraffa',          ja: 'キリン (kirin)' },
	backpack:         { en: 'backpack',        es: 'mochila',          fr: 'sac à dos',      de: 'Rucksack',        it: 'zaino',            ja: 'リュックサック (ryukkusakku)' },
	umbrella:         { en: 'umbrella',        es: 'paraguas',         fr: 'parapluie',      de: 'Regenschirm',     it: 'ombrello',         ja: '傘 (kasa)' },
	handbag:          { en: 'handbag',         es: 'bolso',            fr: 'sac à main',     de: 'Handtasche',      it: 'borsa',            ja: 'ハンドバッグ (handobaggu)' },
	tie:              { en: 'tie',             es: 'corbata',          fr: 'cravate',        de: 'Krawatte',        it: 'cravatta',         ja: 'ネクタイ (nekutai)' },
	suitcase:         { en: 'suitcase',        es: 'maleta',           fr: 'valise',         de: 'Koffer',          it: 'valigia',          ja: 'スーツケース (sūtsukēsu)' },
	frisbee:          { en: 'frisbee',         es: 'frisbee',          fr: 'frisbee',        de: 'Frisbee',         it: 'frisbee',          ja: 'フリスビー (furisubī)' },
	skis:             { en: 'skis',            es: 'esquís',           fr: 'skis',           de: 'Skier',           it: 'sci',              ja: 'スキー (sukī)' },
	snowboard:        { en: 'snowboard',       es: 'tabla de snowboard', fr: 'snowboard',    de: 'Snowboard',       it: 'snowboard',        ja: 'スノーボード (sunōbōdo)' },
	'sports ball':    { en: 'sports ball',     es: 'pelota',           fr: 'ballon',         de: 'Ball',            it: 'palla',            ja: 'ボール (bōru)' },
	kite:             { en: 'kite',            es: 'cometa',           fr: 'cerf-volant',    de: 'Drachen',         it: 'aquilone',         ja: '凧 (tako)' },
	'baseball bat':   { en: 'baseball bat',    es: 'bate de béisbol',  fr: 'batte de baseball', de: 'Baseballschläger', it: 'mazza da baseball', ja: 'バット (batto)' },
	'baseball glove': { en: 'baseball glove',  es: 'guante de béisbol', fr: 'gant de baseball', de: 'Baseballhandschuh', it: 'guantone',     ja: 'グローブ (gurōbu)' },
	skateboard:       { en: 'skateboard',      es: 'monopatín',        fr: 'skateboard',     de: 'Skateboard',      it: 'skateboard',       ja: 'スケートボード (sukētobōdo)' },
	surfboard:        { en: 'surfboard',       es: 'tabla de surf',    fr: 'planche de surf', de: 'Surfbrett',      it: 'tavola da surf',   ja: 'サーフボード (sāfubōdo)' },
	'tennis racket':  { en: 'tennis racket',   es: 'raqueta de tenis', fr: 'raquette de tennis', de: 'Tennisschläger', it: 'racchetta da tennis', ja: 'テニスラケット (tenisu raketto)' },
	bottle:           { en: 'bottle',          es: 'botella',          fr: 'bouteille',      de: 'Flasche',         it: 'bottiglia',        ja: 'ボトル (botoru)' },
	'wine glass':     { en: 'wine glass',      es: 'copa de vino',     fr: 'verre à vin',    de: 'Weinglas',        it: 'bicchiere da vino', ja: 'ワイングラス (wain gurasu)' },
	cup:              { en: 'cup',             es: 'taza',             fr: 'tasse',          de: 'Tasse',           it: 'tazza',            ja: 'カップ (kappu)' },
	fork:             { en: 'fork',            es: 'tenedor',          fr: 'fourchette',     de: 'Gabel',           it: 'forchetta',        ja: 'フォーク (fōku)' },
	knife:            { en: 'knife',           es: 'cuchillo',         fr: 'couteau',        de: 'Messer',          it: 'coltello',         ja: 'ナイフ (naifu)' },
	spoon:            { en: 'spoon',           es: 'cuchara',          fr: 'cuillère',       de: 'Löffel',          it: 'cucchiaio',        ja: 'スプーン (supūn)' },
	bowl:             { en: 'bowl',            es: 'cuenco',           fr: 'bol',            de: 'Schüssel',        it: 'ciotola',          ja: 'ボウル (bōru)' },
	banana:           { en: 'banana',          es: 'plátano',          fr: 'banane',         de: 'Banane',          it: 'banana',           ja: 'バナナ (banana)' },
	apple:            { en: 'apple',           es: 'manzana',          fr: 'pomme',          de: 'Apfel',           it: 'mela',             ja: 'りんご (ringo)' },
	sandwich:         { en: 'sandwich',        es: 'sándwich',         fr: 'sandwich',       de: 'Sandwich',        it: 'panino',           ja: 'サンドイッチ (sandoitchi)' },
	orange:           { en: 'orange',          es: 'naranja',          fr: 'orange',         de: 'Orange',          it: 'arancia',          ja: 'オレンジ (orenji)' },
	broccoli:         { en: 'broccoli',        es: 'brócoli',          fr: 'brocoli',        de: 'Brokkoli',        it: 'broccoli',         ja: 'ブロッコリー (burokkorī)' },
	carrot:           { en: 'carrot',          es: 'zanahoria',        fr: 'carotte',        de: 'Karotte',         it: 'carota',           ja: 'にんじん (ninjin)' },
	'hot dog':        { en: 'hot dog',         es: 'perrito caliente', fr: 'hot-dog',        de: 'Hotdog',          it: 'hot dog',          ja: 'ホットドッグ (hotto doggu)' },
	pizza:            { en: 'pizza',           es: 'pizza',            fr: 'pizza',          de: 'Pizza',           it: 'pizza',            ja: 'ピザ (piza)' },
	donut:            { en: 'donut',           es: 'dona',             fr: 'beignet',        de: 'Donut',           it: 'ciambella',        ja: 'ドーナツ (dōnatsu)' },
	cake:             { en: 'cake',            es: 'pastel',           fr: 'gâteau',         de: 'Kuchen',          it: 'torta',            ja: 'ケーキ (kēki)' },
	chair:            { en: 'chair',           es: 'silla',            fr: 'chaise',         de: 'Stuhl',           it: 'sedia',            ja: '椅子 (isu)' },
	couch:            { en: 'couch',           es: 'sofá',             fr: 'canapé',         de: 'Sofa',            it: 'divano',           ja: 'ソファ (sofa)' },
	'potted plant':   { en: 'potted plant',    es: 'planta en maceta', fr: 'plante en pot',  de: 'Topfpflanze',     it: 'pianta in vaso',   ja: '鉢植え (hachiue)' },
	bed:              { en: 'bed',             es: 'cama',             fr: 'lit',            de: 'Bett',            it: 'letto',            ja: 'ベッド (beddo)' },
	'dining table':   { en: 'dining table',    es: 'mesa',             fr: 'table',          de: 'Esstisch',        it: 'tavolo',           ja: 'テーブル (tēburu)' },
	toilet:           { en: 'toilet',          es: 'inodoro',          fr: 'toilettes',      de: 'Toilette',        it: 'gabinetto',        ja: 'トイレ (toire)' },
	tv:               { en: 'TV',              es: 'televisor',        fr: 'télévision',     de: 'Fernseher',       it: 'televisore',       ja: 'テレビ (terebi)' },
	laptop:           { en: 'laptop',          es: 'portátil',         fr: 'ordinateur portable', de: 'Laptop',     it: 'portatile',        ja: 'ノートパソコン (nōto pasokon)' },
	mouse:            { en: 'mouse',           es: 'ratón',            fr: 'souris',         de: 'Maus',            it: 'mouse',            ja: 'マウス (mausu)' },
	remote:           { en: 'remote',          es: 'mando',            fr: 'télécommande',   de: 'Fernbedienung',   it: 'telecomando',      ja: 'リモコン (rimokon)' },
	keyboard:         { en: 'keyboard',        es: 'teclado',          fr: 'clavier',        de: 'Tastatur',        it: 'tastiera',         ja: 'キーボード (kībōdo)' },
	'cell phone':     { en: 'cell phone',      es: 'teléfono móvil',   fr: 'téléphone',      de: 'Handy',           it: 'cellulare',        ja: '携帯電話 (keitai denwa)' },
	microwave:        { en: 'microwave',       es: 'microondas',       fr: 'micro-ondes',    de: 'Mikrowelle',      it: 'microonde',        ja: '電子レンジ (denshi renji)' },
	oven:             { en: 'oven',            es: 'horno',            fr: 'four',           de: 'Ofen',            it: 'forno',            ja: 'オーブン (ōbun)' },
	toaster:          { en: 'toaster',         es: 'tostadora',        fr: 'grille-pain',    de: 'Toaster',         it: 'tostapane',        ja: 'トースター (tōsutā)' },
	sink:             { en: 'sink',            es: 'fregadero',        fr: 'évier',          de: 'Spüle',           it: 'lavandino',        ja: '流し台 (nagashidai)' },
	refrigerator:     { en: 'refrigerator',    es: 'nevera',           fr: 'réfrigérateur',  de: 'Kühlschrank',     it: 'frigorifero',      ja: '冷蔵庫 (reizōko)' },
	book:             { en: 'book',            es: 'libro',            fr: 'livre',          de: 'Buch',            it: 'libro',            ja: '本 (hon)' },
	clock:            { en: 'clock',           es: 'reloj',            fr: 'horloge',        de: 'Uhr',             it: 'orologio',         ja: '時計 (tokei)' },
	vase:             { en: 'vase',            es: 'jarrón',           fr: 'vase',           de: 'Vase',            it: 'vaso',             ja: '花瓶 (kabin)' },
	scissors:         { en: 'scissors',        es: 'tijeras',          fr: 'ciseaux',        de: 'Schere',          it: 'forbici',          ja: 'はさみ (hasami)' },
	'teddy bear':     { en: 'teddy bear',      es: 'oso de peluche',   fr: 'ours en peluche', de: 'Teddybär',       it: 'orsacchiotto',     ja: 'テディベア (tedibea)' },
	'hair drier':     { en: 'hair drier',      es: 'secador',          fr: 'sèche-cheveux',  de: 'Föhn',            it: 'asciugacapelli',   ja: 'ドライヤー (doraiyā)' },
	toothbrush:       { en: 'toothbrush',      es: 'cepillo de dientes', fr: 'brosse à dents', de: 'Zahnbürste',    it: 'spazzolino',       ja: '歯ブラシ (haburashi)' },
};

// Conversation scenarios. Each exchange: what the other person says + responses you can pick.
const CONVERSATIONS = {
	greetings: {
		title: 'Greetings',
		icon: '👋',
		exchanges: [
			{
				prompt: { en: 'Hello! How are you?', es: '¡Hola! ¿Cómo estás?', fr: 'Bonjour ! Comment ça va ?', de: 'Hallo! Wie geht es dir?', it: 'Ciao! Come stai?', ja: 'こんにちは！お元気ですか？ (Konnichiwa! Ogenki desu ka?)' },
				responses: [
					{ en: "I'm well, thanks.", es: 'Estoy bien, gracias.', fr: 'Je vais bien, merci.', de: 'Mir geht es gut, danke.', it: 'Sto bene, grazie.', ja: '元気です、ありがとう。 (Genki desu, arigatō.)' },
					{ en: 'Not bad, and you?', es: 'No mal, ¿y tú?', fr: 'Pas mal, et toi ?', de: 'Nicht schlecht, und dir?', it: 'Non male, e tu?', ja: 'まあまあです、あなたは？ (Māmā desu, anata wa?)' },
					{ en: 'A little tired.', es: 'Un poco cansado.', fr: 'Un peu fatigué.', de: 'Ein bisschen müde.', it: 'Un po’ stanco.', ja: '少し疲れています。 (Sukoshi tsukarete imasu.)' },
				],
			},
			{
				prompt: { en: 'What is your name?', es: '¿Cómo te llamas?', fr: 'Comment tu t’appelles ?', de: 'Wie heißt du?', it: 'Come ti chiami?', ja: 'お名前は何ですか？ (Onamae wa nan desu ka?)' },
				responses: [
					{ en: 'My name is Alex.', es: 'Me llamo Alex.', fr: 'Je m’appelle Alex.', de: 'Ich heiße Alex.', it: 'Mi chiamo Alex.', ja: '私はアレックスです。 (Watashi wa Arekkusu desu.)' },
					{ en: 'Nice to meet you.', es: 'Encantado de conocerte.', fr: 'Enchanté.', de: 'Freut mich.', it: 'Piacere di conoscerti.', ja: 'はじめまして。 (Hajimemashite.)' },
				],
			},
		],
	},
	cafe: {
		title: 'Ordering at a café',
		icon: '☕',
		exchanges: [
			{
				prompt: { en: 'What would you like to order?', es: '¿Qué desea pedir?', fr: 'Que voulez-vous commander ?', de: 'Was möchten Sie bestellen?', it: 'Cosa desidera ordinare?', ja: 'ご注文は何になさいますか？ (Gochūmon wa nani ni nasaimasu ka?)' },
				responses: [
					{ en: 'A coffee, please.', es: 'Un café, por favor.', fr: 'Un café, s’il vous plaît.', de: 'Einen Kaffee, bitte.', it: 'Un caffè, per favore.', ja: 'コーヒーをお願いします。 (Kōhī o onegai shimasu.)' },
					{ en: 'I would like a tea.', es: 'Quisiera un té.', fr: 'Je voudrais un thé.', de: 'Ich hätte gern einen Tee.', it: 'Vorrei un tè.', ja: 'お茶をください。 (Ocha o kudasai.)' },
					{ en: 'Do you have anything without sugar?', es: '¿Tiene algo sin azúcar?', fr: 'Avez-vous quelque chose sans sucre ?', de: 'Haben Sie etwas ohne Zucker?', it: 'Avete qualcosa senza zucchero?', ja: '砂糖なしのものはありますか？ (Satō nashi no mono wa arimasu ka?)' },
				],
			},
			{
				prompt: { en: 'For here or to go?', es: '¿Para aquí o para llevar?', fr: 'Sur place ou à emporter ?', de: 'Zum hier essen oder zum Mitnehmen?', it: 'Qui o da portare via?', ja: '店内ですか、お持ち帰りですか？ (Tennai desu ka, omochikaeri desu ka?)' },
				responses: [
					{ en: 'To go, please.', es: 'Para llevar, por favor.', fr: 'À emporter, s’il vous plaît.', de: 'Zum Mitnehmen, bitte.', it: 'Da portare via, per favore.', ja: '持ち帰りでお願いします。 (Mochikaeri de onegai shimasu.)' },
					{ en: 'For here.', es: 'Para aquí.', fr: 'Sur place.', de: 'Zum hier essen.', it: 'Qui, grazie.', ja: '店内で。 (Tennai de.)' },
				],
			},
		],
	},
	directions: {
		title: 'Asking directions',
		icon: '🧭',
		exchanges: [
			{
				prompt: { en: 'Can I help you find something?', es: '¿Le ayudo a encontrar algo?', fr: 'Puis-je vous aider à trouver quelque chose ?', de: 'Kann ich Ihnen helfen, etwas zu finden?', it: 'Posso aiutarla a trovare qualcosa?', ja: '何かお探しですか？ (Nanika osagashi desu ka?)' },
				responses: [
					{ en: 'Where is the station?', es: '¿Dónde está la estación?', fr: 'Où est la gare ?', de: 'Wo ist der Bahnhof?', it: 'Dov’è la stazione?', ja: '駅はどこですか？ (Eki wa doko desu ka?)' },
					{ en: 'Is it far from here?', es: '¿Está lejos de aquí?', fr: 'C’est loin d’ici ?', de: 'Ist es weit von hier?', it: 'È lontano da qui?', ja: 'ここから遠いですか？ (Koko kara tōi desu ka?)' },
					{ en: 'No thanks, just looking.', es: 'No gracias, solo miro.', fr: 'Non merci, je regarde juste.', de: 'Nein danke, ich schaue nur.', it: 'No grazie, sto solo guardando.', ja: 'いいえ、見ているだけです。 (Iie, mite iru dake desu.)' },
				],
			},
		],
	},
	shopping: {
		title: 'Shopping',
		icon: '🛍️',
		exchanges: [
			{
				prompt: { en: 'How much does this cost?', es: '¿Cuánto cuesta esto?', fr: 'Combien ça coûte ?', de: 'Wie viel kostet das?', it: 'Quanto costa questo?', ja: 'これはいくらですか？ (Kore wa ikura desu ka?)' },
				responses: [
					{ en: "I'll take it.", es: 'Me lo llevo.', fr: 'Je le prends.', de: 'Ich nehme es.', it: 'Lo prendo.', ja: 'これをください。 (Kore o kudasai.)' },
					{ en: "It's too expensive.", es: 'Es demasiado caro.', fr: 'C’est trop cher.', de: 'Das ist zu teuer.', it: 'È troppo caro.', ja: '高すぎます。 (Takasugimasu.)' },
					{ en: 'Can I pay by card?', es: '¿Puedo pagar con tarjeta?', fr: 'Puis-je payer par carte ?', de: 'Kann ich mit Karte zahlen?', it: 'Posso pagare con la carta?', ja: 'カードで払えますか？ (Kādo de haraemasu ka?)' },
				],
			},
		],
	},
};

window.LL_DATA = { BASE_LANG, LANGUAGES, VOCAB, CONVERSATIONS };
