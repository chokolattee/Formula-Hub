const mongoose = require('mongoose')

const teamSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        },
    description: {
        type: String,
        required: true,
        }, 
    images: [
        {
            public_id: {
                type: String,
                required:true
            },
            url: {
                type:String,
                required: true
            }
        }
    ]  
    },
    {
        timestamps: true,
    });

module.exports = mongoose.model('Team', teamSchema);