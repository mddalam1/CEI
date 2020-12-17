const { validateUser } = require('../models/user.model');
const router = require('express').Router()
const bcrypt = require('bcrypt')
const pool = require('../database/database.setup');
const winston = require('winston');

router.post('/', async (req, res) => {
    const {error} = validateUser(req.body)
    if(error) return res.status(400).send(`${error.name} : ${error.message}`)
    const {name, email, password, role = 'user'} = req.body
    try {
        const {rowCount} = await pool.query(`SELECT * FROM users WHERE email='${email}'`)
        if(rowCount) return res.status(400).send(`Account with provided email already exists.`)
        const salt = await bcrypt.genSalt(11)
        const hashedPassword = await bcrypt.hash(password, salt)
        const {rows} = await pool.query(`INSERT INTO users VALUES (
            DEFAULT, 
            '${name}', 
            '${email}', 
            '${hashedPassword}', 
            '${role}')
            RETURNING *;
        `)
        res.status(200).json(rows[0])
    } catch ({name, message}) {
        winston.error(`${name} : ${message}`)
        res.status(500).send('Something went Wrong!!!')
    }
})

module.exports = router