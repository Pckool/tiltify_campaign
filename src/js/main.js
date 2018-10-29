import { ipcRenderer } from 'electron';
const $ = require('jquery');
var emoji = require('node-emoji');

setInterval(function (){
    ipcRenderer.send('get-new-donations');
    ipcRenderer.once('donations', function(donations) {
        if(donations.length > 0 ){
            if($('.no-donations').length)
                $('.no-donations').css('display', 'none');
            console.log('We have Donations!');
            let highestDonation = {amount:0};

            donations.forEach(function(el, i){
                var $newdiv = $( `<div id="${el.id}" class="donation"></div>`);
                $(`#${el.id}`).append(`<div>Name: ${el.name}</div>`);
                $(`#${el.id}`).append(`<div>Amount: ${el.amount}</div>`);
                $(`#${el.id}`).append(`<div>Comment: ${el.comment}</div>`);
                $('#donations').prepend($newdiv);


                if(i===0){
                    ipcRenderer.send('write-lastest-donation', el);
                }

                if(el.amount > highestDonation.amount){
                    highestDonation = el;
                }
            });
            ipcRenderer.send('write-highest-donation', highestDonation);
        }
        else{
            if(! $('.no-donations').length)
                $('#donations').html( `<div class="no-donations">No Donations yet... ${emoji.get('anguished')}</div>` );
        }


    });

}, 3000)
