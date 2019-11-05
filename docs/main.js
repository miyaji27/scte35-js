(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["main"],{

/***/ "../build/lib/descriptors.js":
/*!***********************************!*\
  !*** ../build/lib/descriptors.js ***!
  \***********************************/
/*! exports provided: SegmentationMessage, parseDescriptor */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SegmentationMessage", function() { return SegmentationMessage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parseDescriptor", function() { return parseDescriptor; });
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./util */ "../build/lib/util.js");
/**
 * Copyright 2018 Comcast Cable Communications Management, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or   implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

var SegmentationMessage;
(function (SegmentationMessage) {
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_0"] = 0] = "RESTRICT_GROUP_0";
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_1"] = 1] = "RESTRICT_GROUP_1";
    SegmentationMessage[SegmentationMessage["RESTRICT_GROUP_2"] = 2] = "RESTRICT_GROUP_2";
    SegmentationMessage[SegmentationMessage["NONE"] = 3] = "NONE";
})(SegmentationMessage || (SegmentationMessage = {}));
/**
 * 10.2 splice_descriptor()
 *
 * NOTE(estobbart): This only supports the base descriptor parsing,
 * Additional payload of the descriptor is handled at the SpliceInfoSection
 * level.
 */
const spliceDescriptor = (view) => {
    const descriptor = {};
    let offset = 0;
    descriptor.spliceDescriptorTag = view.getUint8(offset++);
    descriptor.descriptorLength = view.getUint8(offset++);
    descriptor.indentifier = "";
    while (descriptor.indentifier.length < 4) {
        descriptor.indentifier += String.fromCharCode(view.getUint8(offset++));
    }
    return descriptor;
};
/**
 * NOTE(estobbart): The view.byteLength may have additional data beyond
 * the descriptorLength if there are additional descriptors in the
 * array beyond the one being parse at the byteOffset of the view.
 */
const parseDescriptor = (view) => {
    const descriptor = spliceDescriptor(view);
    // splice_descriptor_tag, descriptor_length, & indentifier are the first 6 bytes
    let offset = 6;
    // TODO: parse out the descriptors appropriately using descriptor methods
    if (descriptor.spliceDescriptorTag === 0 /* AVAIL_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.AVAIL_DESCRIPTOR");
    }
    else if (descriptor.spliceDescriptorTag === 1 /* DTMF_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.DTMF_DESCRIPTOR");
    }
    else if (descriptor.spliceDescriptorTag === 2 /* SEGMENTATION_DESCRIPTOR */) {
        const segmentationDescriptor = descriptor;
        segmentationDescriptor.segmentationEventId = view.getUint32(offset);
        offset += 4;
        segmentationDescriptor.segmentationEventCancelIndicator = !!(view.getUint8(offset++) & 0x80);
        // next 7 bits are reserved
        if (!segmentationDescriptor.segmentationEventCancelIndicator) {
            const tmpByte = view.getUint8(offset++);
            segmentationDescriptor.programSegmentationFlag = !!(tmpByte & 0x80);
            segmentationDescriptor.segmentationDurationFlag = !!(tmpByte & 0x40);
            segmentationDescriptor.deliveryNotRestrictedFlag = !!(tmpByte & 0x20);
            if (!segmentationDescriptor.deliveryNotRestrictedFlag) {
                segmentationDescriptor.webDeliveryAllowedFlag = !!(tmpByte & 0x10);
                segmentationDescriptor.noRegionalBlackoutFlag = !!(tmpByte & 0x08);
                segmentationDescriptor.archiveAllowedFlag = !!(tmpByte & 0x04);
                segmentationDescriptor.deviceResctrictions = tmpByte & 0x03;
            }
            if (!segmentationDescriptor.programSegmentationFlag) {
                segmentationDescriptor.componentCount = view.getUint8(offset++);
                console.warn("scte35-js TODO: segmentationDescriptor.componentCount: " + segmentationDescriptor.componentCount);
                // TODO: component count
                offset += segmentationDescriptor.componentCount * 6;
            }
            if (segmentationDescriptor.segmentationDurationFlag) {
                segmentationDescriptor.segmentationDuration = _util__WEBPACK_IMPORTED_MODULE_0__["shiftThirtyTwoBits"](view.getUint8(offset++));
                segmentationDescriptor.segmentationDuration += view.getUint32(offset);
                offset += 4;
            }
            segmentationDescriptor.segmentationUpidType = view.getUint8(offset++);
            segmentationDescriptor.segmentationUpidLength = view.getUint8(offset++);
            let bytesToCopy = segmentationDescriptor.segmentationUpidLength;
            segmentationDescriptor.segmentationUpid = new Uint8Array(bytesToCopy);
            while (bytesToCopy >= 0) {
                bytesToCopy--;
                segmentationDescriptor.segmentationUpid[bytesToCopy] = view.getUint8(offset + bytesToCopy);
            }
            offset += segmentationDescriptor.segmentationUpidLength;
            segmentationDescriptor.segmentationTypeId = view.getUint8(offset++);
            segmentationDescriptor.segmentNum = view.getUint8(offset++);
            segmentationDescriptor.segmentsExpected = view.getUint8(offset++);
            if (offset < descriptor.descriptorLength + 2) {
                if (segmentationDescriptor.segmentationTypeId === 0x34
                    || segmentationDescriptor.segmentationTypeId === 0x36) {
                    // NOTE(estobbart): The older SCTE-35 spec did not include
                    // these additional two bytes
                    segmentationDescriptor.subSegmentNum = view.getUint8(offset++);
                    segmentationDescriptor.subSegmentsExpected = view.getUint8(offset++);
                }
            }
        }
    }
    else if (descriptor.spliceDescriptorTag === 3 /* TIME_DESCRIPTOR */) {
        offset = descriptor.descriptorLength + 2;
        console.warn("scte35-js TODO: support spliceDescriptorTag: SpliceDescriptorTag.TIME_DESCRIPTOR");
    }
    else {
        console.error(`scte35-js Unrecognized spliceDescriptorTag ${descriptor.spliceDescriptorTag}`);
        offset = descriptor.descriptorLength + 2;
    }
    if (offset !== descriptor.descriptorLength + 2) {
        console.error(`scte35-js Error reading descriptor offset @${offset} of ${descriptor.descriptorLength + 2}`);
    }
    return descriptor;
};
//# sourceMappingURL=descriptors.js.map

