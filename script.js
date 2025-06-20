// Initial values
let allQuestions = [];
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval;
let secondsElapsed = 0;
let isPaused = false;

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
        Swal.fire({
          title: "Mauvaise Configuration",
          text: `Entrez un nombre valide de questions  (entre 1 à ${allQuestions.length}) `,
          icon: "warning",
        });
        return;
      }
    }
    const questionCount =
      mode === "test"
        ? parseInt(document.getElementById("nb-questions").value)
        : 42;

    startQuiz(questionCount, mode);
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
  document.getElementById("submit-btn").addEventListener("click", correctQuiz);
  document.getElementById("end-btn").addEventListener("click", submitExam);
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

function startQuiz(count, mode) {
  quizQuestions = allQuestions.slice(0, count);
  userAnswers = new Array(count).fill(null);

  localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
  currentQuestionIndex = 0;

  document.getElementById("setup").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("restart-btn").style.display = "block";

  if (mode == "exam") {
    document.getElementById("submit-btn").style.display = "none";
    document.getElementById("end-btn").style.display = "block";
    document.getElementById("pause-resume").style.display = "none";
  } else {
    document.getElementById("submit-btn").style.display = "block";
    document.getElementById("end-btn").style.display = "none";
    document.getElementById("pause-resume").style.display = "block";
  }

  // reset the pause and resume status each time
  isPaused = false;
  startTimer();
  
  showQuestion(currentQuestionIndex, count);
}

function showQuestion(index, count) {
  currentQuestionIndex = index;

  const infobar = document.getElementById("info-bar");
  const questionIndex = infobar.querySelector("#nb");
  const total = infobar.querySelector("#total");

  questionIndex.innerHTML = index + 1;
  total.innerHTML = count;

  infobar.style.display = "flex";

  const container = document.getElementById("quiz-container");
  container.innerHTML = "";
  const question = quizQuestions[index];

  const box = document.createElement("div");
  box.className = "question-box";
  box.innerHTML = `<strong>Question ${index + 1}:</strong><br><br>${
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
  nav.setAttribute("class", "nav-btn");
  if (index > 0) {
    const prev = document.createElement("button");
    prev.innerText = "Précédent";
    prev.onclick = () => showQuestion(index - 1, count);
    nav.appendChild(prev);
  }
  if (index < quizQuestions.length - 1) {
    const next = document.createElement("button");
    next.innerText = "Suivant";
    next.onclick = () => showQuestion(index + 1, count);
    nav.appendChild(next);
  }

  box.appendChild(nav);
  container.appendChild(box);
}

function saveAnswer(index, value) {
  userAnswers[index] = value;
  localStorage.setItem("userAnswers", JSON.stringify(userAnswers));
}

function correctQuiz() {
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

function submitExam() {
  const unansweredCount = userAnswers.filter(
    (answer) => answer === null || answer === undefined
  ).length;

  if (unansweredCount > 0) {
    Swal.fire({
      title: "Test incomplet",
      text: `Vous devez répondre à toutes les questions pour terminer le test !
    Il vous reste ${unansweredCount} questions sans réponse !`,
      icon: "warning",
      confirmButtonText: "Continuez l'examen !",
    });

    return;
  }
  // stop timer when the user submit the test
  stopTimer();

  let score = 0;
  quizQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) score++;
  });
  const percentage = ((score / quizQuestions.length) * 100).toFixed(1);

  let swalDict = {};

  if (percentage > 75) {
    swalDict.title = "Examen Reussi !";
    swalDict.text = `Pourcentage : ${percentage} % questions trouvées: ${score} / ${quizQuestions.length}`;
    swalDict.icon = "success";
  } else {
    swalDict.title = "Examen raté !";
    swalDict.text = `Pourcentage : ${percentage} questions trouvées: ${score} / ${quizQuestions.length}`;
    swalDict.icon = "error";
  }

  Swal.fire({
    title: swalDict.title,
    text: swalDict.text,
    icon: swalDict.icon,
    confirmButtonText: "Voir les résultats",
  });

  // display the result
  correctQuiz();
  // make the selected answer unupdatable
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.disabled = true;
  });
  // once the test is validated no more validation allow avoiding correction and resubmitting
  document.getElementById("end-btn").style.display = "none";
}

function startTimer() {
  const timerElement = document.getElementById("timer");
  secondsElapsed = 0;

  if (timerInterval) clearInterval(timerInterval); // Reset if already running

  timerInterval = setInterval(() => {
    if (!isPaused) {
      secondsElapsed++;
      const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, "0");
      const secs = String(secondsElapsed % 60).padStart(2, "0");
      timerElement.textContent = `Temps passé: ${mins}:${secs}`;
    }
  }, 1000);
}

function toggleTimer() {
  isPaused = !isPaused;
}

function stopTimer() {
  clearInterval(timerInterval);
}

function resetTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  document.getElementById("timer").textContent = "Temps passé: 00:00";
}

function resetQuiz() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("submit-btn").style.display = "none";
  document.getElementById("result").classList.add("hidden");
  document.getElementById("setup").style.display = "flex";
  document.getElementById("quiz-container").innerHTML = "";
  document.getElementById("info-bar").style.display = "none";
  document.getElementById("end-btn").style.display = "none";
  resetTimer();
}
