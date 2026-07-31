let worksInitialized = false;

const defaults = [
  ["VOID", "数字时装身份", "以生成式视觉构建可持续演化的数字时装身份系统。", "identity"],
  ["NOVA TWIN", "AI 双生系统", "连接人类直觉与机器生成能力的视觉身份实验。", "orbit"],
  ["TECH WITH A HUMAN PULSE", "让科技更像人", "一次关于科技品牌温度、信任与表达方式的视觉重构。", "signal"],
  ["DUAL SIGNAL", "生成字体实验", "让文字在秩序与干扰之间形成动态视觉信号。", "type"],
  ["SYNTHETIC MEMORY", "合成记忆", "以图像、文本和数据重新想象记忆如何被保存与讲述。", "memory"],
  ["SANKOU × INTELLIGENCE", "品牌协作系统", "把策略、视觉和智能工具组织成可复用的品牌系统。", "system"],
  ["MAKE IDEAS MOVE", "动态视觉", "为品牌概念建立具有节奏与方向感的动态语言。", "motion"],
  ["FUTURE EXPERIENCE", "未来零售体验", "未来不是一种风格，而是一套可以被感知的体验。", "retail"],
  ["HUMAN MACHINE CULTURE", "人机文化", "观察人类创造力与智能系统共同形成的新文化。", "culture"],
  ["NEW SPECIES", "新世界物种", "通过生成式叙事探索尚未出现的角色与视觉世界。", "world"],
];

export async function ensureWorksTable(database:D1Database) {
  if (worksInitialized) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS selected_works (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    image_key TEXT NOT NULL DEFAULT '',
    image_type TEXT NOT NULL DEFAULT '',
    visual_key TEXT NOT NULL DEFAULT 'custom',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`).run();
  await database.prepare(`CREATE TABLE IF NOT EXISTS work_content_blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    work_id INTEGER NOT NULL,
    image_key TEXT NOT NULL,
    image_type TEXT NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`).run();
  const count = await database.prepare("SELECT COUNT(*) AS count FROM selected_works").first<{ count:number }>();
  if (!count?.count) {
    const createdAt = new Date().toISOString();
    await database.batch(defaults.map((work,index) => database.prepare("INSERT INTO selected_works (title, summary, content, visual_key, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(work[0], work[1], work[2], work[3], index, createdAt)));
  }
  worksInitialized = true;
}