/***/ }),

/***/ "../build/lib/scte35.js":
/*!******************************!*\
  !*** ../build/lib/scte35.js ***!
  \******************************/
/*! exports provided: SCTE35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SCTE35", function() { return SCTE35; });
/* harmony import */ var _descriptors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./descriptors */ "../build/lib/descriptors.js");
/* harmony import */ var _util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./util */ "../build/lib/util.js");
/**
 * Copyright 2018 Comcast Cable Communications Management, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or   implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */


/**
 * A splice_insert and a splice_schedule were similar enough in the properties
 * that spliceEvent was created with a few conditionals in the middle of the
 * read depending on the tag provided.
 */
const spliceEvent = (event, view, tag) => {
    let offset = 0;
    event.spliceEventId = view.getUint32(offset);
    offset += 4;
    event.spliceEventCancelIndicator = !!(view.getUint8(offset++) & 0x80);
    if (event.spliceEventCancelIndicator) {
        return offset;
    }
    let byte = view.getUint8(offset++);
    event.outOfNetworkIndicator = !!(byte & 0x80);
    event.programSpliceFlag = !!(byte & 0x40);
    event.durationFlag = !!(byte & 0x20);
    if (tag === 5 /* SPLICE_INSERT */) {
        event.spliceImmediateFlag = !!(byte & 0x10);
    }
    if (event.programSpliceFlag) {
        if (tag === 5 /* SPLICE_INSERT */ && !event.spliceImmediateFlag) {
            const spliceTime = timeSignal(new DataView(view.buffer, view.byteOffset + offset, 5));
            event.spliceTime = spliceTime;
            offset++;
            if (spliceTime.specified) {
                offset += 4;
            }
        }
        else if (tag === 4 /* SPLICE_SCHEDULE */) {
            event.utcSpliceTime = view.getUint32(offset);
            offset += 4;
        }
    }
    else {
        event.componentCount = view.getUint8(offset++);
        if (tag === 4 /* SPLICE_SCHEDULE */) {
            const utcSpliceComponents = [];
            while (utcSpliceComponents.length !== event.componentCount) {
                utcSpliceComponents.push({
                    componentTag: view.getUint8(offset++),
                    utcSpliceTime: view.getUint32(offset),
                });
                offset += 4;
            }
            event.utcSpliceComponents = utcSpliceComponents;
        }
        else {
            console.warn("scte35-js TODO: support splice_insert");
            // TODO:.. support for the array in the SPLICE_INSERT
        }
    }
    if (event.durationFlag) {
        // 6 reserved bits
        byte = view.getUint8(offset++);
        // 9.4.2 break_duration()
        event.breakDuration = {
            autoReturn: !!(byte & 0x80),
            duration: ((byte & 0x01) ? _util__WEBPACK_IMPORTED_MODULE_1__["THIRTY_TWO_BIT_MULTIPLIER"] : 0) + view.getUint32(offset),
        };
        offset += 4;
    }
    event.uniqueProgramId = view.getUint16(offset);
    offset += 2;
    event.available = view.getUint8(offset++);
    event.expected = view.getUint8(offset++);
    return offset;
};
/**
 * 9.3.2 splice_schedule()
 */
