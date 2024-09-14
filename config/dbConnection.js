const mongoose=require('mongoose');
const CONNECTION_STRING='mongodb+srv://rahulwadhwa1902:5Y4w0zrAiJpx6iM5@cluster0.k0lrk.mongodb.net/node-js?retryWrites=true&w=majority&appName=Cluster0';
const connectDb= async function(){
    try{
    const connect=await mongoose.connect(CONNECTION_STRING);
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

module.exports=connectDb;