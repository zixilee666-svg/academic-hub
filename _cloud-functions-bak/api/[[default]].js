// ========================================
// Joan's Academic Hub — EdgeOne Cloud Functions (Node.js)
// ========================================
// Express 主入口，处理所有 /api/* 请求
// 部署路径: cloud-functions/api/[[default]].js

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

// ===== KV Storage Adapter =====
// EdgeOne KV 通过环境变量绑定
// 开发环境使用内存模拟
class KVAdapter {
  constructor() {
    this.store = new Map();
    this.ready = false;
  }

  async init() {
    // 生产环境从 KV 加载种子数据，开发环境使用内存
    if (!this.ready) {
      this.ready = true;
    }
  }

  async get(key) {
    // 生产: return await EDGEONE_KV.get(key, { type: 'json' })
    const val = this.store.get(key);
    return val ? JSON.parse(val) : null;
  }

  async put(key, value, ttl) {
    // 生产: await EDGEONE_KV.put(key, JSON.stringify(value), { expirationTtl: ttl })
    this.store.set(key, JSON.stringify(value));
  }

  async delete(key) {
    this.store.delete(key);
  }

  async list(prefix) {
    const results = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        results.push(JSON.parse(this.store.get(key)));
      }
    }
    return results;
  }

  async keys(prefix) {
    const result = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        result.push(key);
      }
    }
    return result;
  }
}

const kv = new KVAdapter();
await kv.init();

