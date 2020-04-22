/*
 * The browser extension created for Andrea Esposito's Bachelor's Thesis.
 * Copyright (C) 2020  Andrea Esposito <a.esposito39@studenti.uniba.it>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import WebcamFacade from "./webcam-facade";

WebcamFacade.enableWebcam();

window.addEventListener('message', function (event) {
    if (event.data.type && event.data.type === "ESPOSITOTHESIS___SNAP_WEBCAM") {
        window.postMessage({type: 'ESPOSITOTHESIS___RETURN_WEBCAM_SNAP', snap: WebcamFacade.snapPhoto()}, '*');
    }
});