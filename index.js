require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

let persons = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

const url = `mongodb+srv://druoc:${process.env.PASSWORD}@cluster0.cth7xey.mongodb.net/phonebook`;

mongoose.set("strictQuery", false);
mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
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
  const id = Number(req.params.id);
  const person = persons.find((person) => person.id === id);
  if (person) {
    res.json(person);
  } else {
    res.status(404).end();
  }
});

app.use(express.json());
app.use(morgan("tiny"));

app.post("/api/persons", (req, res) => {
  const maxId = persons.length > 0 ? Math.max(...persons.map((x) => x.id)) : 0;
  const newPerson = req.body;

  if (!newPerson.name) {
    return res.status(400).json({ error: "name missing" });
  }

  if (!newPerson.number) {
    return res.status(400).json({ error: "number missing" });
  }

  const personAlreadyExists = persons.find(
    (person) => person.name === newPerson.name
  );

  if (personAlreadyExists) {
    return res
      .status(400)
      .json({ error: "Person already exists in phonebook!" });
  }
  newPerson.id = maxId + 1;
  persons = persons.concat(newPerson);
  res.json(newPerson);
});

app.delete("/api/persons/:id", (req, res) => {
  const id = Number(req.params.id);
  persons = persons.filter((person) => person.id !== id);
  res.status(204).end();
});

app.get("/info", (req, res) => {
  let numberOfPeople = 0;
  const date = new Date();
  persons.forEach(() => numberOfPeople++);
  res.send(
    `<p>Phonebook has info for ${numberOfPeople} people.</p><p>${date}</p>`
  );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
