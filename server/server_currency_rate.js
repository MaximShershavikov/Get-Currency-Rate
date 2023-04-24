/**********************************************************************************
    Get-Currency-Rate Version 1.0. Web server for receiving currency rates
    and transfer to client currency rates.       
    
    Copyright (C) 2023  Maxim Shershavikov
    This file is part of Get-Currency-Rate.
    
    Get-Currency-Rate is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    Get-Currency-Rate is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
    Email m.shershavikov@yandex.ru
**********************************************************************************/

const NEW_SESSION = 10;
const tree = [[1,'DIV'], [1,'DIV'], [4,'DIV'], [1,'DIV'], [1,'DIV'], [1,'DIV'], [1,'DIV'], [1,'DIV'], [1,'DIV'], [1,'TABLE'], [1,'TBODY']];
const currency_const = {
    'Eur/Rub': [0,0],
    'Rub/Eur': [0,0],
    'Usd/Jpy': [0,0],
    'Usd/Cad': [0,0],
    'Usd/Rub': [0,0],
    'Rub/Usd': [0,0],
    'Gbp/Usd': [0,0],
    'Aud/Usd': [0,0],
    'Nzd/Usd': [0,0],
    'Usd/Cny': [0,0],
    'Aud/Jpy': [0,0],
    'Eur/Cny': [0,0],
    'Eur/Usd': [0,0],
    'Eur/Nok': [0,0]
};
const WebServer = new require('ws');
const Socket = new WebServer.Server({port: 1010});
var count_con = 0;

Socket.on('connection', function connection(wsConnection) {
    let disconnect = { 'status': '' };
    wsConnection.on('message', function incoming(message) {
        let str = `${message}`;
        disconnect['status'] = str;
        if (str === 'Connect') {
            count_con++;
            console.log(str + " " + count_con);
            get_data(wsConnection, disconnect, count_con);
        }
    });
});

async function get_data(wsConnection, connect_status, connect_num) {
    let count, curr, val, proc, browser;
    const currency = JSON.parse(JSON.stringify(currency_const));
    const jsdom = require("jsdom");
    const { JSDOM } = jsdom;
    const puppeteer = require("puppeteer");
    while (true) {
        let flg = true;
        let reload_count = 0;
        if (connect_status['status'] === 'DisConnect') {
            console.log(connect_status['status'] + " " + connect_num);
            return;
        }
        try {
            browser = await puppeteer.launch({headless: true});        
            const page = await browser.newPage();
            await page.setViewport({ width: 1600, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Linux; Android 7.0; NEM-L51) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.81 Mobile Safari/537.36');
            await page.goto("https://www.finam.ru/quotes/currencies/");
            await page.waitForTimeout(5000);
            if (connect_status['status'] === 'DisConnect') throw 'DisConnect';
            for (let i = 0 ; i < 12; i++) {
                const content = await page.content();
                const dom = new JSDOM(content);
                let TAG = dom.window.document.getElementById("finambackground").childNodes;
                for (let j = 0; j < tree.length; j++) {
                    count = 0;
                    TAG.forEach(element => {
                        if (element.tagName === tree[j][1]) {
                            count++;
                            if (count === tree[j][0]) {
                                TAG = element.childNodes;
                                return;
                            }
                        }
                    });
                }
                TAG.forEach(element => {
                    curr = element.childNodes[1].childNodes[0].textContent;
                    if (connect_status['status'] === 'DisConnect') throw 'DisConnect';
                    if (typeof currency[curr] !== "undefined") {
                        val = parseFloat(element.childNodes[2].childNodes[0].textContent);
                        proc = parseFloat(element.childNodes[3].childNodes[0].textContent);
                        if (val > currency[curr][0]) {
                            currency[curr][0] = val;
                            wsConnection.send(curr + " " + val.toString() + " blink_green");
                        }
                        else if (val < currency[curr][0]) {
                            currency[curr][0] = val;
                            wsConnection.send(curr + " " + val.toString() + " blink_red");
                        }
                        if (proc > currency[curr][1]) {
                            currency[curr][1] = proc;
                            if (proc > 0)
                                wsConnection.send(curr + "%" + " " + proc.toString() + " green");
                            else
                                wsConnection.send(curr + "%" + " " + proc.toString() + " red");
                        }
                        else if (proc < currency[curr][1]) {
                            currency[curr][1] = proc;
                            if (proc > 0)
                                wsConnection.send(curr + "%" + " " + proc.toString() + " green");
                            else
                                wsConnection.send(curr + "%" + " " + proc.toString() + " red");
                        }
                    }
                });
                if (i == 11) {
                    i = 0;
                    if (flg == false)
                        flg = true;
                    else
                        flg = false;
                    if (++reload_count === NEW_SESSION) {
                        await browser.close();
                        break;
                    }
                }
                if (flg == false) {
                    await page.click("#finambackground > div > div > div:nth-child(6) > div > div > ul > li:nth-child(1)");
                    await page.waitForTimeout(1000);
                }
                else {
                    await page.click("#finambackground > div > div > div:nth-child(6) > div > div > ul > li:nth-child(11)");
                    await page.waitForTimeout(1000);
                }
            }
        }
        catch (err) {
            if (err != 'DisConnect')
                console.log(err);
            await browser.close();
        }
    }
}