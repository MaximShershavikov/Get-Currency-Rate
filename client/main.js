/**********************************************************************************
    Get-Currency-Rate Version 1.0. Web client for displaying data on 
    the web interface and communicating with the server       
    
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

function main() {
    const socket = new WebSocket('ws://localhost:1010'); 
    socket.addEventListener('open', (event) => { 
        socket.send('Connect'); 
        window.addEventListener('beforeunload', (event) => {
            socket.send('DisConnect');
        });
    }); 
    socket.addEventListener("message", (event) => {
        console.log("Message from server ", event.data);
        data(event.data);
    });
    return;
}

function data(data) {
    let arr = data.split(' ');    
    if (arr[0][arr[0].length-1] === "%") {
        document.getElementById(arr[0]).style.color = arr[2];
        document.getElementById(arr[0]).textContent = arr[1] + "%";
    }
    else {
        document.getElementById(arr[0]).textContent = arr[1];
        document.getElementById(arr[0]).style.animation = arr[2] + " 1s";
    }
    return;
}