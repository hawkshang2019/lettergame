// Netlify Function for analytics API
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'analytics.json');

// 初始化数据库
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      totalVisits: 0,
      uniqueUsers: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      users: {},
      gameSessions: [],
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// 读取数据库
function readDatabase() {
  initDatabase();
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// 写入数据库
function writeDatabase(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// 生成用户ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// API处理函数
exports.handler = async (event, context) => {
  // CORS设置
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // 处理预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const data = readDatabase();
    
    if (event.httpMethod === 'GET') {
      // 获取统计数据
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: data
        })
      };
    }
    
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      switch (body.action) {
        case 'recordVisit':
          // 记录用户访问
          data.totalVisits++;
          
          if (!data.users[body.userId]) {
            data.users[body.userId] = {
              id: body.userId,
              visits: 0,
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              gameSessions: [],
              firstVisit: new Date().toISOString(),
              lastVisit: new Date().toISOString(),
              userAgent: body.userAgent || '',
              language: body.language || '',
              platform: body.platform || ''
            };
            data.uniqueUsers++;
          }
          
          data.users[body.userId].visits++;
          data.users[body.userId].lastVisit = new Date().toISOString();
          break;
          
        case 'recordAnswer':
          // 记录答题结果
          if (!data.users[body.userId]) {
            data.users[body.userId] = {
              id: body.userId,
              visits: 1,
              totalQuestions: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              gameSessions: [],
              firstVisit: new Date().toISOString(),
              lastVisit: new Date().toISOString(),
              userAgent: body.userAgent || '',
              language: body.language || '',
              platform: body.platform || ''
            };
            data.uniqueUsers++;
          }
          
          data.users[body.userId].totalQuestions++;
          data.totalQuestions++;
          
          if (body.isCorrect) {
            data.users[body.userId].correctAnswers++;
            data.totalCorrect++;
          } else {
            data.users[body.userId].wrongAnswers++;
            data.totalWrong++;
          }
          
          data.users[body.userId].lastVisit = new Date().toISOString();
          // 更新用户代理信息
          if (body.userAgent) data.users[body.userId].userAgent = body.userAgent;
          if (body.language) data.users[body.userId].language = body.language;
          if (body.platform) data.users[body.userId].platform = body.platform;
          break;
          
        case 'clearData':
          // 清空数据
          data.totalVisits = 0;
          data.uniqueUsers = 0;
          data.totalQuestions = 0;
          data.totalCorrect = 0;
          data.totalWrong = 0;
          data.users = {};
          data.gameSessions = [];
          break;
          
        default:
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: '未知的操作类型'
            })
          };
      }
      
      writeDatabase(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '操作成功'
        })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: '不支持的HTTP方法'
      })
    };
    
  } catch (error) {
    console.error('API错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: '服务器内部错误'
      })
    };
  }
};