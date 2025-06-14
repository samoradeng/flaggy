class AchievementSystem {
    constructor() {
        this.achievements = this.loadAchievements();
        this.unlockedCountries = new Set(JSON.parse(localStorage.getItem('unlockedCountries') || '[]'));
        this.correctlyAnsweredCountries = new Set(JSON.parse(localStorage.getItem('correctlyAnsweredCountries') || '[]'));
        this.initializeAchievements();
    }

    initializeAchievements() {
        this.achievementsList = [
            {
                id: 'first_correct',
                name: 'First Steps',
                description: 'Get your first flag correct',
                icon: '🎯',
                condition: () => this.correctlyAnsweredCountries.size >= 1
            },
            {
                id: 'streak_5',
                name: 'On Fire',
                description: 'Get 5 correct answers in a row',
                icon: '🔥',
                condition: () => parseInt(localStorage.getItem('bestStreak') || '0') >= 5
            },
            {
                id: 'streak_10',
                name: 'Unstoppable',
                description: 'Get 10 correct answers in a row',
                icon: '🔥🔥',
                condition: () => parseInt(localStorage.getItem('bestStreak') || '0') >= 10
            },
            {
                id: 'daily_streak_3',
                name: 'Consistent',
                description: 'Play daily challenge 3 days in a row',
                icon: '📅',
                condition: () => {
                    const dailyStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
                    return (dailyStats.streak || 0) >= 3;
                }
            },
            {
                id: 'level_5',
                name: 'Rising Star',
                description: 'Reach level 5',
                icon: '⭐',
                condition: () => Math.floor(parseInt(localStorage.getItem('totalXP') || '0') / 100) + 1 >= 5
            },
            {
                id: 'africa_master',
                name: 'Africa Expert',
                description: 'Correctly guess 20 African countries',
                icon: '🌍',
                condition: () => this.getRegionCount('Africa') >= 20
            },
            {
                id: 'europe_master',
                name: 'Europe Expert',
                description: 'Correctly guess 20 European countries',
                icon: '🇪🇺',
                condition: () => this.getRegionCount('Europe') >= 20
            },
            {
                id: 'world_traveler',
                name: 'World Traveler',
                description: 'Unlock 100 countries',
                icon: '🌎',
                condition: () => this.correctlyAnsweredCountries.size >= 100
            }
        ];
    }

    loadAchievements() {
        return JSON.parse(localStorage.getItem('achievements') || '{}');
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    unlockCountry(countryCode, countryData) {
        // Add to both sets for backward compatibility
        this.unlockedCountries.add(countryCode);
        this.correctlyAnsweredCountries.add(countryCode);
        
        localStorage.setItem('unlockedCountries', JSON.stringify([...this.unlockedCountries]));
        localStorage.setItem('correctlyAnsweredCountries', JSON.stringify([...this.correctlyAnsweredCountries]));
        
        // Store country data for region tracking
        const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
        countryDetails[countryCode] = {
            name: countryData.name,
            region: countryData.region,
            subregion: countryData.subregion,
            flag: countryData.flag
        };
        localStorage.setItem('countryDetails', JSON.stringify(countryDetails));
    }

    getRegionCount(region) {
        const countryDetails = JSON.parse(localStorage.getItem('countryDetails') || '{}');
        return Object.values(countryDetails).filter(country => country.region === region).length;
    }

    checkAchievements() {
        const newAchievements = [];
        
        this.achievementsList.forEach(achievement => {
            if (!this.achievements[achievement.id] && achievement.condition()) {
                this.achievements[achievement.id] = {
                    unlockedAt: new Date().toISOString(),
                    ...achievement
                };
                newAchievements.push(achievement);
            }
        });

        if (newAchievements.length > 0) {
            this.saveAchievements();
        }

        return newAchievements;
    }

    getUnlockedAchievements() {
        return Object.values(this.achievements);
    }

    getProgress() {
        const total = this.achievementsList.length;
        const unlocked = Object.keys(this.achievements).length;
        return { unlocked, total, percentage: Math.round((unlocked / total) * 100) };
    }

    getCorrectlyAnsweredCountries() {
        return this.correctlyAnsweredCountries;
    }
}

window.AchievementSystem = AchievementSystem;