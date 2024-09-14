
const authenticate=(req,res,next)=>{
    if(req.session &&  req.session.user){
      return next();
    }else{
      req.flash("warning","You Need To Log In First");
      res.redirect("/login");
    }
}

module.exports=authenticate;