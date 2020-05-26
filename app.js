const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app=express();



app.set('view engine', 'ejs');

app.use(express.static("public"));

mongoose.connect("mongodb+srv://******-******:*****@cluster0-jl6rf.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema=new mongoose.Schema({
  name:String
});

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to your todolist!"
});
const item2=new Item({
  name:"Hit the + button to add a new item."
});
const item3=new Item({
  name:"<-- Hit this to delete an item."
});

const defaultItems=[item1,item2,item3];

const listSchema={
  name:String,
  items:[itemsSchema]
}
const List=mongoose.model("List",listSchema);


app.get("/",function(req,res){

Item.find({},function(err,foundItems){

  if(foundItems.length===0){
    Item.insertMany(defaultItems,function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully saved defaultItems to the database");
      }
    });
    res.redirect("/")
  }
  else{
    res.render("list",{listTitle:"Today",item:foundItems});
  }

});
});
app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list=new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }else{
        //load the existing list
        res.render("list",{listTitle:foundList.name,item:foundList.items});
      }
    }
  });
});

app.use(bodyParser.urlencoded({extended:true}));

app.post("/",function(req,res){
  const itemName=req.body.add_item;
  const listName=req.body.list;

  const newitem=new Item({
    name:itemName
  });

  if(listName==="Today"){
    newitem.save();

    res.redirect("/");
  }
else{
  List.findOne({name:listName},function(err,foundList){
    foundList.items.push(newitem);
    foundList.save();
    res.redirect("/"+listName);
  })
}

});

app.post("/delete",function(req,res){
  const removeItemId=req.body.checkbox;
  const listName=req.body.listName;
  if(listName==="Today"){
    Item.findByIdAndRemove(removeItemId,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Successfully Removed");
        res.redirect("/");
      }
    });
  }
  else{
  List.findOneAndUpdate({name:listName},{$pull:{items:{_id: removeItemId}}},function(err,foundList){
    if(!err){
      res.redirect("/"+listName);
    }
  });
  }

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,function(){
  console.log("Server started successfully");
});
