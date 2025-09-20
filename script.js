let currentQuestion = 0;
        let questions = [];
        let score = 0;
        let timeLeft = 30;
        let timer = null;
        let startTime = null;
        let questionStartTime = null;
        let totalTimeTaken = 0;
        let questionTimes = [];

        const apiUrl = 'https://opentdb.com/api.php';

        function showScreen(screenId) {
            document.querySelectorAll('.setup-screen, .quiz-screen, .results-screen, .loading').forEach(screen => {
                screen.style.display = 'none';
            });
            document.getElementById(screenId).style.display = 'block';
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            document.querySelector('.container').appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }

        async function startQuiz() {
            const numQuestions = document.getElementById('numQuestions').value;
            const category = document.getElementById('category').value;
            const difficulty = document.getElementById('difficulty').value;
            const type = document.getElementById('type').value;

            let url = `${apiUrl}?amount=${numQuestions}`;
            if (category) url += `&category=${category}`;
            if (difficulty) url += `&difficulty=${difficulty}`;
            if (type) url += `&type=${type}`;

            showScreen('loadingScreen');

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.response_code !== 0) {
                    throw new Error('Failed to fetch questions. Please try different settings.');
                }

                questions = data.results;
                currentQuestion = 0;
                score = 0;
                startTime = Date.now();
                questionTimes = [];
                
                showScreen('quizScreen');
                loadQuestion();
                startTimer();
            } catch (error) {
                showScreen('setupScreen');
                showError(error.message);
            }
        }

        function loadQuestion() {
            if (currentQuestion >= questions.length) {
                showResults();
                return;
            }

            questionStartTime = Date.now();
            const question = questions[currentQuestion];
            
            document.getElementById('questionNumber').textContent = 
                `Question ${currentQuestion + 1} of ${questions.length}`;
            
            document.getElementById('categoryDifficulty').textContent = 
                `${question.category} • ${question.difficulty.toUpperCase()}`;
            
            const progress = (currentQuestion / questions.length) * 100;
            document.getElementById('progressFill').style.width = `${progress}%`;
            
            document.getElementById('questionText').innerHTML = decodeHTML(question.question);
            
            const answers = [...question.incorrect_answers, question.correct_answer];
            shuffleArray(answers);
            
            const answersContainer = document.getElementById('answersContainer');
            answersContainer.innerHTML = '';
            
            answers.forEach((answer, index) => {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'answer';
                answerDiv.innerHTML = decodeHTML(answer);
                answerDiv.onclick = () => selectAnswer(answerDiv, answer, question.correct_answer);
                answersContainer.appendChild(answerDiv);
            });
            
            timeLeft = 30;
            document.getElementById('nextBtn').style.display = 'none';
        }

        function selectAnswer(selectedElement, selectedAnswer, correctAnswer) {
            const answers = document.querySelectorAll('.answer');
            answers.forEach(answer => answer.onclick = null);
            
            const timeTaken = (Date.now() - questionStartTime) / 1000;
            questionTimes.push(timeTaken);
            
            selectedElement.classList.add('selected');
            
            answers.forEach(answer => {
                if (answer.innerHTML === decodeHTML(correctAnswer)) {
                    answer.classList.add('correct');
                } else if (answer === selectedElement && selectedAnswer !== correctAnswer) {
                    answer.classList.add('incorrect');
                }
            });
            
            if (selectedAnswer === correctAnswer) {
                score++;
            }
            
            clearInterval(timer);
            document.getElementById('nextBtn').style.display = 'inline-block';
        }

        function startTimer() {
            timer = setInterval(() => {
                timeLeft--;
                document.getElementById('timer').textContent = `${timeLeft}s`;
                
                if (timeLeft <= 0) {
                    const answers = document.querySelectorAll('.answer');
                    answers.forEach(answer => answer.onclick = null);
                    
                    const question = questions[currentQuestion];
                    answers.forEach(answer => {
                        if (answer.innerHTML === decodeHTML(question.correct_answer)) {
                            answer.classList.add('correct');
                        }
                    });
                    
                    questionTimes.push(30);
                    clearInterval(timer);
                    document.getElementById('nextBtn').style.display = 'inline-block';
                }
            }, 1000);
        }

        function nextQuestion() {
            currentQuestion++;
            loadQuestion();
            if (currentQuestion < questions.length) {
                startTimer();
            }
        }

        function showResults() {
            totalTimeTaken = (Date.now() - startTime) / 1000;
            const percentage = Math.round((score / questions.length) * 100);
            
            document.getElementById('finalScore').textContent = `${percentage}%`;
            document.getElementById('correctAnswers').textContent = score;
            document.getElementById('incorrectAnswers').textContent = questions.length - score;
            document.getElementById('totalTime').textContent = `${Math.round(totalTimeTaken)}s`;
            document.getElementById('averageTime').textContent = 
                `${Math.round(totalTimeTaken / questions.length)}s`;
            
            showScreen('resultsScreen');
        }

        function restartQuiz() {
            showScreen('setupScreen');
        }

        function goHome() {
            showScreen('setupScreen');
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function decodeHTML(html) {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }