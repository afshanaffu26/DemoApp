//RESRFul Services byNodeJS
var crypto = require('crypto');
var uuid = require('uuid');
var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');

//connect to MySQL


var con = mysql.createConnection(
{
	host:"localhost", //Replace your host IP
	user:"root",
	password:"",
	database:"DemoNodeJS"
});

//Password Ultil
var genRandomstring = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
	.toString('hex') /*convert to hext format*/
	.slice(0,length); /*return required no of characters*/
};

var sha512 = function(password,salt){
 var hash = crypto.createHmac('sha512',salt);
 hash.update(password);
 var value = hash.digest('hex');
 return{
	 salt:salt,
	 passwordHash:value
 };
};

function saltHashpassword(userPassword){
	var salt = genRandomstring(16);//gen random string with 16 characters to salt
	var passwordData = sha512(userPassword,salt);
	return passwordData;

}

function checkHashPassword(userPassword,salt){
	console.log("salt: "+salt);
	var passwordData = sha512(userPassword,salt);
	return passwordData;
}


var app = express();
app.use(bodyParser.json());//Accept Json params
app.use(bodyParser.urlencoded({extended:true}));//accept url encoded params

app.post('/register/',(req,res,next)=>{
	var post_data = req.body; //get post params

	var uid = uuid.v4(); //get uuid v4 like '110bsxjhbshjsx-cccc-55555-jsdnjdnxk '
	var plaint_password = post_data.password; //get password from post params
	var hash_data = saltHashpassword(plaint_password);
	var password = hash_data.passwordHash;//get hash value
	var salt = hash_data.salt;

	var name = post_data.name;
	var email = post_data.email;

	con.query('select * from user where email=?',[email],function(err,result,fields){

		con.on('error',function(err){
			console.log('[MYSQL ERROR]',err);
		});
		if(result && result.length)
			res.json('user already exist');
		else{
		con.query('INSERT INTO `user`(`unique_id`, `name`, `email`, `encrypted_password`, `Salt`, `created_at`, `updated_at`) '+
		'VALUES (?,?,?,?,?,NOW(),NOW())',[uid,name,email,password,salt],function(err,result,fields){
		con.on('error',function(err){
			console.log('[MYSQL ERROR]',err);
			res.json('Register err: ',err);

		});
		res.json('Registered');
	})
}
	});


})



app.post('/loginn/',(req,res,next)=>{
	var post_data = req.body; 

	//extract email, password from request
	var user_password = post_data.password;
	var email = post_data.email;

	con.query('select * from user where email=?',[email],function(err,result,fields){
		con.on('error',function(err){
			console.log('[MYSQL ERROR]',err);
		});
		if(result && result.length)
		{

 	var salt = result[0].Salt; //get salt of result if account exists
	 var encrypted_password = result[0].encrypted_password;

	// Hash password from login request with salt in database
	var hashed_password = checkHashPassword(user_password,salt).passwordHash;
	if(encrypted_password == hashed_password)
		res.end(JSON.stringify(result[0]))//if password is true ,return all info of user
	else
		res.end(JSON.stringify('Wrong password'));
	}
		else{
			res.json('user does not exist');
	}

});
})


// app.get("/",(req,res,next)=>{
// 	console.log("Password: 123456");
// 	var encrypt = saltHashpassword("123456");
// 	console.log("Encrypt:"+ encrypt.passwordHash);
// 	console.log("Salt:"+encrypt.salt);
// });

//start server
app.listen(3000,()=>{
	console.log('Restful running on port 3000');
})