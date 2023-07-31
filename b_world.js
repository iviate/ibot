const axios = require('axios');
const yeh = require('./yeh')
var url = require('url');

module.exports.login_with_token = async function login_with_token(token){

    const payload = {
        "token": token
    }

    const url = "https://wapi.betworld.bingo/user-service/user/login-with-token"
    try {

        let response = await axios.post(url, payload)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }
}

module.exports.get_game_list = async function get_game_list(token){

    const headers = {
        "Authorization": `Bearer ${token}`
    }

    let config = {
        headers: headers,
    }

    const url = "https://wapi.betworld.international/game-service/v-games?status=active&table_status=active&group_key=classic&all=true&per_page=20&page=1"
    try {

        let response = await axios.get(url, config)
        return response.data

    } catch (error) {
        console.log('get_game_list : ', error)
        return null
    }
}

module.exports.get_room_data = async function get_room_data(id, token){

    const headers = {
        "Authorization": `Bearer ${token}`
    }

    let config = {
        headers: headers,
    }

    const url = `https://wapi.betworld.bingo/game-service/v-games/${id}`
    try {

        let response = await axios.get(url, config)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }
}

module.exports.get_history = async function get_history(token, page){

    const headers = {
        "Authorization": `Bearer ${token}`
    }
    // console.log(token)

    let config = {
        headers: headers,
    }

    const url = `https://wapi.betworld.bingo/game-service/bet_game/find?per_page=20&page=${page}`
    // console.log(url)
    try {

        let response = await axios.get(url, config)
        // console.log(response.data)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }
    
}

module.exports.get_token = async function get_token(username, password){
    
    let r1 = await yeh.login(username, password)
    // console.log(r['jwt'])

    let r2 = await yeh.launch_game(r1['jwt'], 14)
    // console.log(r4)

    var url_parts = url.parse(r2['url'], true);
    var query = url_parts.query;
    // console.log(query['sync_token'])

    let r3 = await this.login_with_token(query['sync_token'])
    // console.log(r3)
    console.log('username : ', username, 'get_token : ', r3 )
    if(r1 && r3){
        return {
            'yeh_jwt' : r1['jwt'],
            'b_world_jwt' : r3['jwt']
        }
    }else{
        return null
    }
    
}