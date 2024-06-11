document.addEventListener("DOMContentLoaded", function () {
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0;
    let total = 0;
    let gameState = "playing";
    let playedDates = [];

    if (localStorage.getItem('playedDates')) {
        playedDates = JSON.parse(localStorage.getItem('playedDates'));
    }

    let dailyStats = {
        timesPlayed: 0,
        currentStreak: 0,
        maxStreak: 0,
        overallScore: 0,
        overallTotal: 0
    };

    let endlessStats = {
        timesPlayed: 0,
        highestScore: 0,
        totalScore: 0
    };

    let lives = 3;
    const hearts = document.querySelectorAll('.heart-icon');
    let isEndlessMode = false;
    let hasPlayedDaily = false;
    const today = (new Date()).toDateString();

    // DOM Elements
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
    const dailyChallengeBtn = document.getElementById('daily-challenge-btn');
    const endlessModeBtn = document.getElementById('endless-mode-btn');
    const modeSelection = document.getElementById('mode-selection');
    const gameContainer = document.getElementById('game-container');
    const gameOverScreen = document.getElementById('game-over-screen');
    const endlessGameOverScreen = document.getElementById('endless-game-over-screen');
    const playEndlessFromGameOver = document.getElementById('play-endless-from-gameover');
    const tryAgainBtn = document.getElementById('try-again');
    const mainMenuBtn = document.getElementById('main-menu');
    const dailyStatsTab = document.getElementById('daily-stats-tab');
    const endlessStatsTab = document.getElementById('endless-stats-tab');

    if (localStorage.getItem('highestScore')) {
        endlessStats.highestScore = parseInt(localStorage.getItem('highestScore'));
    }

    if (localStorage.getItem('dailyChallengePlayed') === today) {
        hasPlayedDaily = true;
        endlessModeBtn.disabled = false;
        dailyChallengeBtn.disabled = true; // Disable the daily challenge button if played today
    }

    function calculateStreaks(dates) {
        const oneDay = 24 * 60 * 60 * 1000;
        let currentStreak = 1;
        let maxStreak = 0;
        let streak = 1;

        dates.sort((a, b) => new Date(a) - new Date(b));

        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i - 1]);
            const currentDate = new Date(dates[i]);

            if ((currentDate - prevDate) === oneDay) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }

            prevDate.setHours(0, 0, 0, 0);
            currentDate.setHours(0, 0, 0, 0);

            if (Math.abs(currentDate - prevDate) === oneDay) {
                streak++;
            } else {
                if (streak > maxStreak) {
                    maxStreak = streak;
                }
                streak = 1;
            }

            if (i === dates.length - 1) {
                currentStreak = streak;
                if (streak > maxStreak) {
                    maxStreak = streak;
                }
            }
        }

        maxStreak = Math.max(maxStreak, currentStreak);
        return { currentStreak, maxStreak };
    }

    // Event Listeners
    options.forEach(button => button.addEventListener('click', checkAnswer));
    nextBtn.addEventListener('click', nextCountry);
    statsBtn.addEventListener('click', showStatsModal);
    closeBtn.addEventListener('click', closeStatsModal);
    dailyChallengeBtn.addEventListener('click', startDailyChallenge);
    endlessModeBtn.addEventListener('click', startEndlessMode);
    endlessModeBtn.addEventListener('mouseover', showEndlessModeInfo);
    playEndlessFromGameOver.addEventListener('click', startEndlessMode);
    tryAgainBtn.addEventListener('click', restartEndlessMode);
    mainMenuBtn.addEventListener('click', backToMainMenu);
    dailyStatsTab.addEventListener('click', showDailyStats);
    endlessStatsTab.addEventListener('click', showEndlessStats);

    window.addEventListener('click', function (event) {
        if (event.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });

    fetch('countries.json')
        .then(response => response.json())
        .then(data => {
            countries = data;
            loadGameState(); // Load game state after fetching the countries
        })
        .catch(error => console.error('Error loading local data:', error));

    function loadGameState() {
        const gameStateData = JSON.parse(localStorage.getItem('countryGame')) || {};

        if (localStorage.getItem('gameEndDate') && isNewDay(localStorage.getItem('gameEndDate'))) {
            localStorage.removeItem('gameEndDate');
            restartGame();

            dailyStats.overallScore = gameStateData.dailyStats?.overallScore || 0;
            dailyStats.overallTotal = gameStateData.dailyStats?.overallTotal || 0;
            endlessStats.totalScore = gameStateData.endlessStats?.totalScore || 0;
            endlessStats.timesPlayed = gameStateData.endlessStats?.timesPlayed || 0;
            endlessStats.highestScore = gameStateData.endlessStats?.highestScore || 0;

            return;
        }

        const savedData = localStorage.getItem('countryGame');

        if (savedData) {
            const gameStateData = JSON.parse(savedData);

            gameState = gameStateData.gameState || "playing";
            score = gameStateData.score || 0;
            total = gameStateData.total || 0;
            lives = gameStateData.lives || 3;
            usedCountries = gameStateData.usedCountries || [];
            currentCountry = gameStateData.currentCountry || null;
            isEndlessMode = gameStateData.isEndlessMode || false;
            hasPlayedDaily = gameStateData.hasPlayedDaily || false;

            dailyStats = gameStateData.dailyStats || dailyStats;
            endlessStats = gameStateData.endlessStats || endlessStats;

            updateUI();
            nextCountry();

            if (currentCountry && gameState !== "over") {
                flagImg.src = currentCountry.flag.large;
                updateOptions(currentCountry);
            } else if (gameState === "over") {
                if (isEndlessMode) {
                    showEndlessGameOver();
                } else {
                    showGameOver();
                }
            }

            if (isEndlessMode || hasPlayedDaily) {
                modeSelection.style.display = 'none';
                gameContainer.style.display = 'flex';
            }
        } else {
            fetchCountriesAndStartNewGame();
        }

        if (hasPlayedDaily) {
            endlessModeBtn.disabled = false;
            dailyChallengeBtn.disabled = true; // Disable the daily challenge button if played today
        }
    }

    function fetchCountriesAndStartNewGame() {
        fetch(`https://countryapi.io/api/all?apikey=${API_KEY}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                countries = Object.values(data);
                fetchNewCountry();
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    function showGameOver() {
        lives = 0;

        hearts.forEach(heart => {
            heart.classList.add('heart-lost');
        });

        if (score > endlessStats.highestScore) {
            endlessStats.highestScore = score;
            localStorage.setItem('highestScore', endlessStats.highestScore);
        }

        gameOverScreen.style.display = 'block';
        gameContainer.style.display = 'none';
        document.getElementById('top-right-game-stats').style.display = 'none';
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        flagImg.style.display = 'none';
        document.getElementById('options').style.display = 'none';
        document.getElementById('highest-score-display').textContent = "Highest Score: " + endlessStats.highestScore;

        dailyChallengeBtn.disabled = true; // Disable the daily challenge button if the game is over
    }

    document.getElementById('see-stats-from-gameover').addEventListener('click', showStatsModal);
    
    function showEndlessGameOver() {
        lives = 0;

        hearts.forEach(heart => {
            heart.classList.add('heart-lost');
        });

        if (score > endlessStats.highestScore) {
            endlessStats.highestScore = score;
            localStorage.setItem('highestScore', endlessStats.highestScore);
        }

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

    function isNewDay(savedDate) {
        const currentDate = new Date().toDateString();
        return currentDate !== savedDate;
    }

    function restartGame() {
        nextBtn.disabled = false;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        gameOverScreen.style.display = 'none';
        endlessGameOverScreen.style.display = 'none';
        headingText.style.display = 'block';
        subHeadingText.style.display = 'block';
        flagImg.style.display = 'block';
        document.getElementById('options').style.display = 'block';
        hearts.forEach(heart => heart.classList.remove('heart-lost'));
        updateUI(); 
        nextCountry();
        document.getElementById('top-right-game-stats').style.display = 'flex';
    }

    function restartEndlessMode() {
        endlessGameOverScreen.style.display = 'none';
        nextBtn.disabled = false;
        lives = 3;
        score = 0;
        total = 0;
        gameState = "playing";
        usedCountries = [];
        gameContainer.style.display = 'flex';
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

    function backToMainMenu() {
        endlessGameOverScreen.style.display = 'none';
        modeSelection.style.display = 'flex';
        gameContainer.style.display = 'none';
        document.getElementById('top-right-game-stats').style.display = 'none';
    }

    function startDailyChallenge() {
        if (hasPlayedDaily) {
            gameOverScreen.style.display = 'block';
            headingText.hidden = true;
            return;
        }
        isEndlessMode = false;
        hasPlayedDaily = true;
        modeSelection.style.display = 'none';
        gameContainer.style.display = 'flex';
        restartGame();
        endlessModeBtn.disabled = false;
        localStorage.setItem('dailyChallengePlayed', today);
        dailyChallengeBtn.disabled = true; // Disable the daily challenge button
        dailyStats.timesPlayed++;
        playedDates.push(today);
    }

    function startEndlessMode() {
        if (hasPlayedDaily) {
            isEndlessMode = true;
            modeSelection.style.display = 'none';
            gameContainer.style.display = 'flex';
            endlessStats.timesPlayed++;
            restartGame();
        } else {
            showEndlessModeInfo();
        }
    }

    function showEndlessModeInfo() {
        if (!hasPlayedDaily) {
           // alert('Please complete the daily challenge to unlock endless mode.');
        }
    }

    function storeCurrentFlag(country) {
        localStorage.setItem('currentFlag', JSON.stringify(country));
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
            setTimeout(() => {
                document.getElementById('final-score-display').textContent = score + "/" + total;
                showStatsModal();
                headingText.style.display = 'none';
                subHeadingText.style.display = 'none';
            }, 1000);
            if (isEndlessMode) {
                showEndlessGameOver();
            } else {
                showGameOver();
            }
        }
    }

    function showStatsModal() {
        updateStats();
        statsModal.style.display = 'block';
    }

    function closeStatsModal() {
        statsModal.style.display = 'none';
    }

    function showDailyStats() {
        document.getElementById('daily-stats').style.display = 'block';
        document.getElementById('endless-stats').style.display = 'none';
        dailyStatsTab.classList.add('active');
        endlessStatsTab.classList.remove('active');
    }

    function showEndlessStats() {
        document.getElementById('endless-stats').style.display = 'block';
        document.getElementById('daily-stats').style.display = 'none';
        endlessStatsTab.classList.add('active');
        dailyStatsTab.classList.remove('active');
    }

    function updateStats() {
        document.getElementById('daily-times-played-value').textContent = playedDates.length;
        document.getElementById('daily-current-streak-value').textContent = dailyStats.currentStreak;
        document.getElementById('daily-max-streak-value').textContent = dailyStats.maxStreak;
        const recentPercentageRight = dailyStats.overallTotal === 0 ? 0 : (dailyStats.overallScore / dailyStats.overallTotal) * 100;
        //document.getElementById('daily-percentage-daily-value').textContent = `${recentPercentageRight.toFixed(0)}%`;

        document.getElementById('endless-times-played-value').textContent = endlessStats.timesPlayed;
        document.getElementById('endless-highest-score-value').textContent = endlessStats.highestScore;
        document.getElementById('endless-total-score-value').textContent = endlessStats.totalScore;
    }

    function copiedResultsToast() {
        var resultsToast = document.getElementById("resultsToast");
        resultsToast.className = "show";
        setTimeout(function () { resultsToast.className = resultsToast.className.replace("show", ""); }, 3000);
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
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
            }
            document.body.removeChild(textArea);
            copiedResultsToast();
        }
    }

    document.getElementById('share-button').addEventListener('click', shareScore);

    function nextCountry() {
        nextBtn.disabled = false;
        saveGameState();
        const storedFlagJSON = localStorage.getItem('currentFlag');

        if (storedFlagJSON) {
            try {
                currentCountry = JSON.parse(storedFlagJSON);
                flagImg.src = currentCountry.flag.large;
                updateOptions(currentCountry);
            } catch (e) {
                console.error('Error parsing stored flag:', e);
                fetchNewCountry();
            }
        } else {
            fetchNewCountry();
        }

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
        const randomIndex = Math.floor(Math.random() * countryCodes.length);
        const countryCode = countryCodes[randomIndex];
        currentCountry = countries[countryCode];

        flagImg.src = currentCountry.flag.large;
        updateOptions();
        localStorage.setItem('currentFlag', JSON.stringify(currentCountry));
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
                document.getElementById('final-score-display').textContent = score + "/" + total;
                showStatsModal();
                headingText.style.display = 'none';
                subHeadingText.style.display = 'none';
                gameContainer.style.display = 'none';
            }, 2000);
            if (isEndlessMode) {
                showEndlessGameOver();
            } else {
                showGameOver();
            }
        }
        saveGameState();
    }

    function saveGameState() {
        dailyStats.overallScore += score;
        dailyStats.overallTotal += total;
        endlessStats.totalScore += score;

        const streaks = calculateStreaks(playedDates);
        dailyStats.currentStreak = streaks.currentStreak;
        dailyStats.maxStreak = streaks.maxStreak;

        const gameStateData = {
            gameState: gameState,
            score: score,
            total: total,
            lives: lives,
            usedCountries: usedCountries,
            currentCountry: currentCountry,
            playedDates: playedDates,
            dailyStats: dailyStats,
            endlessStats: endlessStats,
            isEndlessMode: isEndlessMode,
            hasPlayedDaily: hasPlayedDaily
        };

        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
        localStorage.setItem('playedDates', JSON.stringify(playedDates));
        localStorage.setItem('gameEndDate', new Date().toDateString());
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

    function checkAnswer(event) {
        const selectedCountryName = event.target.textContent;
        options.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled'); // Add disabled class
        });

        localStorage.removeItem('currentFlag'); // Remove the stored flag after user makes a choice

        if (selectedCountryName === currentCountry.name) {
            message.textContent = "🎉 Correct! Well done!";
            score++;
            dailyStats.currentStreak++;
            dailyStats.overallScore++;
            if (dailyStats.currentStreak > dailyStats.maxStreak) {
                dailyStats.maxStreak = dailyStats.currentStreak;
            } else {
                dailyStats.currentStreak = 0;
                const streaks = calculateStreaks(playedDates);
                dailyStats.maxStreak = streaks.maxStreak;
            }

            event.target.classList.add('correct-answer');
        } else {
            message.textContent = "😢 Oops, that's not correct.";
            event.target.classList.add('wrong-answer');
            dailyStats.currentStreak = 0;
            loseLife();
            saveGameState();

        }

        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        dailyStats.overallTotal++;
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        showFacts(currentCountry);
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        nextBtn.hidden = false;
        headingText.hidden = true;
        subHeadingText.hidden = true;

        saveGameState();
    }

    function showFacts(country) {
        facts.innerHTML = `
            <p class="fact-text"><strong>Capital:</strong> ${country.capital}</p>
            <p class="fact-text"><strong>Location:</strong> ${country.subregion}</p>
        `;
        facts.hidden = false;
    }

    function confetti() {
        const duration = 5 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#bb0000', '#ffffff'],
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#bb0000', '#ffffff'],
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    console.log("Current Streak:", dailyStats.currentStreak);
    console.log("Max Streak:", dailyStats.maxStreak);
    console.log("Overall Score:", dailyStats.overallScore);
    console.log("Overall Total:", dailyStats.overallTotal);
});