const spliceSchedule = (view) => {
    const schedule = {};
    schedule.spliceCount = view.getUint8(0);
    schedule.spliceEvents = [];
    let offset = 1;
    while (schedule.spliceEvents.length !== schedule.spliceCount) {
        const event = {};
        offset += spliceEvent(event, new DataView(view.buffer, view.byteOffset + offset), 4 /* SPLICE_SCHEDULE */);
        schedule.spliceEvents.push(event);
    }
    if (offset !== view.byteLength) {
        console.error(`scte35-js Bad read splice_schedule actual: ${offset} expected: ${view.byteLength}`);
    }
    return schedule;
};
/**
 * 9.3.3 splice_insert()
 */
const spliceInsert = (view) => {
    const insert = {};
    const offset = spliceEvent(insert, view, 5 /* SPLICE_INSERT */);
    if (offset !== view.byteLength) {
        console.error(`scte35-js Bad read splice_insert actual: ${offset} expected: ${view.byteLength}`);
    }
    return insert;
};
/**
 *
 * 9.3.4 time_signal is a single splice_time (9.4.1)
 * so it can also be used in splice_insert
 *
 */
const timeSignal = (view) => {
    const spliceTime = {};
    const byte = view.getUint8(0);
    spliceTime.specified = !!(byte & 0x80);
    if (spliceTime.specified) {
        spliceTime.pts = (byte & 0x01) ? _util__WEBPACK_IMPORTED_MODULE_1__["THIRTY_TWO_BIT_MULTIPLIER"] : 0;
        spliceTime.pts += view.getUint32(1);
    }
    return spliceTime;
};
const SCTE35 = Object.create(null);
// Table 5 splice_info_section
const parseSCTE35Data = (bytes) => {
    const sis = {};
    const view = new DataView(bytes.buffer);
    let offset = 0;
    sis.tableId = view.getUint8(offset++);
    let byte = view.getUint8(offset++);
    sis.selectionSyntaxIndicator = !!(byte & 0x80);
    sis.privateIndicator = !!(byte & 0x40);
    // const reserved = (byte & 0x03) >> 4;
    sis.sectionLength = ((byte & 0x0F) << 8) + view.getUint8(offset++);
    if (sis.sectionLength + 3 !== bytes.byteLength) {
        throw new Error(`Binary read error sectionLength: ${sis.sectionLength} + 3 !== data.length: ${bytes.byteLength}`);
    }
    sis.protocolVersion = view.getUint8(offset++);
    byte = view.getUint8(offset++);
    sis.encryptedPacket = !!(byte & 0x80);
    sis.encryptedAlgorithm = (byte & 0x7E) >> 1;
    if (sis.encryptedPacket) {
        console.error(`scte35-js splice_info_section encrypted_packet ${sis.encryptedAlgorithm} not supported`);
    }
    // NOTE(estobb200): Can't shift JavaScript numbers above 32 bits
    sis.ptsAdjustment = (byte & 0x01) ? _util__WEBPACK_IMPORTED_MODULE_1__["THIRTY_TWO_BIT_MULTIPLIER"] : 0;
    sis.ptsAdjustment += view.getUint32(offset);
    offset += 4;
    sis.cwIndex = view.getUint8(offset++);
    sis.tier = view.getUint8(offset++) << 4;
    byte = view.getUint8(offset++);
    sis.tier += (byte & 0xF0) >> 4;
    sis.spliceCommandLength = ((byte & 0x0F) << 8) + view.getUint8(offset++);
    sis.spliceCommandType = view.getUint8(offset++);
    if (sis.spliceCommandType != 0 /* SPLICE_NULL */) {
        const splice = new DataView(bytes.buffer, offset, sis.spliceCommandLength);
        if (sis.spliceCommandType === 4 /* SPLICE_SCHEDULE */) {
            sis.spliceCommand = spliceSchedule(splice);
        }
        else if (sis.spliceCommandType === 5 /* SPLICE_INSERT */) {
            sis.spliceCommand = spliceInsert(splice);
        }
        else if (sis.spliceCommandType === 6 /* TIME_SIGNAL */) {
            sis.spliceCommand = timeSignal(splice);
        }
        else if (sis.spliceCommandType === 255 /* PRIVATE_COMMAND */) {
            console.error(`scte35-js command_type private_command not supported.`);
        }
    }
    offset += sis.spliceCommandLength;
    sis.descriptorLoopLength = view.getUint16(offset);
    offset += 2;
    if (sis.descriptorLoopLength) {
        let bytesToRead = sis.descriptorLoopLength;
        sis.descriptors = [];
        try {
            while (bytesToRead) {
                const descriptorView = new DataView(bytes.buffer, offset, bytesToRead);
                const spliceDescriptor = _descriptors__WEBPACK_IMPORTED_MODULE_0__["parseDescriptor"](descriptorView);
                bytesToRead -= spliceDescriptor.descriptorLength + 2;
                offset += spliceDescriptor.descriptorLength + 2;
                sis.descriptors.push(spliceDescriptor);
            }
        }
        catch (error) {
            console.error(`scte35-js Error reading descriptor @ ${offset}, ignoring remaing bytes: ${bytesToRead} in loop.`);
            console.error(error);
            offset += bytesToRead;
            bytesToRead = 0;
        }
    }
    // TODO: alignment_stuffing
    // TODO: validate the crc
    sis.crc = view.getUint32(offset);
    offset += 4;
    if (offset !== view.byteLength) {
        console.error(`scte35-js Bad SCTE35 read - remaining data: ${bytes.slice(offset).join(", ")}`);
    }
    return sis;
};
SCTE35.parseFromB64 = (b64) => {
    const bytes = Uint8Array.from(atob(b64).split("").map((c) => c.charCodeAt(0)));
    return parseSCTE35Data(bytes);
};
SCTE35.parseFromHex = (hex) => {
    const octets = hex.match(/[a-f\d]{2}/gi) || [];
    const bytes = Uint8Array.from(octets.map((octet) => parseInt(octet, 16)));
    return parseSCTE35Data(bytes);
};
//# sourceMappingURL=scte35.js.map

