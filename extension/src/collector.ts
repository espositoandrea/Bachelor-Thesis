import * as _ from "lodash";
import * as $ from 'jquery';
import WebcamFacade from "./webcam-facade";

/**
 * The structure of the collected data.
 */
export interface CollectedData {
    users_id: string,
    timestamp: string,
    url: string,
    mouse: {
        position: {
            x: number,
            y: number
        },
        buttons: {
            leftPressed: boolean,
            middlePressed: boolean,
            rightPressed: boolean
        }
    },
    scroll: {
        absolute: { x: number, y: number },
        relative: { x: number, y: number }
    },
    window: {
        width: number,
        height: number
    },
    keyboard: string[],
    image: string,
}

/**
 * The available options for the data collection.
 */
export interface CollectionOptions {
    mainInterval?: number, // defaults to 100 ms
    emotionsInterval?: number, // defaults to 1000 ms
    sendInterval?: number, // defaults to 5000 ms
    url?: {
        getProtocol?: boolean,
        getDomain?: boolean,
        getPath?: boolean,
        getQuery?: boolean,
        getAnchor?: boolean
    }
}

/**
 * The main collector.
 *
 * This class collects the required data.
 */
export class Collector {
    private mousePosition: CollectedData['mouse']['position'] = { x: 0, y: 0 };
    private mouseButtons: CollectedData['mouse']['buttons'] = {
        leftPressed: false,
        middlePressed: false,
        rightPressed: false
    };
    private pressedKeys: Set<string> = new Set<string>();
    private userId: string;

    private _areListenersRegistered: boolean = false;

