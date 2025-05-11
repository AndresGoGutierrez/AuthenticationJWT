import mongoose from 'mongoose'

mongoose.connect("mongodb://Localhost/juez-authentication")
    .then(db => console.log('Db is connected'))
    .catch(error => console.log(error))