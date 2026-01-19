export const GameData = {
    // Liste de toutes les cartes
    cardIds: [
        '1', '23', '26', '37', 
        '16', '45', '76', 
        '13', '78', '11', '67', 
        '74', '71', '56', '62', 
        '58', '91', '14', 
        '31', '4', '50', '75', 
        '88', '55', '22', '21',
        // Pièges
        '49', '77', '87', '84', '85', '86', '61', '63', '64', '93', '94', '95', '44'
    ],

    // Inventaire de départ
    initialInventory: ['1', '23', '26'],

    // Pénalités
    penalties: {
        '49': 5, '77': 5, '87': 5,
        '84': 5, '85': 5, '86': 5,
        '61': 5, '63': 5, '64': 5,
        '93': 5, '94': 5, '95': 5, '44': 5
    },

    // Définitions des cartes avec Dépendances (requires)
    cards: {
        '1': { name: "Livret", type: 'info', text: "Le livret explique le code César..." },
        '23': { name: "Lune", type: 'indice', text: "LUNE... C'est le nom du prof." },

        // Puzzle Téléphone
        '26': { 
            name: "Téléphone", 
            type: 'puzzle',      
            puzzleType: 't9',    
            solution: '555886633', 
            rewards: ['37', '16', '45', '76'], 
            successMessage: "Connexion établie ! La porte s'ouvre.",
            hint: "Regarde la carte 23 (LUNE). Sur un clavier : L=5, U=8...",
            text: "Un vieux téléphone. Il semble fonctionner."
        }, 

        '37': {
            name: "Porte",
            type: 'machine',
            prompt: "Code de la porte (T9) ?",
            code: '555886633', 
            rewards: ['16', '45', '76'],
            successMessage: "La porte s'ouvre !"
        },
        
        // Le Bureau (Zones)
        '16': { name: "Bureau", type: 'info', text: "On voit les numéros 13, 58, 56, 78..." },
        '45': { name: "Armoire", type: 'info', text: "Contient 91 et 71." },
        '76': { name: "Bibliothèque", type: 'info', text: "Indices : 21, 74, 14, 31." },

        // Objets du Bureau (Nécessitent d'avoir accès aux zones)
        '13': {
            name: "Tiroir Braille",
            type: 'machine',
            prompt: "Code à 4 chiffres ?",
            code: '0818',
            rewards: ['11'],
            successMessage: "Le tiroir s'ouvre !",
            requires: ['16'] // Visible sur le bureau 16
        },
        '78': { name: "Table Braille", type: 'indice', requires: ['16'] },
        '58': { name: "Lampe", type: 'indice', text: "Il manque l'abat-jour (91).", requires: ['16'] },
        '56': {
            name: "Tiroir César",
            type: 'machine',
            prompt: "Mot de passe ?",
            code: 'VERTU', 
            rewards: ['62'],
            successMessage: "Table des symboles trouvée.",
            requires: ['16']
        },

        // Contenu Armoire (Nécessite 45)
        '91': { name: "Abat-jour", type: 'item', requires: ['45'] },
        '71': { name: "Disque César", type: 'outil', requires: ['45'] },

        // Contenu Bibliothèque (Nécessite 76)
        '21': { name: "Rotor", type: 'item', requires: ['76'] },
        '74': { name: "Livre Suspendu", type: 'indice', requires: ['76'] },
        '14': { name: "Livre Animaux", type: 'indice', requires: ['76'] },
        '31': { name: "Livre Océan", type: 'indice', requires: ['76'] },

        // Suite des énigmes (Objets cachés)
        '11': { name: "Tiroir Ouvert", type: 'info', text: "Il y a une carte 67 (Lampe UV)." }, // Donné par 13
        
        '67': { name: "Lampe UV", type: 'indice', text: "Révèle 'Océan p. 242' sur le mur.", requires: ['11'] }, // Dans le tiroir 11
        
        '62': { name: "Symboles", type: 'indice' }, // Donné par 56

        '4': { name: "Page 242", type: 'indice', requires: ['31'] }, // Dans le livre 31
        '50': { name: "Unité Centrale", type: 'info', requires: ['76'] }, // Visible biblio ou via 4
        '75': { name: "Code Morse", type: 'indice' },
        '88': { name: "Identifiant", type: 'info', text: "ID: 88", requires: ['76'] }, // Visible biblio
        
        '55': {
            name: "Ordinateur",
            type: 'machine',
            prompt: "LOGIN (ID + MDP) :",
            code: '88179401', 
            rewards: ['22'],
            successMessage: "ACCÈS AUTORISÉ."
        },
        '22': { name: "VICTOIRE", type: 'win', text: "Bravo ! Vous avez réussi." },

        // Pièges (Affichage)
        '49': { name: "ERREUR", type: 'error', text: "Mauvaise réponse. -5 Minutes." },
        '77': { name: "ERREUR", type: 'error', text: "Ce n'est pas le bon code. -5 Minutes." },
        '87': { name: "ERREUR", type: 'error', text: "Erreur de décodage. -5 Minutes." },
        '84': { name: "ERREUR", type: 'error', text: "Erreur Braille. -5 Minutes." },
        '85': { name: "ERREUR", type: 'error', text: "Erreur Braille. -5 Minutes." },
        '86': { name: "ERREUR", type: 'error', text: "Erreur Braille. -5 Minutes." },
        '61': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes." },
        '63': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes." },
        '64': { name: "ERREUR", type: 'error', text: "Erreur César. -5 Minutes." },
        '93': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes." },
        '94': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes." },
        '95': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes." },
        '44': { name: "ERREUR", type: 'error', text: "Fausse piste. -5 Minutes." }
    }
};