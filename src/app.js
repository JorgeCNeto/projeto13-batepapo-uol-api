import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"

const app = express()

app.use(cors())
app.use(express.json())


let db
const mongoClient = new MongoClient(process.env.DATABASE_URL)
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


    app.post("/participants", (res, req) => {
    const { name } = req.body

    if(!name){
        return res.status(422).send("Todos os campos são obrigatórios!")
    }

    const newParticipant = {name}
    db.collection("participants").insertOnde(newParticipant)
        .then(() => res.status(201).send("Entrou na sala"))
        .catch((err) => res.status(500).send(err.message))
})


const PORT = 5000
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`))