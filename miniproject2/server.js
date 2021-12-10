const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const formidable = require('formidable');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const ObjectID = require('mongodb').ObjectID;
const mongourl = 'mongodb+srv://kenny:kenny@cluster0.hwqlo.mongodb.net/test?retryWrites=true&w=majority';
const dbName = 'test';

app.set('view engine','ejs');

app.use(express.static(__dirname + '/public'));

const SECRETKEY1 = '1';
const SECRETKEY2 = '2';

const users = new Array(
	{name: 'demo', password: ''},
	{name: 'student', password: ''}
);

var usernameOwner = "";

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req,res) => {
	usernameOwner = req.session.username;
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	} else {
		res.redirect('/home');
	}
});

app.get('/login', (req,res) => {
	res.status(200).sendFile(__dirname + '/public/login.html');
});

app.post('/login', (req,res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = user.name;			
		}
	});
	res.redirect('/');
});

app.get('/logout', (req,res) => {
	req.session = null;
	res.redirect('/');
});

app.get('/home', (req,res) => {
	res.render('home.ejs');
});


app.get('/createInventory', (req,res) => {
	res.render('createInventory.ejs');
});

app.post('/insertInventory', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    let filename = files.filetoupload.path;
    if (fields.name) {
      var name = (fields.name.length > 0) ? fields.name : "";
      console.log(`name = ${name}`);
    }
    if (fields.type) {
      var type  = (fields.type.length > 0) ? fields.type : "";
      console.log(`type = ${type}`);
    }
    if (fields.quantity) {
      var quantity   = (fields.quantity.length > 0) ? fields.quantity : "";
      console.log(`quantity = ${quantity}`);
    }
    if (files.filetoupload.type) {
      var mimetype = files.filetoupload.type;
      console.log(`mimetype = ${mimetype}`);
    }
    if (!mimetype.match(/^image/)) {
      var mimetype = "null";
      console.log(`mimetype = "null"`);
    }
    if (fields.street) {
      var street = (fields.street.length > 0) ? fields.street : "";
      console.log(`street = ${street}`);
    }
    if (fields.building) {
      var building = (fields.building.length > 0) ? fields.building : "";
      console.log(`building = ${building}`);
    }
    if (fields.zipcode) {
      var zipcode = (fields.zipcode.length > 0) ? fields.zipcode : "";
      console.log(`zipcode = ${zipcode}`);
    }
    if (fields.coordlon) {
      var coordlon= (fields.coordlon.length > 0) ? fields.coordlon : "";
      console.log(`coordlon = ${coordlon}`);
    }
    if (fields.coordlat) {
      var coordlat= (fields.coordlat.length > 0) ? fields.coordlat : "";
      console.log(`coordlat = ${coordlat}`);
    }
    	
    fs.readFile(filename, (err,data) => {
      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
	  res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
          res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        let new_r = {};
	let address = {};
        new_r['name'] = name;
        new_r['type'] = type;
	new_r['quantity'] = quantity;
        new_r['photo'] = new Buffer.from(data).toString('base64');
	new_r['photo mimetype'] = mimetype;
	address['street'] = street;
	address['building'] = building;
	address['zipcode'] = zipcode;
	address['coord'] = [coordlon, coordlat];
	new_r['address'] = address;
	new_r['owner'] = usernameOwner;
        insertInventory(db,new_r,(result) => {
          client.close();
	  res.writeHead(200, {"Content-Type": "text/html"});
	  res.write('Inventory was inserted into MongoDB!');
	  res.end('<br><a href="/">Back</a>');
        });
      });
    });
  });
});

//function requirement #3
app.get('/updateInventory', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findInventory(db,criteria,(Inventory) => {
      client.close();
      console.log('Disconnected MongoDB'); 
      res.render('updateInventory.ejs',{Inventory:Inventory});    
    });
  });
});

app.post('/updateResult', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    let filename = files.filetoupload.path;
    if (fields.id) {
      var id = (fields.id.length > 0) ? fields.id : "";
      console.log(`id = ${id}`);
    }
    if (fields.owner) {
      var owner = (fields.owner.length > 0) ? fields.owner : "";
      console.log(`owner = ${owner}`);
    }
    if (fields.name) {
      var name = (fields.name.length > 0) ? fields.name : "";
      console.log(`name = ${name}`);
    }
    if (fields.type) {
      var type  = (fields.type.length > 0) ? fields.type : "";
      console.log(`type = ${type}`);
    }
    if (fields.quantity) {
      var quantity   = (fields.quantity.length > 0) ? fields.quantity : "";
      console.log(`quantity = ${quantity}`);
    }
    if (files.filetoupload.type) {
      var mimetype = files.filetoupload.type;
      console.log(`mimetype = ${mimetype}`);
    }
    if (!mimetype.match(/^image/)) {
      var mimetype = "null";
      console.log(`mimetype = "null"`);
    }
    if (fields.street) {
      var street = (fields.street.length > 0) ? fields.street : "";
      console.log(`street = ${street}`);
    }
    if (fields.building) {
      var building = (fields.building.length > 0) ? fields.building : "";
      console.log(`building = ${building}`);
    }
    if (fields.zipcode) {
      var zipcode = (fields.zipcode.length > 0) ? fields.zipcode : "";
      console.log(`zipcode = ${zipcode}`);
    }
    if (fields.coordlon) {
      var coordlon= (fields.coordlon.length > 0) ? fields.coordlon : "";
      console.log(`coordlon = ${coordlon}`);
    }
    if (fields.coordlat) {
      var coordlat= (fields.coordlat.length > 0) ? fields.coordlat : "";
      console.log(`coordlat = ${coordlat}`);
    }
    	
    fs.readFile(filename, (err,data) => {
      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
          res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
          res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        let new_r = {};
	let address = {};
        new_r['name'] = name;
        new_r['type'] = type;
	new_r['quantity'] = quantity;
        new_r['photo'] = new Buffer.from(data).toString('base64');
	new_r['photo mimetype'] = mimetype;
	address['street'] = street;
	address['building'] = building;
	address['zipcode'] = zipcode;
	address['coord'] = [coordlon, coordlat];
	new_r['address'] = address;
	new_r['owner'] = usernameOwner;
	let criteria = {};
    	criteria['_id'] = ObjectID(id);
	if(owner==usernameOwner) {
      	updateInventory(db,criteria,new_r,(result) => {
          client.close();
          res.writeHead(200, {"Content-Type": "text/html"});
	  res.write('Inventory was updated into MongoDB!');
          res.end('<br><a href="/">Back</a>');
	});
	} else {
          res.writeHead(500, {"Content-Type": "text/html"});
	  res.write('Only owner can update inventory information!');
	  res.end('<br><a href="/">Back</a>');
	}
      });
    });
  });
});