/***/ }),

/***/ "../build/lib/util.js":
/*!****************************!*\
  !*** ../build/lib/util.js ***!
  \****************************/
/*! exports provided: bytesToUUID, THIRTY_TWO_BIT_MULTIPLIER, shiftThirtyTwoBits */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "bytesToUUID", function() { return bytesToUUID; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "THIRTY_TWO_BIT_MULTIPLIER", function() { return THIRTY_TWO_BIT_MULTIPLIER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "shiftThirtyTwoBits", function() { return shiftThirtyTwoBits; });
/**
 * Converts a Uint8Array(16) to it's UUID string
 */
const bytesToUUID = (bytes) => {
    if (bytes.length !== 16) {
        throw new Error(`scte35-js Uint8Array uuid bad size: ${bytes.length}`);
    }
    return [].map.call(bytes, (byte, index) => {
        // left pad the hex result to two chars
        const hex = (byte <= 0x0F ? "0" : "") + byte.toString(16);
        // splice in "-" at position 4, 6, 8, 10
        if (index >= 4 && index <= 10 && index % 2 === 0) {
            return "-" + hex;
        }
        return hex;
    }).join("");
};
const THIRTY_TWO_BIT_MULTIPLIER = Math.pow(2, 32);
/**
 * shifts a single byte by 32 bits
 */
const shiftThirtyTwoBits = (byte) => {
    return byte * THIRTY_TWO_BIT_MULTIPLIER;
};
//# sourceMappingURL=util.js.map

/***/ }),

/***/ "./node_modules/raw-loader/dist/cjs.js!./src/app/app.component.html":
/*!**************************************************************************!*\
  !*** ./node_modules/raw-loader/dist/cjs.js!./src/app/app.component.html ***!
  \**************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("<router-outlet></router-outlet>\n\n<app-demo-page></app-demo-page>\n");

/***/ }),

