import { app, BrowserWindow, ipcMain, dialog } from 'electron';
const http = require('http');
const https = require('https');
const request = require('request');
const fs = require('fs');

var access_token;

const redirect_uri = 'https://localhost:8889/tiltify';
const request_url = 'https://tiltify.com/api/v3'
const request_url_campaigns = `${request_url}/teams/616/campaigns`
const request_url_campaign = `${request_url}/campaigns/19919`
const request_url_campaigns_donationMessages = `${request_url}/campaigns/19919/donations`

var fundraiserGoalAmount;
var amountRaised;
var totalAmountRaised;

var saveLocation;
var appReady = false;

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
    show: false,
    icon: `${__dirname}/media/warframe_fan_channel_logo_png__1__VBa_icon.ico`
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', () => {
        fs.readFile(`${__dirname}\\tokens.json`, function(err, data){
            let parsedData = JSON.parse(data);
            console.log(parsedData);
            access_token = parsedData.data.access_token;
            console.log('yeet1: ' + access_token);
            appReady = true;
            req_options = {
                url: request_url_campaigns_donationMessages,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };
            req_options_donations = {
                url: request_url_campaign,
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            };
            getTiltifyData();
            mainWindow.show();

        });
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
        if(! access_token){
            fs.readFile(`${__dirname}\\tokens.json`, function(err, data){
                let parsedData = JSON.parse(data);
                access_token = parsedData.data.access_token;
                appReady = true;
            });
        }
        else{
            request(req_options, (err, res, body) => {
                if(err) console.error(err);
                console.log(body);
                var parsedBody = JSON.parse(body);
                fundraiserGoalAmount = parsedBody.data.fundraiserGoalAmount;
                amountRaised = parsedBody.data.amountRaised;
                totalAmountRaised = parsedBody.data.totalAmountRaised;

                if(!saveLocation || saveLocation === ''){
                    dialog.showMessageBox({
                        type: 'info',
                        title: 'Warframe Fan Channels',
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
                            title: 'No File Location Selected',
                            message: 'You did not select a location. Please select a location continue without genrating files, or close the application.',
                            buttons: ['Close', 'Continue', 'Select Location']
                        }, function(res){
                            if (res === 0 || !res){
                                app.quit();
                                return;
                            }
                            if(res === 1){
                                goodToGoFam(false);
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
    }
    catch(err){
        console.log(err);
        goodToGoFam(false, err);
    }

}
// getTiltifyData();


ipcMain.on('get-new-donations', function(event, arg){
    if (!appReady) return;
    if(saveLocation){
        getTiltifyData();
    }
    request(req_options_donations, (err, res, body) => {
        var parsedBody = JSON.parse(body);
        event.sender.send('donations', parsedBody.data)
    });
});

ipcMain.on('write-lastest-donation', function(event, arg){
    let dataToWrite = `Latest Donation: ${arg.name} ( ${arg.amount} )`
    fs.writeFile(saveLocation+'\\latest_donation.txt', dataToWrite, function(err){
        if(err) throw err;
    });
});

ipcMain.on('write-highest-donation', function(event, arg){
    let dataToWrite = `Latest Donation: ${arg.name} ( ${arg.amount} )`
    fs.writeFile(saveLocation+'\\highest_donation.txt', dataToWrite, function(err){
        if(err) throw err;
    });
});
