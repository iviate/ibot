const axios = require('axios');


module.exports.login = async function login(username, password){

    const payload = {
        "dealer": "yehyehmaster",
        "username": username,
        "password": password,
        "language": "th"
    }
    const url = "https://service-api.yehyeh.com/user-service/api-login/yehyehmaster"
    try {

        let response = await axios.post(url, payload)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }
}


module.exports.get_game = async function get_game(token, partner_key){

    const params = {
        "per_page": 100,
        "category[]": "casino",
        "search": '',
        "partner_key[]": partner_key,
        "page": 1
    }

    const headers = {
        "Authorization": `Bearer ${token}`
    }

    let config = {
        headers: headers,
        params: params
    }

    const url = "https://service-api.yehyeh.com/third-party-service/home/get-game-by-filter"
    try {

        let response = await axios.get(url, config)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }

}

module.exports.get_user_profile = async function get_user_profile(token){

    const headers = {
        "Authorization": `Bearer ${token}`
    }

    let config = {
        headers: headers,
    }

    const url = "https://service-api.yehyeh.com/user-service/user/me"
    try {

        let response = await axios.get(url, config)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }

}

module.exports.launch_game = async function launch_game(token, game_list_id){

    const headers = {
        "Authorization": `Bearer ${token}`
    }

    const payload = {
        "game_list_id": game_list_id
    }

    let config = {
        headers: headers,
    }

    const url = "https://service-api.yehyeh.com/third-party-service/launch-game"
    try {

        let response = await axios.post(url, payload, config)
        return response.data

    } catch (error) {
        console.log(error)
        return null
    }

}

