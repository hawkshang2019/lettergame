// 数据库分析服务 - 连接Netlify Functions API

class AnalyticsService {
  constructor() {
    // 根据环境设置API基础URL
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888/.netlify/functions' 
      : '/.netlify/functions';
    
    this.apiURL = `${this.baseURL}/analytics`;
    this.userId = this.generateUserId();
  }

  // 生成用户ID
  generateUserId() {
    if (!localStorage.getItem('word_game_user_id')) {
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('word_game_user_id', userId);
    }
    return localStorage.getItem('word_game_user_id');
  }

  // API调用封装
  async apiCall(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API调用失败:', error);
      // 静默失败，不影响用户体验
      return { success: false, error: error.message };
    }
  }

  // 记录用户访问
  async recordVisit() {
    const data = {
      action: 'recordVisit',
      userId: this.userId,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    };

    return await this.apiCall(this.apiURL, 'POST', data);
  }

  // 记录答题结果
  async recordAnswer(question, userAnswer, isCorrect, timeSpent = 0) {
    const data = {
      action: 'recordAnswer',
      userId: this.userId,
      question: question,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      timeSpent: timeSpent
    };

    return await this.apiCall(this.apiURL, 'POST', data);
  }

  // 获取统计数据
  async getSummary() {
    try {
      const result = await this.apiCall(this.apiURL);
      
      if (result.success && result.data) {
        const data = result.data;
        
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
      }
      
      return this.getDefaultSummary();
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return this.getDefaultSummary();
    }
  }

  // 获取用户列表
  async getUserList() {
    try {
      const result = await this.apiCall(this.apiURL);
      
      if (result.success && result.data && result.data.users) {
        const users = Object.values(result.data.users);
        
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
      const result = await this.apiCall(this.apiURL);
      
      if (result.success && result.data && result.data.users) {
        const users = Object.values(result.data.users);
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
          ? Math.round(result.data.totalQuestions / users.length) 
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
    const data = {
      action: 'clearData'
    };

    return await this.apiCall(this.apiURL, 'POST', data);
  }

  // 导出数据
  async exportData() {
    try {
      const result = await this.apiCall(this.apiURL);
      
      if (result.success && result.data) {
        const dataStr = JSON.stringify(result.data, null, 2);
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
      }
      
      return { success: false, error: '导出数据失败' };
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