export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  buildApiUrl() {
    let url = "https://opentdb.com/api.php?amount=" + this.numberOfQuestions;

    if (this.category !== "") {
      url += "&category=" + this.category;
    }

    url += "&difficulty=" + this.difficulty;
    return url;
  }

  async getQuestions() {
    const url = this.buildApiUrl();
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          "Too many requests. Please wait 5 seconds and try again.",
        );
      }
      throw new Error(
        "Failed to load questions (error " + response.status + ").",
      );
    }

    const data = await response.json();

    if (data.response_code !== 0) {
      throw new Error(
        "Not enough questions for these options. Try fewer questions or another category.",
      );
    }

    this.questions = data.results;
    return this.questions;
  }

  incrementScore() {
    this.score += 1;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion() {
    this.currentQuestionIndex += 1;
    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      const saved = localStorage.getItem("quizHighScores");
      if (saved === null) {
        return [];
      }
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }

  saveHighScore() {
    const highScores = this.getHighScores();

    highScores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString(),
    });

    highScores.sort(function (a, b) {
      return b.percentage - a.percentage;
    });
    const top10 = highScores.slice(0, 10);

    localStorage.setItem("quizHighScores", JSON.stringify(top10));
  }

  isHighScore() {
    const highScores = this.getHighScores();

    if (highScores.length < 10) {
      return true;
    }

    const lowest = highScores[highScores.length - 1].percentage;
    return this.getScorePercentage() > lowest;
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    const isNewRecord = this.isHighScore();

    if (isNewRecord) {
      this.saveHighScore();
    }
    const highScores = this.getHighScores();

    let trophy = "💪";
    if (percentage >= 80) {
      trophy = "🏆";
    } else if (percentage >= 50) {
      trophy = "👏";
    }

    const ranks = ["gold", "silver", "bronze"];
    let leaderboardItems = "";
    for (let i = 0; i < highScores.length; i++) {
      let rankClass = "";
      if (i < 3) {
        rankClass = " " + ranks[i];
      }

      const safeName = String(highScores[i].name)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      leaderboardItems +=
        '<li class="leaderboard-item' +
        rankClass +
        '">' +
        '<span class="leaderboard-rank">#' +
        (i + 1) +
        "</span>" +
        '<span class="leaderboard-name">' +
        safeName +
        "</span>" +
        '<span class="leaderboard-score">' +
        highScores[i].percentage +
        "%</span>" +
        "</li>";
    }

    let recordBadge = "";
    if (isNewRecord) {
      recordBadge =
        '<div class="new-record-badge"><i class="fa-solid fa-star"></i> New High Score!</div>';
    }

    return `
      <div class="game-card results-card">
        <div class="results-trophy">${trophy}</div>
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>

        ${recordBadge}

        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">
            ${leaderboardItems}
          </ul>
        </div>

        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}
