class ContinentFilter {
    constructor() {
        this.selectedContinents = this.loadSelectedContinents();
        this.availableContinents = [
            { id: 'Africa', name: 'Africa', emoji: '🌍' },
            { id: 'Asia', name: 'Asia', emoji: '🌏' },
            { id: 'Europe', name: 'Europe', emoji: '🇪🇺' },
            { id: 'Americas', name: 'Americas', emoji: '🌎' },
            { id: 'Oceania', name: 'Oceania', emoji: '🏝️' }
        ];
    }

    loadSelectedContinents() {
        const saved = localStorage.getItem('selectedContinents');
        return saved ? JSON.parse(saved) : ['all'];
    }

    saveSelectedContinents() {
        localStorage.setItem('selectedContinents', JSON.stringify(this.selectedContinents));
    }

    setSelectedContinents(continents) {
        this.selectedContinents = continents;
        this.saveSelectedContinents();
    }

    toggleContinent(continentId) {
        if (continentId === 'all') {
            this.selectedContinents = ['all'];
        } else {
            // Remove 'all' if selecting specific continents
            this.selectedContinents = this.selectedContinents.filter(c => c !== 'all');
            
            if (this.selectedContinents.includes(continentId)) {
                this.selectedContinents = this.selectedContinents.filter(c => c !== continentId);
            } else {
                this.selectedContinents.push(continentId);
            }
            
            // If no continents selected, default to all
            if (this.selectedContinents.length === 0) {
                this.selectedContinents = ['all'];
            }
        }
        
        this.saveSelectedContinents();
    }

    filterCountries(countries) {
        if (this.selectedContinents.includes('all')) {
            return countries;
        }
        
        const countryCodes = Object.keys(countries);
        const filtered = {};
        
        countryCodes.forEach(code => {
            const country = countries[code];
            if (this.selectedContinents.includes(country.region)) {
                filtered[code] = country;
            }
        });
        
        return filtered;
    }

    getSelectionText() {
        if (this.selectedContinents.includes('all')) {
            return '🌐 All Continents';
        }
        
        if (this.selectedContinents.length === 1) {
            const continent = this.availableContinents.find(c => c.id === this.selectedContinents[0]);
            return `${continent.emoji} ${continent.name}`;
        }
        
        return `🌍 ${this.selectedContinents.length} Continents`;
    }

    isUnlocked(continentId, unlockedFeatures) {
        if (continentId === 'all') return true;
        return unlockedFeatures.continentsUnlocked.includes(continentId);
    }
}

window.ContinentFilter = ContinentFilter;