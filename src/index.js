import { app, BrowserWindow, ipcMain, dialog } from 'electron';
const http = require('http');
const https = require('https');
const request = require('request');
const fs = require('fs');

const app_id = '2d53d92d3a96ea2d07f048e2f4a14d4036afd6e10b2abdcf81b3cef6e911fce2';
const access_token = '89fc2caa28f56f8038b105bd64240e21b4db81bced5ce19caeab2c562b57e33e';
const app_secret = '978ded1422a9699542b403261a423e5a411d0ffa4c0eb72807a3c2a4b4d94543';

const redirect_uri = 'https://localhost:8889/tiltify';
const request_url = 'https://tiltify.com/api/v3'
const request_url_campaigns = `${request_url}/teams/616/campaigns`
const request_url_campaign = `${request_url}/campaigns/19919`
const request_url_campaigns_donationMessages = `${request_url}/campaigns/19919/donations`

var fundraiserGoalAmount;
var amountRaised;
var totalAmountRaised;

var saveLocation;

// set up the data to push to the tiltify API (headers)
var req_options = {
    url: request_url_campaign,
    headers: {
        'Authorization': `Bearer ${access_token}`
    }
}
var req_options_donations = {
    url: request_url_campaigns_donationMessages,
    headers: {
        'Authorization': `Bearer ${access_token}`
    }
}

// Are we allowed to continue fetching?
var goodToGo = true;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

var mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Retieve Tilitfy Data',
    autoHideMenuBar: true,
    backgroundColor: '#272a2d',
    darkTheme: true,
    show: false
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.once('ready-to-show', () => {
      getTiltifyData();
      mainWindow.show();

  });

};

app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});




function goodToGoFam(value, err){
    goodToGo = value;
    if (! value && err) {
        dialog.showErrorBox('Something went wrong', `Something went wron. Please restart the application or contact TDefton for assitance.\n ERROR: ${err}`);
    }

}

function getTiltifyData(){
    if (goodToGo) console.log('Checking the Tilitify Data...');
    else return;

    try{
        request(req_options, (err, res, body) => {
            if(err) console.error(err);
            // console.log(body);
            var parsedBody = JSON.parse(body);
            fundraiserGoalAmount = parsedBody.data.fundraiserGoalAmount;
            amountRaised = parsedBody.data.amountRaised;
            totalAmountRaised = parsedBody.data.totalAmountRaised;

            if(!saveLocation || saveLocation === ''){
                dialog.showMessageBox({
                    type: 'info',
                    title: 'I need a save Location.',
                    message: 'Hey! I need a location in order to save the text files. The Warframe Fan Channels Tiltify donations data will be saved in this folder. So maybe create a folder in your documents or something. There will be 3 files, You can just go into OBS and tell it to use these files as text sources. If you have any questions, please message TDefton. Thanks! <3'

                })
                let saveLocations = dialog.showOpenDialog({
                    title: 'Locations for txt Files',
                    defaultPath: 'C:/',
                    properties: ['openDirectory']
                });
                if(saveLocations)
                    saveLocation = saveLocations[0];
                else{
                    dialog.showMessageBox({
                        type: 'error',
                        title: 'You did not Select a Location',
                        message: 'You did not select a location. Please select a location or close the application.',
                        buttons: ['Close', 'Select Location']
                    }, function(res){
                        if (res === 0 || !res){
                            app.quit();
                            return;
                        }
                    });
                }

            }
            else{
                console.log('Saving ' + saveLocation + '\\fundraiser_goal.txt');
                fs.writeFile(saveLocation+'\\fundraiser_goal.txt', parseInt(fundraiserGoalAmount), (err) => {
                    if (err) throw err;
                });

                console.log('Saving ' + saveLocation + '\\amount_raised.txt');
                fs.writeFile(saveLocation+'\\amount_raised.txt', parseInt(amountRaised), (err) => {
                    if (err) throw err;
                });

                console.log('Saving ' + saveLocation + '\\total_amount_raised.txt');
                fs.writeFile(saveLocation+'\\total_amount_raised.txt', parseInt(totalAmountRaised), (err) => {
                    if (err) throw err;
                });
            }
        });
    }
    catch(err){
        console.log(err);
        goodToGoFam(false, err);
    }

}
// getTiltifyData();


ipcMain.on('get-new-donations', function(event, arg){
    if(saveLocation){
        getTiltifyData()
    }
    request(req_options_donations, (err, res, body) => {
        var parsedBody = JSON.parse(body);
        event.sender.send('donations', parsedBody.data)
    });
});
