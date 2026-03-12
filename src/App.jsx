import React, { useState, useEffect } from 'react';
import wordList from './wordList';
import analyticsService from './services/analyticsService';

const generateAlphabet = (word, blankPositions) => {
  const correctLetters = [];
  blankPositions.forEach(pos => {
    const letter = word[pos].toLowerCase();
    if (letter && letter !== ' ') {
      correctLetters.push(letter);
    }
  });
  
  const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const otherLetters = allLetters.filter(l => !correctLetters.includes(l));
  const randomOthers = otherLetters.sort(() => Math.random() - 0.5).slice(0, 6);
  const letters = [...correctLetters, ...randomOthers];
  return letters.sort(() => Math.random() - 0.5);
};

const generateOptions = (correctWord, mode) => {
  const correctText = mode === 'enToZh' ? correctWord.zh : correctWord.en;
  
  const allOptions = [{ text: correctText, isCorrect: true }];
  
  const otherWords = wordList.filter(
    w => (mode === 'enToZh' ? w.zh : w.en) !== correctText
  );
  
  const shuffled = otherWords.sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    const word = shuffled[i];
    const optionText = mode === 'enToZh' ? word.zh : word.en;
    allOptions.push({ text: optionText, isCorrect: false });
  }
  
  return allOptions.sort(() => Math.random() - 0.5);
};

const getRandomWord = (correctAnswer, mode) => {
  const allWords = wordList.map(w => mode === 'enToZh' ? w.zh : w.en);
  const filtered = allWords.filter(w => w !== correctAnswer);
  return filtered[Math.floor(Math.random() * filtered.length)] || 'apple';
};

