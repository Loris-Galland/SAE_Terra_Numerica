export const GameData = {
    // Liste de toutes les cartes valides du jeu
    cardIds: [
        '1', '23', '26', '37', 
        '16', '45', '76', 
        '13', '78', '11', '67', 
        '74', '71', '56', '62', 
        '58', '91', '14', 
        '31', '4', '50', '75', 
        '88', '55', '22', '21'
    ],

    // On commence avec ça
    initialInventory: ['1', '23', '26'],

    // Les cartes pièges (Master Plan) qui enlèvent du temps
    penalties: {
        // Phase T9
        '49': { time: 5, message: "Erreur T9 ! (-5 min)" },
        '77': { time: 5, message: "Mauvais code ! (-5 min)" },
        '87': { time: 5, message: "Erreur décodage ! (-5 min)" },
        
        // Phase Braille
        '84': { time: 5, message: "Faux ! (-5 min)" },
        '85': { time: 5, message: "Faux ! (-5 min)" },
        '86': { time: 5, message: "Faux ! (-5 min)" },

        // Phase César
        '61': { time: 5, message: "Erreur César ! (-5 min)" },
        '63': { time: 5, message: "Erreur César ! (-5 min)" },
        '64': { time: 5, message: "Erreur César ! (-5 min)" },

        // Final
        '93': { time: 5, message: "Mauvaise piste... (-5 min)" },
        '94': { time: 5, message: "Erreur calcul ! (-5 min)" },
        '95': { time: 5, message: "Perdu... (-5 min)" },
        '44': { time: 5, message: "Carte Piège ! (-5 min)" }
    },

    // Infos et interactions des cartes
    cards: {
        '1': { name: "Livret", type: 'info', text: "Le livret explique le code César..." },
        '23': { name: "Lune", type: 'indice', text: "LUNE... C'est le nom du prof." },
        '26': { name: "Téléphone", type: 'indice', text: "Un vieux téléphone T9." }, 

        '37': {
            name: "Porte",
            type: 'machine',
            prompt: "Code de la porte (T9) ?",
            code: '555886633', // LUNE
            rewards: ['16', '45', '76'],
            successMessage: "La porte s'ouvre !"
        },
        '16': { name: "Bureau", type: 'info', text: "On voit les numéros 13, 58, 56, 78..." },
        '45': { name: "Armoire", type: 'info', text: "Contient 91 et 71." },
        '76': { name: "Bibliothèque", type: 'info', text: "Indices : 21, 74, 14, 31." },

        '13': {
            name: "Tiroir Braille",
            type: 'machine',
            prompt: "Code à 4 chiffres ?",
            code: '0818',
            rewards: ['11'],
            successMessage: "Le tiroir s'ouvre !"
        },
        '78': { name: "Table Braille", type: 'indice' },
        '11': { name: "Tiroir Ouvert", type: 'info', text: "Il y a une carte 67 (Lampe UV)." },
        '67': { name: "Lampe UV", type: 'indice', text: "Révèle 'Océan p. 242' sur le mur." },

        '74': { name: "Livre Suspendu", type: 'indice' },
        '71': { name: "Disque César", type: 'outil' },
        '56': {
            name: "Tiroir César",
            type: 'machine',
            prompt: "Mot de passe ?",
            code: 'VERTU', 
            rewards: ['62'],
            successMessage: "Table des symboles trouvée."
        },
        '62': { name: "Symboles", type: 'indice' },

        '58': { name: "Lampe", type: 'indice', text: "Il manque l'abat-jour (91)." },
        '91': { name: "Abat-jour", type: 'item' },
        '14': { name: "Livre Animaux", type: 'indice' },

        '31': { name: "Livre Océan", type: 'indice' },
        '4': { name: "Page 242", type: 'indice' },
        '50': { name: "Unité Centrale", type: 'info' },
        '75': { name: "Code Morse", type: 'indice' },
        '88': { name: "Identifiant", type: 'info', text: "ID: 88" },
        
        '55': {
            name: "Ordinateur",
            type: 'machine',
            prompt: "LOGIN (ID + MDP) :",
            code: '88179401', // ID + Animaux
            rewards: ['22'],
            successMessage: "ACCÈS AUTORISÉ."
        },
        '22': { name: "VICTOIRE", type: 'win', text: "Bravo ! Vous avez réussi." },
        '21': { name: "Rotor", type: 'item' }
    }
};