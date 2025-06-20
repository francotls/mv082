let allQuestions = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadQuestions();
  initializeQuizUI();
});

//add event listener for the the button (test or exam btn) and load the value from the input if test selected and set 42 for exam
document.querySelectorAll(".start-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;
    // add validation to check if in test mode the input is not empty and the value is between 1 and the total number of questions
    if (mode === "test") {
      const questionInput = document.getElementById("nb-questions");
      const questionCount = parseInt(questionInput.value);
      if (
        isNaN(questionCount) ||
        questionCount < 1 ||
        questionCount > allQuestions.length
      ) {
        alert(
          `Veuillez entrer un nombre valide de questions (1 à ${allQuestions.length})`
        );
        return;
      }
    }
    const questionCount =
      mode === "test"
        ? parseInt(document.getElementById("nb-questions").value)
        : 42;

    startQuiz(questionCount);
  });
});

async function loadQuestions() {
  try {
    const response = await fetch("question.json");
    allQuestions = await response.json();

    // Shuffle questions and options
    shuffleArray(allQuestions);

    // shuffle answers delayed to avoid confusion with the question order
    // allQuestions.forEach(q => shuffleArray(q.options));

    document.getElementById(
      "total-question-count"
    ).textContent = `Nombre total de questions dans la base : ${allQuestions.length}`;

    document
      .getElementById("nb-questions")
      .setAttribute("max", `${allQuestions.length}`);
  } catch (error) {
    console.error("Erreur lors du chargement des questions:", error);
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function initializeQuizUI() {
  document.getElementById("submit-btn").addEventListener("click", submitQuiz);
  document.getElementById("restart-btn").addEventListener("click", resetQuiz);

  document.addEventListener("click", function (e) {
    if (e.target?.name?.startsWith("q")) {
      const radios = document.querySelectorAll(
        `input[name='${e.target.name}']`
      );
      radios.forEach((input) =>
        input.parentElement.classList.remove("selected")
      );
      e.target.parentElement.classList.add("selected");
    }
  });
}

function startQuiz(count) {
  quizQuestions = allQuestions.slice(0, count);
  userAnswers = new Array(count).fill(null);

  localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  currentQuestionIndex = 0;

  document.getElementById("setup").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("submit-btn").style.display = "block";
  document.getElementById("restart-btn").style.display = "block";
  showQuestion(currentQuestionIndex);
}

function showQuestion(index) {
  currentQuestionIndex = index;
  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  const question = quizQuestions[index];

  const box = document.createElement("div");
  box.className = "question-box";
  box.innerHTML = `<strong>Question ${index + 1}:</strong><br>${
    question.question
  }`;

  question.options.forEach((option, i) => {
    const label = document.createElement("label");

    const isSubmitted = !document
      .getElementById("result")
      .classList.contains("hidden");

    const userAnswer = userAnswers[index];

    // Only highlight if user has answered this question
    if (isSubmitted && userAnswer !== null) {
      if (i === question.answer) {
        label.classList.add("correct");
      } else if (i === userAnswer) {
        label.classList.add("incorrect");
      }
    }

    label.innerHTML = `<input type="radio" class="" name="q${index}" value="${i}" 
      ${userAnswers[index] === i ? "checked" : ""} 
      onchange="saveAnswer(${index}, ${i})"> ${option}`;
    box.appendChild(label);
  });

  const nav = document.createElement("div");
  nav.style.textAlign = "center";
  if (index > 0) {
    const prev = document.createElement("button");
    prev.innerText = "Précédent";
    prev.onclick = () => showQuestion(index - 1);
    nav.appendChild(prev);
  }
  if (index < quizQuestions.length - 1) {
    const next = document.createElement("button");
    next.innerText = "Suivant";
    next.onclick = () => showQuestion(index + 1);
    nav.appendChild(next);
  }

  box.appendChild(nav);
  container.appendChild(box);
}

function saveAnswer(index, value) {
  userAnswers[index] = value;
  localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
}

function submitQuiz() {
  let score = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) score++;
  });

  const percentage = ((score / quizQuestions.length) * 100).toFixed(1);
  const resultBox = document.getElementById("result");
  resultBox.classList.remove("hidden");
  resultBox.innerHTML = `✅ Votre score est ${score} / ${quizQuestions.length} (${percentage}%)`;

  // Update current question's labels with correct/incorrect classes
  const labels = document.querySelectorAll(
    `input[name='q${currentQuestionIndex}']`
  );
  labels.forEach((input, i) => {
    input.parentElement.classList.remove("correct", "incorrect");

    const selected = parseInt(input.value);
    const isCorrect = selected === quizQuestions[currentQuestionIndex].answer;
    const wasSelected = selected === userAnswers[currentQuestionIndex];

    if (isCorrect) {
      input.parentElement.classList.add("correct");
    } else if (wasSelected) {
      input.parentElement.classList.add("incorrect");
    }
  });
}

function resetQuiz() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("submit-btn").style.display = "none";
  document.getElementById("result").classList.add("hidden");
  document.getElementById("setup").style.display = "flex";
  document.getElementById("quiz-container").innerHTML = "";
}
