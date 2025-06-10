class FlagFacts {
    constructor() {
        this.facts = {
            'NP': '🇳🇵 Nepal is the only non-rectangular flag in the world.',
            'CH': '🇨🇭 Switzerland has a square flag, one of only two countries with this shape.',
            'VA': '🇻🇦 Vatican City also has a square flag, making it unique among nations.',
            'JP': '🇯🇵 Japan\'s flag represents the rising sun and has been used since 1870.',
            'CA': '🇨🇦 Canada\'s maple leaf flag was adopted in 1965, replacing the British ensign.',
            'BR': '🇧🇷 Brazil\'s flag features a celestial globe showing the night sky over Rio.',
            'KE': '🇰🇪 Kenya\'s flag includes a traditional Maasai shield and spears.',
            'SA': '🇸🇦 Saudi Arabia\'s flag contains the Islamic declaration of faith in Arabic.',
            'CY': '🇨🇾 Cyprus shows the outline of the island and olive branches for peace.',
            'BT': '🇧🇹 Bhutan\'s flag features a thunder dragon, symbol of the kingdom.',
            'KH': '🇰🇭 Cambodia\'s flag displays Angkor Wat, the famous temple complex.',
            'LB': '🇱🇧 Lebanon\'s flag shows the cedar tree, a national symbol for millennia.',
            'MZ': '🇲🇿 Mozambique is the only flag featuring a modern rifle (AK-47).',
            'PG': '🇵🇬 Papua New Guinea\'s flag includes the Bird of Paradise and Southern Cross.',
            'FJ': '🇫🇯 Fiji\'s flag still includes the British Union Jack in its design.',
            'NZ': '🇳🇿 New Zealand\'s flag debate in 2016 kept the current design with Union Jack.',
            'AU': '🇦🇺 Australia\'s flag features the Southern Cross constellation.',
            'MY': '🇲🇾 Malaysia\'s 14 stripes represent the unity of its 13 states and federal government.',
            'TH': '🇹🇭 Thailand\'s flag colors represent the nation (red), religion (white), and king (blue).',
            'IN': '🇮🇳 India\'s wheel (chakra) has 24 spokes representing hours in a day.',
            'PK': '🇵🇰 Pakistan\'s crescent and star represent progress and light.',
            'BD': '🇧🇩 Bangladesh\'s red circle represents the sun rising over Bengal.',
            'LK': '🇱🇰 Sri Lanka\'s lion flag dates back to ancient Sinhalese kingdoms.',
            'MM': '🇲🇲 Myanmar changed its flag in 2010 after decades of military rule.',
            'KP': '🇰🇵 North Korea\'s flag features a red star symbolizing communism.',
            'KR': '🇰🇷 South Korea\'s flag includes the yin-yang symbol and trigrams.',
            'MN': '🇲🇳 Mongolia\'s flag features the Soyombo symbol with ancient meanings.',
            'CN': '🇨🇳 China\'s five stars represent the Communist Party and four social classes.',
            'VN': '🇻🇳 Vietnam\'s flag shows a five-pointed star on red background.',
            'LA': '🇱🇦 Laos is the only flag with a white circle representing the full moon.',
            'ID': '🇮🇩 Indonesia\'s red and white flag is called "Sang Saka Merah-Putih".',
            'PH': '🇵🇭 Philippines\' flag is flipped upside down during times of war.',
            'SG': '🇸🇬 Singapore\'s flag crescent represents a rising young nation.',
            'TW': '🇹🇼 Taiwan\'s flag sun has 12 rays representing 12 hours of the day.',
            'HK': '🇭🇰 Hong Kong\'s flag features a white bauhinia flower.',
            'MO': '🇲🇴 Macau\'s flag shows a lotus flower above a bridge and water.',
            'default': '🌍 Every flag tells the story of its nation\'s history and values.'
        };
    }

    getFact(countryCode) {
        return this.facts[countryCode] || this.facts['default'];
    }

    getRandomGlobalStat() {
        const stats = [
            'Only 23% of players got this right today!',
            '67% of players confused this with a neighboring country!',
            'This flag stumps 45% of geography experts!',
            '78% of players got this correct - well done!',
            'Only 1 in 3 players recognize this flag immediately!',
            'This is one of the most challenging flags - 34% success rate!',
            '89% of players who got this right are from this region!',
            'Fun fact: 56% of players guess this wrong on first try!'
        ];
        
        return stats[Math.floor(Math.random() * stats.length)];
    }
}

window.FlagFacts = FlagFacts;