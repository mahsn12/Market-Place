import mongoose from 'mongoose';
import dot from 'dotenv';

dot.config();

const DB = async ()=> {
    try{
        await mongoose.connect(process.env.mongoURL);
        console.log('✅ MongoDB Connected Successfully');
    }
    catch(error){
        console.log('Cant Connect to DB'+error);
    }
}

export default DB;