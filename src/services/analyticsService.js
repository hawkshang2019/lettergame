// 数据库分析服务 - 本地存储解决方案

class AnalyticsService {
  constructor() {
    this.userId = this.generateUserId();
    this.initLocalStorage();
  }

  // 生成用户ID
  generateUserId() {
    if (!localStorage.getItem('word_game_user_id')) {
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('word_game_user_id', userId);
    }
    return localStorage.getItem('word_game_user_id');
  }

  // 初始化本地存储
  initLocalStorage() {
    if (!localStorage.getItem('word_game_analytics')) {
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
      localStorage.setItem('word_game_analytics', JSON.stringify(initialData));
    }
  }

  // 读取本地存储数据
  readData() {
    this.initLocalStorage();
    const data = localStorage.getItem('word_game_analytics');
    return JSON.parse(data);
  }

  // 写入本地存储数据
  writeData(data) {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem('word_game_analytics', JSON.stringify(data));
  }

  // 记录用户访问
  async recordVisit() {
    try {
      const data = this.readData();
      
      data.totalVisits++;
      
      if (!data.users[this.userId]) {
        data.users[this.userId] = {
          id: this.userId,
          visits: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          gameSessions: [],
          firstVisit: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          userAgent: navigator.userAgent || '',
          language: navigator.language || '',
          platform: navigator.platform || ''
        };
        data.uniqueUsers++;
      }
      
      data.users[this.userId].visits++;
      data.users[this.userId].lastVisit = new Date().toISOString();
      
      this.writeData(data);
      
      return { success: true, message: '操作成功' };
    } catch (error) {
      console.error('记录访问失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 记录答题结果
  async recordAnswer(question, userAnswer, isCorrect, timeSpent = 0) {
    try {
      const data = this.readData();
      
      if (!data.users[this.userId]) {
        data.users[this.userId] = {
          id: this.userId,
          visits: 1,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          gameSessions: [],
          firstVisit: new Date().toISOString(),
          lastVisit: new Date().toISOString(),
          userAgent: navigator.userAgent || '',
          language: navigator.language || '',
          platform: navigator.platform || ''
        };
        data.uniqueUsers++;
      }
      
      data.users[this.userId].totalQuestions++;
      data.totalQuestions++;
      
      if (isCorrect) {
        data.users[this.userId].correctAnswers++;
        data.totalCorrect++;
      } else {
        data.users[this.userId].wrongAnswers++;
        data.totalWrong++;
      }
      
      data.users[this.userId].lastVisit = new Date().toISOString();
      
      this.writeData(data);
      
      return { success: true, message: '操作成功' };
    } catch (error) {
      console.error('记录答题结果失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取统计数据
  async getSummary() {
    try {
      const data = this.readData();
      
      // 计算正确率
      const accuracyRate = data.totalQuestions > 0 
        ? Math.round((data.totalCorrect / data.totalQuestions) * 100) 
        : 0;

      return {
        uniqueUsers: data.uniqueUsers || 0,
        totalVisits: data.totalVisits || 0,
        totalQuestions: data.totalQuestions || 0,
        totalCorrect: data.totalCorrect || 0,
        totalWrong: data.totalWrong || 0,
        accuracyRate: accuracyRate,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return this.getDefaultSummary();
    }
  }

  // 获取用户列表
  async getUserList() {
    try {
      const data = this.readData();
      
      if (data.users) {
        const users = Object.values(data.users);
        
        return users.map(user => ({
          id: user.id,
          visits: user.visits || 0,
          totalQuestions: user.totalQuestions || 0,
          correctAnswers: user.correctAnswers || 0,
          wrongAnswers: user.wrongAnswers || 0,
          firstVisit: user.firstVisit || new Date().toISOString(),
          lastVisit: user.lastVisit || new Date().toISOString(),
          accuracyRate: user.totalQuestions > 0 
            ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
            : 0
        }));
      }
      
      return [];
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  // 获取用户活动统计
  async getUserActivityStats() {
    try {
      const data = this.readData();
      
      if (data.users) {
        const users = Object.values(data.users);
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const activeToday = users.filter(user => 
          user.lastVisit && user.lastVisit.split('T')[0] === today
        ).length;

        const activeThisWeek = users.filter(user => 
          user.lastVisit && new Date(user.lastVisit) > oneWeekAgo
        ).length;

        const avgQuestionsPerUser = users.length > 0 
          ? Math.round(data.totalQuestions / users.length) 
          : 0;

        const avgAccuracy = users.length > 0 
          ? Math.round(users.reduce((sum, user) => sum + (user.correctAnswers / user.totalQuestions || 0), 0) / users.length * 100)
          : 0;

        return {
          activeToday,
          activeThisWeek,
          avgQuestionsPerUser,
          avgAccuracy
        };
      }
      
      return this.getDefaultActivityStats();
    } catch (error) {
      console.error('获取用户活动统计失败:', error);
      return this.getDefaultActivityStats();
    }
  }

  // 清空数据
  async clearData() {
    try {
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
      
      this.writeData(initialData);
      
      return { success: true, message: '操作成功' };
    } catch (error) {
      console.error('清空数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 导出数据
  async exportData() {
    try {
      const data = this.readData();
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `word_game_analytics_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('导出数据失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 默认统计数据
  getDefaultSummary() {
    return {
      uniqueUsers: 0,
      totalVisits: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      totalWrong: 0,
      accuracyRate: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // 默认活动统计
  getDefaultActivityStats() {
    return {
      activeToday: 0,
      activeThisWeek: 0,
      avgQuestionsPerUser: 0,
      avgAccuracy: 0
    };
  }
}

// 创建单例实例
const analyticsService = new AnalyticsService();

export default analyticsService;