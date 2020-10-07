const db = require("./app/models");
const axios = require('axios');

let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7InVpZCI6NTcwMzA2fSwiaWF0IjoxNTk3NjY5NDc1fQ.C2BVb8kPMWl6T5lquMQrAWv1JruHMGyvmZ35z6QlIA4"

async function pullMember() {
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
            let data2 = await db.member.findOne({where:{
                username: downline.username
            }})

            if(data2){
                
                console.log(`found ${downline.username}`)
                let betAll = 0
                if(downline.stat != null){
                    betAll = downline.stat.betall
                    console.log(betAll)
                }
                data2.email = downline.email
                data2.mobile = downline.mobile
                data2.betall = betAll
                data2.save()
            }else{
                console.log(`create ${downline.username}`)
                let betAll = 0
                if(downline.stat != null){
                    betAll = downline.stat.betall
                }
                let created = await db.member.create({username: downline.username, email: downline.email, mobile: downline.mobile, betall: betAll})
            }
            
        }

        page++
        
    }

}

module.exports = pullMember