const db = require("./app/models");
const axios = require('axios');

let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTcwMzA2fSwiaWF0IjoxNTk3NjY5NDc1fQ.C2BVb8kPMWl6T5lquMQrAWv1JruHMGyvmZ35z6QlIA4"

async function pullMemberRecord() {
    let page = 1
    let all_page = 1
    while (page <= all_page) {
        // console.log(page)
        
        // console.log(page)
        const {data} = await axios.get(`https://truthbet.com/api/m/affiliate/members?page=${page}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })   
        // console.log(data)
        let downlines = data.downlines
        all_page = downlines.lastPage
        
        // console.log(all_page)
        // console.log(all_page)
        for(let downline of downlines.data){
            // console.log(downline)
            let latest = await db.member_record.findOne({
                where: {
                    username: downline.username
                },
                order: [
                    ['id', 'DESC']
                ]
            })
            let previous_betall = 0
            if(latest){
                previous_betall = latest.previous_betall
            }
            
            
            if(downline.stat != null){
                
                let stat = downline.stat
                console.log(downline.username, stat.betall)
                // if(downline.username.toLo)
                let user_data = {
                    username: downline.username,
                    all_point_casino: stat.all_point_casino,
                    all_point_gaming: stat.all_point_gaming,
                    all_point_sports: stat.all_point_sports,
                    previous_betall: previous_betall,
                    betall: stat.betall,
                    betcredit: stat.betcredit,
                    withdraw: stat.withdraw,
                    withdraw_times: stat.withdraw_times,
                    deposit: stat.deposit,
                    deposit_times: stat.deposit_times,
                    settlement: stat.settlement 
                }
                let created = await db.member_record.create(user_data)
            }else{
                let user_data = {
                    username: downline.username
                }
                let created = await db.member_record.create(user_data)
            }
            
            
        }
        page++
    }

}

module.exports = pullMemberRecord