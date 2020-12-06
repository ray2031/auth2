var oauthServer = require('oauth2-server');
var Request = oauthServer.Request;
var Response = oauthServer.Response;
var db = require('db/mysqldb');
var oauth = new oauthServer({
    model: require('./model'),
    authorizationCodeLifetime:10*60, //authorization codes 有效时间
    allowEmptyState:true,
    allowBearerTokensInQueryString:true,
})

module.exports = function(app){
    app.all('/oauth/token', function(req,res,next){
        var request = new Request(req);
        var response = new Response(res);

        oauth
            .token(request,response)
            .then(function(token) {
                // Todo: remove unnecessary values in response
                return res.json(token)
            }).catch(function(err){
            return res.status(500).json(err)
        })
    });

    app.all('/authorize', function(req, res){
        var request = new Request(req);
        var response = new Response(res);
        return oauth.authorize(request, response).then(function(success) {
            //  if (req.body.allow !== 'true') return callback(null, false);
            //  return callback(null, true, req.user);
            res.json(success)
        }).catch(function(err){
            console.log(err)
            res.status(err.code || 500).json(err)
        })
    });

    app.all('/authenticate', function(req, res){
        var request = new Request(req);
        var response = new Response(res);
        oauth.authenticate(request, response).then(function (token) {
            // Request is authorized.
            req.user = token
            res.json(token)
        }).catch(function (err) {
            // Request is not authorized.
            res.status(err.code || 500).json(err)
        });
    });
}
