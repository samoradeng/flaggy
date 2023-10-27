document.addEventListener("DOMContentLoaded", function () {
    const API_KEY = "lGBbDFd82zkgNzrKEY3KYCDGI4AEdNST01U6Q57I";
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0;
    let total = 0;
    let gameState = "playing"; // possible values: "playing", "over"
    let playedDates = []; // Added this for unique days tracking

    if (localStorage.getItem('playedDates')) {
        playedDates = JSON.parse(localStorage.getItem('playedDates'));
    }

    let overallScore = 0; // Introduce this variable
    let overallTotal = 0; // Introduce this variable


    // User statistics
    let timesPlayed = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let lives = 3;
    const hearts = document.querySelectorAll('.heart-icon');


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

    // Check if today's date is already in playedDates
    const today = (new Date()).toDateString();
    if (!playedDates.includes(today)) {
        playedDates.push(today);
        // Also, we'll update streaks here:
        const streaks = calculateStreaks(playedDates);
        currentStreak = streaks.currentStreak;
        maxStreak = streaks.maxStreak;
    }

    function calculateStreaks(dates) {
        const oneDay = 24 * 60 * 60 * 1000;  // milliseconds in a day

        let currentStreak = 1;  // We start at 1 because the streak includes today.
        let maxStreak = 0;
        let streak = 1;  // The streak for the loop also starts at 1 for the same reason.

        dates.sort((a, b) => new Date(a) - new Date(b)); // Sort the dates in ascending order

        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i - 1]);
            const currentDate = new Date(dates[i]);

            if ((currentDate - prevDate) === oneDay) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak); // Update maxStreak if currentStreak was greater.
                currentStreak = 1;
            }

            // Set the time of both dates to midnight for accurate comparison
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

        // After loop ends, it's possible that the longest streak is the current one.
        maxStreak = Math.max(maxStreak, currentStreak);
        return { currentStreak, maxStreak };
    }



    // Event Listeners
    options.forEach(button => button.addEventListener('click', checkAnswer));
    nextBtn.addEventListener('click', nextCountry);
    statsBtn.addEventListener('click', showStatsModal);
    closeBtn.addEventListener('click', closeStatsModal);
    window.addEventListener('click', function (event) {
        if (event.target === statsModal) {
            statsModal.style.display = 'none';
        }
    });

    // Fetch countries data
    fetch(`https://countryapi.io/api/all?apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            countries = Object.values(data);
            nextCountry();
        })
        .catch(error => console.error('Error fetching data:', error));


    function loadGameState() {
        if (localStorage.getItem('gameEndDate') && isNewDay(localStorage.getItem('gameEndDate'))) {
            // ... reset the game and remove the gameEndDate from local storage...
            localStorage.removeItem('gameEndDate');
            restartGame(); // This function should reset everything for a new game

            overallScore = gameStateData.overallScore || 0;
            overallTotal = gameStateData.overallTotal || 0;
            return;  // No need to load the saved data if we are starting fresh



        }

        const savedData = localStorage.getItem('countryGame');

        if (savedData) {
            const gameStateData = JSON.parse(savedData);

            gameState = gameStateData.gameState;
            score = gameStateData.score;
            total = gameStateData.total;
            lives = gameStateData.lives;
            timesPlayed = gameStateData.timesPlayed;
            currentStreak = gameStateData.currentStreak || 0;
            maxStreak = gameStateData.maxStreak || 0;
            usedCountries = gameStateData.usedCountries;

            overallScore = gameStateData.overallScore;
            overallTotal = gameStateData.overallTotal;

            // Update the UI with the loaded data
            scoreDisplay.textContent = "Score: " + score + "/" + total;
            for (let i = 0; i < 3 - lives; i++) {
                hearts[i].classList.add('heart-lost');

                if (lives === 0) {
                    document.getElementById('game-over-screen').style.display = 'block';
                    // Hide other game elements as appropriate...
                    headingText.style.display = 'none';
                    subHeadingText.style.display = 'none';
                    flagImg.style.display = 'none';
                    document.getElementById('options').style.display = 'none';
                }


            }

        }

    }
    loadGameState();

    document.getElementById('see-stats-from-gameover').addEventListener('click', showStatsModal);


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
        // Reset UI elements
        document.getElementById('game-over-screen').style.display = 'none';
        headingText.style.display = 'block';
        subHeadingText.style.display = 'block';
        flagImg.style.display = 'block';
        document.getElementById('options').style.display = 'block';
        hearts.forEach(heart => heart.classList.remove('heart-lost'));
        // Now, fetch a new country
        nextCountry();
    }



    function showStatsModal() {
        updateStats();
        statsModal.style.display = 'block';
    }

    function closeStatsModal() {
        statsModal.style.display = 'none';
    }

    function updateStats() {
        document.getElementById('times-played').textContent = playedDates.length;
        document.getElementById('current-streak').textContent = currentStreak;
        document.getElementById('max-streak').textContent = maxStreak;
        // For percentage right:
        const percentageRight = (score / total) * 100;

        const overallPercentageRight = overallTotal === 0 ? 0 : (overallScore / overallTotal) * 100;
        const recentPercentageRight = total === 0 ? 0 : (score / total) * 100;
        document.getElementById('percentage-daily').textContent = `${recentPercentageRight.toFixed(0)}%`;
        // document.getElementById('percentage-overall').textContent = `Overall: ${overallPercentageRight.toFixed(0)}%`;
    }

    // Function to share score on Twitter
    function shareOnTwitter() {
        const text = `I scored ${score} on the flaggy game! Try it out now!`;
        const url = 'https://yourquizapp.com'; // Replace with your app's URL
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }

    document.getElementById('share-button').addEventListener('click', shareOnTwitter);

    function nextCountry() {
        nextBtn.disabled = false;
        saveGameState();
        if (gameState === "over") return;
        timesPlayed++;

        if (countries.length === 0) {
            document.getElementById('final-score-display').textContent = score + "/" + total;
            document.getElementById('game-over-overlay').style.display = 'flex';
            return;
        }

        document.getElementById('close-overlay-btn').addEventListener('click', function () {
            document.getElementById('game-over-overlay').style.display = 'none';
        });


        const randomIndex = Math.floor(Math.random() * countries.length);
        currentCountry = countries[randomIndex];
        countries.splice(randomIndex, 1);
        usedCountries.push(currentCountry);

        flagImg.src = currentCountry.flag.large;
        updateOptions();

        message.textContent = "";
        facts.hidden = true;
        nextBtn.hidden = true;
        headingText.hidden = false;
        subHeadingText.hidden = false;

        options.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled', 'correct-answer', 'wrong-answer'); // Remove disabled and styling classes
        });
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
                //alert('Thanks for playing!');
                document.getElementById('final-score-display').textContent = score + "/" + total;
                document.getElementById('game-over-overlay').style.display = 'flex';
                showStatsModal();
            }, 1000);
        }
        saveGameState();
    }


    function saveGameState() {

        overallScore += score; // Update the overall score with the current game's score
        overallTotal += total; // Update the overall total with the current game's total
        // Always ensure streaks are updated before saving the game state
        const streaks = calculateStreaks(playedDates);
        currentStreak = streaks.currentStreak;
        maxStreak = streaks.maxStreak;



        const gameStateData = {
            gameState: gameState,
            score: score,
            total: total,
            lives: lives,
            timesPlayed: timesPlayed,
            currentStreak: currentStreak,
            maxStreak: maxStreak,
            usedCountries: usedCountries,
            playedDates: playedDates,

            overallScore: overallScore,
            overallTotal: overallTotal,
        };

        localStorage.setItem('countryGame', JSON.stringify(gameStateData));
        localStorage.setItem('playedDates', JSON.stringify(playedDates));

        localStorage.setItem('gameEndDate', new Date().toDateString());
    }





    function updateOptions() {
        const allOtherCountries = [...countries, ...usedCountries].filter(country => country.name !== currentCountry.name);
        const incorrectAnswers = [];
        while (incorrectAnswers.length < 3 && allOtherCountries.length > 0) {
            const randomIndex = Math.floor(Math.random() * allOtherCountries.length);
            incorrectAnswers.push(allOtherCountries[randomIndex].name);
            allOtherCountries.splice(randomIndex, 1);
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

        if (selectedCountryName === currentCountry.name) {
            message.textContent = "🎉 Correct! Well done!";
            score++;
            currentStreak++;
            overallScore++;
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
            else {
                currentStreak = 0;
                const streaks = calculateStreaks(playedDates);
                maxStreak = streaks.maxStreak;
            }

            event.target.classList.add('correct-answer');
        } else {
            message.textContent = "😢 Oops, that's not correct.";
            event.target.classList.add('wrong-answer');
            currentStreak = 0;
            loseLife();
            saveGameState();

        }

        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        overallTotal++;
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        showFacts(currentCountry);
        nextBtn.hidden = false;
        headingText.hidden = true;
        subHeadingText.hidden = true;
    }

    function showFacts(country) {
        facts.innerHTML = `
            <h2>${country.name}</h2>
            <p class="fact-text"><strong>Capital:</strong> ${country.capital}</p>
            <p class="fact-text"><strong>Region:</strong> ${country.region}</p>
            <p class="fact-text"><strong>Sub Region:</strong> ${country.subregion}</p>
            <p class="fact-text"><strong>Population:</strong> ${country.population.toLocaleString('en-US')}</p>
            
        `;
        facts.hidden = false;
    }
    console.log("Current Streak:", currentStreak);
    console.log("Max Streak:", maxStreak);
    console.log("Overall Score:", overallScore);
    console.log("Overall Total:", overallTotal);
    //console.log("Percentage:", overallPercentageRight);

});