// ===== Seed Data Auto-Init =====
// 首次启动时自动加载种子数据（仅当 papers:all 不存在时）
async function initSeedData() {
  const existing = await kv.get('papers:all');
  if (existing && existing.length > 0) return;

  // 种子论文数据（与前端 mockPapers 保持一致）
  const seedPapers = [
    {
      id: 'p-001', title: 'Semi-Supervised Classification with Graph Convolutional Networks',
      authors: ['T.N. Kipf', 'M. Welling'], year: 2017, venue: 'ICLR 2017', venueType: 'conference',
      abstract: 'We present a scalable approach for semi-supervised learning on graph-structured data that is based on an efficient variant of convolutional neural networks operating directly on graphs.',
      keywords: ['GCN', 'semi-supervised', 'graph neural network'], doi: '10.5555/3295222.3295313',
      tags: ['GNN', '经典论文'], isFavorited: true, readingStatus: 'completed', addedDate: '2026-04-20T10:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/1609.02907',
    },
    {
      id: 'p-002', title: 'Graph Attention Networks',
      authors: ['P. Veličković', 'G. Cucurull', 'A. Casanova', 'A. Romero', 'P. Liò', 'Y. Bengio'],
      year: 2018, venue: 'ICLR 2018', venueType: 'conference',
      abstract: 'We propose Graph Attention Networks (GATs), novel neural network architectures that operate on graph-structured data, leveraging masked self-attentional layers.',
      keywords: ['GAT', 'attention mechanism', 'graph neural network'], doi: '10.5555/3327758.3327825',
      tags: ['GNN', '注意力机制'], isFavorited: true, readingStatus: 'reading', addedDate: '2026-04-21T08:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/1710.10903',
    },
    {
      id: 'p-003', title: 'Heterogeneous Graph Attention Network',
      authors: ['X. Wang', 'H. Ji', 'C. Shi', 'B. Wang', 'Y. Ye', 'P. Cui', 'P.S. Yu'],
      year: 2019, venue: 'WWW 2019', venueType: 'conference',
      abstract: 'In real world, different types of objects and rich interactions between them form heterogeneous information networks. We propose the Heterogeneous Graph Attention Network (HAN).',
      keywords: ['HAN', 'heterogeneous graph', 'attention', 'meta-path'], doi: '10.1145/3308558.3313418',
      tags: ['HGNN', '元路径'], isFavorited: false, readingStatus: 'unread', addedDate: '2026-04-22T12:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/1903.07293',
    },
    {
      id: 'p-004', title: 'CARE-GNN: Collaborative Learning for Financial Fraud Detection',
      authors: ['Y. Liu', 'Y. Li', 'X. Wu', 'F. Ye', 'M. Ester', 'J. Liang'],
      year: 2020, venue: 'CIKM 2020', venueType: 'conference',
      abstract: 'We propose a novel graph-based approach, CARE-GNN, which effectively leverages the topological and relational information to improve financial fraud detection.',
      keywords: ['fraud detection', 'GNN', 'reinforcement learning', 'relation-aware'],
      tags: ['金融欺诈', '图方法'], isFavorited: true, readingStatus: 'completed', addedDate: '2026-04-23T09:00:00Z',
    },
    {
      id: 'p-005', title: 'Heterogeneous Graph Transformer',
      authors: ['Y. Hu', 'Z. Li', 'D. Wang', 'S. Liang', 'Y. Chang', 'Q.V.H. Nguyen'],
      year: 2020, venue: 'WWW 2020', venueType: 'conference',
      abstract: 'We propose the Heterogeneous Graph Transformer (HGT) for modeling heterogeneous web data. HGT introduces a novel heterogeneous mutual attention mechanism.',
      keywords: ['HGT', 'heterogeneous graph', 'transformer', 'attention'], doi: '10.1145/3366423.3380287',
      tags: ['HGNN', 'Transformer'], isFavorited: false, readingStatus: 'reading', addedDate: '2026-04-24T10:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/2003.01345',
    },
    {
      id: 'p-006', title: 'Inductive Representation Learning on Large Graphs',
      authors: ['W.L. Hamilton', 'R. Ying', 'J. Leskovec'],
      year: 2017, venue: 'NeurIPS 2017', venueType: 'conference',
      abstract: 'We present GraphSAGE, a general inductive learning framework that leverages node feature information to efficiently generate node embeddings for previously unseen data.',
      keywords: ['GraphSAGE', 'inductive learning', 'sampling', 'node embedding'],
      tags: ['GNN', '经典论文'], isFavorited: false, readingStatus: 'completed', addedDate: '2026-04-24T11:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/1706.02216',
    },
    {
      id: 'p-007', title: 'Relational Graph Convolutional Networks',
      authors: ['M. Schlichtkrull', 'T.N. Kipf', 'R. Bloem', 'P. van den Berg', 'I. Titov', 'M. Welling'],
      year: 2018, venue: 'Relational Representation Learning, NIPS 2018 Workshop', venueType: 'conference',
      abstract: 'We propose relational graph convolutional networks (R-GCNs) which apply specialized aggregation functions to nodes belonging to different edge types.',
      keywords: ['RGCN', 'relational graph', 'knowledge graph'],
      tags: ['HGNN', '知识图谱'], isFavorited: false, readingStatus: 'unread', addedDate: '2026-04-25T08:00:00Z',
      pdfUrl: 'https://arxiv.org/abs/1703.06103',
    },
    {
      id: 'p-008', title: 'Dual Graph Convolutional Networks for Fraud Detection',
      authors: ['J. Dou', 'Y. Liu', 'F. Liu', 'X. Yu', 'J. Li'],
      year: 2020, venue: 'CIKM 2020', venueType: 'conference',
      abstract: 'We propose a dual Graph Convolutional Network (Dual-GCN) framework for fraud detection, which consists of a relation-aware GCN and an intuitionistic GCN.',
      keywords: ['fraud detection', 'dual GCN', 'heterogeneous graph'],
      tags: ['金融欺诈', '图方法'], isFavorited: false, readingStatus: 'unread', addedDate: '2026-04-25T09:00:00Z',
    },
  ];

  const seedProjects = [
    {
      id: 'proj-001', name: 'HGNN 金融欺诈检测综述',
      description: '基于异质图神经网络的金融欺诈检测方法综述论文',
      status: 'active', goalCount: 12, completedGoals: 7,
      startDate: '2026-03-01', targetDate: '2026-06-30',
      tags: ['综述', 'HGNN', '金融欺诈'], paperIds: ['p-001', 'p-002', 'p-003', 'p-004', 'p-005'],
      objectives: [
        { id: 'obj-1', text: '文献检索与筛选', completed: true },
        { id: 'obj-2', text: 'GNN 基础理论梳理', completed: true },
        { id: 'obj-3', text: 'HGNN 方法分类', completed: true },
        { id: 'obj-4', text: '金融欺诈数据集分析', completed: true },
        { id: 'obj-5', text: '实验对比框架设计', completed: true },
        { id: 'obj-6', text: '综述初稿撰写', completed: true },
        { id: 'obj-7', text: '文献真实性验证', completed: true },
        { id: 'obj-8', text: '终稿修订', completed: false },
        { id: 'obj-9', text: '导师审阅反馈', completed: false },
        { id: 'obj-10', text: '投稿', completed: false },
      ],
      notes: '', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z',
    },
    {
      id: 'proj-002', name: '多尺度元路径融合实验',
      description: '基于多尺度元路径融合的异质图神经网络在电商欺诈检测中的应用实验',
      status: 'active', goalCount: 8, completedGoals: 2,
      startDate: '2026-04-15', targetDate: '2026-07-31',
      tags: ['实验', '元路径', '电商欺诈'], paperIds: ['p-003', 'p-004'],
      objectives: [
        { id: 'obj-11', text: '环境搭建', completed: true },
        { id: 'obj-12', text: '数据预处理', completed: true },
        { id: 'obj-13', text: '基线模型复现', completed: false },
        { id: 'obj-14', text: '多尺度融合模型实现', completed: false },
        { id: 'obj-15', text: '消融实验', completed: false },
        { id: 'obj-16', text: '结果分析', completed: false },
      ],
      notes: '', createdAt: '2026-04-15T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z',
    },
    {
      id: 'proj-003', name: 'GNN 核心理论梳理',
      description: '系统梳理 GNN 核心理论：从谱图理论到消息传递范式',
      status: 'completed', goalCount: 10, completedGoals: 10,
      startDate: '2026-02-01', targetDate: '2026-04-01',
      tags: ['学习', 'GNN', '理论'], paperIds: ['p-001', 'p-002', 'p-006'],
      objectives: [
        { id: 'obj-17', text: '谱图理论', completed: true },
        { id: 'obj-18', text: 'GCN 推导', completed: true },
        { id: 'obj-19', text: 'GAT 注意力机制', completed: true },
        { id: 'obj-20', text: 'GraphSAGE 采样', completed: true },
      ],
      notes: '已完成第一阶段训练', createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-04-01T00:00:00Z',
    },
  ];

  await kv.put('papers:all', seedPapers);
  for (const p of seedPapers) {
    await kv.put(`papers:${p.id}`, p);
  }
  await kv.put('projects:all', seedProjects);

  console.log(`[Seed] 已初始化 ${seedPapers.length} 篇论文, ${seedProjects.length} 个项目`);
}

