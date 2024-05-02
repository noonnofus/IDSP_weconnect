var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
};
var _this = this;
var socket = new WebSocket("ws://".concat(window.location.host));
socket.addEventListener("open", function () { return __awaiter(_this, void 0, void 0, function () {
    var userSession;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("connected to server ✅");
                return [4 /*yield*/, getUserSession()];
            case 1:
                userSession = _a.sent();
                socket.send(userSession);
                return [2 /*return*/];
        }
    });
}); });
socket.addEventListener("close", function () {
    console.log("disconnected from the server ❌");
});
socket.addEventListener("message", function (ev) {
    var blobMsg = ev.data;
    var reader = new FileReader();
    reader.onload = function () { return __awaiter(_this, void 0, void 0, function () {
        var textmsg, userStr, user, chat, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    textmsg = reader.result;
                    return [4 /*yield*/, getUserSession()];
                case 1:
                    userStr = _a.sent();
                    user = JSON.parse(userStr.data);
                    console.log('user who wrote the msg: ', user);
                    console.log('does it with user data?: ', textmsg); // where msgs are.
                    chat = document.querySelector('.chatting');
                    msg = document.createElement("div");
                    if (typeof textmsg === "string") {
                        msg.innerHTML = "\n            <p>".concat(user.username, ": ").concat(textmsg, "</p>\n            ");
                        chat === null || chat === void 0 ? void 0 : chat.appendChild(msg);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    reader.readAsText(blobMsg);
});
var form = document.querySelector('.message');
form === null || form === void 0 ? void 0 : form.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log('from frontend: ', event);
    var input = form.querySelector("input");
    if (input) {
        socket.send(input.value);
        input.value = "";
    }
});
function getUserSession() {
    return __awaiter(this, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/getUserSession', {
                        method: 'POST',
                    })];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.json()];
            }
        });
    });
}
