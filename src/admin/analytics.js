// 完善的后台监控系统 - 记录每个用户的详细使用痕迹

class Analytics {
  constructor() {
    this.storageKey = 'word_game_analytics_v2';
    this.adminUsername = 'hawkadmin';
    this.adminPassword = 'hawk1230oflettergame';
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({
        totalVisits: 0,
        uniqueUsers: 0,
        users: {},
        totalQuestions: 0,
        totalCorrect: 0,
        totalWrong: 0,
        gameSessions: [],
        lastReset: new Date().toISOString(),
        settings: {
          adminUsername: this.adminUsername,
          adminPassword: this.adminPassword
        }
      }));
    }
  }

  // 生成唯一用户ID
  generateUserId() {
    if (!localStorage.getItem('word_game_user_id')) {
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('word_game_user_id', userId);
    }
    return localStorage.getItem('word_game_user_id');
  }

  // 记录用户访问
  recordVisit() {
    const data = this.getData();
    const userId = this.generateUserId();
    
    data.totalVisits++;
    
    if (!data.users[userId]) {
      data.users[userId] = {
        id: userId,
        visits: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        gameSessions: [],
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      };
      data.uniqueUsers++;
    }
    
    data.users[userId].visits++;
    data.users[userId].lastVisit = new Date().toISOString();
    
    this.saveData(data);
    
    return userId;
  }

  // 开始游戏会话
  startGameSession(userId, gameMode, questionCount, selectedGrades) {
    const data = this.getData();
    
    if (data.users[userId]) {
      const session = {
        id: 'session_' + Date.now(),
        startTime: new Date().toISOString(),
        gameMode: gameMode,
        questionCount: questionCount,
        selectedGrades: selectedGrades,
        questions: [],
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        timeSpent: 0,
        completed: false
      };
      
      data.users[userId].currentSession = session;
      data.gameSessions.push({
        ...session,
        userId: userId
      });
      
      this.saveData(data);
    }
  }

  // 记录答题结果
  recordAnswer(userId, question, userAnswer, isCorrect, timeSpent) {
    const data = this.getData();
    
    if (data.users[userId] && data.users[userId].currentSession) {
      const questionRecord = {
        question: question,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        timestamp: new Date().toISOString(),
        timeSpent: timeSpent
      };
      
      data.users[userId].currentSession.questions.push(questionRecord);
      
      if (isCorrect) {
        data.users[userId].currentSession.correctCount++;
        data.users[userId].currentSession.score += Math.round(100 / data.users[userId].currentSession.questionCount);
      } else {
        data.users[userId].currentSession.wrongCount++;
      }
      
      data.users[userId].totalQuestions++;
      data.totalQuestions++;
      
      if (isCorrect) {
        data.users[userId].correctAnswers++;
        data.totalCorrect++;
      } else {
        data.users[userId].wrongAnswers++;
        data.totalWrong++;
      }
      
      this.saveData(data);
    }
  }

  // 结束游戏会话
  endGameSession(userId, totalTime) {
    const data = this.getData();
    
    if (data.users[userId] && data.users[userId].currentSession) {
      data.users[userId].currentSession.endTime = new Date().toISOString();
      data.users[userId].currentSession.timeSpent = totalTime;
      data.users[userId].currentSession.completed = true;
      
      data.users[userId].gameSessions.push(data.users[userId].currentSession);
      delete data.users[userId].currentSession;
      
      this.saveData(data);
    }
  }

  // 管理员认证
  authenticateAdmin(username, password) {
    return username === this.adminUsername && password === this.adminPassword;
  }

  // 获取统计数据
  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey));
  }

  // 保存数据
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // 获取统计摘要
  getSummary() {
    const data = this.getData();
    return {
      totalVisits: data.totalVisits,
      uniqueUsers: data.uniqueUsers,
      totalQuestions: data.totalQuestions,
      totalCorrect: data.totalCorrect,
      totalWrong: data.totalWrong,
      accuracyRate: data.totalQuestions > 0 ? ((data.totalCorrect / data.totalQuestions) * 100).toFixed(1) : 0,
      totalGameSessions: data.gameSessions.length,
      completedSessions: data.gameSessions.filter(s => s.completed).length
    };
  }

  // 获取用户列表
  getUserList() {
    const data = this.getData();
    return Object.values(data.users).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
  }

  // 获取游戏会话列表
  getGameSessions() {
    const data = this.getData();
    return data.gameSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }

  // 获取用户详细数据
  getUserDetails(userId) {
    const data = this.getData();
    return data.users[userId];
  }

  // 清空统计数据
  clearData() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      totalVisits: 0,
      uniqueUsers: 0,
      users: {},
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      gameSessions: [],
      lastReset: new Date().toISOString(),
      settings: {
        adminUsername: this.adminUsername,
        adminPassword: this.adminPassword
      }
    }));
  }

  // 导出数据
  exportData() {
    const data = this.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word_game_analytics_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 获取用户活动统计
  getUserActivityStats() {
    const users = this.getUserList();
    const today = new Date().toDateString();
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      activeToday: users.filter(u => new Date(u.lastVisit).toDateString() === today).length,
      activeThisWeek: users.filter(u => new Date(u.lastVisit) >= thisWeek).length,
      totalUsers: users.length,
      avgQuestionsPerUser: users.length > 0 ? (this.getData().totalQuestions / users.length).toFixed(1) : 0,
      avgAccuracy: users.length > 0 ? (users.reduce((sum, u) => sum + (u.totalQuestions > 0 ? (u.correctAnswers / u.totalQuestions) * 100 : 0), 0) / users.length).toFixed(1) : 0
    };
  }
}

// 创建全局实例
export const analytics = new Analytics();