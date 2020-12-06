var user={
    // userid:'userid',
    // username:'username',
}
var client={
    id: 'clientid',
    redirectUris: 'http://localhost:3000/oauth/token',
    grants: ['password','client_credentials','authorization_code']
}

var db=require('../db/mysqldb');
var _ = require('lodash');
var crypto = require('crypto')

function dateformat (datetime) {
    let year = "" + datetime.getFullYear();
    let month = "" + (datetime.getMonth() + 1); if (month.length == 1) { month = "0" + month; }
    let day = "" + datetime.getDate(); if (day.length == 1) { day = "0" + day; }
    let hour = "" + datetime.getHours(); if (hour.length == 1) { hour = "0" + hour; }
    let minute = "" + datetime.getMinutes(); if (minute.length == 1) { minute = "0" + minute; }
    let second = "" + datetime.getSeconds(); if (second.length == 1) { second = "0" + second; }
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}


function getAccessToken(accessToken){
    var sql ="select * from  oauth_access_tokens where access_token='"+accessToken+"'";
    console.log(sql);
    return new Promise((resolve, reject) => {
        db.query(sql).then(function(data){
            if (!_.isEmpty(data)) {
                var d = data[0]
                resolve({
                    accessToken: d.access_token,
                    accessTokenExpiresAt: d.expires,
                    scope: '',
                    client: {
                        id:d.client_id
                    },
                    user: {
                        id:d.user_id
                    }
                })
            }else{
                reject('token无效')
            }
        }).catch(function(err){
            reject(err)
        })
    })
}

// function generateAccessToken(){
//     return 'generateAccessToken';
// }

function generateRefreshToken(){
    return 'generateRefreshToken';
}

function generateAuthorizationCode(){
    const seed = crypto.randomBytes(256)
    const code = crypto
        .createHash('sha1')
        .update(seed)
        .digest('hex')
    return code
}

function getAuthorizationCode(authorizationCode){
    var sql ="select * from  oauth_authorization_codes where authorization_code='"+authorizationCode+"'";
    console.log(sql);
    return new Promise((resolve, reject) => {
        db.query(sql).then(function(data){
            if (!_.isEmpty(data)) {
                var d = data[0]
                resolve({
                    code: d.authorization_code,
                    expiresAt: d.expires,
                    redirectUri: d.redirect_uri,
                    scope: d.scope,
                    client: {
                        id:d.client_id+''
                    },
                    user:{
                        id:d.user_id+''
                    }
                })
            }else{
                reject('获取code失败')
            }
        }).catch(function(err){
            reject(err)
        })
    })
}

function getClient(clientId, clientSecret) {
    var  sql = "select * from oauth_clients where client_id='"+clientId+"'"
    if(!_.isEmpty(clientSecret)){
        sql = sql + " and client_secret ='"+clientSecret+"' "
    }
    return new Promise ((resolve, reject) => {
        db.query(sql).then(function (data) {
            if (!_.isEmpty(data)) {
                var d = data[0]
                resolve({
                    id:d.client_id,
                    redirectUris:[d.redirect_uri],
                    grants:d.grant_type.split(','),
                })
            } else {
                reject('client无效')
            }
        }).catch(function (err) {
            console.log(err)
            reject(err)
        })
    })
}

function saveToken(token, client, user){
    var sql1 ="insert into oauth_access_tokens(id,access_token,expires,client_id) values(uuid(),'"+token.accessToken+"','"+dateformat(token.accessTokenExpiresAt)+"','"+client.id+"')";
    var sql2 ="insert into oauth_refresh_tokens(id,refresh_token,expires,client_id) values(uuid(),'"+token.refreshToken+"','"+dateformat(token.accessTokenExpiresAt)+"','"+client.id+"')";
    console.log(sql1)
    console.log(sql2)
    var p = [db.transquery(sql1),db.transquery(sql2)]
    return new Promise((resolve, reject) => {
        Promise.all(p).then(function(){
            resolve({
                accessToken: token.accessToken,
                accessTokenExpiresAt: token.accessTokenExpiresAt,
                refreshToken: token.refreshToken,
                refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                scope: token.scope,
                client: client,
                user: user
            })
        }).catch(function(err){
            reject(err)
        })
    })
    // return 'saveToken';
}

function saveAuthorizationCode(code,client,user){
    var sql ="insert into oauth_authorization_codes(id,authorization_code,expires,client_id) values(uuid(),'"+code.authorizationCode+"','"+dateformat(code.expiresAt)+"','"+client.id+"')";
    console.log(sql);
    return new Promise((resolve, reject) => {
        db.transquery(sql).then(function(r){
            if(r.affectedRows==1){
                resolve(code)
            }else{
                reject('保存code失败')
            }
        }).catch(function(err){
            reject(err)
        })
    })
}

function revokeAuthorizationCode(){
    return 'revokeAuthorizationCode';
}
function validateScope(){
    return true
}

function getUserFromClient(client){
    console.log(client);
    return user;
}

function getUser(username, password) {
    var  sql = "select * from oauth_users where username='"+username+"' and password='"+password+"'"
    return new Promise ((resolve, reject) => {
        db.query(sql).then(function (data) {
            if (!_.isEmpty(data)) {
                var d = data[0]
                resolve({
                    id:d.id,
                    username:d.username,
                    scope:d.scope,
                })
            } else {
                reject('user无效')
            }
        }).catch(function (err) {
            console.log(err)
            reject(err)
        })
    })
}



module.exports = {
    getAccessToken:getAccessToken,
    // generateAccessToken:generateAccessToken,
    // generateRefreshToken:generateRefreshToken,
    generateAuthorizationCode:generateAuthorizationCode,
    getAuthorizationCode:getAuthorizationCode,
    getClient:getClient,
    saveToken:saveToken,
    saveAuthorizationCode:saveAuthorizationCode,
    revokeAuthorizationCode:revokeAuthorizationCode,
    validateScope:validateScope,
    getUserFromClient:getUserFromClient,
    getUser:getUser,
}