await initSeedData();

// ===== JWT Helpers =====
const JWT_SECRET = process.env.JWT_SECRET || 'joan-academic-hub-dev-secret-key-2026';

function signJWT(payload, expiresIn = '7d') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn === '7d' ? now + 7 * 24 * 3600 : now + 3600;
  const payloadData = { ...payload, iat: now, exp };
  const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signatureInput = `${base64Url(header)}.${base64Url(payloadData)}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url');
  return `${signatureInput}.${signature}`;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url');
    if (expectedSig !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ===== Password Hashing (bcrypt-like with crypto) =====
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

// ===== Rate Limiter =====
const rateLimitMap = new Map();
function rateLimit(userId, maxRequests = 60, windowMs = 60000) {
  const key = `rl:${userId}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.startTime > windowMs) {
    rateLimitMap.set(key, { count: 1, startTime: now });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ===== Auth Middleware =====
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: '令牌无效或已过期' });
  }

  req.userId = payload.userId;
  req.userRole = payload.role || 'user';
  next();
}

function adminMiddleware(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  next();
}

// ===== WorkBuddy Admin Middleware =====
function wbAdminMiddleware(req, res, next) {
  const wbToken = req.headers['x-wb-token'];
  if (wbToken !== process.env.WORKBUDDY_ADMIN_TOKEN && wbToken !== 'dev-wb-admin-token') {
    return res.status(403).json({ success: false, error: 'WorkBuddy admin token 无效' });
  }
  next();
}

// ===== Express App =====
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check（含种子数据状态）
app.get('/api/health', async (req, res) => {
  const papers = (await kv.get('papers:all')) || [];
  const projects = (await kv.get('projects:all')) || [];
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      kvSize: kv.store.size,
      papersCount: papers.length,
      projectsCount: projects.length,
      fixedAdmin: true,
      version: '2.0.0',
    },
  });
});