/***/ "./node_modules/raw-loader/dist/cjs.js!./src/app/demo-page/demo-page.component.html":
/*!******************************************************************************************!*\
  !*** ./node_modules/raw-loader/dist/cjs.js!./src/app/demo-page/demo-page.component.html ***!
  \******************************************************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("<mat-card>\n  <mat-card-title>SCTE35-JS Demo</mat-card-title>\n  <mat-card-content fxLayout=\"column\" fxLayoutAlign=\"center stretch\">\n    <div fxLayout=\"column\" fxLayoutAlign=\"center stretch\">\n      <mat-form-field>\n        <input matInput placeholder=\"Payload\" [(ngModel)]=\"payload\">\n      </mat-form-field>\n    </div>\n    <div fxLayout=\"row\" fxLayoutAlign=\"space-around center\">\n      <button mat-button mat-raised-button color=\"primary\" (click)=\"parsePayload()\">Parse</button>\n      <button mat-button mat-raised-button color=\"primary\" (click)=\"showRawJson = true\" *ngIf=\"parsedObject !== undefined && !showRawJson\">\n        View Raw JSON\n      </button>\n      <button mat-button mat-raised-button color=\"primary\" (click)=\"showRawJson = false\" *ngIf=\"parsedObject !== undefined && showRawJson\">\n        Hide Raw JSON\n      </button>\n    </div>\n    <div fxLayout=\"column\" fxLayoutAlign=\"center center\" *ngIf=\"parsedObject !== undefined\">\n      <ngx-json-viewer [json]=\"parsedObject\"></ngx-json-viewer>\n    </div>\n    <mat-card *ngIf=\"showRawJson\">\n      <pre style=\"word-break: break-all; white-space: normal;\">{{parsedObjectString}}</pre>\n    </mat-card>\n  </mat-card-content>\n</mat-card>\n");

/***/ }),

/***/ "./node_modules/tslib/tslib.es6.js":
/*!*****************************************!*\
  !*** ./node_modules/tslib/tslib.es6.js ***!
  \*****************************************/
/*! exports provided: __extends, __assign, __rest, __decorate, __param, __metadata, __awaiter, __generator, __exportStar, __values, __read, __spread, __spreadArrays, __await, __asyncGenerator, __asyncDelegator, __asyncValues, __makeTemplateObject, __importStar, __importDefault */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spreadArrays", function() { return __spreadArrays; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() { return __makeTemplateObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importStar", function() { return __importStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importDefault", function() { return __importDefault; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}


/***/ }),

/***/ "./src/$$_lazy_route_resource lazy recursive":
/*!**********************************************************!*\
  !*** ./src/$$_lazy_route_resource lazy namespace object ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncaught exception popping up in devtools
	return Promise.resolve().then(function() {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "./src/$$_lazy_route_resource lazy recursive";

/***/ }),

/***/ "./src/app/app-routing.module.ts":
/*!***************************************!*\
  !*** ./src/app/app-routing.module.ts ***!
  \***************************************/
/*! exports provided: AppRoutingModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppRoutingModule", function() { return AppRoutingModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/router */ "./node_modules/@angular/router/fesm5/router.js");



var routes = [];
var AppRoutingModule = /** @class */ (function () {
    function AppRoutingModule() {
    }
    AppRoutingModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
            imports: [_angular_router__WEBPACK_IMPORTED_MODULE_2__["RouterModule"].forRoot(routes)],
            exports: [_angular_router__WEBPACK_IMPORTED_MODULE_2__["RouterModule"]]
        })
    ], AppRoutingModule);
    return AppRoutingModule;
}());



/***/ }),

/***/ "./src/app/app.component.scss":
/*!************************************!*\
  !*** ./src/app/app.component.scss ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2FwcC5jb21wb25lbnQuc2NzcyJ9 */");

/***/ }),

/***/ "./src/app/app.component.ts":
/*!**********************************!*\
  !*** ./src/app/app.component.ts ***!
  \**********************************/
/*! exports provided: AppComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppComponent", function() { return AppComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");


var AppComponent = /** @class */ (function () {
    function AppComponent() {
        this.title = 'scte35-js';
    }
    AppComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-root',
            template: tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"](__webpack_require__(/*! raw-loader!./app.component.html */ "./node_modules/raw-loader/dist/cjs.js!./src/app/app.component.html")).default,
            styles: [tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"](__webpack_require__(/*! ./app.component.scss */ "./src/app/app.component.scss")).default]
        })
    ], AppComponent);
    return AppComponent;
}());



