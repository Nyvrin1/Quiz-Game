let audioContext = null;

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((answer) =>
      this.decodeHtml(answer),
    );
    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;

    this.keyHandler = (event) => {
      const validKeys = ["1", "2", "3", "4"];
      if (validKeys.includes(event.key)) {
        const buttons = this.container.querySelectorAll(".answer-btn");
        const button = buttons[Number(event.key) - 1];
        if (button) {
          this.checkAnswer(button);
        }
      }
    };
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    const answers = this.wrongAnswers.concat([this.correctAnswer]);

    if (answers.length === 2) {
      return ["True", "False"];
    }

    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = answers[i];
      answers[i] = answers[j];
      answers[j] = temp;
    }
    return answers;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const total = this.quiz.numberOfQuestions;
    const current = this.index + 1;

    const difficulty = this.questionData.difficulty;
    let difficultyIcon = "fa-face-smile";
    if (difficulty === "medium") {
      difficultyIcon = "fa-face-meh";
    } else if (difficulty === "hard") {
      difficultyIcon = "fa-skull";
    }

    let answersHtml = "";
    for (let i = 0; i < this.allAnswers.length; i++) {
      answersHtml += `
        <button class="answer-btn">
          <span class="answer-key">${i + 1}</span>
          <span class="answer-text"></span>
        </button>
      `;
    }

    this.container.innerHTML = `
      <div class="game-card question-card">

        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Round ${current}/${total}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span></span>
          </div>
          <div class="stat-badge difficulty ${difficulty}">
            <i class="fa-solid ${difficultyIcon}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${current}/${total}</span>
          </div>
        </div>

        <div id="timeUpBox"></div>

        <h2 class="question-text"></h2>

        <div class="answers-grid">
          ${answersHtml}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector(".question-text").textContent = this.question;
    this.container.querySelector(".stat-badge.category span").textContent =
      this.category;

    const buttons = this.container.querySelectorAll(".answer-btn");
    const answerTexts = this.container.querySelectorAll(".answer-text");
    for (let i = 0; i < this.allAnswers.length; i++) {
      answerTexts[i].textContent = this.allAnswers[i];
      buttons[i].setAttribute("data-answer", this.allAnswers[i]);
    }

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      button.addEventListener("click", () => {
        this.checkAnswer(button);
      });
    }

    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.keyHandler);
  }

  startTimer() {
    const timerValue = this.container.querySelector(".timer-value");
    const timerBadge = this.container.querySelector(".stat-badge.timer");

    this.timerInterval = setInterval(() => {
      this.timeRemaining -= 1;
      timerValue.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5) {
        timerBadge.classList.add("warning");
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    this.highlightCorrectAnswer("correct");
    this.disableOtherButtons(null);

    this.container.querySelector("#timeUpBox").innerHTML = `
      <div class="time-up-message">
        <i class="fa-solid fa-clock"></i> TIME'S UP!
      </div>
    `;

    this.playSound(false);
    this.animateQuestion(400);
  }

  checkAnswer(choiceElement) {
    if (this.answered) {
      return;
    }
    this.answered = true;

    this.stopTimer();
    this.removeEventListeners();

    const selectedAnswer = choiceElement.getAttribute("data-answer");

    if (selectedAnswer.toLowerCase() === this.correctAnswer.toLowerCase()) {
      choiceElement.classList.add("correct");
      this.quiz.incrementScore();
      this.container.querySelector(".score-item-value").textContent =
        this.quiz.score;
      this.playSound(true);
    } else {
      choiceElement.classList.add("wrong");
      this.highlightCorrectAnswer("correct-reveal");
      this.playSound(false);
    }

    this.disableOtherButtons(choiceElement);
    this.animateQuestion(400);
  }

  highlightCorrectAnswer(className) {
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      const answer = buttons[i].getAttribute("data-answer");
      if (answer.toLowerCase() === this.correctAnswer.toLowerCase()) {
        buttons[i].classList.add(className);
      }
    }
  }

  disableOtherButtons(selectedButton) {
    const buttons = this.container.querySelectorAll(".answer-btn");
    for (let i = 0; i < buttons.length; i++) {
      const answer = buttons[i].getAttribute("data-answer");
      const isCorrect =
        answer.toLowerCase() === this.correctAnswer.toLowerCase();
      if (buttons[i] !== selectedButton && !isCorrect) {
        buttons[i].classList.add("disabled");
      }
    }
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      const nextQuestion = new Question(
        this.quiz,
        this.container,
        this.onQuizEnd,
      );
      nextQuestion.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();

      const restartBtn = this.container.querySelector(".btn-restart");
      restartBtn.addEventListener("click", () => {
        this.onQuizEnd();
      });
    }
  }

  animateQuestion(duration) {
    setTimeout(() => {
      const card = this.container.querySelector(".question-card");
      card.classList.add("exit");

      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }

  playSound(isCorrect) {
    if (audioContext === null) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    let notes = [523, 659, 784];
    let waveType = "sine";
    if (!isCorrect) {
      notes = [220, 160];
      waveType = "sawtooth";
    }

    for (let i = 0; i < notes.length; i++) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = audioContext.currentTime + i * 0.12;

      oscillator.type = waveType;
      oscillator.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    }
  }
}
