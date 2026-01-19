const request = require('supertest');
const fs = require('fs');
const app = require('./server');

jest.mock('fs'); //mock

describe('API Escape Game', () => {
    const mockScores = [
        { pseudo: "Lent", temps: 5000, date: "2024-01-01" },
        { pseudo: "Rapide", temps: 100, date: "2024-01-01" }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/scores', () => {
        it('devrait retourner la liste des scores triée (du plus rapide au plus lent)', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockScores));
            const res = await request(app).get('/api/scores');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].pseudo).toBe("Rapide");
            expect(res.body[1].pseudo).toBe("Lent");
        });
        it('devrait retourner un tableau vide si le fichier n\'existe pas', async () => {
            fs.existsSync.mockReturnValue(false); 
            const res = await request(app).get('/api/scores');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });
    });

    describe('POST /api/score', () => {
        it('devrait sauvegarder un nouveau score valide', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify([]));
            const newScore = { pseudo: "Gagnant", temps: 1234 };
            const res = await request(app).post('/api/score').send(newScore);

            expect(res.statusCode).toEqual(200);
            expect(fs.writeFileSync).toHaveBeenCalled();
            const writeArgs = fs.writeFileSync.mock.calls[0];
            const contentWritten = JSON.parse(writeArgs[1]);
            expect(contentWritten[0].pseudo).toBe("Gagnant");
            expect(contentWritten[0].temps).toBe(1234);
        });

        it('devrait rejeter un score sans pseudo', async () => {
            const res = await request(app)
                .post('/api/score')
                .send({ temps: 1234 });
            expect(res.statusCode).toEqual(400);
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });
});