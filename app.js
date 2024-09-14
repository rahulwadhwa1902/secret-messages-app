const express=require('express');
const connectDb = require('./config/dbConnection');
const Secret=require('./models/secretModels');
const User=require('./models/UserModels');
const session = require('express-session');
const flash = require('express-flash');
const bcrypt=require('bcrypt');
const path = require('path');
const authenticate=require('./middleware/AuthenticationHandler');
const ACCESS_TOKEN_SECRET="sherrrr";

connectDb();


const app=express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ 
  secret: 'qmndpz',
  resave: true,
  saveUninitialized: true
}));


app.use(flash());


app.use(express.urlencoded({extended:false}));
app.set('view engine','ejs');



app.get("/",function(req,res){
 res.render("home");
});



app.get("/register",function(req,res){
  res.render("register",{success:req.flash('success'),error:req.flash('error')});
})



app.post("/register",(async function(req,res)
{
  try{
       let {email,password}=req.body;
       if(!email || !password)
        {
          req.flash('error',"All fields are mandatory");
          return res.redirect("/register");
        }
        email=email.trim().toLowerCase();
        const existingUser=await User.findOne({email});   
      
       if(existingUser)
        {
          req.flash('error', 'This email already exists. Please try again with a different email');
          return res.redirect("/register");
        }
        const hashedPassword=await bcrypt.hash(password,10);
        await User.create({email,password:hashedPassword});
        req.flash('success', 'You are successfully registered');
        return res.redirect("/login");
     }
  catch(err){
     console.log(err);
     req.flash('error',err.message);
     return res.redirect("/register");
    }
}))



app.get("/login",function(req,res)
{
  res.render("login",{success:req.flash('success'),error:req.flash('error'),warning:req.flash('warning')});
})


app.post("/login",async function(req,res)
{
  try{
        let {email,password}=req.body;
        console.log("email= ",email,"password =",password);
        if(!email || !password)
           {
            res.status(400);
            req.flash('error','All fields are mandatory');
            return res.redirect("/login");
           }
        email=email.trim().toLowerCase();
        const user=await User.findOne({email:email});
        console.log("user =",user);
        if(user && (await bcrypt.compare(password,user.password)))
        {
          req.session.user={email:email,_id:user._id};
          console.log("session in post login =",req.session.user);
          res.status(200);
          return res.redirect("/secret");
        }else {
           throw err;
        }
      }
  catch(err)
  {
        req.flash('error','Username or password is invalid');
        return res.redirect("/login");
   }
 })



app.get("/secretdata",authenticate,function(req,res)
{ 
    res.render("secretdata",{success:req.flash('success'),error:req.flash('error')});
})

app.post("/secret",authenticate,function(req,res)
{
  const {secret,location}=req.body;
  const secretAfterTrim=secret.trim();
  const locationAfterTrim=location.trim();
  
  if(secretAfterTrim.length===0){
    req.flash('error',`Secret can't be empty`);
    return res.redirect("/secretdata");
  }

  if(locationAfterTrim.length===0){
    req.flash('error',`Location can't be empty`);
    return res.redirect("/secretdata");
  } 

  const checkSecretLength=secret.split(" ").length;
  console.log(checkSecretLength);

  if(checkSecretLength>50){
    req.flash('error',`Please Enter Secret Upto 50 Words`);
    return res.redirect("/secretdata");
  }

  if(locationAfterTrim.length===0 || locationAfterTrim.length>30)
  {
    req.flash('error',`Please Enter Valid Country Name Upto 30 Characters`);
    return res.redirect("/secretdata");
  }
  Secret.create({secrett:secretAfterTrim,location:locationAfterTrim, user_id:req.session.user._id})
  .then(res=>console.log(`secret is inserted with ${res}`))
  .catch(err=>console.log(err.message));
  
  return res.redirect("/secret");
 
})


app.get("/secret",authenticate,function(req,res)
{
    Secret.find()
    .then(function(data)
    { 
      console.log(data);
      res.render("secret",{data:data.reverse()});  // so that  newly inserted can come at top
     }).catch(err=>console.log(err));
})

app.get("/mysecret",authenticate,function(req,res)
{
      Secret.find({user_id:req.session.user._id})
      .then((secrets)=>{
        console.log("Secrets =",secrets);
       return res.render('mysecret',{secrets:secrets.reverse(),success:req.flash('success'),error:req.flash('error')});
      })
      .catch((err)=>{
        console.log(err);
      })
})

app.get("/delete",authenticate,function(req,res)
{
       Secret.deleteOne({_id:req.query.secretId})
       .then(res=>{
         console.log(res);
          })
       .catch(err=>{
         console.log(err);
        })
       req.flash('success','Your Secret is Successfully deleted');
       return res.redirect("/mysecret");
})

app.get("/edit",authenticate,(req,res)=>{
   Secret.find({_id:req.query.editId})
   .then(secret=>{
    return res.render('editsecret',{secret:secret[0],success:req.flash('success'),error:req.flash('error'),warning:req.flash('warning')});
   })
   .catch(err=>{
    console.log(err);
   })
})


app.post("/edit",authenticate,(req,res)=>
{
    const secretId=req.body.secretId;
    let   updatedSecret=req.body.secret;
    const secretTrim=updatedSecret.trim();
    let   updatedLocation=req.body.location;
    const locationAfterTrim=updatedLocation.trim();

 if(secretTrim.length===0){
  req.flash('error',`Secret Can't Be Empty`);
  return res.redirect(`/edit?editId=${secretId}`);
 }
 if(secretTrim.split(" ").length >50){
  req.flash('error',`Please enter secret Upto 50 words`);
  return res.redirect(`/edit?editId=${secretId}`);
 }

 if(locationAfterTrim.length===0 || locationAfterTrim.length>30)
  {
    req.flash('error',`Please Enter Valid Country Name Upto 30 Characters`);
    return res.redirect(`/edit?editId=${secretId}`);
  }

 Secret.findById(secretId)
  .then(secret=>{
    secret.secrett=secretTrim;  
    secret.location=locationAfterTrim;
    return secret.save();
  })
  .then(data=>{
    return res.redirect("/mysecret");
  }).catch(err=>{
    console.log(err);
  })
})


app.get("/logout",authenticate,(req,res)=>{
  console.log("session in logout =",req.session.user);
  req.session.destroy();
  res.redirect("/login");
})


app.listen(3004,function(req,res){
    console.log("App listening on port 3004");
});








