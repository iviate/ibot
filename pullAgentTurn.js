const db = require("./app/models");
const axios = require('axios');

let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTcwMzA2fSwiaWF0IjoxNTk3NjY5NDc1fQ.C2BVb8kPMWl6T5lquMQrAWv1JruHMGyvmZ35z6QlIA4"

async function pullAgentTurn() {
    const { data } = await axios.get(`https://truthbet.com/api/m/affiliate`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    // console.log(data)
    let downlines = data.downlines
    let user = data.user
    let stat = user.stat
    let created = await db.agent_record.create({username: user.username, 
                                                af_betcredit: stat.af_betcredit,
                                                af_betcredit_casino: stat.af_betcredit_casino,
                                                af_betcredit_gaming: stat.af_betcredit_gaming,
                                                af_betcredit_sport: stat.af_betcredit_sport,
                                                downlines_count: downlines.length})

}

module.exports = pullAgentTurn