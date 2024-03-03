//test 

document.addEventListener("DOMContentLoaded", function () {
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

    document.addEventListener("DOMContentLoaded", loadGameState);

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

    // Assuming you've placed the JSON file in the same directory
    fetch('countries.json')
        .then(response => response.json())
        .then(data => {
            countries = data; // or however you need to process it
            nextCountry();// Your code to initialize the game with this data
        })
        .catch(error => console.error('Error loading local data:', error));



    function loadGameState() {
        const gameStateData = JSON.parse(localStorage.getItem('countryGame')) || {};

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

            gameState = gameStateData.gameState || "playing";
            score = gameStateData.score || 0;
            total = gameStateData.total || 0;
            lives = gameStateData.lives || 3;
            timesPlayed = gameStateData.timesPlayed || 0;
            currentStreak = gameStateData.currentStreak || 0;
            maxStreak = gameStateData.maxStreak || 0;
            usedCountries = gameStateData.usedCountries || [];
            currentCountry = gameStateData.currentCountry || null;

            overallScore = gameStateData.overallScore;
            overallTotal = gameStateData.overallTotal;

            updateUI();

            if (currentCountry && gameState !== "over") {
                flagImg.src = currentCountry.flag.large;
                updateOptions(currentCountry); // Update options with the current country to prevent cheating
            } else if (gameState === "over") {
                showGameOver();
            }



        } else {
            // If there's no saved game state, start a new game
            fetchCountriesAndStartNewGame();
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
                // Handle the error, such as retrying the fetch or informing the user
            });
    }


    function showGameOver() {
        lives = 0;
        console.log(lives)

        hearts.forEach(heart => {
            heart.classList.add('heart-lost');
        });


        // Show the game over screen and hide the other elements
        document.getElementById('game-over-screen').style.display = 'block';
        // Hide other game elements
        document.getElementById('top-right-game-stats').style.display = 'none';
        headingText.style.display = 'none';
        subHeadingText.style.display = 'none';
        flagImg.style.display = 'none';
        document.getElementById('options').style.display = 'none';


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

    function storeCurrentFlag(country) {
        localStorage.setItem('currentFlag', JSON.stringify(country));
    }

    function updateUI() {
        // Update the UI with the loaded data
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        hearts.forEach((heart, index) => {
            if (index < lives) {
                heart.classList.remove('heart-lost');
            } else {
                heart.classList.add('heart-lost');
            }
        });

        // If the game is over, show the game over screen
        if (lives === 0) {
            gameState = "over";
            nextBtn.disabled = true;
            setTimeout(() => {
                //alert('Thanks for playing!');
                document.getElementById('final-score-display').textContent = score + "/" + total;
                //document.getElementById('game-over-overlay').style.display = 'flex';
                showStatsModal();

                //message.hidden = true;
                //facts.hidden = true;
                //nextBtn.hidden = true;
                //headingText.hidden = false;
                //subHeadingText.hidden = false;




                headingText.style.display = 'none';
                subHeadingText.style.display = 'none';
                //flagImg.style.display = 'none';
                //document.getElementById('options').style.display = 'none';
                //document.getElementById('game-over-screen').style.display = 'block';

            }, 1000);

            showGameOver();


        }
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
    // function shareOnTwitter() {
    //     const text = `I scored ${score} on the flaggy game! Try it out now!`;
    //     const url = 'https://yourquizapp.com'; // Replace with your app's URL
    //     window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    // }
    //document.getElementById('share-button').addEventListener('click', shareOnTwitter);


    function copiedResultsToast() {
        // Get the snackbar DIV
        var resultsToast = document.getElementById("resultsToast");

        // Add the "show" class to DIV
        resultsToast.className = "show";

        // After 3 seconds, remove the show class from DIV
        setTimeout(function () { resultsToast.className = resultsToast.className.replace("show", ""); }, 3000);
    }

    // Function to share score
    function shareScore() {
        const scoreText = `flagtriv ${score}/${total}`; // Modify this text as needed

        // Check if the Web Share API is supported
        if (navigator.share) {
            // Use the Web Share API
            navigator.share({
                title: 'Check out my score!',
                text: scoreText,
                url: document.URL // You can also share a URL if needed
            }).then(() => {
                console.log('Thanks for sharing!');
            }).catch(console.error);
        } else {
            // Fallback for desktop browsers
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
            //alert('Score copied to clipboard: ' + scoreText); // Inform the user
            copiedResultsToast()
        }
    }

    // Update the event listener for your share button
    document.getElementById('share-button').addEventListener('click', shareScore);




    function nextCountry() {
        nextBtn.disabled = false;
        saveGameState();
        // Check if there's a stored flag in localStorage and parse it if present
        const storedFlagJSON = localStorage.getItem('currentFlag');

        if (storedFlagJSON) {
            try {
                currentCountry = JSON.parse(storedFlagJSON);
                flagImg.src = currentCountry.flag.large;
                updateOptions(currentCountry);
            } catch (e) {
                console.error('Error parsing stored flag:', e);
                // Handle the error, for example, by fetching a new country
                fetchNewCountry();
            }
        } else {
            // If there's no current country stored, fetch a new one
            fetchNewCountry();
        }

        // Enable option buttons
        options.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled', 'correct-answer', 'wrong-answer');
        });

        timesPlayed++;

        // Update UI to reflect the new state
        message.textContent = "";
        facts.hidden = true;
        nextBtn.hidden = true;
        headingText.hidden = false;
        subHeadingText.hidden = false;
    }


    function fetchNewCountry() {
        const countryCodes = Object.keys(countries); // Get an array of country codes
        const randomIndex = Math.floor(Math.random() * countryCodes.length);
        const countryCode = countryCodes[randomIndex];
        currentCountry = countries[countryCode];

        flagImg.src = currentCountry.flag.large; // Adjust according to your JSON structure
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
            //updateUI(); // Add this call to ensure UI is updated when the game is over
            nextBtn.disabled = true;
            setTimeout(() => {
                //alert('Thanks for playing!');
                document.getElementById('final-score-display').textContent = score + "/" + total;
                //document.getElementById('game-over-overlay').style.display = 'flex';
                showStatsModal();

                //message.hidden = true;
                //facts.hidden = true;
                //nextBtn.hidden = true;
                //headingText.hidden = false;
                //subHeadingText.hidden = false;




                headingText.style.display = 'none';
                subHeadingText.style.display = 'none';
                //flagImg.style.display = 'none';
                //document.getElementById('options').style.display = 'none';
                //document.getElementById('game-over-screen').style.display = 'block';

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
            currentCountry: currentCountry,
            playedDates: playedDates,

            overallScore: overallScore,
            overallTotal: overallTotal,
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
    console.log("Current Streak:", currentStreak);
    console.log("Max Streak:", maxStreak);
    console.log("Overall Score:", overallScore);
    console.log("Overall Total:", overallTotal);
    //console.log("Percentage:", overallPercentageRight);

});
