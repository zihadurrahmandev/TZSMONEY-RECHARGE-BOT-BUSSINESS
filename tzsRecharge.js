let libPrefix = "tzsmoneylib";
let API_URL = "http://tzsmoney.com/api/recharge';

function setApiKey(key) {
  Bot.setProperty(libPrefix + "apiKey", key, "string");
}

function loadApiKey() {
  var apiKey = Bot.getProperty(libPrefix + "apiKey");
  if (!apiKey) {
    throw new Error("TZS Lib: no apiKey. You need to setup it");
  }
  return apiKey;
}

function getQueryParams(json) {
  return Object.keys(json).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
  }).join("&");
}

function recharge(options) {
  if (!options) {
    throw "TZS Lib: need options";
  }
  if (!options.number) {
    throw "TZS Lib: need options.number";
  }
  if (!options.operator) {
    throw "TZS Lib: need options.operator";
  }
  if (!options.number_type) {
    throw "TZS Lib: need options.number_type";
  }
  if (!options.amount) {
    throw "TZS Lib: need options.amount";
  }

  let apiKey = loadApiKey();
  let fields = {
    number: options.number,
    operator: options.operator,
    number_type: options.number_type,
    amount: options.amount,
    api_key: apiKey
  };
  let queryParams = getQueryParams(fields);
  let url = API_URL + "?" + queryParams;
  let onSuccess = options.onSuccess || "";
  let onError = options.onError || "";
  let successCallback = libPrefix + "onRechargeResponse " + onSuccess + " " + onError;
  HTTP.get({
    url: url,
    success: successCallback
  });
}

function onRechargeResponse() {
  let json = JSON.parse(content);
  let arr = params.split(" ");
  let onSuccess = arr[0] ? arr[0].trim() : null;
  let onError = arr[1] ? arr[1].trim() : null;
  if (json.success && onSuccess) {
    Bot.runCommand(onSuccess, { trx_id: json.trx_id });
  } else if (!json.success && onError) {
    Bot.runCommand(onError, { message: json.message });
  } else if (!json.success) {
    Bot.sendMessage("TZS Recharge error: " + (json.message || "Unknown error"));
  }
}

on(libPrefix + "onRechargeResponse", onRechargeResponse);

publish({
  setApiKey: setApiKey,
  recharge: recharge
});
