require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

//database connection
const url = process.env.MONGODB_URI;

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
app.use(express.static("build"));

//routes
app.get("/api/persons", (req, res, next) => {
  Person.find({})
    .then((persons) => {
      res.json(persons);
    })
    .catch((error) => next(error));
});

app.get("/api/persons/:id", (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error));
});

app.use(express.json());
app.use(morgan("tiny"));

app.post("/api/persons", (req, res, next) => {
  const newPerson = req.body;

  if (!newPerson.name) {
    return res.status(400).json({ error: "name missing" });
  }

  if (!newPerson.number) {
    return res.status(400).json({ error: "number missing" });
  }

  Person.findOne({ name: newPerson.name })
    .then((existingPerson) => {
      if (existingPerson) {
        existingPerson.number = newPerson.number;
        existingPerson.save().then((updatedPerson) => {
          res.json(updatedPerson);
        });
      } else {
        const person = new Person({
          name: newPerson.name,
          number: newPerson.number,
        });

        person.save().then((savedPerson) => {
          res.json(savedPerson);
        });
      }
    })
    .catch((error) => next(error));
});

app.delete("/api/persons/:id", (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then((result) => {
      res.status(204).end();
    })
    .catch((error) => next(error));
});

app.get("/info", (req, res, next) => {
  let numberOfPeople = 0;
  const date = new Date();
  Person.find({})
    .then((persons) => {
      persons.forEach(() => numberOfPeople++);
      res.send(
        `<p>Phonebook has info for ${numberOfPeople} people.</p><p>${date}</p>`
      );
    })
    .catch((error) => next(error));
});

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const errorHandler = (error, req, res, next) => {
  console.error(error.message);
  if (error.name === "CastError") {
    return res.status(400).send({ error: "incorrectly formatted id" });
  }
  res.status(500).send({ error: "Something went wrong!" });
};

app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
