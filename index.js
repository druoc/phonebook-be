require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

let persons = [];

//database connection
const url = `mongodb+srv://druoc:${process.env.PASSWORD}@cluster0.cth7xey.mongodb.net/phonebook`;

mongoose.set("strictQuery", false);
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

//change document id from object to string
personSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject._v;
  },
});

const Person = mongoose.model("Person", personSchema);

app.use(cors());
app.use(express.static("dist"));

//routes
app.get("/api/persons", (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

app.get("/api/persons/:id", (req, res) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(400).send({ error: "incorrectly formatted id" });
    });
});

app.use(express.json());
app.use(morgan("tiny"));

app.post("/api/persons", (req, res) => {
  const newPerson = req.body;

  if (!newPerson.name) {
    return res.status(400).json({ error: "name missing" });
  }

  if (!newPerson.number) {
    return res.status(400).json({ error: "number missing" });
  }

  const person = new Person({
    name: newPerson.name,
    number: newPerson.number,
  });

  person.save().then((savedPerson) => {
    res.json(savedPerson);
  });
});

app.delete("/api/persons/:id", (req, res) => {
  Person.findByIdAndRemove(req.params.id).then((result) => {
    res.status(204).end();
  });
});

app.get("/info", (req, res) => {
  let numberOfPeople = 0;
  const date = new Date();
  Person.find({}).then((persons) => {
    persons.forEach(() => numberOfPeople++);
    res.send(
      `<p>Phonebook has info for ${numberOfPeople} people.</p><p>${date}</p>`
    );
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
