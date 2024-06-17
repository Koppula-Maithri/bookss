import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 4000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "BOOKSS",
  password: "KSr@1234",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT BOOK_NAME, SUMMARY, RATING FROM READ");
    const data = result.rows;

    console.log("Database query result:", data);

    let books = [];

    for (const row of data) {
      const apiresult = await axios.get(`https://openlibrary.org/search.json`, {
        params: {
          q: row.book_name
        }
      });

      console.log(`API response data for book '${row.book_name}':`, apiresult.data);

      const apidata = apiresult.data.docs;

      if (apidata.length > 0) {
        const book = apidata[0];
        const coverUrl = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null;

        books.push({
          title: book.title,
          author: book.author_name ? book.author_name.join(', ') : 'Unknown',
          summary: row.summary,
          rating: row.rating,
          coverUrl
        });
      } else {
        books.push({
          title: row.book_name,
          author: 'Unknown',
          summary: row.summary,
          rating: row.rating,
          coverUrl: null
        });
      }
    }

    console.log("Books data:", books);

    res.render("index", {
      books
    });
  } catch (err) {
    console.error("Error:", err);
    res.send(err);
  }
});

app.get("/add-book", (req, res) => {
  res.render("new.ejs");
});

app.post("/add-book", async (req, res) => {
  const { book_name, summary, rating } = req.body;

  try {
    await db.query("INSERT INTO READ (BOOK_NAME, SUMMARY, RATING) VALUES ($1, $2, $3)", [book_name, summary, rating]);
    res.redirect("/");
  } catch (err) {
    console.error("Error:", err);
    res.send(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
