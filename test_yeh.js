const yeh = require("./yeh")
var url = require('url');
const b_world = require("./b_world")


testYeh()

async function testYeh(){

    let r = await yeh.login("uw254112", "t3h622j1")
    console.log(r['jwt'])

    let r2 = await yeh.get_game(r['jwt'], "BETWORLD")
    // console.log(r2)

    let r3 = await yeh.get_user_profile(r['jwt'])
    // console.log(r3)

    let r4 = await yeh.launch_game(r['jwt'], 14)
    console.log(r4)

    var url_parts = url.parse(r4['url'], true);
    var query = url_parts.query;
    console.log(query['sync_token'])

    let r5 = await b_world.login_with_token(query['sync_token'])
    console.log(r5)

    let r6 = await b_world.get_room_data("50fe04d0-d411-4205-bb62-b05a291cca7f", r5['jwt'])
    console.log(r6)

}