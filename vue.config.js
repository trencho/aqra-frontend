const path = require('path');

module.exports = {
    configureWebpack: () => {
        const envPath = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
        require('dotenv').config({path: path.resolve(__dirname, envPath)});
    },
    transpileDependencies: [
        'vuetify'
    ]
}