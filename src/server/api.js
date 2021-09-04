if (process.env.NODE_ENV !== 'production') require('dotenv').config()
// Simple Express server setup to serve for local testing/dev API server
const compression = require('compression');
const helmet = require('helmet');
const express = require('express');
const cookieParser = require('cookie-parser');
const jsforce = require('jsforce');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cookieParser());

const HOST = process.env.API_HOST || 'localhost';
const PORT = process.env.API_PORT || 3002;

app.get('/api/v1/endpoint', (req, res) => {
    res.json({ success: true });
});

app.get('/mycookie', (req, res) => {
    res
    .cookie('foo','yoyo')
    .json({ success: true });
});

app.get('/myapibar', (req, res) => {
    return res.send('Received a GET HTTP method bar');
});

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
    conn.authorize(code, function(err, userInfo) {
        if (err) { return console.error(err); }        
    }).then(uRes =>{
        conn.tooling.query("Select Title,SupportsRevoke,IsReleased,DueDate,Description,DeveloperName,Status,Release,ReleaseLabel,ReleaseDate From ReleaseUpdate WHERE DeveloperName = 'AuraSecStaticResCRUC'")
        .then(qRes =>{
            console.log(qRes.records[0]);
            console.log(qRes.records[0].Status === 'Revocable');
            res.redirect('/?isEnabled='+(qRes.records[0].Status === 'Revocable'));
        }).catch(err => {
            console.log(err);
        });
    });
});

app.listen(PORT, () =>
    console.log(
        `✅  API Server started: http://${HOST}:${PORT}/api/v1/endpoint`
    )
);
