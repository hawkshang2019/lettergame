import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';

const AdminDashboard = ({ onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      const summaryData = await analyticsService.getSummary();
      const userList = await analyticsService.getUserList();
      const activityStats = await analyticsService.getUserActivityStats();
      
      setSummary(summaryData);
      setUsers(userList);
      setSessions([]); // 暂时不显示详细会话
    } catch (error) {
      console.error('加载数据失败:', error);
      // 设置默认数据
      setSummary({
        uniqueUsers: 0,
        totalVisits: 0,
        totalQuestions: 0,
        accuracyRate: 0
      });
      setUsers([]);
      setSessions([]);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.uniqueUsers || 0}</div>
            <div className="stat-label">独立用户</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.totalVisits || 0}</div>
            <div className="stat-label">总访问次数</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.totalQuestions || 0}</div>
            <div className="stat-label">总答题数</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.accuracyRate || 0}%</div>
            <div className="stat-label">平均正确率</div>
          </div>
        </div>
      </div>

      <div className="activity-stats">
        <h3>用户活动统计</h3>
        <div className="activity-grid">
          <div className="activity-item">
            <span className="activity-label">今日活跃用户</span>
            <span className="activity-value">{users.filter(user => {
              const today = new Date().toISOString().split('T')[0];
              return user.lastVisit && user.lastVisit.split('T')[0] === today;
            }).length}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">本周活跃用户</span>
            <span className="activity-value">{users.filter(user => {
              const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return user.lastVisit && new Date(user.lastVisit) > oneWeekAgo;
            }).length}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">平均答题数/用户</span>
            <span className="activity-value">{users.length > 0 ? Math.round(summary?.totalQuestions / users.length) : 0}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">平均正确率</span>
            <span className="activity-value">{summary?.accuracyRate || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="users-list">
        {users.map((user, index) => (
          <div 
            key={user.id} 
            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
            onClick={() => setSelectedUser(user)}
          >
            <div className="user-header">
              <span className="user-number">用户 {index + 1}</span>
              <span className="user-visits">访问 {user.visits} 次</span>
            </div>
            <div className="user-stats">
              <span>答题: {user.totalQuestions} 题</span>
              <span>正确率: {user.totalQuestions > 0 ? ((user.correctAnswers / user.totalQuestions) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="user-dates">
              <span>首次: {formatDate(user.firstVisit)}</span>
              <span>最后: {formatDate(user.lastVisit)}</span>
            </div>
          </div>
        ))}
      </div>
      
      {selectedUser && (
        <div className="user-details">
          <h3>用户详情</h3>
          <div className="user-info">
            <p><strong>用户ID:</strong> {selectedUser.id}</p>
            <p><strong>访问次数:</strong> {selectedUser.visits}</p>
            <p><strong>总答题数:</strong> {selectedUser.totalQuestions}</p>
            <p><strong>正确答题:</strong> {selectedUser.correctAnswers}</p>
            <p><strong>错误答题:</strong> {selectedUser.wrongAnswers}</p>
            <p><strong>正确率:</strong> {selectedUser.totalQuestions > 0 ? ((selectedUser.correctAnswers / selectedUser.totalQuestions) * 100).toFixed(1) : 0}%</p>
            <p><strong>首次访问:</strong> {formatDate(selectedUser.firstVisit)}</p>
            <p><strong>最后访问:</strong> {formatDate(selectedUser.lastVisit)}</p>
            <p><strong>浏览器:</strong> {selectedUser.userAgent}</p>
            <p><strong>语言:</strong> {selectedUser.language}</p>
            <p><strong>平台:</strong> {selectedUser.platform}</p>
          </div>
          
          <h4>游戏会话 ({selectedUser.gameSessions?.length || 0})</h4>
          <div className="user-sessions">
            {selectedUser.gameSessions?.map((session, index) => (
              <div key={session.id} className="session-item">
                <div className="session-header">
                  <span>会话 {index + 1}</span>
                  <span>{session.gameMode}</span>
                </div>
                <div className="session-stats">
                  <span>得分: {session.score}</span>
                  <span>正确: {session.correctCount}</span>
                  <span>错误: {session.wrongCount}</span>
                  <span>用时: {formatDuration(session.timeSpent)}</span>
                </div>
                <div className="session-dates">
                  <span>开始: {formatDate(session.startTime)}</span>
                  {session.endTime && <span>结束: {formatDate(session.endTime)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <div className="admin-sessions">
      <div className="sessions-list">
        {sessions.map((session, index) => (
          <div key={session.id} className="session-card">
            <div className="session-header">
              <span className="session-number">会话 {index + 1}</span>
              <span className="session-mode">{session.gameMode}</span>
              <span className="session-user">用户: {session.userId?.substring(0, 8)}...</span>
            </div>
            <div className="session-stats">
              <span>题目: {session.questionCount}</span>
              <span>得分: {session.score}</span>
              <span>正确: {session.correctCount}</span>
              <span>错误: {session.wrongCount}</span>
              <span>用时: {formatDuration(session.timeSpent)}</span>
            </div>
            <div className="session-dates">
              <span>开始: {formatDate(session.startTime)}</span>
              {session.endTime && <span>结束: {formatDate(session.endTime)}</span>}
            </div>
            <div className="session-grades">
              <span>年级: {session.selectedGrades?.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h2>后台监控系统</h2>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          概览
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          用户管理
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          游戏会话
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'sessions' && renderSessions()}
      </div>
      
      <div className="admin-footer-controls">
        <button className="btn btn-primary admin-footer-btn" onClick={loadData}>
          刷新
        </button>
        <button className="btn btn-secondary admin-footer-btn" onClick={() => analyticsService.exportData()}>
          导出
        </button>
        <button className="btn btn-danger admin-footer-btn" onClick={() => {
          if (window.confirm('确定要清空所有统计数据吗？此操作不可恢复！')) {
            analyticsService.clearData();
            loadData();
          }
        }}>
          清空
        </button>
        <button className="btn btn-logout admin-footer-btn" onClick={onLogout}>
          退出
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;