// ===== 固定管理员账户 =====
const FIXED_ADMIN = {
  id: 'admin-fixed',
  username: 'admin',
  password: '123456',
  displayName: 'Administrator',
  email: 'admin@academic-hub.dev',
  institution: 'Joan Academic Hub',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

// ===== Auth Routes =====

// 注册路由保留，但已注册用户需要通过登录验证
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, institution } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    if (password.length < 1) {
      return res.status(400).json({ success: false, error: '密码不能为空' });
    }

    const existingUser = await kv.get(`users:username:${username}`);
    if (existingUser) {
      return res.status(409).json({ success: false, error: '用户名已存在' });
    }

    const userId = `user_${Date.now().toString(36)}`;
    const hashedPassword = await hashPassword(password);

    const user = {
      id: userId,
      username,
      displayName: username,
      institution: institution || '',
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    await kv.put(`users:username:${username}`, { id: userId });
    await kv.put(`users:${userId}`, user);
    await kv.put(`users:${userId}:password`, hashedPassword);

    const token = signJWT({ userId, role: 'user', username });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 登录路由：优先检查固定管理员，再检查 KV 用户
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }

    // 固定管理员账户：admin / 123456
    if (username === FIXED_ADMIN.username && password === FIXED_ADMIN.password) {
      const token = signJWT({
        userId: FIXED_ADMIN.id,
        role: FIXED_ADMIN.role,
        username: FIXED_ADMIN.username,
      });
      const { password: _, ...safeUser } = FIXED_ADMIN;
      return res.json({ success: true, data: { token, user: safeUser } });
    }

    // KV 用户查找
    const usernameRecord = await kv.get(`users:username:${username}`);
    if (!usernameRecord) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const user = await kv.get(`users:${usernameRecord.id}`);
    const storedPassword = await kv.get(`users:${usernameRecord.id}:password`);

    if (!user || !storedPassword || !(await verifyPassword(password, storedPassword))) {
      return res.status(401).json({ success: false, error: '用户名或密码错误' });
    }

    const token = signJWT({ userId: user.id, role: user.role, username: user.username });
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: '已登出' });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    // 固定管理员直接返回
    if (req.userId === FIXED_ADMIN.id) {
      const { password: _, ...safeUser } = FIXED_ADMIN;
      return res.json({ success: true, data: safeUser });
    }
    const user = await kv.get(`users:${req.userId}`);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Papers Routes =====
