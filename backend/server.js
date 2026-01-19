const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');

// --- FONCTIONS UTILITAIRES ---

// Lire les scores
const getScores = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Erreur de lecture:", err);
        return [];
    }
};

//ecrire les scores
const saveScores = (scores) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2));
    } catch (err) {
        console.error("Erreur d'écriture:", err);
    }
};

// --- ROUTES API ---

// récupérer les scores
app.get('/api/scores', (req, res) => {
    let scores = getScores();
    scores.sort((a, b) => a.temps - b.temps);
    res.json(scores.slice(0, 10));
});

// enregistrer un nouveau score
app.post('/api/score', (req, res) => {
    const { pseudo, temps } = req.body;
    if (!pseudo || !temps) {
        return res.status(400).json({ error: "Pseudo et temps requis" });
    }
    const newScore = {
        pseudo: pseudo,
        temps: parseInt(temps),
        date: new Date().toISOString()
    };
    const scores = getScores();
    scores.push(newScore);
    saveScores(scores);
    console.log(`Nouveau score enregistré : ${pseudo} - ${temps}s`);
    res.json({ success: true, message: "Score sauvegardé" });
});


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Serveur Backend démarré sur http://localhost:${PORT}`);
        console.log(`Fichier de données visé : ${DATA_FILE}`);
    });
}
module.exports = app;