const db = require("./app/models");

updatePoint()
function updatePoint(){
    let i = 0
    db.botTransction.findAll({
        order:[
            ['id', 'asc']
        ]
    }).then((datas) => {
        console.log(datas)
        datas.forEach(element => {
            console.log(element.win_result)
            if(element.win_result == 'LOSE'){
                i--
                element.point = i
                element.save()
            }else if(element.win_result == 'WIN'){
                i++
                element.point = i
                element.save()
            }else{
                element.point = i
                element.save()
            }
        });
    })
}