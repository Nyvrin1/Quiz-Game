import Quiz from "./quiz.js";
import Question from "./question.js";

const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.querySelector(".questions-container");

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) {
    overlay.remove();
  }
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message"></p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  questionsContainer.querySelector(".error-message").textContent = message;
  questionsContainer
    .querySelector(".retry-btn")
    .addEventListener("click", resetToStart);
}

function validateForm() {
  const value = questionsNumber.value;

  if (value === "") {
    return { isValid: false, error: "Please enter the number of questions." };
  }

  const count = Number(value);

  if (Math.floor(count) !== count) {
    return {
      isValid: false,
      error: "Number of questions must be a whole number.",
    };
  }
  if (count < 1) {
    return { isValid: false, error: "You need at least 1 question." };
  }
  if (count > 50) {
    return { isValid: false, error: "Maximum is 50 questions." };
  }

  return { isValid: true, error: null };
}

function showFormError(message) {
  const oldError = quizOptionsForm.querySelector(".form-error");
  if (oldError) {
    oldError.remove();
  }

  startQuizBtn.insertAdjacentHTML(
    "beforebegin",
    `<div class="form-error"><i class="fa-solid fa-circle-exclamation"></i> ${message}</div>`,
  );

  const errorBox = quizOptionsForm.querySelector(".form-error");

  setTimeout(() => {
    errorBox.style.transition = "opacity 0.4s";
    errorBox.style.opacity = "0";
    setTimeout(() => {
      errorBox.remove();
    }, 400);
  }, 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = "";

  playerNameInput.value = "";
  questionsNumber.value = 10;
  document.querySelector("#categorySelect .custom-select-option").click();
  document.querySelector("#difficultySelect .custom-select-option").click();

  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

async function startQuiz() {
  const validation = validateForm();
  if (!validation.isValid) {
    showFormError(validation.error);
    return;
  }

  let playerName = playerNameInput.value.trim();
  if (playerName === "") {
    playerName = "Player";
  }
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    const firstQuestion = new Question(
      currentQuiz,
      questionsContainer,
      resetToStart,
    );
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
}

startQuizBtn.addEventListener("click", startQuiz);

questionsNumber.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    startQuiz();
  }
});

playerNameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    startQuiz();
  }
});
