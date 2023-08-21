import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

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

const hora = dayjs().format("HH:mm:ss")

//////////////////////

app.post("/participants", async (req, res) => {
const { name } = req.body

const participantsSchema = joi.object({
    name: joi.string().required().min(1)
})

const validation = participantsSchema.validate(req.body, {abortEarly: false })

if(validation.error){
    //console.log(validation.error.details)
    const errors = validation.error.details.map(detail => detail.message)
    return res.status(422).send(errors)
}

try{
    const verificarParticipant = await db.collection("participants").findOne({name : name})
    if(verificarParticipant) return res.status(409).send("Essa pessoa já existe!")
    User.push(name)
    await db.collection("participants").insertOne({name, lastStatus: Date.now()})
    await db.collection("messages").insertOne({from: name, to: "Todos", text: "entra na sala...", type: "status", time: hora})
    res.sendStatus(201)       
} catch (err) {
    res.status(500).send(err.message)
}
})

app.get("/participants", async (req, res) =>{
    const { id } = req.params

    try{
        const participants = await db.collection("participants").find().toArray()
        res.status(200).send(participants)
    } catch (err) {
        res.status(500).send(err.message)
    }   
})

app.post("/messages", async (req, res) => {
    const {to, text, type } = req.body
    const {user} = req.headers

    const messagesSchema = joi.object({
        to: joi.string().required().min(1),
        text: joi.string().required().min(1),
        type: joi.string().required().valid("message", "private_message"),
        from: joi.string().required()
    })
    
    const validation = messagesSchema.validate({...req.body, from: user}, {abortEarly: false })
    
    if(validation.error){
        console.log(validation.error.details)
        const errors = validation.error.details.map(detail => detail.message)
        return res.status(422).send(errors)
    }
    
    try{     
        const participants = await db.collection("participants").findOne({name: user})
        if(!participants){
            return res.sendStatus(422)
        }
        
        await db.collection("messages").insertOne({from: user , to, text, type,  time: hora})
        res.sendStatus(201)     
    } catch (err) {
        res.status(500).send(err.message)
    }
    
})

app.get("/messages", async (req, res) =>{
    const { user } = req.headers
    const { limit } = req.query
    if ( Number(limit) <= 0 || isNaN(limit) || limit === undefined){
        return res.sendStatus(422)
    }

    try{
        const messageParticipant = await db.collection("messages")
        .find({ $or: [{from: user}, {to:user}, {type: "message"}, {to: "Todos"}]})
        .sort({time: -1})
        .limit(limit === undefined ? 0 : Number(limit))
        .toArray()
        res.send(messageParticipant)
    } catch (err) {
        res.status(500).send(err.message)
    }   
})

app.post("/status", async (req, res) => {
  
})

const PORT = 5000
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`))