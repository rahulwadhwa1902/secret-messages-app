const mongoose=require('mongoose');

const secretSchema=mongoose.Schema({
    secrett:{
        type:String,
        required:[true,"Please enter the Secret"],
    },
    location:{
        type:String,
        required:[true,"Please enter the location"],
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:[true,"Please enter the user id"],
    }
},
{
    timestamps:true
})


module.exports=mongoose.model('Secret',secretSchema);