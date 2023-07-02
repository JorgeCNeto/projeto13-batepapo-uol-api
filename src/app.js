import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

const app = express()

app.use(cors())
app.use(express.json())
dotenv.config()

let User = []

const mongoClient = new MongoClient(process.env.DATABASE_URL)
try{
    await mongoClient.connect()
    console.log("MongoDB conectado!")
} catch (err){
    (err) => console.log(err.message)
}
const db = mongoClient.db()

//////////////////////

app.post("/participants", async (res, req) => {
const { name } = req.body

const participantsSchema = joi.object({
    name: joi.string().required().min(1)
})

const validation = participantsSchema.validate(req.body, {abortEarly: false })

if(validation.error){
    console.log(validation.error.details)
    const errors = validation.error.details.map(detail => detail.message)
    return res.status(422).send(errors)
}

try{
    const verificarParticipant = await db.collection("participants").findOne({name: name})
    if(verificarParticipant) return res.status(409).send("Essa pessoa já existe!")
    User.push(name)
    await db.collection("participants").insertOne({name, lastStatus: Date.now()})
    await db.collection("messages").insertOne({from: name, to: "Todos", text: "entra na sala...", type: "status", time: lastStatus})
    res.sendStatus(201)       
} catch (err) {
    res.status(500).send(err.message)
}
})

app.get("/participants", async (req, res) =>{
    const { id } = req.params

    try{
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }   
})

app.post("/messages", async (req, res) => {
    const {to, text, type } = req.body
    const { from }  = User

    const messagesSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required(),
        from: joi.string().required()
    })
    
    const validation = messagesSchema.validate(req.body, {abortEarly: false })
    
    if(validation.error){
        console.log(validation.error.details)
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }
    
    try{
        //@ts-ignore
        await db.collection("messages").insertOne({to, text, type,  time: Date.now()})
        res.sendStatus(201)     
    } catch (err) {
        res.status(500).send(err.message)
    }
    
})

app.get("/messages", async (req, res) =>{
    try{
        const participants = await db.collection("messages").find().toArray()
        res.send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }   
})

app.post("/status", async (req, res) => {
  
})

const PORT = 5000
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`))