//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const userName = process.env.USER_NAME;
const password = process.env.PASS_WORD;
const dataBase = process.env.DATA_BASE;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// create new db and connect to mongodb
mongoose.connect(
  `mongodb+srv://${userName}:${password}@cluster0.k6eoi80.mongodb.net/${dataBase}`,
  {
    useNewUrlParser: true,
  }
);

// creating new schema
const itemsSchema = {
  name: String,
};

// creating new model
const Item = mongoose.model("item", itemsSchema);

// creating db document
const item1 = new Item({
  name: "JavaScript",
});
const item2 = new Item({
  name: "Node.js",
});
const item3 = new Item({
  name: "MongoDB",
});

//array of documents
const defaultItems = [item1, item2, item3];

// creating new list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// creating new model
const List = mongoose.model("List", listSchema);

// using get method
app.get("/", function (req, res) {
  Item.find({}, (error, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("successfully saved items to DB");
        }
      });
      res.redirect("/");
    }
    if (items.length > 0) {
      console.log(items);
      res.render("list", {
        listTitle: "Manage Your Daily Activites",
        newListItems: items,
      });
    }
  });
});

// creating customlist using express route params
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (error, foundList) => {
    if (!error) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

// sending post req
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(listName);

  if (itemName === "") {
    return;
  }

  const item = new Item({
    name: itemName,
  });

  if (listName === "Manage Your Daily Activites") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// post req to delete item
app.post("/delete", (req, res) => {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Manage Your Daily Activites") {
    Item.findByIdAndRemove(checkItemId, (error, foundList) => {
      if (!error) {
        console.log(foundList);
      }
      res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkItemId } } },
      (error, foundList) => {
        if (!error) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

// server listen on port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