app.get('/api/papers', authMiddleware, async (req, res) => {
  try {
    const { search, tag, page = 1, pageSize = 20 } = req.query;
    let papers = (await kv.get('papers:all')) || [];

    if (search) {
      const q = search.toLowerCase();
      papers = papers.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.authors.some(a => a.toLowerCase().includes(q)) ||
        p.keywords.some(k => k.toLowerCase().includes(q)) ||
        p.abstract.toLowerCase().includes(q)
      );
    }

    if (tag) {
      papers = papers.filter(p => p.tags.includes(tag) || p.keywords.some(k => k.toLowerCase().includes(tag.toLowerCase())));
    }

    // 按添加日期倒序
    papers.sort((a, b) => new Date(b.addedDate) - new Date(a.addedDate));

    const total = papers.length;
    const start = (Number(page) - 1) * Number(pageSize);
    const paginatedPapers = papers.slice(start, start + Number(pageSize));

    // Filter favorites for current user
    const userFavorites = (await kv.get(`favorites:${req.userId}`)) || [];
    const favoriteIds = new Set(userFavorites.map(f => f.paperId));

    const enrichedPapers = paginatedPapers.map(p => ({
      ...p,
      isFavorited: favoriteIds.has(p.id),
    }));

    res.json({ success: true, data: enrichedPapers, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/papers/:id', authMiddleware, async (req, res) => {
  try {
    const papers = (await kv.get('papers:all')) || [];
    const paper = papers.find(p => p.id === req.params.id);
    if (!paper) {
      return res.status(404).json({ success: false, error: '文献不存在' });
    }
    const userFavorites = (await kv.get(`favorites:${req.userId}`)) || [];
    paper.isFavorited = userFavorites.some(f => f.paperId === paper.id);
    res.json({ success: true, data: paper });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/papers', authMiddleware, async (req, res) => {
  try {
    const papers = (await kv.get('papers:all')) || [];
    const newPaper = {
      id: `paper_${Date.now().toString(36)}`,
      addedDate: new Date().toISOString(),
      citationCount: 0,
      isFavorited: false,
      addedBy: req.userId,
      ...req.body,
    };
    papers.push(newPaper);
    await kv.put('papers:all', papers);
    await kv.put(`papers:${newPaper.id}`, newPaper);
    res.json({ success: true, data: newPaper });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/papers/:id', authMiddleware, async (req, res) => {
  try {
    const papers = (await kv.get('papers:all')) || [];
    const idx = papers.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: '文献不存在' });
    papers[idx] = { ...papers[idx], ...req.body, id: req.params.id };
    await kv.put('papers:all', papers);
    await kv.put(`papers:${req.params.id}`, papers[idx]);
    res.json({ success: true, data: papers[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/papers/:id', authMiddleware, async (req, res) => {
  try {
    let papers = (await kv.get('papers:all')) || [];
    papers = papers.filter(p => p.id !== req.params.id);
    await kv.put('papers:all', papers);
    await kv.delete(`papers:${req.params.id}`);
    res.json({ success: true, message: '已删除' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/papers/:id/favorite', authMiddleware, async (req, res) => {
  try {
    let favorites = (await kv.get(`favorites:${req.userId}`)) || [];
    const existingIdx = favorites.findIndex(f => f.paperId === req.params.id);
    let isFavorited;
    if (existingIdx >= 0) {
      favorites.splice(existingIdx, 1);
      isFavorited = false;
    } else {
      favorites.push({ paperId: req.params.id, timestamp: new Date().toISOString() });
      isFavorited = true;
    }
    await kv.put(`favorites:${req.userId}`, favorites);
    res.json({ success: true, data: { isFavorited } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Notes Routes =====
app.get('/api/papers/:paperId/notes', authMiddleware, async (req, res) => {
  try {
    const notes = (await kv.get(`notes:${req.params.paperId}`)) || [];
    res.json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/papers/:paperId/notes', authMiddleware, async (req, res) => {
  try {
    const notes = (await kv.get(`notes:${req.params.paperId}`)) || [];
    const newNote = {
      id: `note_${Date.now().toString(36)}`,
      paperId: req.params.paperId,
      content: req.body.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.userId,
    };
    notes.push(newNote);
    await kv.put(`notes:${req.params.paperId}`, notes);
    res.json({ success: true, data: newNote });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Highlights Routes =====
app.get('/api/papers/:paperId/highlights', authMiddleware, async (req, res) => {
  try {
    const highlights = (await kv.get(`highlights:${req.params.paperId}`)) || [];
    res.json({ success: true, data: highlights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/papers/:paperId/highlights', authMiddleware, async (req, res) => {
  try {
    const highlights = (await kv.get(`highlights:${req.params.paperId}`)) || [];
    const newHighlight = {
      id: `hl_${Date.now().toString(36)}`,
      paperId: req.params.paperId,
      createdAt: new Date().toISOString(),
      userId: req.userId,
      ...req.body,
    };
    highlights.push(newHighlight);
    await kv.put(`highlights:${req.params.paperId}`, highlights);
    res.json({ success: true, data: newHighlight });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Projects Routes =====
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const projects = (await kv.get('projects:all')) || [];
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const projects = (await kv.get('projects:all')) || [];
    const newProject = {
      id: `proj_${Date.now().toString(36)}`,
      progress: 0,
      status: 'planned',
      objectives: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: req.userId,
      ...req.body,
    };
    projects.push(newProject);
    await kv.put('projects:all', projects);
    res.json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const projects = (await kv.get('projects:all')) || [];
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: '项目不存在' });
    projects[idx] = { ...projects[idx], ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    await kv.put('projects:all', projects);
    res.json({ success: true, data: projects[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    let projects = (await kv.get('projects:all')) || [];
    projects = projects.filter(p => p.id !== req.params.id);
    await kv.put('projects:all', projects);
    res.json({ success: true, message: '已删除' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Reading Records & Stats =====
app.post('/api/reading-records', authMiddleware, async (req, res) => {
  try {
    const records = (await kv.get(`reading_records:${req.userId}`)) || [];
    const newRecord = {
      id: `rec_${Date.now().toString(36)}`,
      userId: req.userId,
      timestamp: new Date().toISOString(),
      ...req.body,
    };
    records.push(newRecord);
    // 只保留最近 1000 条
    if (records.length > 1000) {
      await kv.put(`reading_records:${req.userId}`, records.slice(-1000));
    } else {
      await kv.put(`reading_records:${req.userId}`, records);
    }
    res.json({ success: true, data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stats/reading', authMiddleware, async (req, res) => {
  try {
    const records = (await kv.get(`reading_records:${req.userId}`)) || [];
    const papers = (await kv.get('papers:all')) || [];
    const favorites = (await kv.get(`favorites:${req.userId}`)) || [];

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const weeklyRead = records.filter(r => r.action === 'read' && new Date(r.timestamp) >= weekAgo).length;

    // Heatmap: past 90 days
    const heatmap = new Array(90).fill(0);
    for (let i = 0; i < 90; i++) {
      const dayStart = new Date(now.getTime() - (89 - i) * 24 * 3600 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);
      heatmap[i] = records.filter(r => {
        const t = new Date(r.timestamp);
        return t >= dayStart && t < dayEnd && (r.action === 'read' || r.action === 'open');
      }).length;
    }

    res.json({
      success: true,
      data: {
        totalPapers: papers.length,
        weeklyRead,
        toRead: papers.filter(p => !favorites.some(f => f.paperId === p.id)).length,
        points: records.length * 10 + favorites.length * 5,
        streakDays: 0, // simplified
        weeklyHeatmap: heatmap,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Search Routes (arXiv / Semantic Scholar) =====
app.get('/api/search/arxiv', authMiddleware, async (req, res) => {
  try {
    const { query, start = 0, maxResults = 10 } = req.query;
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=${start}&max_results=${maxResults}`;
    const response = await fetch(arxivUrl);
    const text = await response.text();

    // Parse arXiv XML response
    const results = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(text)) !== null) {
      const entry = match[1];
      const title = (entry.match(/<title>(.*?)<\/title>/s) || [])[1]?.trim() || '';
      const summary = (entry.match(/<summary>(.*?)<\/summary>/s) || [])[1]?.trim() || '';
      const id = (entry.match(/<id>(.*?)<\/id>/) || [])[1] || '';
      const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1] || '';
      const authors = [...entry.matchAll(/<name>(.*?)<\/name>/g)].map(m => m[1]);
      results.push({
        id: id.split('/').pop(),
        title,
        summary,
        published,
        authors,
        source: 'arxiv',
        pdfUrl: id.replace(/abs/, 'pdf'),
      });
    }
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/search/semantic-scholar', authMiddleware, async (req, res) => {
  try {
    const { query, offset = 0, limit = 10 } = req.query;
    const s2Url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&offset=${offset}&limit=${limit}&fields=title,abstract,authors,year,citationCount,externalIds,openAccessPdf`;
    const response = await fetch(s2Url);
    const data = await response.json();
    const results = (data.data || []).map(p => ({
      id: p.paperId,
      title: p.title,
      abstract: p.abstract || '',
      year: p.year,
      authors: (p.authors || []).map(a => a.name),
      citationCount: p.citationCount || 0,
      doi: p.externalIds?.DOI,
      pdfUrl: p.openAccessPdf?.url || '',
      source: 'semantic-scholar',
    }));
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/search/import', authMiddleware, async (req, res) => {
  try {
    const papers = (await kv.get('papers:all')) || [];
    const { title, authors, year, abstract, doi, pdfUrl, source, keywords } = req.body;
    const newPaper = {
      id: `paper_${Date.now().toString(36)}`,
      title: title || 'Untitled',
      authors: authors || [],
      year: year || new Date().getFullYear(),
      venue: source === 'arxiv' ? 'arXiv preprint' : 'Semantic Scholar',
      venueType: 'preprint',
      abstract: abstract || '',
      keywords: keywords || [],
      pdfUrl: pdfUrl || '',
      doi: doi || '',
      citationCount: 0,
      isFavorited: true,
      addedDate: new Date().toISOString(),
      tags: ['Imported'],
      joanNote: '',
      addedBy: req.userId,
    };
    papers.push(newPaper);
    await kv.put('papers:all', papers);
    res.json({ success: true, data: newPaper });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== AI Chat Route (SSE streaming) =====
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    const llmApiBase = process.env.LLM_API_BASE;
    const llmApiKey = process.env.LLM_API_KEY;

    if (!llmApiBase || !llmApiKey) {
      return res.status(503).json({
        success: false,
        error: 'AI 服务尚未配置，请在环境变量中设置 LLM_API_BASE 和 LLM_API_KEY',
      });
    }

    // Save user message
    const conversations = (await kv.get(`ai_conversations:${req.userId}`)) || [];
    let currentConv = conversations.find(c => c.id === conversationId);
    if (!currentConv) {
      currentConv = {
        id: `conv_${Date.now().toString(36)}`,
        userId: req.userId,
        title: message.slice(0, 50),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversations.push(currentConv);
    }
    currentConv.messages.push({
      id: `msg_${Date.now().toString(36)}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    await kv.put(`ai_conversations:${req.userId}`, conversations);

    // Build system prompt with Joan persona
    const systemPrompt = `你是 Joan（贞德・达尔克），一位温和沉静、严谨自律的 AI 科研学习引导者。你正在用户的学术文献管理平台中提供学术问答服务。${context ? `\n\n当前文献上下文：\n标题：${context.title}\n摘要：${context.abstract}` : ''}`;

    // Call LLM API with streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const llmResponse = await fetch(`${llmApiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...currentConv.messages.map(m => ({ role: m.role, content: m.content })),
        ],
        stream: true,
      }),
    });

    let assistantContent = '';
    const reader = llmResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            assistantContent += content;
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          } catch { /* skip malformed chunks */ }
        }
      }
    }

    // Save assistant message
    currentConv.messages.push({
      id: `msg_${Date.now().toString(36)}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
    });
    currentConv.updatedAt = new Date().toISOString();
    await kv.put(`ai_conversations:${req.userId}`, conversations);

    res.write(`data: ${JSON.stringify({ done: true, conversationId: currentConv.id })}\n\n`);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ai/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = (await kv.get(`ai_conversations:${req.userId}`)) || [];
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Settings Routes =====
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await kv.get(`settings:${req.userId}`);
    if (!settings) {
      const defaults = { theme: 'system', citationFormat: 'ieee', notifications: { newPapers: true, readingReminders: true, projectUpdates: true, pointsChange: false } };
      res.json({ success: true, data: defaults });
    } else {
      res.json({ success: true, data: settings });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const current = (await kv.get(`settings:${req.userId}`)) || {};
    const updated = { ...current, ...req.body };
    await kv.put(`settings:${req.userId}`, updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Batch Import/Export =====
app.post('/api/papers/batch-import', authMiddleware, async (req, res) => {
  try {
    // Parse BibTeX from request body (text/bibtex content)
    const { content, format } = req.body;
    if (!content) return res.status(400).json({ success: false, error: '导入内容不能为空' });

    const papers = (await kv.get('papers:all')) || [];
    let imported = 0;

    if (format === 'bibtex') {
      // Simple BibTeX parser
      const entryRegex = /@\w+\{([^,]+),([\s\S]*?)\n\}/g;
      let match;
      while ((match = entryRegex.exec(content)) !== null) {
        const key = match[1].trim();
        const fields = match[2];
        const getField = (name) => {
          const m = fields.match(new RegExp(`${name}\\s*=\\s*\\{([^}]*)\\}`, 'i'));
          return m ? m[1].trim() : '';
        };
        const title = getField('title').replace(/[{}]/g, '');
        if (title) {
          const authors = getField('author').split(' and ').map(a => a.trim().replace(/[{}]/g, ''));
          const year = parseInt(getField('year')) || new Date().getFullYear();
          const newPaper = {
            id: `paper_${Date.now().toString(36)}_${imported}`,
            title,
            authors,
            year,
            venue: getField('journal') || getField('booktitle') || '',
            venueType: getField('journal') ? 'journal' : 'conference',
            abstract: getField('abstract').replace(/[{}]/g, ''),
            keywords: [],
            pdfUrl: getField('url') || '',
            doi: getField('doi') || '',
            citationCount: 0,
            isFavorited: false,
            addedDate: new Date().toISOString(),
            tags: ['Imported'],
            joanNote: '',
            addedBy: req.userId,
          };
          papers.push(newPaper);
          imported++;
        }
      }
    }

    await kv.put('papers:all', papers);
    res.json({ success: true, data: { imported, total: papers.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/papers/export', authMiddleware, async (req, res) => {
  try {
    const { format = 'bibtex', ids } = req.query;
    let papers = (await kv.get('papers:all')) || [];
    if (ids) {
      const idSet = new Set(ids.split(','));
      papers = papers.filter(p => idSet.has(p.id));
    }

    if (format === 'bibtex') {
      const bibtex = papers.map(p => {
        const id = `${(p.authors[0] || 'unknown').split(' ').pop()?.toLowerCase()}${p.year}`;
        const authors = p.authors.join(' and ');
        return `@${p.venueType === 'journal' ? 'article' : 'inproceedings'}{${id},
  title     = {${p.title}},
  author    = {${authors}},
  year      = {${p.year}},
  journal   = {${p.venue}},
  doi       = {${p.doi || 'N/A'}},
  url       = {${p.pdfUrl}}
}`;
      }).join('\n\n');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="academic_hub_export.bib"');
      res.send(bibtex);
    } else if (format === 'csv') {
      const header = 'title,authors,year,venue,doi,tags\n';
      const rows = papers.map(p =>
        `"${p.title}","${p.authors.join('; ')}",${p.year},"${p.venue}","${p.doi || ''}","${p.tags.join('; ')}"`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="academic_hub_export.csv"');
      res.send(header + rows);
    } else {
      res.status(400).json({ success: false, error: '不支持的导出格式' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== Admin Routes =====
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await kv.list('users:');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await kv.list('users:');
    const papers = (await kv.get('papers:all')) || [];
    const projects = (await kv.get('projects:all')) || [];
    res.json({
      success: true,
      data: {
        totalUsers: users.filter(u => u.username).length,
        totalPapers: papers.length,
        totalProjects: projects.length,
        kvSize: kv.store.size,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== WorkBuddy Admin Routes =====
app.get('/api/admin/workbuddy/health', wbAdminMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      kvSize: kv.store.size,
      kvKeys: [...kv.store.keys()],
    },
  });
});

app.get('/api/admin/workbuddy/kv/:key', wbAdminMiddleware, async (req, res) => {
  try {
    const value = await kv.get(req.params.key);
    res.json({ success: true, data: { key: req.params.key, value } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/workbuddy/kv/:key', wbAdminMiddleware, async (req, res) => {
  try {
    await kv.put(req.params.key, req.body.value, req.body.ttl);
    res.json({ success: true, message: 'KV 写入成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/workbuddy/users', wbAdminMiddleware, async (req, res) => {
  try {
    const users = await kv.list('users:');
    res.json({ success: true, data: users.filter(u => u.username) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/workbuddy/papers', wbAdminMiddleware, async (req, res) => {
  try {
    const papers = await kv.get('papers:all');
    res.json({ success: true, data: papers || [], total: (papers || []).length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/workbuddy/seed', wbAdminMiddleware, async (req, res) => {
  try {
    // Import seed data from inline data
    const { papers, projects } = req.body;

    if (papers && papers.length > 0) {
      const existing = (await kv.get('papers:all')) || [];
      if (existing.length > 0) {
        await kv.put('papers:all', papers);
      } else {
        await kv.put('papers:all', papers);
      }
      for (const p of papers) {
        await kv.put(`papers:${p.id}`, p);
      }
    }

    if (projects && projects.length > 0) {
      await kv.put('projects:all', projects);
    }

    res.json({
      success: true,
      data: {
        papersLoaded: (papers || []).length,
        projectsLoaded: (projects || []).length,
        totalKVKeys: kv.store.size,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/workbuddy/kv', wbAdminMiddleware, async (req, res) => {
  try {
    const { prefix, confirm } = req.query;
    if (confirm !== 'yes') {
      return res.status(400).json({ success: false, error: '需要 confirm=yes 参数确认删除' });
    }
    const keys = await kv.keys(prefix || '');
    for (const key of keys) {
      await kv.delete(key);
    }
    res.json({ success: true, data: { deleted: keys.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== 404 Handler =====
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `接口不存在: ${req.method} ${req.path}` });
});

// ===== Export for EdgeOne Cloud Functions =====
export default app;