function App() {
  const [gameMode, setGameMode] = useState(null);
  const [currentWord, setCurrentWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [progress, setProgress] = useState(0);
  const [alphabet, setAlphabet] = useState([]);
  const [wordBlanks, setWordBlanks] = useState([]);
  const [blankPositions, setBlankPositions] = useState([]);
  const [usedLetters, setUsedLetters] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isAnswered, setIsAnswered] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [wordCorrectCount, setWordCorrectCount] = useState({});
  const [masteredWords, setMasteredWords] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);
  const [countdownSeconds, setCountdownSeconds] = useState(2);
  const [selectedGrades, setSelectedGrades] = useState(['1-3', '4']);
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [isPracticeMode, setIsPracticeMode] = useState(false);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const gradeStages = [
    { value: '1-3', label: '1-3年级', grades: ['1', '2', '3'] },
    { value: '4', label: '4年级', grades: ['4'] },
    { value: '5', label: '5年级', grades: ['5'] },
    { value: '6', label: '6年级', grades: ['6'] }
  ];

  const getWordCountForStage = (stage) => {
    return wordList.filter(w => w.grade && stage.grades.includes(w.grade)).length;
  };

  const generateBlanks = (word) => {
    const letters = word.split('');
    const letterIndices = [];
    letters.forEach((letter, index) => {
      if (letter !== ' ') {
        letterIndices.push(index);
      }
    });
    
    const numBlanks = Math.min(2, letterIndices.length);
    const shuffledIndices = [...letterIndices].sort(() => Math.random() - 0.5);
    const blankPos = shuffledIndices.slice(0, numBlanks);
    
    const blanks = letters.map((letter, index) => {
      if (blankPos.includes(index)) {
        return '_';
      }
      return letter;
    });
    
    return { blanks, blankPositions: blankPos.sort((a, b) => a - b) };
  };
  
  const [coins, setCoins] = useState(0);
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [practiceMode, setPracticeMode] = useState(null);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [practiceAnswered, setPracticeAnswered] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState('');
  const [practiceFeedbackType, setPracticeFeedbackType] = useState('');
  const [practiceCountdown, setPracticeCountdown] = useState(3);
  const [practiceTimer, setPracticeTimer] = useState(null);
  const [gameTime, setGameTime] = useState(0);
  const [timer, setTimer] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userId, setUserId] = useState(null);

  // 初始化分析系统
  useEffect(() => {
    analyticsService.recordVisit();
  }, []);

  useEffect(() => {
    if (currentWord && (gameMode === 'enToZh' || gameMode === 'zhToEn')) {
      const newOptions = generateOptions(currentWord, gameMode);
      setOptions(newOptions);
    }
  }, [currentWord, gameMode]);

  useEffect(() => {
    if (isAnswered && currentQuestionIndex < questionCount && !isPracticeMode) {
      setCountdown(countdownSeconds);
      const countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            if (currentQuestionIndex + 1 >= questionCount) {
              setGameComplete(true);
              if (timer) clearInterval(timer);
            }
            nextQuestion(gameMode);
            return countdownSeconds;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownTimer);
    }
  }, [isAnswered, currentQuestionIndex, gameMode, questionCount, countdownSeconds, isPracticeMode]);

  const startGame = (mode) => {
    const selectedGradeValues = selectedGrades.flatMap(stageValue => {
      const stage = gradeStages.find(s => s.value === stageValue);
      return stage ? stage.grades : [];
    });
    const filteredWords = wordList.filter(word => !word.grade || selectedGradeValues.includes(word.grade));
    const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, questionCount);
    setQuestionQueue(selectedWords);
    setCurrentQuestionIndex(0);
    setGameMode(mode);
    setScore(0);
    setTotalQuestions(0);
    setProgress(0);
    setGameTime(0);
    setGameComplete(false);
    setFeedback('');
    setFeedbackType('');
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (timer) clearInterval(timer);
    const newTimer = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);
    setTimer(newTimer);
    setCurrentWord(selectedWords[0]);
    
    if (mode === 'spelling') {
      const { blanks, blankPositions } = generateBlanks(selectedWords[0].en);
      setWordBlanks(blanks);
      setBlankPositions(blankPositions);
      setAlphabet(generateAlphabet(selectedWords[0].en, blankPositions));
      setUsedLetters([]);
    }
  };

  const nextQuestion = (mode) => {
    if (!isAnswered && currentWord) {
      setWrongCount(prev => prev + 1);
      setTotalAnswered(prev => prev + 1);
      if (gameMode === 'spelling') {
        const userAnswer = wordBlanks.join('');
        setWrongAnswers(prev => [...prev, { 
          question: currentWord.zh,
          correctAnswer: currentWord.en,
          userAnswer: userAnswer.includes('_') ? '(未完成)' : userAnswer,
          mode: '填空'
        }]);
      } else {
        const correctAnswer = gameMode === 'enToZh' ? currentWord.zh : currentWord.en;
        setWrongAnswers(prev => [...prev, { 
          question: gameMode === 'enToZh' ? currentWord.en : currentWord.zh,
          correctAnswer: correctAnswer,
          userAnswer: '(未作答)',
          mode: gameMode === 'enToZh' ? '英译汉' : '汉译英'
        }]);
      }
    }
    
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= questionCount) {
      setGameComplete(true);
      if (timer) clearInterval(timer);
      return;
    }
    setCurrentQuestionIndex(nextIndex);
    const word = questionQueue[nextIndex];
    setCurrentWord(word);
    setUserAnswer('');
    setFeedback('');
    setFeedbackType('');
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTotalQuestions(prev => prev + 1);
    
    if ((mode || gameMode) === 'spelling') {
      const { blanks, blankPositions } = generateBlanks(word.en);
      setWordBlanks(blanks);
      setBlankPositions(blankPositions);
      setAlphabet(generateAlphabet(word.en, blankPositions));
      setUsedLetters([]);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex <= 0) {
      return;
    }
    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    const word = questionQueue[prevIndex];
    setCurrentWord(word);
    setUserAnswer('');
    setFeedback('');
    setFeedbackType('');
    setSelectedAnswer(null);
    setIsAnswered(false);
    
    if ((gameMode) === 'spelling') {
      const { blanks, blankPositions } = generateBlanks(word.en);
      setWordBlanks(blanks);
      setBlankPositions(blankPositions);
      setAlphabet(generateAlphabet(word.en, blankPositions));
      setUsedLetters([]);
    }
  };

  const startPractice = () => {
    if (wrongAnswers.length === 0) return;
    
    const firstWrong = wrongAnswers[0];
    let mode = 'enToZh';
    if (firstWrong.mode === '汉译英') mode = 'zhToEn';
    else if (firstWrong.mode === '填空') mode = 'spelling';
    
    setIsPracticeMode(true);
    setPracticeMode(mode);
    setCurrentPracticeIndex(0);
    setPracticeAnswered(false);
    setPracticeFeedback('');
    setPracticeFeedbackType('');
    setIsAnswered(false);
    setFeedback('');
    setFeedbackType('');
    setScore(0);
    setCurrentQuestionIndex(0);
    setShowWrongAnswers(false);
    
    const wordObj = {
      en: firstWrong.correctAnswer,
      zh: firstWrong.question
    };
    setCurrentWord(wordObj);
    
    if (mode !== 'spelling') {
      setOptions(generatePracticeOptions(firstWrong));
    } else {
      const { blanks, blankPositions } = generateBlanks(firstWrong.correctAnswer);
      setWordBlanks(blanks);
      setBlankPositions(blankPositions);
      setAlphabet(generateAlphabet(firstWrong.correctAnswer, blankPositions));
      setUsedLetters([]);
    }
  };

  const handlePracticeAnswer = (isCorrect, answer) => {
    const currentWrong = wrongAnswers[currentPracticeIndex];
    setPracticeAnswered(true);
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    
    if (isCorrect) {
      setPracticeFeedback('正确！');
      setPracticeFeedbackType('correct');
      setFeedback('正确！');
      setFeedbackType('correct');
      setCorrectCount(prev => prev + 1);
            analyticsService.recordAnswer(currentWord.en, filledWord, true, 0);
      const wordKey = currentWrong.correctAnswer;
      setWordCorrectCount(prev => {
        const newCount = { ...prev };
        newCount[wordKey] = (newCount[wordKey] || 0) + 1;
        const mastered = Object.values(newCount).filter(count => count >= 3).length;
        setMasteredWords(mastered);
        return newCount;
      });
    } else {
      setPracticeFeedback(`错误！正确答案是: ${currentWrong.correctAnswer}`);
      setPracticeFeedbackType('incorrect');
      setFeedback(`错误！正确答案是: ${currentWrong.correctAnswer}`);
      setFeedbackType('incorrect');
      setWrongCount(prev => prev + 1);
      analyticsService.recordAnswer(currentWrong.question, currentWrong.userAnswer, false, 0);
    }
    
    setPracticeCountdown(3);
    if (practiceTimer) clearInterval(practiceTimer);
    
    const newTimer = setInterval(() => {
      setPracticeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(practiceTimer);
          if (currentPracticeIndex < wrongAnswers.length - 1) {
            const nextIndex = currentPracticeIndex + 1;
            const nextWrong = wrongAnswers[nextIndex];
            let nextMode = 'enToZh';
            if (nextWrong.mode === '汉译英') nextMode = 'zhToEn';
            else if (nextWrong.mode === '填空') nextMode = 'spelling';
            
            setPracticeMode(nextMode);
            setCurrentPracticeIndex(nextIndex);
            setPracticeAnswered(false);
            setPracticeFeedback('');
            setPracticeFeedbackType('');
            setIsAnswered(false);
            setFeedback('');
            setFeedbackType('');
            
            const nextWordObj = {
              en: nextWrong.correctAnswer,
              zh: nextWrong.question
            };
            setCurrentWord(nextWordObj);
            
            if (nextMode !== 'spelling') {
              setOptions(generatePracticeOptions(nextWrong));
            } else {
              const { blanks, blankPositions } = generateBlanks(nextWrong.correctAnswer);
              setWordBlanks(blanks);
              setBlankPositions(blankPositions);
              setAlphabet(generateAlphabet(nextWrong.correctAnswer, blankPositions));
              setUsedLetters([]);
            }
          } else {
            setPracticeMode(null);
            setShowWrongAnswers(false);
            setIsPracticeMode(false);
          }
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    setPracticeTimer(newTimer);
  };

  const nextPracticeQuestion = () => {
    if (practiceTimer) {
      clearInterval(practiceTimer);
      setPracticeTimer(null);
    }
    
    if (currentPracticeIndex < wrongAnswers.length - 1) {
      const nextIndex = currentPracticeIndex + 1;
      const nextWrong = wrongAnswers[nextIndex];
      let nextMode = 'enToZh';
      if (nextWrong.mode === '汉译英') nextMode = 'zhToEn';
      else if (nextWrong.mode === '填空') nextMode = 'spelling';
      
      setPracticeMode(nextMode);
      setCurrentPracticeIndex(nextIndex);
      setPracticeAnswered(false);
      setPracticeFeedback('');
      setPracticeFeedbackType('');
      setIsAnswered(false);
      setFeedback('');
      setFeedbackType('');
      
      const nextWordObj = {
        en: nextWrong.correctAnswer,
        zh: nextWrong.question
      };
      setCurrentWord(nextWordObj);
      
      if (nextMode !== 'spelling') {
        setOptions(generatePracticeOptions(nextWrong));
      } else {
        const { blanks, blankPositions } = generateBlanks(nextWrong.correctAnswer);
        setWordBlanks(blanks);
        setBlankPositions(blankPositions);
        setAlphabet(generateAlphabet(nextWrong.correctAnswer, blankPositions));
        setUsedLetters([]);
      }
    } else {
      setPracticeMode(null);
      setShowWrongAnswers(false);
      setIsPracticeMode(false);
    }
  };

  const endGame = () => {
    if (!isAnswered && currentWord) {
      setWrongCount(prev => prev + 1);
      setTotalAnswered(prev => prev + 1);
      if (gameMode === 'spelling') {
        const userAnswer = wordBlanks.join('');
        setWrongAnswers(prev => [...prev, { 
          question: currentWord.zh,
          correctAnswer: currentWord.en,
          userAnswer: userAnswer.includes('_') ? '(未完成)' : userAnswer,
          mode: '填空'
        }]);
      } else {
        const correctAnswer = gameMode === 'enToZh' ? currentWord.zh : currentWord.en;
        setWrongAnswers(prev => [...prev, { 
          question: gameMode === 'enToZh' ? currentWord.en : currentWord.zh,
          correctAnswer: correctAnswer,
          userAnswer: '(未作答)',
          mode: gameMode === 'enToZh' ? '英译汉' : '汉译英'
        }]);
      }
    }
    
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    let baseCoins = 0;
    if (score >= 75) {
      baseCoins = 10;
    } else if (score >= 60) {
      baseCoins = 8;
    } else if (score >= 50) {
      baseCoins = 5;
    } else {
      baseCoins = 2;
    }
    
    let timeMultiplier = 1;
    if (gameTime <= 30) {
      timeMultiplier = 3;
    } else if (gameTime <= 60) {
      timeMultiplier = 2;
    }
    
    const earnedCoins = baseCoins * timeMultiplier;
    setCoins(prev => prev + earnedCoins);
    setGameComplete(true);
    
    // 记录游戏会话结束
    // 游戏结束，数据已通过答题记录保存到数据库
  };

  const checkAnswer = () => {
    let isCorrect = false;
    
    if (gameMode === 'enToZh') {
      isCorrect = userAnswer.toLowerCase() === currentWord.zh.toLowerCase();
    } else if (gameMode === 'zhToEn') {
      isCorrect = userAnswer.toLowerCase() === currentWord.en.toLowerCase();
    }
    
    if (isCorrect) {
      setScore(prev => prev + Math.round(100 / questionCount));
      setFeedback('正确！');
      setFeedbackType('correct');
    } else {
      setFeedback(`错误！正确答案是: ${gameMode === 'enToZh' ? currentWord.zh : currentWord.en}`);
      setFeedbackType('incorrect');
    }
    
    setProgress(score / 100 * 100);
  };

  const handleOptionSelect = (option) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(option.text);
    setIsAnswered(true);
    const isCorrect = option.isCorrect;
    const correctAnswer = gameMode === 'enToZh' ? currentWord.zh : currentWord.en;
    
    if (isCorrect) {
      setScore(prev => prev + Math.round(100 / questionCount));
        setCorrectCount(prev => prev + 1);
        analyticsService.recordAnswer(currentWord.en, option.text, true, 0);
      const wordKey = currentWord.en;
      setWordCorrectCount(prev => {
        const newCount = { ...prev };
        newCount[wordKey] = (newCount[wordKey] || 0) + 1;
        const mastered = Object.values(newCount).filter(count => count >= 3).length;
        setMasteredWords(mastered);
        return newCount;
      });
      setFeedback('正确！');
      setFeedbackType('correct');
    } else {
      setWrongCount(prev => prev + 1);
      analyticsService.recordAnswer(currentWord.en, option.text, false, 0);
      setWrongAnswers(prev => [...prev, { 
        question: gameMode === 'enToZh' ? currentWord.en : currentWord.zh,
        correctAnswer: correctAnswer,
        userAnswer: option.text,
        mode: gameMode === 'enToZh' ? '英译汉' : '汉译英'
      }]);
      setFeedback(`错误！正确答案是: ${correctAnswer}`);
      setFeedbackType('incorrect');
    }
    
    setTotalAnswered(prev => prev + 1);
    setProgress(score / 100 * 100);
  };

  const handleLetterClick = (letter) => {
    if (isAnswered) return;
    
    const word = currentWord.en;
    
    let hasEmptySlot = false;
    for (let i = 0; i < blankPositions.length; i++) {
      const pos = blankPositions[i];
      if (wordBlanks[pos] === '_') {
        hasEmptySlot = true;
        break;
      }
    }
    
    if (!hasEmptySlot) return;
    
    const newBlanks = [...wordBlanks];
    let filledAny = false;
    
    for (let i = 0; i < blankPositions.length; i++) {
      const pos = blankPositions[i];
      if (newBlanks[pos] === '_') {
        newBlanks[pos] = letter;
        filledAny = true;
        break;
      }
    }
    
    if (!filledAny) return;
    
    setWordBlanks(newBlanks);
    setUsedLetters(prev => [...prev, letter]);
    
    const filledWord = newBlanks.join('');
    const allFilled = !newBlanks.includes('_');
    
    if (allFilled) {
      if (isPracticeMode) {
        if (filledWord.toLowerCase() === word.toLowerCase()) {
          handlePracticeAnswer(true, filledWord);
        } else {
          handlePracticeAnswer(false, filledWord);
        }
      } else {
        setIsAnswered(true);
        setTotalAnswered(prev => prev + 1);
        
        if (filledWord.toLowerCase() === word.toLowerCase()) {
          setFeedback('恭喜！填空正确！');
          setFeedbackType('correct');
          setCorrectCount(prev => prev + 1);
          analyticsService.recordAnswer(currentWord.en, filledWord, true, 0);
          setScore(prev => prev + Math.round(100 / questionCount));
          
          const wordKey = currentWord.en;
          const newCount = (wordCorrectCount[wordKey] || 0) + 1;
          setWordCorrectCount(prev => ({
            ...prev,
            [wordKey]: newCount
          }));
          
          if (newCount >= 3) {
            setMasteredWords(prev => prev + 1);
          }
        } else {
          setFeedback(`错误！正确答案是: ${word}`);
          setFeedbackType('incorrect');
          setWrongCount(prev => prev + 1);
            analyticsService.recordAnswer(currentWord.en, filledWord, false, 0);
          setWrongAnswers(prev => [...prev, { 
            question: currentWord.zh,
            correctAnswer: word,
            userAnswer: filledWord,
            mode: '填空'
          }]);
        }
      }
    }
  };

  const handleBlankClick = (index, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (isAnswered) return;
    
    const pos = blankPositions[index];
    if (wordBlanks[pos] === '_') return;
    
    const letter = wordBlanks[pos];
    const newBlanks = [...wordBlanks];
    newBlanks[pos] = '_';
    setWordBlanks(newBlanks);
    
    setUsedLetters(prev => prev.filter(l => l !== letter));
    setFeedback('');
    setFeedbackType('');
  };

  const renderModeSelection = () => (
    <div className="mode-selection">
      <div className="stats-header">
        <div className="stat-item">
          <span className="stat-label">金币</span>
          <span className="stat-value">{coins}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">答题总数</span>
          <span className="stat-value">{totalAnswered}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">正确</span>
          <span className="stat-value correct">{correctCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">错误</span>
          <span className="stat-value incorrect">{wrongCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">单词总数</span>
          <span className="stat-value">{wordList.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">已掌握</span>
          <span className="stat-value correct">{masteredWords}</span>
        </div>
      </div>
      <h1>单词训练游戏</h1>
      <h2>选择游戏模式</h2>
      <div className="options">
        <button className="btn btn-primary" onClick={() => startGame('enToZh')}>
          英译汉
        </button>
        <button className="btn btn-secondary" onClick={() => startGame('zhToEn')}>
          汉译英
        </button>
        <button className="btn btn-success" onClick={() => startGame('spelling')}>
          单词填空
        </button>
      </div>
      <div className="bottom-buttons">
        {wrongAnswers.length > 0 && !showWrongAnswers && (
          <button className="btn btn-wrong-answers" style={{ width: '150px', minWidth: '150px', height: '50px', minHeight: '50px' }} onClick={() => setShowWrongAnswers(true)}>
            错题本 ({wrongAnswers.length})
          </button>
        )}
        {wrongAnswers.length === 0 && (
          <button className="btn btn-wrong-answers" style={{ width: '150px', minWidth: '150px', height: '50px', minHeight: '50px' }} onClick={() => setShowWrongAnswers(true)}>
            错题本 (0)
          </button>
        )}
        <button className="btn btn-settings" style={{ width: '150px', minWidth: '150px', height: '50px', minHeight: '50px' }} onClick={() => setShowSettings(true)}>
          设置
        </button>
      </div>
    </div>
  );

  const renderEnToZhGame = () => (
    <div className="game-container">
      <div className="progress">
        <span>分数: {score}</span>
        <span className="time-display">用时: {formatTime(gameTime)}</span>
        <span>{currentQuestionIndex + 1}/{questionCount}</span>
      </div>
      <div className="question">{currentWord.en}</div>
      <div className="options">
        {options.map((option, index) => (
          <button
            key={index}
            className={`btn ${selectedAnswer === option.text ? (option.isCorrect ? 'btn-success' : 'btn-danger') : 'btn-primary'}`}
            onClick={() => handleOptionSelect(option)}
            disabled={selectedAnswer !== null}
          >
            {option.text}
          </button>
        ))}
      </div>
      <div className="feedback-row">
        <div className="feedback-container">
          <div className={`feedback ${feedbackType}`}>{feedback}</div>
          {isAnswered && currentQuestionIndex < questionCount - 1 && <div className="countdown-display">{countdown}</div>}
        </div>
        <div className="options-bottom">
          {currentQuestionIndex > 0 && (
            <button className="btn btn-icon btn-secondary" onClick={() => prevQuestion()}>
              ⬅️
            </button>
          )}
          {currentQuestionIndex < questionCount - 1 ? (
            <button className="btn btn-icon btn-primary" onClick={() => nextQuestion(gameMode)}>
              ➡️
            </button>
          ) : (
            <button className="btn btn-icon btn-primary" onClick={() => endGame()}>
              🏁
            </button>
          )}
          <button className="btn btn-icon btn-danger" onClick={() => { setGameMode(null); setGameComplete(false); }}>
            🏠
          </button>
        </div>
      </div>
    </div>
  );

  const renderZhToEnGame = () => (
    <div className="game-container">
      <div className="progress">
        <span>分数: {score}</span>
        <span className="time-display">用时: {formatTime(gameTime)}</span>
        <span>{currentQuestionIndex + 1}/{questionCount}</span>
      </div>
      <div className="question">{currentWord.zh}</div>
      <div className="options">
        {options.map((option, index) => (
          <button
            key={index}
            className={`btn ${selectedAnswer === option.text ? (option.isCorrect ? 'btn-success' : 'btn-danger') : 'btn-primary'}`}
            onClick={() => handleOptionSelect(option)}
            disabled={selectedAnswer !== null}
          >
            {option.text}
          </button>
        ))}
      </div>
      <div className="feedback-row">
        <div className="feedback-container">
          <div className={`feedback ${feedbackType}`}>{feedback}</div>
          {isAnswered && currentQuestionIndex < questionCount - 1 && <div className="countdown-display">{countdown}</div>}
        </div>
        <div className="options-bottom">
          {currentQuestionIndex > 0 && (
            <button className="btn btn-icon btn-secondary" onClick={() => prevQuestion()}>
              ⬅️
            </button>
          )}
          {currentQuestionIndex < questionCount - 1 ? (
            <button className="btn btn-icon btn-primary" onClick={() => nextQuestion(gameMode)}>
              ➡️
            </button>
          ) : (
            <button className="btn btn-icon btn-primary" onClick={() => endGame()}>
              🏁
            </button>
          )}
          <button className="btn btn-icon btn-danger" onClick={() => { setGameMode(null); setGameComplete(false); }}>
            🏠
          </button>
        </div>
      </div>
    </div>
  );

    const renderSpellingGame = () => {
    return (
      <div className="game-container">
        <div className="progress">
          <span>分数: {score}</span>
          <span className="time-display">用时: {formatTime(gameTime)}</span>
          <span>{currentQuestionIndex + 1}/{questionCount}</span>
        </div>
        <div className="question">{currentWord?.zh}</div>
        <div className="word-display">
          {wordBlanks && wordBlanks.length > 0 ? wordBlanks.map((letter, index) => {
            const blankIdx = blankPositions.indexOf(index);
            const isBlankPosition = blankIdx !== -1;
            
            return (
              <span 
                key={index} 
                className={`word-letter ${letter === '_' ? 'blank-letter' : ''} ${letter === ' ' ? 'space-char' : ''} ${isBlankPosition && letter !== '_' ? 'filled-blank' : ''}`}
                onClick={(e) => isBlankPosition && letter !== '_' && handleBlankClick(blankIdx, e)}
                style={isBlankPosition && letter !== '_' ? { cursor: 'pointer' } : {}}
              >
                {letter === '_' ? '' : letter}
              </span>
            );
          }) : null}
        </div>
        <div className="keyboard">
          {alphabet && alphabet.length > 0 ? alphabet.map((letter, idx) => (
            <div
              key={idx}
              className={`key ${usedLetters.includes(letter) ? 'used' : ''}`}
              onClick={() => handleLetterClick(letter)}
            >
              {letter}
            </div>
          )) : null}
        </div>
        <div className="feedback-row">
          <div className="feedback-container">
            <div className={`feedback ${feedbackType}`}>{feedback}</div>
            {isAnswered && currentQuestionIndex < questionCount - 1 && <div className="countdown-display">{countdown}</div>}
          </div>
          <div className="options-bottom">
            {currentQuestionIndex > 0 && (
              <button className="btn btn-icon btn-secondary" onClick={() => prevQuestion()}>
                ⬅️
              </button>
            )}
            {currentQuestionIndex < questionCount - 1 ? (
              <button className="btn btn-icon btn-primary" onClick={() => nextQuestion(gameMode)}>
                ➡️
              </button>
            ) : (
              <button className="btn btn-icon btn-primary" onClick={() => endGame()}>
                🏁
              </button>
            )}
            <button className="btn btn-icon btn-danger" onClick={() => { setGameMode(null); setGameComplete(false); }}>
              🏠
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderPracticeGame = () => {
    const currentWrong = wrongAnswers[currentPracticeIndex];
    if (!currentWrong) {
      return (
        <div className="game-container">
          <h2>错题训练完成！</h2>
          <button className="btn btn-primary" onClick={() => {
            setPracticeMode(null);
            setShowWrongAnswers(false);
            setIsPracticeMode(false);
          }}>
            返回菜单
          </button>
        </div>
      );
    }

    return (
      <div className="game-container">
        <div className="progress">
          <span>错题训练 [{currentWrong.mode}]</span>
          <span>{currentPracticeIndex + 1}/{wrongAnswers.length}</span>
        </div>
        <div className="question">{currentWord?.zh}</div>
        
        {practiceMode === 'spelling' ? (
          <>
            <div className="word-display">
              {wordBlanks && wordBlanks.length > 0 ? wordBlanks.map((letter, index) => {
                const blankIdx = blankPositions.indexOf(index);
                const isBlankPosition = blankIdx !== -1;
                
                return (
                  <span 
                    key={index} 
                    className={`word-letter ${letter === '_' ? 'blank-letter' : ''} ${letter === ' ' ? 'space-char' : ''} ${isBlankPosition && letter !== '_' ? 'filled-blank' : ''}`}
                    onClick={(e) => isBlankPosition && letter !== '_' && handleBlankClick(blankIdx, e)}
                    style={isBlankPosition && letter !== '_' ? { cursor: 'pointer' } : {}}
                  >
                    {letter === '_' ? '' : letter}
                  </span>
                );
              }) : null}
            </div>
            <div className="keyboard">
              {alphabet && alphabet.length > 0 ? alphabet.map((letter, idx) => (
                <div
                  key={idx}
                  className={`key ${usedLetters.includes(letter) ? 'used' : ''}`}
                  onClick={() => handleLetterClick(letter)}
                >
                  {letter}
                </div>
              )) : null}
            </div>
          </>
        ) : (
          <div className="options">
            {options.map((option, index) => (
              <button
                key={index}
                className={`btn ${isAnswered ? (option.isCorrect ? 'btn-success' : 'btn-danger') : 'btn-primary'}`}
                onClick={() => !isAnswered && handlePracticeAnswer(option.isCorrect, option.text)}
                disabled={isAnswered}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}
        
        <div className="feedback-row">
          <div className={`feedback ${feedbackType}`}>{feedback}</div>
          <div className="options-bottom">
              {currentPracticeIndex < wrongAnswers.length - 1 ? (
                <button className="btn btn-primary" onClick={() => nextPracticeQuestion()}>
                  下一题
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => {
                  setPracticeMode(null);
                  setShowWrongAnswers(false);
                  setIsPracticeMode(false);
                }}>
                  完成
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => {
                setPracticeMode(null);
                setShowWrongAnswers(false);
                setIsPracticeMode(false);
              }}>
                返回菜单
              </button>
            </div>
          </div>
        </div>
    );
  };

  const generatePracticeOptions = (wrongItem) => {
    const correctText = wrongItem.correctAnswer;
    const options = [{ text: correctText, isCorrect: true }];
    
    const mode = wrongItem.mode === '英译汉' ? 'enToZh' : 'zhToEn';
    const otherWords = wordList.filter(w => 
      (mode === 'enToZh' ? w.zh : w.en) !== correctText
    );
    
    const shuffled = otherWords.sort(() => Math.random() - 0.5).slice(0, 3);
    shuffled.forEach(w => {
      options.push({
        text: mode === 'enToZh' ? w.zh : w.en,
        isCorrect: false
      });
    });
    
    return options.sort(() => Math.random() - 0.5);
  };

  const renderGameResults = () => {
    const isPerfect = correctCount === questionCount;
    
    return (
      <div className="game-complete">
        {isPerfect && (
          <div className="perfect-score">
            <h2>🎉 太棒了！全部答对！🎉</h2>
          </div>
        )}
        <h2>游戏完成！</h2>
        <div className="results-stats">
          <div className="result-item">
            <span className="result-label">正确</span>
            <span className="result-value correct">{correctCount}</span>
          </div>
          <div className="result-item">
            <span className="result-label">错误</span>
            <span className="result-value incorrect">{wrongCount}</span>
          </div>
          <div className="result-item">
            <span className="result-label">得分</span>
            <span className="result-value">{score}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { 
          setGameMode(null); 
          setGameComplete(false); 
          setShowWrongAnswers(false);
          setShowSettings(false);
          setIsPracticeMode(false);
          setPracticeMode(null);
        }}>
          返回菜单
        </button>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="settings-container">
      <h2>设置</h2>
      
      <div className="settings-section">
        <h3>题目数量</h3>
        <div className="settings-options">
          <button 
            className={`btn ${questionCount === 10 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setQuestionCount(10)}
          >
            10题
          </button>
          <button 
            className={`btn ${questionCount === 20 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setQuestionCount(20)}
          >
            20题
          </button>
          <button 
            className={`btn ${questionCount === 25 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setQuestionCount(25)}
          >
            25题
          </button>
          <button 
            className={`btn ${questionCount === 50 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setQuestionCount(50)}
          >
            50题
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>自动倒数秒数</h3>
        <div className="settings-options">
          <button 
            className={`btn ${countdownSeconds === 1 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountdownSeconds(1)}
          >
            1秒
          </button>
          <button 
            className={`btn ${countdownSeconds === 2 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountdownSeconds(2)}
          >
            2秒
          </button>
          <button 
            className={`btn ${countdownSeconds === 3 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountdownSeconds(3)}
          >
            3秒
          </button>
          <button 
            className={`btn ${countdownSeconds === 5 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCountdownSeconds(5)}
          >
            5秒
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>选择年级</h3>
        <div className="settings-options grade-options">
          {gradeStages.map(stage => {
            const count = getWordCountForStage(stage);
            return (
              <button 
                key={stage.value}
                className={`btn ${selectedGrades.includes(stage.value) ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  if (selectedGrades.includes(stage.value)) {
                    setSelectedGrades(selectedGrades.filter(g => g !== stage.value));
                  } else {
                    setSelectedGrades([...selectedGrades, stage.value]);
                  }
                }}
              >
                {stage.label} <span className="grade-count">({count})</span>
              </button>
            );
          })}
        </div>
        <p style={{textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: '#666'}}>
          已标记年级单词数：{wordList.filter(w => w.grade).length} / {wordList.length}
        </p>
      </div>

      <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
        返回
      </button>
    </div>
  );

  const renderAnalytics = () => {
    const [summary, setSummary] = useState({
      totalVisits: 0,
      uniqueUsers: 0,
      totalQuestions: 0,
      accuracyRate: 0
    });
    const [users, setUsers] = useState([]);

    // 加载统计数据
    useEffect(() => {
      const loadData = async () => {
        const summaryData = await analyticsService.getSummary();
        const userList = await analyticsService.getUserList();
        setSummary(summaryData);
        setUsers(userList);
      };
      loadData();
    }, []);
    
    return (
      <div className="analytics-container">
        <h2>数据统计</h2>
        
        <div className="analytics-summary">
          <div className="summary-item">
            <span className="summary-label">总访问次数</span>
            <span className="summary-value">{summary.totalVisits}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">独立用户数</span>
            <span className="summary-value">{summary.uniqueUsers}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">总答题数</span>
            <span className="summary-value">{summary.totalQuestions}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">正确率</span>
            <span className="summary-value">{summary.accuracyRate}%</span>
          </div>
        </div>
        
        <div className="analytics-controls">
          <button className="btn btn-primary" onClick={() => analyticsService.exportData()}>
            导出数据
          </button>
          <button className="btn btn-danger" onClick={() => {
            if (window.confirm('确定要清空所有统计数据吗？此操作不可恢复！')) {
              analyticsService.clearData();
              setSummary({
                totalVisits: 0,
                uniqueUsers: 0,
                totalQuestions: 0,
                accuracyRate: 0
              });
              setUsers([]);
            }
          }}>
            清空数据
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAnalytics(false)}>
            返回
          </button>
        </div>
        
        <div className="users-list">
          <h3>用户列表 ({users.length})</h3>
          <div className="users-container">
            {users.map((user, index) => (
              <div key={user.id} className="user-item">
                <div className="user-info">
                  <span className="user-id">用户 {index + 1}</span>
                  <span className="user-visits">访问: {user.visits}次</span>
                  <span className="user-questions">答题: {user.totalQuestions}题</span>
                  <span className="user-accuracy">正确率: {user.totalQuestions > 0 ? ((user.correctAnswers / user.totalQuestions) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="user-dates">
                  <span className="user-date">首次: {new Date(user.firstVisit).toLocaleDateString()}</span>
                  <span className="user-date">最后: {new Date(user.lastVisit).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {showSettings && renderSettings()}
      {showAnalytics && renderAnalytics()}
      {gameComplete && !showWrongAnswers && !practiceMode ? renderGameResults() : null}
      {!gameMode && !practiceMode && !showSettings && !showAnalytics && !gameComplete && !showWrongAnswers ? renderModeSelection() : null}
      {practiceMode && renderPracticeGame()}
      {gameMode === 'enToZh' && currentWord && !gameComplete ? renderEnToZhGame() : null}
      {gameMode === 'zhToEn' && currentWord && !gameComplete ? renderZhToEnGame() : null}
      {gameMode === 'spelling' && currentWord && !gameComplete ? renderSpellingGame() : null}
      {showWrongAnswers && (
        <div className="wrong-answers-section">
          <h3>错题本 ({wrongAnswers.length})</h3>
          {wrongAnswers.length > 0 && (
            <button className="btn btn-primary" onClick={() => startPractice()}>
              开始训练
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setShowWrongAnswers(false)}>
            返回
          </button>
          <div className="wrong-answers-list">
            {wrongAnswers.map((item, index) => (
              <div key={index} className="wrong-answer-item">
                <span className="wrong-mode">{item.mode}</span>
                <span className="wrong-question">{item.question}</span>
                <span className="wrong-answer">正确答案: {item.correctAnswer}</span>
                <span className="wrong-user-answer">你的答案: {item.userAnswer}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
