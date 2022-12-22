//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv')
const app = express();

dotenv.config();
app.set("view engine", "ejs");
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, });

const itemsSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
});

const item3 = new Item({
    name: "<-- Hit this button to delete an item.",
});

const defalutItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defalutItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems,
            });
        }
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName == "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (!err) {
                res.redirect("/");
            } else {
                console.log(err);
            }
            console.log("Successfully deleted checked item.");
        });
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemId } } },
            function (err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            }
        );
    }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defalutItems,
                });

                list.save();
                res.redirect("/" + customListName);
            } else {
                // Show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            }
        }
    });
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server started on port 3000");
});
