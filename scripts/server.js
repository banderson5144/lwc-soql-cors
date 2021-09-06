if (process.env.NODE_ENV !== 'production') require('dotenv').config()

// Simple Express server setup to serve the build output
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const jsforce = require('jsforce');

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

// //
// // OAuth2 client information can be shared with multiple connections.
// //
const oauth2 = new jsforce.OAuth2({
    // you can change loginUrl to connect to sandbox or prerelease env.
    // loginUrl : 'https://test.salesforce.com',
    clientId : clientId,
    clientSecret : clientSecret,
    redirectUri : redirectUri
});

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const DIST_DIR = './dist';

const app = express();
app.use(cookieParser());
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(function (req, res, next) {
    console.log(req.url);
    if (req.url === '/') {
        console.log(req.cookies.myServ);
        res.set('Content-Security-Policy', 'connect-src '+req.cookies.myServ);
    }
    next();
});
app.use(express.static(DIST_DIR));

// //
// // Get authorization url and redirect to it.
// //
app.get('/oauth2/auth', function(req, res) {
    var isSandbox = req.query.isSandbox === 'true';
    res.redirect(`https://${isSandbox?'test':'login'}.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`);
});

app.get('/oauth2/callback', function(req, res) {
    var conn = new jsforce.Connection({ oauth2 : oauth2, version: '50.0' });
    
    var code = req.query.code;
    conn.authorize(code)
    .then(uRes =>{
        console.log(process.env.REDIRECT_URI);
        let corsUrl = new URL(process.env.REDIRECT_URI);
        console.log(corsUrl.origin);
        let metadata = [{
            fullName: 'HerokuTest',
            urlPattern: corsUrl.origin
        }];
        conn.metadata.upsert('CorsWhitelistOrigin', metadata)
        .then(mRes =>{
            console.log(mRes);
            console.log(conn.accessToken);
            console.log(conn.instanceUrl);
            res.cookie('mySess',conn.accessToken);
            res.cookie('myServ',conn.instanceUrl);
            res.set('Content-Security-Policy', 'connect-src '+conn.instanceUrl);
            res.redirect('/');
        })
        .catch(err =>{
            console.log(err);
            console.log(conn.accessToken);
            console.log(conn.instanceUrl);
            res.cookie('mySess',conn.accessToken);
            res.cookie('myServ',conn.instanceUrl);
            res.set('Content-Security-Policy', 'connect-src '+conn.instanceUrl);
            res.redirect('/');
        });
    });
});

app.get('/readCookies', (req, res) => {
    console.log(req.cookies);
    res.send('read cookies');
});

app.listen(PORT, () =>
    console.log(`✅  Servesr started: http://${HOST}:${PORT}`)
);
