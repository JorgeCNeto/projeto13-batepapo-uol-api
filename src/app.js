import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try{
    await mongoClient.connect()
    console.log("MongoDB conectado")
} catch (err){
    console.log(err.message)
}
const db = mongoClient.db()

app.post("/participants", async (res, req) => {
const { name } = req.body

const participantsSchema = joi.object({
    name: joi.string().required()
})

const validation = participantsSchema.validate(req.body, {abortEarly: false })

if(validation.error){
    console.log(validation.error.details)
    const errors = validation.error.details.map(detail => detail.message)
    return res.status(422).send(errors)
}

try{
    const verificarParticipant = await db.collection("participants").findOne({name: name, lastStatus: Date.now()})
    if(verificarParticipant) return res.status(409).send("Essa pessoa já existe!")

    await db.collection("participants").insertOne(req.body)
        res.status(201).send("Entrou na sala")       
} catch (err) {
    res.status(500).send(err.message)
}
})

app.get("/participants", async (req, res) =>{
    try{
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }   
})


const PORT = 5000
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`))