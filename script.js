// script.js
document.addEventListener("DOMContentLoaded", function () {
    const API_KEY = "zl2lkL1rpY7gOv6uCtIYM4BKWAp81eHOnIQT7Lbc";
    let countries = [];
    let currentCountry = null;
    let usedCountries = [];
    let score = 0;
    let total = 0;

    // DOM Elements
    const flagImg = document.getElementById('flag');
    const options = document.querySelectorAll('.option');
    const message = document.getElementById('message');
    const facts = document.getElementById('facts');
    const nextBtn = document.getElementById('next');
    const scoreDisplay = document.getElementById('score');
    const headingText = document.getElementById('heading');
    const subHeadingText = document.getElementById('subHeading')

    // Fetch countries data
    fetch(`https://countryapi.io/api/all?apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
            countries = Object.values(data);
            nextCountry();
        })
        .catch(error => console.error('Error fetching data:', error));

    // Event Listeners
    options.forEach(button => button.addEventListener('click', checkAnswer));
    nextBtn.addEventListener('click', nextCountry);

    function nextCountry() {
        if (countries.length === 0) {
            alert("Game Over! Your score: " + score + "/" + total);
            return;
        }

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
            event.target.classList.add('correct-answer');
            // createConfetti();
        } else {
            message.textContent = "😢 Oops, that's not correct.";
            event.target.classList.add('wrong-answer');
        }

        options.forEach(button => {
            if (button.textContent === currentCountry.name) {
                button.classList.add('correct-answer');
            }
        });

        total++;
        scoreDisplay.textContent = "Score: " + score + "/" + total;
        showFacts(currentCountry);
        nextBtn.hidden = false;
        headingText.hidden = true;
        subHeadingText.hidden = true;
    }

    /*function createConfetti() {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }*/

    function showFacts(country) {
        facts.innerHTML = `
            <h2>${country.name}</h2>
            <p class="fact-text"><strong>Region:</strong> ${country.region}</p>
            <p class="fact-text"><strong>Subregion:</strong> ${country.subregion}</p>
            <p class="fact-text"><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <p class="fact-text"><strong>Languages:</strong> ${Object.values(country.languages).join(', ')}</p>
            <p class="fact-text"><strong>Currency:</strong> ${country.currencies[Object.keys(country.currencies)[0]].name} (${country.currencies[Object.keys(country.currencies)[0]].symbol})</p>
        `;
        facts.hidden = false;
    }
});
