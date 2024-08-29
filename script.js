document.addEventListener("DOMContentLoaded", function () {
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0; // Score for the current game session
    let total = 0; // Total number of questions attempted
    let gameState = "playing";
    let endlessStats = {
        timesPlayed: 0,
        highestScore: 0,
        totalScore: 0 // Overall total score across all sessions
    };
    let lives = 3;
    const hearts = document.querySelectorAll('.heart-icon');
    let isEndlessMode = false;
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
    const message = document.getElementById('message');
    const facts = document.getElementById('facts');
    const nextBtn = document.getElementById('next');
    const scoreDisplay = document.getElementById('score');
    const headingText = document.getElementById('heading');
    const subHeadingText = document.getElementById('subHeading');
    const statsBtn = document.getElementById('stats-btn');
    const statsModal = document.getElementById('stats-modal');
    const closeBtn = document.querySelector('.close-btn');
    const endlessModeBtn = document.getElementById('endless-mode-btn');
    const modeSelection = document.getElementById('mode-selection');
    const gameContainer = document.getElementById('game-container');
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    const playEndlessFromGameOver = document.getElementById('play-endless-from-gameover');
    const tryAgainBtn = document.getElementById('try-again');
    const seeStatsFromGameOver = document.getElementById('see-stats-from-gameover'); // Ensure this ID matches your HTML

    // Load stats from localStorage if available
    const savedStats = JSON.parse(localStorage.getItem('countryGame'));
    if (savedStats && savedStats.endlessStats) {
        endlessStats = savedStats.endlessStats;
    }

    if (localStorage.getItem('highestScore')) {
        endlessStats.highestScore = parseInt(localStorage.getItem('highestScore'));
    }

    // Fetch the countries data and start the game once the data is loaded
    fetch('countries.json')
        .then(response => response.json())
        .then(data => {
            countries = data;
            // After loading countries, attach event listeners and make the buttons functional
            options.forEach(button => button.addEventListener('click', checkAnswer));
            nextBtn.addEventListener('click', nextCountry);
            endlessModeBtn.addEventListener('click', restartEndlessMode);
            playEndlessFromGameOver.addEventListener('click', restartEndlessMode);
            tryAgainBtn.addEventListener('click', restartEndlessMode);
            seeStatsFromGameOver.addEventListener('click', showStatsModal); // Ensure this is registered
        })
        .catch(error => console.error('Error loading countries data:', error));

    function saveGameState() {
        // Save the current session's game state (but not the total score again)
        const gameStateData = {
            gameState: gameState,
            score: score,
            total: total,
            lives: lives,
            usedCountries: usedCountries,
            currentCountry: currentCountry,
            endlessStats: endlessStats,
            isEndlessMode: isEndlessMode
        };

        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
    }

    function restartEndlessMode() {
        modeSelection.style.display = 'none';  // Hide the play button and mode selection
        endlessGameOverScreen.style.display = 'none';
        nextBtn.disabled = false;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        gameContainer.style.display = 'flex';  // Show the game container
        headingText.style.display = 'block';
        subHeadingText.style.display = 'block';
        flagImg.style.display = 'block';
        document.getElementById('options').style.display = 'block';
        document.getElementById('top-right-game-stats').style.display = 'flex';
        hearts.forEach(heart => heart.classList.remove('heart-lost'));
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        isEndlessMode = true;
        endlessStats.timesPlayed++;
        nextCountry();
    }

    function updateUI() {
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        hearts.forEach((heart, index) => {
            if (index < lives) {
                heart.classList.remove('heart-lost');
            } else {
                heart.classList.add('heart-lost');
            }
        });

        if (lives === 0) {
            gameState = "over";
            nextBtn.disabled = true;
            if (isEndlessMode) {
                showEndlessGameOver();
            }
        }
    }

    function showEndlessGameOver() {
        lives = 0;

        hearts.forEach(heart => {
            heart.classList.add('heart-lost');
        });

        // Accumulate the current session's score to the total score
        endlessStats.totalScore += score;

        if (score > endlessStats.highestScore) {
            endlessStats.highestScore = score;
            localStorage.setItem('highestScore', endlessStats.highestScore);
        }

        localStorage.setItem('countryGame', JSON.stringify({ endlessStats }));

        endlessGameOverScreen.style.display = 'block';
        gameContainer.style.display = 'none';
        document.getElementById('top-right-game-stats').style.display = 'none';
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        flagImg.style.display = 'none';
        document.getElementById('options').style.display = 'none';
        document.getElementById('endless-score-display').textContent = "Your Score: " + score;
        document.getElementById('endless-highest-score-display').textContent = "Highest Score: " + endlessStats.highestScore;
    }

    function showStatsModal() {
        updateStats();
        statsModal.style.display = 'block';
    }

    function updateStats() {
        document.getElementById('endless-times-played-value').textContent = endlessStats.timesPlayed;
        document.getElementById('endless-highest-score-value').textContent = endlessStats.highestScore;
        document.getElementById('endless-total-score-value').textContent = endlessStats.totalScore;
    }

    closeBtn.addEventListener('click', () => {
        statsModal.style.display = 'none';
    });

    statsBtn.addEventListener('click', showStatsModal);

    function backToMainMenu() {
        endlessGameOverScreen.style.display = 'none';
        modeSelection.style.display = 'flex';  // Show the mode selection again
        gameContainer.style.display = 'none';
        document.getElementById('top-right-game-stats').style.display = 'none';
    }

    function nextCountry() {
        nextBtn.disabled = false;
        saveGameState();
        fetchNewCountry();

        options.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });

        message.textContent = "";
        facts.hidden = true;
        nextBtn.hidden = true;
        headingText.hidden = false;
        subHeadingText.hidden = false;
    }

    function fetchNewCountry() {
        const countryCodes = Object.keys(countries);
        if (countryCodes.length === 0) {
            console.error('No countries available');
            return;
        }
        const randomIndex = Math.floor(Math.random() * countryCodes.length);
        const countryCode = countryCodes[randomIndex];
        currentCountry = countries[countryCode];

        if (!currentCountry || !currentCountry.flag || !currentCountry.flag.large) {
            console.error('Invalid country data:', currentCountry);
            return;
        }

        flagImg.src = currentCountry.flag.large;
        updateOptions();
        localStorage.setItem('currentFlag', JSON.stringify(currentCountry));
    }

    function checkAnswer(event) {
        const selectedCountryName = event.target.textContent;
        options.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });

        localStorage.removeItem('currentFlag');

        if (selectedCountryName === currentCountry.name) {
            message.textContent = "🎉 Correct! Well done!";
            score++;
            event.target.classList.add('correct-answer');
        } else {
            message.textContent = "😢 Oops, that's not correct.";
            event.target.classList.add('wrong-answer');
            loseLife();
        }

        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        showFacts(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        nextBtn.hidden = false;

        saveGameState();
    }

    function loseLife() {
        if (lives > 0) {
            lives--;
            hearts[lives].classList.add('heart-lost');
            saveGameState();
        }

        if (lives === 0) {
            gameState = "over";
            nextBtn.disabled = true;
            setTimeout(() => {
                if (isEndlessMode) {
                    showEndlessGameOver();
                }
            }, 2000);
        }
    }

    function updateOptions() {
        const allOtherCountryCodes = Object.keys(countries).filter(code => code !== currentCountry.alpha2Code);
        const incorrectAnswers = [];
        while (incorrectAnswers.length < 3 && allOtherCountryCodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * allOtherCountryCodes.length);
            const countryCode = allOtherCountryCodes[randomIndex];
            incorrectAnswers.push(countries[countryCode].name);
            allOtherCountryCodes.splice(randomIndex, 1);
        }

        const allAnswers = [...incorrectAnswers, currentCountry.name];
        options.forEach(button => {
            const randomIndex = Math.floor(Math.random() * allAnswers.length);
            button.textContent = allAnswers[randomIndex];
            allAnswers.splice(randomIndex, 1);
        });
    }

    function showFacts(country) {
        facts.innerHTML = `
            <p class="fact-text"><strong>Capital:</strong> ${country.capital}</p>
            <p class="fact-text"><strong>Location:</strong> ${country.subregion}</p>
        `;
        facts.hidden = false;
    }

    function shareScore() {
        const scoreText = `flagtriv: ${score}/${total} www.flagtriv.com`;
    
        if (navigator.share) {
            navigator.share({
                title: 'Check out my score!',
                text: scoreText,
                url: document.URL
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = scoreText;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                const msg = successful ? 'successful' : 'unsuccessful';
                console.log('Fallback: Copying text command was ' + msg);
                showCopiedToast(); // Show the toast
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
        }
    }
    
    function showCopiedToast() {
        var resultsToast = document.getElementById("resultsToast");
        resultsToast.className = "show";
        setTimeout(function () { resultsToast.className = resultsToast.className.replace("show", ""); }, 3000);
    }

    document.getElementById('share-button').addEventListener('click', shareScore);
});




