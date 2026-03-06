const express = require("express");
const { connect } = require("http2");
const { Pool } = require("pg");
const app = express();
const PORT = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');

const poolc = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware para parsear JSON
app.use(express.json());

// GET API endpoint that returns a string
app.get('/api/now', async (req, res) => {
    const { rows } = await poolc.query('SELECT NOW() as now');
    res.json({
        message: "Hello from Node.js API!",
        dbTime: rows[0].now,
        timestamp: new Date().toISOString(),
        status: "success"
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user_db = await poolc.query('SELECT user_id, username, password FROM "user" WHERE email = $1', [email]);
    if(user_db.rowCount === 0) {
        return res.status(401).json({ message: "Credenciais inválidas. Tente novamente." });
    }

    const isMatch = await bcrypt.compare(password, user_db.rows[0].password);
    if (!isMatch) {
        return res.status(401).json({ message: "Credenciais inválidas. Tente novamente." });
    }

    const token = jwt.sign(
        { 
            user_id: user_db.rows[0].user_id, 
            username: user_db.rows[0].username 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );

    res.json({ message: "Login realizado com sucesso!", token });
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, username, name } = req.body;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await poolc.query(
            'INSERT INTO "user" (email, password, username, name) VALUES ($1, $2, $3, $4)', 
            [email, hashedPassword, username, name]
        );

        return res.status(201).json({ message: "Usuário registrado com sucesso!" });

    } catch (error) {
        // O código 23505 é o padrão do Postgres para erro de unicidade
        if (error.code === '23505') {
            return res.status(400).json({ 
                error: "Este e-mail já está em uso por outro usuário." 
            });
        }

        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

function verifyToken(req, res, next) {
    const normalizedToken = req.headers['authorization'];
    if (!normalizedToken) {
        return res.status(403).json({ message: "Nenhum token fornecido." });
    }
    const tokenParts = normalizedToken.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: "Token inválido." });
    }
    const token = tokenParts[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token inválido." });
        }
        req.user = decoded;
        next();
    });
}
    
app.get('/api/users', verifyToken, async (req, res) => {
    const { rows } = await poolc.query('SELECT user_id, username FROM "user"');

    res.json({
        users: rows
    });
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});