app.get('/viewInventory', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    findInventory(db,{},(Inventory) => {
      client.close();
      console.log('Disconnected MongoDB');
      res.render("viewInventory.ejs",{Inventory:Inventory});
    });
  });
});

app.get('/display', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(500, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');s
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findInventory(db,criteria,(Inventory) => {
      client.close();
      console.log('Disconnected MongoDB');
      let photo = new Buffer(Inventory[0].photo,'base64');
      //console.log(usernameOwner); 
      res.render('viewDetail.ejs',{Inventory:Inventory, usernameOwner:usernameOwner});    
    });
  });
});


app.get('/deleteInventory', (req,res) => {
  let client = new MongoClient(mongourl);
  client.connect((err) => {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write("MongoClient connect() failed!");
      res.end('<br><a href="/">Back</a>');
    }      
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    let criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    let owner = req.query.downer;
    if(owner==usernameOwner) {
      deleteInventory(db,criteria,(Inventory) => {
      client.close();
      console.log('Disconnected MongoDB');
      res.writeHead(200, {"Content-Type": "text/html"});
      res.write("Inventory data was deleted from MongoDB!");
      res.end('<br><a href="/">Back</a>');
    });
    } else {
        res.writeHead(200, {"Content-Type": "text/html"});
	res.write("Only owner can delete!");
	res.end('<br><a href="/">Back</a>');
    }
  });
});


app.get('/searchInventory', (req,res) => {
	res.render('searchInventory.ejs',)
});

app.post('/searchResult', (req,res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(files));
    if (fields.type) {
      var type = (fields.type.length > 0) ? fields.type : "";
      console.log(`type = ${type}`);
    }
    if (fields.searchitem) {
      var searchitem = (fields.searchitem.length > 0) ? fields.searchitem : "";
      console.log(`searchitem = ${searchitem}`);
    }

      let client = new MongoClient(mongourl);
      client.connect((err) => {
        try {
          assert.equal(err,null);
        } catch (err) {
	  res.writeHead(500, {"Content-Type": "text/html"});
          res.write("MongoClient connect() failed!");
	  res.end('<br><a href="/">Back</a>');
        }
        const db = client.db(dbName);
        
	var a = "";
        a = "" + searchitem; 

    	searchInventory(db,a,(Inventory) => {
      	   client.close();
           console.log('Disconnected MongoDB');
           res.render("searchResult.ejs",{Inventory:Inventory});
    	});
     });
  });
});


app.get('^\/.*/', function(req,res) {
  res.render('/');
});


function findInventory(db,criteria,callback) {
  cursor = db.collection("InventoryHW").find(criteria);
  let Inventory = [];
  cursor.forEach((doc) => {
    Inventory.push(doc);
  }, (err) => {

    console.log('data received');
    assert.equal(err,null);
    callback(Inventory);
  })
}


function insertInventory(db,r,callback) {		db.collection('InventoryHW').insertOne(r,function(err,result) {
    assert.equal(err,null);
    console.log("insert was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}


function updateInventory(db,criteria,r,callback) {		db.collection('InventoryHW').replaceOne(criteria,r,function(err,result) {
    assert.equal(err,null);
    console.log("update was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}




function deleteInventory(db,criteria,callback) {
db.collection('InventoryHW').deleteOne(criteria,function(err,result) {
    assert.equal(err,null);
    console.log("delete was successful!");
    //console.log(JSON.stringify(result));
    callback(result);
  });
}


function searchInventory(db,criteria,callback) {
   cursor = db.collection("InventoryHW").find({$or:[{"name":criteria},{"type":criteria},{"quantity":criteria},{"address.street":criteria},{"address.building":criteria},{"address.zipcode":criteria},{"address.coord[0]":criteria},{"address.coord[1]":criteria},{"grades":{"user":criteria}},{"grades":{"score":criteria}},{"owner":criteria}]});
  let Inventory = [];
  cursor.forEach((doc) => {
    Inventory.push(doc);
  }, (err) => {
    // done or error
    console.log('data received');
    assert.equal(err,null);
    callback(Inventory);
  })
}

app.listen(process.env.PORT || 8099);