/***/ }),

/***/ "./src/app/app.module.ts":
/*!*******************************!*\
  !*** ./src/app/app.module.ts ***!
  \*******************************/
/*! exports provided: AppModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "AppModule", function() { return AppModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/platform-browser */ "./node_modules/@angular/platform-browser/fesm5/platform-browser.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/platform-browser/animations */ "./node_modules/@angular/platform-browser/fesm5/animations.js");
/* harmony import */ var _material_material_module__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./material/material.module */ "./src/app/material/material.module.ts");
/* harmony import */ var _angular_flex_layout__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @angular/flex-layout */ "./node_modules/@angular/flex-layout/esm5/flex-layout.es5.js");
/* harmony import */ var ngx_json_viewer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ngx-json-viewer */ "./node_modules/ngx-json-viewer/ngx-json-viewer.es5.js");
/* harmony import */ var _angular_forms__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! @angular/forms */ "./node_modules/@angular/forms/fesm5/forms.js");
/* harmony import */ var _app_routing_module__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./app-routing.module */ "./src/app/app-routing.module.ts");
/* harmony import */ var _app_component__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./app.component */ "./src/app/app.component.ts");
/* harmony import */ var _demo_page_demo_page_component__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./demo-page/demo-page.component */ "./src/app/demo-page/demo-page.component.ts");
/* harmony import */ var _angular_material__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! @angular/material */ "./node_modules/@angular/material/esm5/material.es5.js");












var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_2__["NgModule"])({
            declarations: [
                _app_component__WEBPACK_IMPORTED_MODULE_9__["AppComponent"],
                _demo_page_demo_page_component__WEBPACK_IMPORTED_MODULE_10__["DemoPageComponent"]
            ],
            imports: [
                _angular_platform_browser__WEBPACK_IMPORTED_MODULE_1__["BrowserModule"],
                _app_routing_module__WEBPACK_IMPORTED_MODULE_8__["AppRoutingModule"],
                _angular_platform_browser_animations__WEBPACK_IMPORTED_MODULE_3__["BrowserAnimationsModule"],
                _material_material_module__WEBPACK_IMPORTED_MODULE_4__["MaterialModule"],
                _angular_flex_layout__WEBPACK_IMPORTED_MODULE_5__["FlexLayoutModule"],
                ngx_json_viewer__WEBPACK_IMPORTED_MODULE_6__["NgxJsonViewerModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_7__["FormsModule"],
                _angular_forms__WEBPACK_IMPORTED_MODULE_7__["ReactiveFormsModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_11__["MatCardModule"]
            ],
            providers: [],
            bootstrap: [_app_component__WEBPACK_IMPORTED_MODULE_9__["AppComponent"]]
        })
    ], AppModule);
    return AppModule;
}());



/***/ }),

/***/ "./src/app/demo-page/demo-page.component.scss":
/*!****************************************************!*\
  !*** ./src/app/demo-page/demo-page.component.scss ***!
  \****************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony default export */ __webpack_exports__["default"] = ("\n/*# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsImZpbGUiOiJzcmMvYXBwL2RlbW8tcGFnZS9kZW1vLXBhZ2UuY29tcG9uZW50LnNjc3MifQ== */");

/***/ }),

/***/ "./src/app/demo-page/demo-page.component.ts":
/*!**************************************************!*\
  !*** ./src/app/demo-page/demo-page.component.ts ***!
  \**************************************************/
/*! exports provided: DemoPageComponent */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DemoPageComponent", function() { return DemoPageComponent; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _build_lib_scte35__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./../../../../build/lib/scte35 */ "../build/lib/scte35.js");



