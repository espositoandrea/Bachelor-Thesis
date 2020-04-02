import './contentscript.scss';


// Listen for mouse movements
document.addEventListener('mousemove', function (e) {
    let x = e.pageX;
    let y = e.pageY;
    chrome.runtime.sendMessage({ event: 'mousemove', mouse: { position: { x, y } } });
});

// Listen for mouse buttons' click
['mousedown', 'mouseup'].forEach(ev => {
    document.addEventListener(ev, (e: MouseEvent) => {
        chrome.runtime.sendMessage({ event: ev, mouse: { button: e.button } });
    });
});

// Listen for keyboard buttons's
['keydown', 'keyup'].forEach(ev => {
    document.addEventListener(ev, (e: KeyboardEvent) => {
        chrome.runtime.sendMessage({ event: ev, keyboard: { key: e.key } });
    });
});

function getScroll() {
    const height = document.body.offsetHeight;
    const width = document.body.offsetWidth;

    let absoluteY = window.pageYOffset;
    let absoluteX = window.pageXOffset;

    let relativeY = 100 * (absoluteY + document.documentElement.clientHeight) / height;
    let relativeX = 100 * (absoluteX + document.documentElement.clientWidth) / width;

    return {
        absolute: { x: absoluteX, y: absoluteY },
        relative: { x: relativeX, y: relativeY }
    };
}

function getWindowSize() {
    return {
        width: window.outerWidth,
        height: window.outerHeight
    };
}

// Add listener for messages from the extension process
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.event == 'getscrolllocation') {
        sendResponse(getScroll());
    }
    else if (request.event == 'getwindowsize') {
        sendResponse(getWindowSize());
    }
});

let iframe = document.createElement('iframe');
iframe.src = chrome.extension.getURL("assets/permissions-requester.html");
iframe.style.display = 'none';
document.body.appendChild(iframe);
chrome.runtime.sendMessage({ event: 'webcampermission' });