    private registerListeners() {
        if (this._areListenersRegistered) return;

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            let mouseButtonFromInteger = (btn: number) => btn < 3 ? ['left', 'middle', 'right'][btn] : 'button' + (btn + 1);

            switch (request.event) {
                case "mousemove":
                    this.mousePosition = request.mouse.position;
                    break;
                case "mousedown":
                    this.mouseButtons[mouseButtonFromInteger(request.mouse.button) + 'Pressed'] = true;
                    break;
                case "mouseup":
                    this.mouseButtons[mouseButtonFromInteger(request.mouse.button) + 'Pressed'] = false;
                    break;
                case "keydown":
                    this.pressedKeys.add(request.keyboard.key);
                    break;
                case "keyup":
                    this.pressedKeys.delete(request.keyboard.key);
                    break;
                case 'webcampermission':
                    WebcamFacade.enableWebcam();
                    break;
            }
        });
        this._areListenersRegistered = true;
    }

    /**
     * The Collector constructor. It registers some messaging events.
     */
    public constructor(userId: string) {
        this.registerListeners();
        userId = userId;
    }

    /**
     * Get the URL currently visited by the user.
     *
     * @param options The url collection options.
     * @return Promise A promise with the collected data.
     */
    async getURL({ url }: CollectionOptions): Promise<string> {
        return await new Promise<string>(resolve => {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                if (!tabs || !tabs[0] || !tabs[0].url) {
                    resolve(null);
                } else {
                    const regexResult = /^(.*?):\/\/([^/]*?)(?:\/|$)([^?]*?)(?:(?:\?|$)([^#]*?))?(?:#|$)(.*?)$/.exec(tabs[0].url);

                    if (!regexResult) {
                        resolve(null);
                    } else {
                        let outUrl = '';
                        url.getProtocol && (outUrl += regexResult[1] + '://');
                        url.getDomain && (outUrl += regexResult[2] + '/');
                        url.getPath && (outUrl += regexResult[3]);
                        url.getQuery && regexResult[4] && (outUrl += '?' + regexResult[4]);
                        url.getAnchor && regexResult[5] && (outUrl += '#' + regexResult[5]);
                        resolve(outUrl);
                    }
                }
            });
        });
    }

    /**
     * Get all the information about the mouse.
     *
     * @return Object The mouse data.
     */
    getMouseData(): CollectedData['mouse'] {
        return {
            position: this.mousePosition,
            buttons: this.mouseButtons,
        };
    }

    /**
     * Get all the information about the keyboard.
     *
     * @return Object The keyboard data.
     */
    getKeyboardData(): CollectedData['keyboard'] {
        return Array.from(this.pressedKeys);
    }

    /**
     * Get the data about the scroll position.
     *
     * @note The relative position is based on the lowest point of the screen.
     */
    async getScrollData(): Promise<CollectedData['scroll']> {
        return await new Promise<CollectedData['scroll']>(resolve => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs === undefined || tabs[0] === undefined || tabs[0].id === undefined) {
                    resolve(null);
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, { event: 'getscrolllocation' }, function (response) {
                        if (chrome.runtime.lastError) {
                            // The target page has disabled the execution of
                            // content scripts
                            resolve(null);
                        } else {
                            resolve(response);
                        }
                    });
                }
            });
        });
    }

    /**
     * Get the data about the scroll position.
     *
     * @note The relative position is based on the lowest point of the screen.
     */
    async getWindowData(): Promise<CollectedData['window']> {
        return await new Promise<CollectedData['window']>(resolve => {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs === undefined || tabs[0] === undefined || tabs[0].id === undefined) {
                    resolve(null);
                } else {
                    chrome.tabs.sendMessage(tabs[0].id, { event: 'getwindowsize' }, function (response) {
                        if (chrome.runtime.lastError) {
                            // The target page has disabled the execution of
                            // content scripts
                            resolve(null);
                        } else {
                            resolve(response);
                        }
                    });
                }
            });
        });
    }

    /**
     * Get all the required data.
     * @param options Various collection options
     */
    async getData(options: CollectionOptions): Promise<CollectedData> {
        return {
            users_id: this.userId,
            timestamp: new Date().toISOString(),
            url: await this.getURL(options),
            mouse: this.getMouseData(),
            scroll: await this.getScrollData(),
            window: await this.getWindowData(),
            keyboard: this.getKeyboardData(),
            image: WebcamFacade.isEnabled ? await WebcamFacade.snapPhoto() : null
        };
    }

    /**
     * Send a batch of data to the server.
     * @param data The data to be sent.
     */
    public static sendToServer(data: CollectedData[]): JQuery.jqXHR {
        const URL = 'http://giuseppe-desolda.ddns.net:8080/data/store';
        return $.post(URL, { data: JSON.stringify(data) });
    }
}


/**
 * A facade function that collects all the required data.
 *
 * @param options Various options for the collection
 * @return Promise A promise with the collected data.
 */
export default function collect(userId, options?: CollectionOptions): void {
    if (!userId) return;

    const defaultCollectionOptions: CollectionOptions = {
        mainInterval: 100,
        emotionsInterval: 1000,
        sendInterval: 5000,
        url: {
            getProtocol: true,
            getDomain: true,
            getPath: false,
            getQuery: false,
            getAnchor: false
        }
    };
    options = _.merge(defaultCollectionOptions, options ?? {});

    const collector = new Collector(userId);

    // To simplify the management of the intervals, the interval of the
    // analysis that include the emotions (EA - Emotion Analysis) is used to
    // get the number of analysis without emotions between one EA and another.
    let numberOfCycles = 0;
    let cyclesForEmotion = Math.floor(options.emotionsInterval / options.mainInterval);

    let resultChunk: CollectedData[] = [];

    let collectorInterval: any = undefined;

    let collectionLoop = () => {
        if (collectorInterval !== undefined) {
            clearInterval(collectorInterval);
            Collector.sendToServer(resultChunk)
                .done(() => resultChunk = [])
                .fail((data, status, error) => console.error(error));
        }

        collectorInterval = setInterval(async function () {
            resultChunk.push(await collector.getData(options));
            numberOfCycles++;
        }, options.mainInterval);
    };

    collectionLoop();
    setInterval(collectionLoop, options.sendInterval);
}