var DemoPageComponent = /** @class */ (function () {
    function DemoPageComponent() {
        this.payload = '';
        this.showRawJson = false;
    }
    DemoPageComponent.prototype.ngOnInit = function () {
    };
    DemoPageComponent.prototype.parsePayload = function () {
        this.showRawJson = false;
        this.parsedObject = _build_lib_scte35__WEBPACK_IMPORTED_MODULE_2__["SCTE35"].parseFromB64(this.payload);
        this.parsedObjectString = JSON.stringify(this.parsedObject);
    };
    DemoPageComponent = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["Component"])({
            selector: 'app-demo-page',
            template: tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"](__webpack_require__(/*! raw-loader!./demo-page.component.html */ "./node_modules/raw-loader/dist/cjs.js!./src/app/demo-page/demo-page.component.html")).default,
            styles: [tslib__WEBPACK_IMPORTED_MODULE_0__["__importDefault"](__webpack_require__(/*! ./demo-page.component.scss */ "./src/app/demo-page/demo-page.component.scss")).default]
        }),
        tslib__WEBPACK_IMPORTED_MODULE_0__["__metadata"]("design:paramtypes", [])
    ], DemoPageComponent);
    return DemoPageComponent;
}());



/***/ }),

/***/ "./src/app/material/material.module.ts":
/*!*********************************************!*\
  !*** ./src/app/material/material.module.ts ***!
  \*********************************************/
/*! exports provided: MaterialModule */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MaterialModule", function() { return MaterialModule; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_common__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/common */ "./node_modules/@angular/common/fesm5/common.js");
/* harmony import */ var _angular_material__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @angular/material */ "./node_modules/@angular/material/esm5/material.es5.js");




var MaterialModule = /** @class */ (function () {
    function MaterialModule() {
    }
    MaterialModule = tslib__WEBPACK_IMPORTED_MODULE_0__["__decorate"]([
        Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["NgModule"])({
            imports: [
                _angular_common__WEBPACK_IMPORTED_MODULE_2__["CommonModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatButtonModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatCheckboxModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatToolbarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatExpansionModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatCardModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatFormFieldModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatInputModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatStepperModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSnackBarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSlideToggleModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatIconModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTooltipModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatMenuModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSelectModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSidenavModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatDialogModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTabsModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatGridListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTableModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatDividerModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatAutocompleteModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatProgressSpinnerModule"]
            ],
            exports: [
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatButtonModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatCheckboxModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatToolbarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatExpansionModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatCardModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatFormFieldModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatInputModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatStepperModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSnackBarModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSlideToggleModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatIconModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTooltipModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatMenuModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSelectModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatSidenavModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatDialogModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTabsModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatGridListModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatTableModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatDividerModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatAutocompleteModule"],
                _angular_material__WEBPACK_IMPORTED_MODULE_3__["MatProgressSpinnerModule"]
            ],
            declarations: []
        })
    ], MaterialModule);
    return MaterialModule;
}());



/***/ }),

/***/ "./src/environments/environment.ts":
/*!*****************************************!*\
  !*** ./src/environments/environment.ts ***!
  \*****************************************/
/*! exports provided: environment */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "environment", function() { return environment; });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

var environment = {
    production: false
};
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.


/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tslib */ "./node_modules/tslib/tslib.es6.js");
/* harmony import */ var _angular_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @angular/core */ "./node_modules/@angular/core/fesm5/core.js");
/* harmony import */ var _angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @angular/platform-browser-dynamic */ "./node_modules/@angular/platform-browser-dynamic/fesm5/platform-browser-dynamic.js");
/* harmony import */ var _app_app_module__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/app.module */ "./src/app/app.module.ts");
/* harmony import */ var _environments_environment__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./environments/environment */ "./src/environments/environment.ts");
/* harmony import */ var hammerjs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! hammerjs */ "./node_modules/hammerjs/hammer.js");
/* harmony import */ var hammerjs__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(hammerjs__WEBPACK_IMPORTED_MODULE_5__);






if (_environments_environment__WEBPACK_IMPORTED_MODULE_4__["environment"].production) {
    Object(_angular_core__WEBPACK_IMPORTED_MODULE_1__["enableProdMode"])();
}
Object(_angular_platform_browser_dynamic__WEBPACK_IMPORTED_MODULE_2__["platformBrowserDynamic"])().bootstrapModule(_app_app_module__WEBPACK_IMPORTED_MODULE_3__["AppModule"])
    .catch(function (err) { return console.error(err); });


/***/ }),

/***/ 0:
/*!***************************!*\
  !*** multi ./src/main.ts ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/ahetma437/_Source/scte35-js/ui/src/main.ts */"./src/main.ts");


/***/ })

},[[0,"runtime","vendor"]]]);
//# sourceMappingURL=main.js.map